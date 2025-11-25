"""API routes"""
from fastapi import APIRouter
from . import auth, codes, users, messages, friends, chats

# Create main router
api_router = APIRouter(prefix="/api")

# Include all route modules (websocket is included separately in main.py)
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(codes.router, tags=["codes"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(messages.router, tags=["messages"])
api_router.include_router(friends.router, tags=["friends"])
api_router.include_router(chats.router, tags=["chats"])

__all__ = ["api_router"]

