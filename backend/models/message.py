"""Message-related Pydantic models"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class MessageCreate(BaseModel):
    fromUserId: str = Field(max_length=50)
    toUserId: str = Field(max_length=50)
    content: str = Field(max_length=5000)
    type: Optional[str] = Field(default="text", max_length=20, pattern=r'^(text|image|audio|video|file|sticker|emoji|location)$')
    attachments: Optional[List[Dict[str, Any]]] = None  # List of attachment objects
    metadata: Optional[Dict[str, Any]] = None  # Additional metadata (location, sticker info, etc.)

