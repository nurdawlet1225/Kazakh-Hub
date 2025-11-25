"""Friend-related Pydantic models"""
from pydantic import BaseModel


class FriendRequestCreate(BaseModel):
    fromUserId: str
    toUserId: str

