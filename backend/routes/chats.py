"""Chat routes"""
from fastapi import APIRouter
from services.chat_service import ChatService

router = APIRouter()


@router.get("/chats/{user_id}")
async def get_chats(user_id: str):
    """Get list of all chats (conversations) for a user"""
    return ChatService.get_chats(user_id)

