from abc import ABC, abstractmethod
from .schemas import ChatRequest, ChatResponse


class LLMProvider(ABC):
    name: str

    @abstractmethod
    async def chat(self, req: ChatRequest) -> ChatResponse:
        ...


