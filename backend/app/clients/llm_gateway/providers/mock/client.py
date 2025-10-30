from ...core.provider_base import LLMProvider
from ...core.schemas import ChatRequest, ChatResponse


class MockProvider(LLMProvider):
    name = "mock"

    def __init__(self):
        pass

    async def chat(self, req: ChatRequest) -> ChatResponse:
        # Echo the last user message or a canned response
        last_user = None
        for m in reversed(req.messages):
            if m.role == "user":
                last_user = m
                break
        content = (
            f"[mock:{req.model}] You said: {last_user.content}" if last_user else f"[mock:{req.model}] Hello!"
        )
        return ChatResponse(provider=self.name, model=req.model, content=content)



