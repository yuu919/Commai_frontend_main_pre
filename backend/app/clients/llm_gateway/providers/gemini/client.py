import os
import json
import google.generativeai as genai
from ...core.errors import AuthError, RateLimitError as RL, ProviderAPIError, BadRequestError
from ...core.schemas import ChatRequest, ChatResponse, ToolCall
from ...core.provider_base import LLMProvider
from ...core.config import settings


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self):
        key = os.getenv("GOOGLE_API_KEY")
        if not key:
            raise AuthError("GOOGLE_API_KEY is not set", provider=self.name)
        genai.configure(api_key=key)

    def _to_tools(self, tools):
        if not tools:
            return None
        return [{
            "function_declarations": [
                {
                    "name": t.name,
                    "description": t.description or "",
                    "parameters": t.parameters,
                }
                for t in tools
            ]
        }]

    async def chat(self, req: ChatRequest) -> ChatResponse:
        try:
            # apply model defaults from config/models.json
            cfg = settings.models_config.get("gemini", {}).get(req.model, {})
            max_param = cfg.get("max_tokens_param", "max_output_tokens")
            default_max = cfg.get("max_tokens")

            tool_config = None
            if req.tools:
                mode = "AUTO"
                if req.tool_choice == "none":
                    mode = "NONE"
                elif req.tool_choice == "required":
                    mode = "ANY"
                tool_config = {"function_calling_config": {"mode": mode}}

            model = genai.GenerativeModel(req.model, tools=self._to_tools(req.tools), tool_config=tool_config)
            contents = []
            for m in req.messages:
                if m.role == "tool":
                    parts = []
                    try:
                        payload = json.loads(m.content)
                        if isinstance(payload, dict) and "name" in payload and "response" in payload:
                            parts.append({"function_response": {"name": payload["name"], "response": payload["response"]}})
                        else:
                            parts.append(m.content)
                    except Exception:
                        parts.append(m.content)
                    contents.append({"role": m.role, "parts": parts})
                else:
                    contents.append({"role": m.role, "parts": [m.content]})
            gen_cfg = {
                "temperature": req.temperature,
                "top_p": req.top_p,
                "response_mime_type": "application/json" if req.response_format == "json" else "text/plain",
            }
            # choose max_output_tokens default
            if req.max_tokens is not None:
                gen_cfg[max_param] = req.max_tokens
            elif default_max is not None:
                gen_cfg[max_param] = default_max

            resp = await model.generate_content_async(
                contents,
                generation_config=gen_cfg,
            )

            # Build text content safely without using resp.text (can raise if no text Part)
            out_text = None
            tool_calls: list[ToolCall] | None = None

            finish_reason = None
            for cand in getattr(resp, "candidates", []) or []:
                content = getattr(cand, "content", None)
                if not content:
                    continue
                finish_reason = getattr(cand, "finish_reason", finish_reason)
                for part in getattr(content, "parts", []):
                    fc = getattr(part, "function_call", None)
                    if fc:
                        args = getattr(fc, "args", None)
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except Exception:
                                args = {"_raw": args}
                        tool_calls = (tool_calls or []) + [ToolCall(name=getattr(fc, "name", None), arguments=args or {})]
                    else:
                        # Text part
                        text_val = getattr(part, "text", None)
                        if text_val is None and isinstance(part, str):
                            text_val = part
                        if text_val:
                            out_text = (out_text or "") + text_val

            # Safety block mapping: finish_reason 2 or string SAFETY
            if out_text is None and (finish_reason in (2, "SAFETY", "BLOCKED")):
                raise BadRequestError("Safety blocked", provider=self.name)

            return ChatResponse(
                provider=self.name,
                model=req.model,
                content=out_text,
                tool_calls=tool_calls,
                finish_reason=getattr(resp, "finish_reason", None),
            )
        except genai.types.generation_types.BlockedPromptException as e:
            raise BadRequestError(f"Safety blocked: {e}", provider=self.name)
        except Exception as e:
            msg = str(e)
            low = msg.lower()
            if "quota" in low or "rate limit" in low or "rate-limit" in low:
                raise RL(msg, provider=self.name)
            if "api key" in low or "permission" in low or "unauthorized" in low:
                raise AuthError(msg, provider=self.name)
            raise ProviderAPIError(msg, provider=self.name)


