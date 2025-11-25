"""Authentication routes"""
from fastapi import APIRouter, HTTPException
from models import UserRegister, UserLogin, ChangePassword
from services.user_service import UserService
from database import passwords, save_passwords

router = APIRouter()


@router.post("/auth/register")
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        # Validate input
        if not user_data.username or not user_data.username.strip():
            raise HTTPException(status_code=400, detail="Username is required")
        
        if not user_data.email or not user_data.email.strip():
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check if user already exists
        existing_user = UserService.find_user_by_email(user_data.email) or \
                        UserService.find_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(status_code=409, detail="User already exists")
        
        # Create new user
        new_user = UserService.create_user(
            username=user_data.username.strip(),
            email=user_data.email.strip(),
            password=user_data.password if user_data.password else None,
            firebase_uid=user_data.firebase_uid
        )
        
        if not new_user:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        return {"user": new_user, "message": "User registered successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/auth/login")
async def login(login_data: UserLogin):
    """Login a user"""
    if not login_data.email and not login_data.username:
        raise HTTPException(status_code=400, detail="Email or username required")
    
    user = None
    
    if login_data.email:
        user = UserService.find_user_by_email(login_data.email)
    elif login_data.username:
        user = UserService.find_user_by_username(login_data.username)
    
    # If no password provided, assume Firebase auth and return user if found
    if not login_data.password:
        if user:
            return {"user": user, "message": "Login successful"}
        else:
            raise HTTPException(status_code=401, detail="User not found")
    
    # Traditional password-based login
    stored_password = None
    if login_data.email:
        stored_password = passwords.get(login_data.email)
    elif login_data.username and user:
        stored_password = passwords.get(user['email'])
    
    if not user or stored_password != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"user": user, "message": "Login successful"}


@router.post("/auth/change-password")
async def change_password(request: ChangePassword):
    """Change user password"""
    if not request.newPassword:
        raise HTTPException(status_code=400, detail="New password required")
    
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    user = None
    if request.userId:
        user = UserService.find_user_by_id(request.userId)
    elif request.email:
        user = UserService.find_user_by_email(request.email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.currentPassword:
        stored_password = passwords.get(user['email'])
        if stored_password != request.currentPassword:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    passwords[user['email']] = request.newPassword
    save_passwords()
    return {"message": "Password changed successfully"}

