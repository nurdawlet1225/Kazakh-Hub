"""User routes"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional
from models import UserUpdate, DeleteUserRequest
from services.user_service import UserService
from database import users, codes, friends, messages, friend_requests, passwords, save_users, save_codes, save_friends, save_messages, save_friend_requests, save_passwords
from db import get_db, User

router = APIRouter()


@router.get("/user")
async def get_current_user(
    email: Optional[str] = Query(None), 
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get current user by email or user_id. Returns 404 if not found."""
    # First try SQL database (for new users registered with SQL auth)
    if user_id:
        sql_user = db.query(User).filter(User.id == user_id).first()
        if sql_user:
            return {
                "id": sql_user.id,
                "username": sql_user.username,
                "email": sql_user.email,
                "avatar": sql_user.avatar
            }
    
    if email:
        sql_user = db.query(User).filter(User.email == email.strip().lower()).first()
        if sql_user:
            return {
                "id": sql_user.id,
                "username": sql_user.username,
                "email": sql_user.email,
                "avatar": sql_user.avatar
            }
    
    # Fallback to JSON storage (for backward compatibility with old users)
    user = None
    
    # Try to find by user_id first (most specific)
    if user_id:
        user = UserService.find_user_by_id(user_id)
        if user:
            return user
    
    # Try to find by email
    if email:
        user = UserService.find_user_by_email(email)
        if user:
            return user
    
    # If both user_id and email were provided but user not found, return 404
    if user_id or email:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If no parameters provided, return 400 (bad request) instead of random user
    raise HTTPException(status_code=400, detail="Email or user_id parameter is required")


@router.get("/users/search")
async def search_users(query: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Search users by username or email"""
    if not query:
        return []
    
    search_term = query.strip().lower()
    results = []
    
    # Search in SQL database (SQLite compatible - case insensitive)
    from sqlalchemy import func
    sql_users = db.query(User).filter(
        (func.lower(User.username).contains(search_term)) | 
        (func.lower(User.email).contains(search_term)) |
        (User.id.like(f"%{search_term}%"))
    ).limit(50).all()
    
    for user in sql_users:
        results.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar
        })
    
    # Also search in JSON storage (for backward compatibility)
    json_users = UserService.search_users(query)
    
    # Merge results, avoiding duplicates
    existing_ids = {r["id"] for r in results}
    for json_user in json_users:
        if json_user["id"] not in existing_ids:
            results.append(json_user)
    
    return results


@router.get("/users/{user_id}")
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get user by ID"""
    # First try SQL database
    sql_user = db.query(User).filter(User.id == user_id).first()
    if sql_user:
        return {
            "id": sql_user.id,
            "username": sql_user.username,
            "email": sql_user.email,
            "avatar": sql_user.avatar
        }
    
    # Fallback to JSON storage
    user = UserService.find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/user")
async def update_user(user_data: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile"""
    try:
        # First try SQL database
        sql_user = None
        if user_data.userId:
            sql_user = db.query(User).filter(User.id == user_data.userId).first()
        elif user_data.currentEmail:
            sql_user = db.query(User).filter(User.email == user_data.currentEmail.strip().lower()).first()
        elif user_data.email:
            sql_user = db.query(User).filter(User.email == user_data.email.strip().lower()).first()
        
        if sql_user:
            # Update SQL user
            if user_data.username is not None and user_data.username.strip():
                # Check if username is taken by another user
                existing = db.query(User).filter(
                    User.username == user_data.username.strip(),
                    User.id != sql_user.id
                ).first()
                if existing:
                    raise ValueError("Username already in use by another user")
                sql_user.username = user_data.username.strip()
            
            if user_data.email is not None and user_data.email.strip():
                # Check if email is taken by another user
                existing = db.query(User).filter(
                    User.email == user_data.email.strip().lower(),
                    User.id != sql_user.id
                ).first()
                if existing:
                    raise ValueError("Email already in use by another user")
                sql_user.email = user_data.email.strip().lower()
            
            if user_data.avatar is not None:
                if user_data.avatar == '':
                    sql_user.avatar = None
                elif isinstance(user_data.avatar, str) and user_data.avatar.startswith('data:image'):
                    sql_user.avatar = user_data.avatar
                else:
                    raise ValueError("Invalid avatar format")
            
            db.commit()
            db.refresh(sql_user)
            
            return {
                "id": sql_user.id,
                "username": sql_user.username,
                "email": sql_user.email,
                "avatar": sql_user.avatar
            }
        
        # Fallback to JSON storage
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
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error while updating profile")


@router.delete("/user")
async def delete_user(request: DeleteUserRequest, db: Session = Depends(get_db)):
    """Delete user account"""
    try:
        # First try SQL database
        sql_user = None
        if request.userId:
            sql_user = db.query(User).filter(User.id == request.userId).first()
        elif request.email:
            sql_user = db.query(User).filter(User.email == request.email.strip().lower()).first()
        
        if sql_user:
            user_id_to_delete = sql_user.id
            username = sql_user.username
            
            # Delete from SQL database
            db.delete(sql_user)
            db.commit()
        else:
            # Fallback to JSON storage
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

