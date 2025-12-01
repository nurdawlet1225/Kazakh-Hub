"""Message routes"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List
import json
from models import MessageCreate
from services.message_service import MessageService
from services.friend_service import FriendService
import os
from datetime import datetime

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/images", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/audio", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/video", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/files", exist_ok=True)


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
    if not message_data.fromUserId or not message_data.toUserId:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # For non-text messages, content can be empty
    if message_data.type == "text" and not message_data.content:
        raise HTTPException(status_code=400, detail="Text messages require content")
    
    try:
        are_friends = FriendService.are_friends(message_data.fromUserId, message_data.toUserId)
        message = await MessageService.create_message(
            from_user_id=message_data.fromUserId,
            to_user_id=message_data.toUserId,
            content=message_data.content or "",
            are_friends=are_friends,
            message_type=message_data.type or "text",
            attachments=message_data.attachments,
            metadata=message_data.metadata
        )
        return message
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/messages/upload")
async def upload_file(
    file: UploadFile = File(...),
    fromUserId: str = Form(...),
    toUserId: str = Form(...),
    messageType: str = Form("file"),
    content: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None)
):
    """Upload a file and create a message with attachment"""
    try:
        # Verify friendship
        are_friends = FriendService.are_friends(fromUserId, toUserId)
        if not are_friends:
            raise HTTPException(status_code=403, detail="You can only message friends")
        
        # Determine upload directory based on message type
        upload_subdir = {
            "image": "images",
            "audio": "audio",
            "video": "video",
            "file": "files"
        }.get(messageType, "files")
        
        upload_path = f"{UPLOAD_DIR}/{upload_subdir}"
        os.makedirs(upload_path, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(upload_path, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content_bytes = await file.read()
            buffer.write(content_bytes)
        
        # Get file size
        file_size = len(content_bytes)
        
        # Create attachment object
        attachment = {
            "filename": file.filename,
            "url": f"/api/uploads/{upload_subdir}/{unique_filename}",
            "size": file_size,
            "mimeType": file.content_type or "application/octet-stream"
        }
        
        # Parse metadata if provided
        metadata_dict = {}
        if metadata:
            try:
                metadata_dict = json.loads(metadata)
            except:
                pass
        
        # Create message
        message = await MessageService.create_message(
            from_user_id=fromUserId,
            to_user_id=toUserId,
            content=content or "",
            are_friends=are_friends,
            message_type=messageType,
            attachments=[attachment],
            metadata=metadata_dict
        )
        
        return message
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


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

