"""Friend-related Pydantic models"""
from pydantic import BaseModel, Field


class FriendRequestCreate(BaseModel):
    fromUserId: str = Field(max_length=50)
    toUserId: str = Field(max_length=50)

