import os
import anthropic
from ...core.errors import AuthError, RateLimitError as RL, ProviderAPIError, BadRequestError
from ...core.schemas import ChatRequest, ChatResponse, ToolCall
from ...core.provider_base import LLMProvider


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self):
        key = os.getenv("ANTHROPIC_API_KEY")
        if not key:
            raise AuthError("ANTHROPIC_API_KEY is not set", provider=self.name)
        self.client = anthropic.AsyncAnthropic(api_key=key)

    async def chat(self, req: ChatRequest) -> ChatResponse:
        try:
            messages_payload = [
                {
                    "role": m.role,
                    "content": [{"type": "text", "text": m.content}],
                }
                for m in req.messages
            ]

            tools = None
            if req.tools:
                tools = [
                    {
                        "name": t.name,
                        "description": t.description or "",
                        "input_schema": t.parameters,
                    }
                    for t in req.tools
                ]

            tool_choice = None
            if tools is not None:
                if req.tool_choice in (None, "auto"):
                    tool_choice = {"type": "auto"}
                elif req.tool_choice == "required":
                    tool_choice = {"type": "any"}
                else:
                    tool_choice = {"type": "none"}

            requested_max = req.max_tokens or 1024
            safe_cap = 4096
            max_tokens = requested_max if requested_max <= safe_cap else safe_cap

            try:
                kwargs = dict(
                    model=req.model,
                    messages=messages_payload,
                    temperature=req.temperature,
                    max_tokens=max_tokens,
                )
                if tools is not None:
                    kwargs["tools"] = tools
                if tool_choice is not None:
                    kwargs["tool_choice"] = tool_choice
                msg = await self.client.messages.create(**kwargs)
            except ValueError as ve:
                if "Streaming is required" in str(ve):
                    stream_kwargs = dict(
                        model=req.model,
                        messages=messages_payload,
                        temperature=req.temperature,
                        max_tokens=min(1024, max_tokens),
                        stream=True,
                    )
                    if tools is not None:
                        stream_kwargs["tools"] = tools
                    if tool_choice is not None:
                        stream_kwargs["tool_choice"] = tool_choice
                    stream = await self.client.messages.create(**stream_kwargs)
                    combined_blocks = []
                    async for chunk in stream:
                        combined_blocks.extend(chunk.content)
                    class _Obj:
                        pass
                    msg = _Obj()
                    msg.content = combined_blocks
                    msg.stop_reason = "stop"
                else:
                    raise

            content_text = ""
            tool_calls: list[ToolCall] | None = None
            for block in msg.content:
                btype = getattr(block, "type", None) if not isinstance(block, dict) else block.get("type")
                # Text block
                if btype == "text":
                    text = getattr(block, "text", None) if not isinstance(block, dict) else block.get("text")
                    if text:
                        content_text += text
                    continue
                # Tool use block
                if btype == "tool_use":
                    name = getattr(block, "name", None) if not isinstance(block, dict) else block.get("name")
                    args = getattr(block, "input", None) if not isinstance(block, dict) else block.get("input")
                    if name:
                        tool_calls = (tool_calls or []) + [ToolCall(name=name, arguments=args or {})]

            return ChatResponse(
                provider=self.name,
                model=req.model,
                content=content_text or None,
                tool_calls=tool_calls,
                finish_reason=getattr(msg, "stop_reason", None),
            )
        except anthropic.AuthenticationError as e:
            detail = {}
            body = getattr(e, "body", None)
            if isinstance(body, dict):
                detail = {"type": body.get("error", {}).get("type"), "message": body.get("error", {}).get("message")}
            raise AuthError(str(e), provider=self.name, detail=detail)
        except anthropic.RateLimitError as e:
            detail = {}
            body = getattr(e, "body", None)
            if isinstance(body, dict):
                detail = {"type": body.get("error", {}).get("type"), "message": body.get("error", {}).get("message"), "retry_after": getattr(e, "retry_after", None)}
            raise RL(str(e), provider=self.name, detail=detail)
        except anthropic.BadRequestError as e:
            detail = {}
            body = getattr(e, "body", None)
            if isinstance(body, dict):
                err = body.get("error", {})
                detail = {"type": err.get("type"), "message": err.get("message"), "param": err.get("param")}
            raise BadRequestError(str(e), provider=self.name, detail=detail)
        except anthropic.APIError as e:
            detail = {}
            body = getattr(e, "body", None)
            if isinstance(body, dict):
                err = body.get("error", {})
                detail = {"type": err.get("type"), "message": err.get("message")}
            raise ProviderAPIError(str(e), provider=self.name, detail=detail)


