from fastapi import APIRouter
from ...core.schemas import ChatRequest, ChatResponse
from ...services.chat_service import ChatService


router = APIRouter()
svc = ChatService()


@router.post("/v1/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    return await svc.chat(req)


