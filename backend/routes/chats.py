"""Chat routes"""
from fastapi import APIRouter, Depends, Request
from services.chat_service import ChatService
from utils.auth import verify_user_access
from db import User
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/chats/{user_id}")
@limiter.limit("30/minute")
async def get_chats(request: Request, user_id: str, current_user: User = Depends(verify_user_access)):
    """Get list of all chats (conversations) for a user (only own chats)"""
    return ChatService.get_chats(user_id)