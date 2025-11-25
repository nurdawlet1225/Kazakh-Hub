"""Message-related Pydantic models"""
from pydantic import BaseModel


class MessageCreate(BaseModel):
    fromUserId: str
    toUserId: str
    content: str

