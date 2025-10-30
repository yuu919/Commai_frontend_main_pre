from fastapi import APIRouter
from app.services.llm_chat_service import ChatService
from app.clients.llm_gateway.core.schemas import ChatRequest, ChatResponse

router = APIRouter()
service = ChatService()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    return await service.chat(request)
