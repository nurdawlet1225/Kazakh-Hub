"""User routes"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models import UserUpdate, DeleteUserRequest
from services.user_service import UserService
from database import users, codes, friends, messages, friend_requests, passwords, save_users, save_codes, save_friends, save_messages, save_friend_requests, save_passwords

router = APIRouter()


@router.get("/user")
async def get_current_user():
    """Get current user"""
    user = UserService.find_user_by_username('current-user')
    if not user and users:
        user = users[0]
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users/search")
async def search_users(query: Optional[str] = Query(None)):
    """Search users by username or email"""
    if not query:
        return []
    return UserService.search_users(query)


@router.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    user = UserService.find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/user")
async def update_user(user_data: UserUpdate):
    """Update user profile"""
    try:
        user = UserService.update_user(
            user_id=user_data.userId,
            current_email=user_data.currentEmail,
            username=user_data.username,
            email=user_data.email,
            avatar=user_data.avatar
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f'Error updating user profile: {e}')
        raise HTTPException(status_code=500, detail="Internal server error while updating profile")


@router.delete("/user")
async def delete_user(request: DeleteUserRequest):
    """Delete user account"""
    try:
        user_id_to_delete, username = UserService.delete_user(
            user_id=request.userId,
            email=request.email
        )
        
        # Delete user's codes
        codes[:] = [code for code in codes if code.get('author') != username]
        save_codes()
        
        # Delete user from friends lists
        if user_id_to_delete in friends:
            del friends[user_id_to_delete]
        for friend_user_id in friends:
            if friends[friend_user_id]:
                friends[friend_user_id] = [id for id in friends[friend_user_id] if id != user_id_to_delete]
        save_friends()
        
        # Delete user's messages
        messages[:] = [msg for msg in messages if msg.get('fromUserId') != user_id_to_delete and msg.get('toUserId') != user_id_to_delete]
        save_messages()
        
        # Delete friend requests involving this user
        friend_requests[:] = [req for req in friend_requests if req.get('fromUserId') != user_id_to_delete and req.get('toUserId') != user_id_to_delete]
        save_friend_requests()
        
        # Remove user from likes and comments in remaining codes
        for code in codes:
            if 'likes' in code:
                code['likes'] = [id for id in code['likes'] if id != user_id_to_delete]
            if 'comments' in code:
                code['comments'] = [
                    comment for comment in code['comments']
                    if comment.get('author') != username
                ]
                for comment in code['comments']:
                    if 'likes' in comment:
                        comment['likes'] = [id for id in comment['likes'] if id != user_id_to_delete]
                    if 'replies' in comment:
                        comment['replies'] = [reply for reply in comment['replies'] if reply.get('author') != username]
        save_codes()
        
        return {"message": "Account deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f'Error deleting account: {e}')
        raise HTTPException(status_code=500, detail="Internal server error while deleting account")


@router.delete("/users/delete-all")
async def delete_all_accounts():
    """Delete all accounts - WARNING: This is irreversible!"""
    try:
        users_count = len(users)
        users.clear()
        save_users()
        passwords.clear()
        save_passwords()
        codes.clear()
        save_codes()
        friends.clear()
        save_friends()
        messages.clear()
        save_messages()
        friend_requests.clear()
        save_friend_requests()
        
        return {
            "message": f"Барлық аккаунттар жойылды",
            "deletedAccounts": users_count,
            "warning": "Бұл операция қайтымсыз!"
        }
    except Exception as e:
        print(f'Error deleting all accounts: {e}')
        raise HTTPException(status_code=500, detail="Internal server error while deleting all accounts")

