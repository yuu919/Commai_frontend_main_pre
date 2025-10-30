import os
import json
from openai import AsyncOpenAI, APIError, RateLimitError, AuthenticationError, BadRequestError as OAI_BAD
from ...core.errors import AuthError, RateLimitError as RL, ProviderAPIError, BadRequestError
from ...core.schemas import ChatRequest, ChatResponse, ToolCall
from ...core.provider_base import LLMProvider
from ...core.config import settings


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self):
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise AuthError("OPENAI_API_KEY is not set", provider=self.name)
        self.client = AsyncOpenAI(api_key=key)

    async def chat(self, req: ChatRequest) -> ChatResponse:
        try:
            # Resolve model config (api and token param)
            cfg = settings.models_config.get("openai", {}).get(req.model, {})
            api_kind = cfg.get("api", "chat")
            token_param = cfg.get("max_tokens_param", "max_tokens")

            tools = None
            if req.tools:
                tools = [
                    {
                        "type": "function",
                        "function": {
                            "name": t.name,
                            "description": t.description or "",
                            "parameters": t.parameters,
                        },
                    }
                    for t in req.tools
                ]
            if api_kind == "responses":
                # Build input as messages array (per sample implementation)
                input_messages = [
                    {"role": m.role, "content": m.content} for m in req.messages
                ]

                kwargs = dict(
                    model=req.model,
                    input=input_messages,
                )
                # token param for Responses
                if req.max_tokens is not None:
                    kwargs[token_param] = req.max_tokens
                elif cfg.get("max_tokens"):
                    kwargs[token_param] = cfg["max_tokens"]
                # Many Responses models do not support temperature/top_p; omit by default
                if tools:
                    # Responses API format: type + name + parameters at root
                    tools_resp = [
                        {
                            "type": "function",
                            "name": t.name,
                            "description": t.description or "",
                            "parameters": t.parameters,
                        }
                        for t in (req.tools or [])
                    ]
                    if tools_resp:
                        kwargs["tools"] = tools_resp
                        # Responses API: prefer simple "auto" when tools are present
                        kwargs["tool_choice"] = "auto"

                try:
                    resp = await self.client.responses.create(**kwargs)
                    # Extract text and tool calls from Responses output
                    content_text = getattr(resp, "output_text", None)
                    tool_calls = None
                    try:
                        output_items = getattr(resp, "output", None) or []
                        for item in output_items:
                            # Direct ResponseFunctionToolCall objects
                            if "ResponseFunctionToolCall" in str(type(item)):
                                name = getattr(item, "name", None)
                                args = getattr(item, "arguments", None) or {}
                                if isinstance(args, str):
                                    try:
                                        args = json.loads(args)
                                    except Exception:
                                        args = {"_raw": args}
                                if name:
                                    if tool_calls is None:
                                        tool_calls = []
                                    tool_calls.append(ToolCall(id=getattr(item, "id", None), name=name, arguments=args))
                            # Prefer block-level tool_calls if present
                            block_tool_calls = getattr(item, "tool_calls", None)
                            if not block_tool_calls and isinstance(item, dict):
                                block_tool_calls = item.get("tool_calls")
                            if block_tool_calls:
                                for tc in block_tool_calls:
                                    name = getattr(tc, "function", None)
                                    args = None
                                    if name and hasattr(tc, "function"):
                                        fn = getattr(tc, "function")
                                        name = getattr(fn, "name", None) or (fn.get("name") if isinstance(fn, dict) else None)
                                        args = getattr(fn, "arguments", None) if not isinstance(fn, dict) else fn.get("arguments")
                                    if isinstance(args, str):
                                        try:
                                            args = json.loads(args)
                                        except Exception:
                                            args = {"_raw": args}
                                    if tool_calls is None:
                                        tool_calls = []
                                    tool_calls.append(ToolCall(id=getattr(tc, "id", None) if not isinstance(tc, dict) else tc.get("id"), name=name, arguments=args or {}))
                            # Fallback: scan content parts
                            parts = getattr(item, "content", None) or []
                            for p in parts:
                                p_type = getattr(p, "type", None)
                                if p_type is None and isinstance(p, dict):
                                    p_type = p.get("type")
                                if p_type in ("tool_call", "function_call"):
                                    fc = getattr(p, p_type, None)
                                    if fc is None and isinstance(p, dict):
                                        fc = p.get(p_type)
                                    if fc is None:
                                        continue
                                    name = getattr(fc, "name", None)
                                    if name is None and isinstance(fc, dict):
                                        name = fc.get("name") or fc.get("function_name")
                                    args = getattr(fc, "arguments", None)
                                    if args is None and isinstance(fc, dict):
                                        args = fc.get("arguments") or fc.get("args") or {}
                                    if isinstance(args, str):
                                        try:
                                            args = json.loads(args)
                                        except Exception:
                                            args = {"_raw": args}
                                    if tool_calls is None:
                                        tool_calls = []
                                    tool_calls.append(ToolCall(id=getattr(fc, "id", None) if not isinstance(fc, dict) else fc.get("id"), name=name, arguments=args))
                    except Exception:
                        pass

                    # If tools requested but Responses did not return tool_calls, and fallback configured → fallback
                    if tools and not tool_calls:
                        chat_fallback = cfg.get("chat_fallback_model")
                        if chat_fallback:
                            response_format = {"type": "json_object"} if req.response_format == "json" else None
                            chat_kwargs = dict(
                                model=chat_fallback,
                                messages=[m.model_dump() for m in req.messages],
                                temperature=req.temperature,
                                top_p=req.top_p,
                            )
                            cap = cfg.get("chat_max_tokens")
                            if req.max_tokens is not None:
                                chat_kwargs["max_tokens"] = min(req.max_tokens, cap) if cap else req.max_tokens
                            elif cap:
                                chat_kwargs["max_tokens"] = cap
                            if tools:
                                chat_kwargs["tools"] = tools
                                if req.tool_choice:
                                    chat_kwargs["tool_choice"] = req.tool_choice
                            if response_format is not None:
                                chat_kwargs["response_format"] = response_format

                            completion = await self.client.chat.completions.create(**chat_kwargs)
                            choice = completion.choices[0]
                            msg = choice.message
                            tool_calls_fb = None
                            if msg.tool_calls:
                                normalized = []
                                for tc in msg.tool_calls:
                                    args = tc.function.arguments
                                    if isinstance(args, str):
                                        try:
                                            args = json.loads(args)
                                        except Exception:
                                            args = {"_raw": args}
                                    normalized.append(ToolCall(id=getattr(tc, 'id', None), name=tc.function.name, arguments=args))
                                tool_calls_fb = normalized
                            return ChatResponse(
                                provider=self.name,
                                model=chat_fallback,
                                content=msg.content or None,
                                tool_calls=tool_calls_fb,
                                finish_reason=choice.finish_reason,
                            )

                    return ChatResponse(
                        provider=self.name,
                        model=req.model,
                        content=content_text,
                        tool_calls=tool_calls,
                        finish_reason=getattr(resp, "finish_reason", None),
                    )
                except Exception as e:
                    # On Responses error, fallback to Chat if configured
                    chat_fallback = cfg.get("chat_fallback_model")
                    if not chat_fallback:
                        raise ProviderAPIError(str(e), provider=self.name)
                    response_format = {"type": "json_object"} if req.response_format == "json" else None
                    chat_kwargs = dict(
                        model=chat_fallback,
                        messages=[m.model_dump() for m in req.messages],
                        temperature=req.temperature,
                        top_p=req.top_p,
                    )
                    cap = cfg.get("chat_max_tokens")
                    if req.max_tokens is not None:
                        chat_kwargs["max_tokens"] = min(req.max_tokens, cap) if cap else req.max_tokens
                    elif cap:
                        chat_kwargs["max_tokens"] = cap
                    if tools:
                        chat_kwargs["tools"] = tools
                        if req.tool_choice:
                            chat_kwargs["tool_choice"] = req.tool_choice
                    if response_format is not None:
                        chat_kwargs["response_format"] = response_format

                    completion = await self.client.chat.completions.create(**chat_kwargs)
                    choice = completion.choices[0]
                    msg = choice.message
                    tool_calls_fb = None
                    if msg.tool_calls:
                        normalized = []
                        for tc in msg.tool_calls:
                            args = tc.function.arguments
                            if isinstance(args, str):
                                try:
                                    args = json.loads(args)
                                except Exception:
                                    args = {"_raw": args}
                            normalized.append(ToolCall(id=getattr(tc, 'id', None), name=tc.function.name, arguments=args))
                        tool_calls_fb = normalized
                    return ChatResponse(
                        provider=self.name,
                        model=chat_fallback,
                        content=msg.content or None,
                        tool_calls=tool_calls_fb,
                        finish_reason=choice.finish_reason,
                    )
            else:
                response_format = {"type": "json_object"} if req.response_format == "json" else None
                kwargs = dict(
                    model=req.model,
                    messages=[m.model_dump() for m in req.messages],
                    temperature=req.temperature,
                    top_p=req.top_p,
                )
                # token param for Chat
                if req.max_tokens is not None:
                    kwargs["max_tokens"] = req.max_tokens
                elif cfg.get("max_tokens"):
                    kwargs["max_tokens"] = cfg["max_tokens"]

                if tools:
                    kwargs["tools"] = tools
                    if req.tool_choice:
                        kwargs["tool_choice"] = req.tool_choice
                if response_format is not None:
                    kwargs["response_format"] = response_format

                completion = await self.client.chat.completions.create(**kwargs)

                choice = completion.choices[0]
                msg = choice.message
                tool_calls = None
                if msg.tool_calls:
                    normalized = []
                    for tc in msg.tool_calls:
                        args = tc.function.arguments
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except Exception:
                                args = {"_raw": args}
                        normalized.append(ToolCall(id=getattr(tc, 'id', None), name=tc.function.name, arguments=args))
                    tool_calls = normalized

                return ChatResponse(
                    provider=self.name,
                    model=req.model,
                    content=msg.content or None,
                    tool_calls=tool_calls,
                    finish_reason=choice.finish_reason,
                )
        except AuthenticationError as e:
            raise AuthError(str(e), provider=self.name)
        except RateLimitError as e:
            raise RL(str(e), provider=self.name)
        except OAI_BAD as e:
            raise BadRequestError(str(e), provider=self.name)
        except APIError as e:
            raise ProviderAPIError(str(e), provider=self.name)


