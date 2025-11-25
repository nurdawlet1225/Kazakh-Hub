"""Friend routes"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict
from models import FriendRequestCreate
from services.friend_service import FriendService

router = APIRouter()


@router.get("/friends/{user_id}")
async def get_friends(user_id: str):
    """Get all friends for a user"""
    return FriendService.get_friends(user_id)


@router.post("/friends/{user_id}/add")
async def add_friend(user_id: str, request: Dict[str, str] = Body(...)):
    """Add a friend"""
    friend_id = request.get('friendId')
    if not friend_id:
        raise HTTPException(status_code=400, detail="Friend ID is required")
    
    try:
        FriendService.add_friend(user_id, friend_id)
        return {"message": "Friend added successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/friends/{user_id}/remove/{friend_id}")
async def remove_friend(user_id: str, friend_id: str):
    """Remove a friend"""
    FriendService.remove_friend(user_id, friend_id)
    return {"message": "Friend removed successfully"}


@router.get("/friend-requests/{user_id}")
async def get_friend_requests(user_id: str):
    """Get all friend requests for a user"""
    return FriendService.get_friend_requests(user_id)


@router.get("/friend-requests/incoming/{user_id}")
async def get_incoming_friend_requests(user_id: str):
    """Get incoming friend requests for a user"""
    return FriendService.get_incoming_friend_requests(user_id)


@router.get("/friend-requests/{user_id}/incoming-count")
async def get_incoming_friend_request_count(user_id: str):
    """Get count of incoming friend requests"""
    count = FriendService.get_incoming_friend_request_count(user_id)
    return {'incomingRequestCount': count}


@router.post("/friend-requests")
async def create_friend_request(request: FriendRequestCreate):
    """Create a friend request"""
    if not request.fromUserId or not request.toUserId:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    try:
        return FriendService.create_friend_request(request.fromUserId, request.toUserId)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/friend-requests/{request_id}/accept")
async def accept_friend_request(request_id: str):
    """Accept a friend request"""
    try:
        request = FriendService.accept_friend_request(request_id)
        return {"message": "Friend request accepted", "request": request}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/friend-requests/{request_id}/reject")
async def reject_friend_request(request_id: str):
    """Reject a friend request"""
    try:
        request = FriendService.reject_friend_request(request_id)
        return {"message": "Friend request rejected", "request": request}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

