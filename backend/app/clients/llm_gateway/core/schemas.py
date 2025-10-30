from typing import Any, Literal
from pydantic import BaseModel, Field, model_validator
import json
from .types import Role


class Message(BaseModel):
    role: Role
    content: str
    name: str | None = None
    # For OpenAI tool response association
    tool_call_id: str | None = None


class ToolFunction(BaseModel):
    name: str
    description: str | None = None
    parameters: dict = Field(default_factory=dict)  # JSON Schema


class ToolCall(BaseModel):
    id: str | None = None
    name: str
    arguments: dict


class ChatRequest(BaseModel):
    provider: Literal["openai", "anthropic", "gemini"] | None = None
    model: str
    messages: list[Message]
    tools: list[ToolFunction] | None = None
    tool_choice: Literal["auto", "none", "required"] | None = "auto"
    temperature: float | None = Field(default=0.7, ge=-2.0, le=2.0)
    top_p: float | None = Field(default=1.0, ge=0.0, le=1.0)
    max_tokens: int | None = Field(default=None, gt=0)
    response_format: Literal["text", "json"] | None = "text"
    extensions: dict | None = None  # provider-specific options

    @model_validator(mode="after")
    def validate_sizes(self):
        if len(self.messages) > 256:
            raise ValueError("messages length exceeds 256")
        tools = self.tools or []
        for t in tools:
            schema_bytes = len(json.dumps(t.parameters, ensure_ascii=False).encode("utf-8"))
            if schema_bytes > 64 * 1024:
                raise ValueError("tool schema exceeds 64kB")
        if (not tools) and self.tool_choice == "required":
            raise ValueError("tool_choice=required requires tools")
        return self


class ChatResponse(BaseModel):
    provider: str
    model: str
    content: str | None = None
    tool_calls: list[ToolCall] | None = None
    finish_reason: str | None = None
    raw: Any | None = None


