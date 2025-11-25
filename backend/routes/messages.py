"""Message routes"""
from fastapi import APIRouter, HTTPException
from models import MessageCreate
from services.message_service import MessageService
from services.friend_service import FriendService

router = APIRouter()


@router.get("/messages/{user_id}")
async def get_messages(user_id: str):
    """Get all messages for a user"""
    return MessageService.get_user_messages(user_id)


@router.get("/messages/{user_id}/{friend_id}")
async def get_conversation(user_id: str, friend_id: str):
    """Get conversation between two users"""
    return MessageService.get_conversation(user_id, friend_id)


@router.post("/messages")
async def create_message(message_data: MessageCreate):
    """Create a new message"""
    if not message_data.fromUserId or not message_data.toUserId or not message_data.content:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    try:
        are_friends = FriendService.are_friends(message_data.fromUserId, message_data.toUserId)
        message = await MessageService.create_message(
            from_user_id=message_data.fromUserId,
            to_user_id=message_data.toUserId,
            content=message_data.content,
            are_friends=are_friends
        )
        return message
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str):
    """Mark a message as read"""
    try:
        return await MessageService.mark_message_read(message_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/messages/{user_id}/{friend_id}/mark-read")
async def mark_conversation_read(user_id: str, friend_id: str):
    """Mark all messages in a conversation as read"""
    updated_count = await MessageService.mark_conversation_read(user_id, friend_id)
    return {'message': f'{updated_count} messages marked as read', 'count': updated_count}


@router.get("/messages/{user_id}/{friend_id}/unread-count")
async def get_unread_count_for_chat(user_id: str, friend_id: str):
    """Get unread message count for a specific chat"""
    unread_count = MessageService.get_unread_count_for_chat(user_id, friend_id)
    return {'unreadCount': unread_count, 'chatId': friend_id}


@router.get("/messages/{user_id}/unread-count")
async def get_total_unread_count(user_id: str):
    """Get total unread message count for a user"""
    total_count = MessageService.get_total_unread_count(user_id)
    return {'totalUnreadCount': total_count}

