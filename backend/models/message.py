"""Message-related Pydantic models"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class MessageCreate(BaseModel):
    fromUserId: str
    toUserId: str
    content: str
    type: Optional[str] = "text"  # text, image, audio, video, file, sticker, emoji, location
    attachments: Optional[List[Dict[str, Any]]] = None  # List of attachment objects
    metadata: Optional[Dict[str, Any]] = None  # Additional metadata (location, sticker info, etc.)

