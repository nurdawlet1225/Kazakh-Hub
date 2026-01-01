"""Authentication routes"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models import UserRegister, UserLogin, ChangePassword
from db import get_db, User
from utils.password import hash_password, verify_password
import random

router = APIRouter()


def generate_user_id() -> str:
    """Generate a 12-digit numeric user ID"""
    return ''.join([str(random.randint(0, 9)) for _ in range(12)])


@router.post("/auth/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Validate input
        if not user_data.username or not user_data.username.strip():
            raise HTTPException(status_code=400, detail="Username is required")
        
        if not user_data.email or not user_data.email.strip():
            raise HTTPException(status_code=400, detail="Email is required")
        
        if not user_data.password or not user_data.password.strip():
            raise HTTPException(status_code=400, detail="Password is required")
        
        if len(user_data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        username = user_data.username.strip()
        email = user_data.email.strip().lower()
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=409, detail="User already exists")
        
        # Generate unique user ID
        user_id = generate_user_id()
        while db.query(User).filter(User.id == user_id).first():
            user_id = generate_user_id()
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Create new user
        new_user = User(
            id=user_id,
            username=username,
            email=email,
            password_hash=password_hash,
            avatar=None
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Return user data (without password hash)
        user_dict = {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "avatar": new_user.avatar
        }
        
        return {"user": user_dict, "message": "User registered successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/auth/login")
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login a user"""
    if not login_data.email and not login_data.username:
        raise HTTPException(status_code=400, detail="Email or username required")
    
    if not login_data.password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    # Find user by email or username
    user = None
    if login_data.email:
        user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    elif login_data.username:
        user = db.query(User).filter(User.username == login_data.username.strip()).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not user.password_hash or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Return user data (without password hash)
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar
    }
    
    return {"user": user_dict, "message": "Login successful"}


@router.post("/auth/change-password")
async def change_password(request: ChangePassword, db: Session = Depends(get_db)):
    """Change user password"""
    if not request.newPassword:
        raise HTTPException(status_code=400, detail="New password required")
    
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Find user
    user = None
    if request.userId:
        user = db.query(User).filter(User.id == request.userId).first()
    elif request.email:
        user = db.query(User).filter(User.email == request.email.strip().lower()).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password if provided
    if request.currentPassword:
        if not user.password_hash or not verify_password(request.currentPassword, user.password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Update password
    user.password_hash = hash_password(request.newPassword)
    db.commit()
    
    return {"message": "Password changed successfully"}

