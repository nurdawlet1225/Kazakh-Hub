"""Friend routes"""
from fastapi import APIRouter, HTTPException, Body, Depends, Request
from typing import Dict
from models import FriendRequestCreate
from services.friend_service import FriendService
from utils.auth import get_current_user, verify_user_access
from db import User
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/friends/{user_id}")
@limiter.limit("30/minute")
async def get_friends(request: Request, user_id: str, current_user: User = Depends(verify_user_access)):
    """Get all friends for a user (only own friends)"""
    return FriendService.get_friends(user_id)


@router.post("/friends/{user_id}/add")
@limiter.limit("10/minute")
async def add_friend(request: Request, user_id: str, body: Dict[str, str] = Body(...), current_user: User = Depends(verify_user_access)):
    """Add a friend (only for own account)"""
    friend_id = body.get('friendId')
    if not friend_id:
        raise HTTPException(status_code=400, detail="Friend ID is required")

    try:
        FriendService.add_friend(user_id, friend_id)
        return {"message": "Friend added successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/friends/{user_id}/remove/{friend_id}")
@limiter.limit("20/minute")
async def remove_friend(request: Request, user_id: str, friend_id: str, current_user: User = Depends(verify_user_access)):
    """Remove a friend (only for own account)"""
    FriendService.remove_friend(user_id, friend_id)
    return {"message": "Friend removed successfully"}


@router.get("/friend-requests/{user_id}")
@limiter.limit("30/minute")
async def get_friend_requests(request: Request, user_id: str, current_user: User = Depends(verify_user_access)):
    """Get all friend requests for a user (only own requests)"""
    return FriendService.get_friend_requests(user_id)


@router.get("/friend-requests/incoming/{user_id}")
@limiter.limit("30/minute")
async def get_incoming_friend_requests(request: Request, user_id: str, current_user: User = Depends(verify_user_access)):
    """Get incoming friend requests for a user (only own)"""
    return FriendService.get_incoming_friend_requests(user_id)


@router.get("/friend-requests/outgoing/{user_id}")
@limiter.limit("30/minute")
async def get_outgoing_friend_requests(request: Request, user_id: str, current_user: User = Depends(verify_user_access)):
    """Get outgoing friend requests for a user (only own)"""
    return FriendService.get_outgoing_friend_requests(user_id)


@router.get("/friend-requests/{user_id}/incoming-count")
@limiter.limit("30/minute")
async def get_incoming_friend_request_count(request: Request, user_id: str, current_user: User = Depends(verify_user_access)):
    """Get count of incoming friend requests (only own)"""
    count = FriendService.get_incoming_friend_request_count(user_id)
    return {'incomingRequestCount': count}


@router.post("/friend-requests")
@limiter.limit("10/minute")
async def create_friend_request(request: Request, friend_request: FriendRequestCreate, user: User = Depends(get_current_user)):
    """Create a friend request"""
    if not friend_request.fromUserId or not friend_request.toUserId:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Verify that the authenticated user is the one creating the request
    if str(user.id) != str(friend_request.fromUserId):
        raise HTTPException(status_code=403, detail="You can only create friend requests for yourself")

    try:
        return FriendService.create_friend_request(friend_request.fromUserId, friend_request.toUserId)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/friend-requests/{request_id}/accept")
@limiter.limit("20/minute")
async def accept_friend_request(request: Request, request_id: str, user: User = Depends(get_current_user)):
    """Accept a friend request (only the recipient can accept)"""
    try:
        # Look up the request to verify ownership before accepting
        friend_req = FriendService.get_friend_request_by_id(request_id)
        if not friend_req:
            raise HTTPException(status_code=404, detail="Friend request not found")
        # Only the recipient (toUserId) can accept
        if str(user.id) != str(friend_req.get('toUserId')):
            raise HTTPException(status_code=403, detail="Only the recipient can accept a friend request")
        result = FriendService.accept_friend_request(request_id)
        return {"message": "Friend request accepted", "request": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/friend-requests/{request_id}/reject")
@limiter.limit("20/minute")
async def reject_friend_request(request: Request, request_id: str, user: User = Depends(get_current_user)):
    """Reject a friend request (only the recipient can reject)"""
    try:
        # Look up the request to verify ownership before rejecting
        friend_req = FriendService.get_friend_request_by_id(request_id)
        if not friend_req:
            raise HTTPException(status_code=404, detail="Friend request not found")
        # Only the recipient (toUserId) can reject
        if str(user.id) != str(friend_req.get('toUserId')):
            raise HTTPException(status_code=403, detail="Only the recipient can reject a friend request")
        result = FriendService.reject_friend_request(request_id)
        return {"message": "Friend request rejected", "request": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/friend-requests/{request_id}/cancel")
@limiter.limit("20/minute")
async def cancel_friend_request(request: Request, request_id: str, body: Dict[str, str] = Body(...), user: User = Depends(get_current_user)):
    """Cancel a friend request (for outgoing requests)"""
    user_id = body.get('userId')
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    # Verify that the authenticated user is the one cancelling the request
    if str(user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="You can only cancel your own friend requests")

    try:
        cancelled_request = FriendService.cancel_friend_request(request_id, user_id)
        return {"message": "Friend request cancelled", "request": cancelled_request}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))