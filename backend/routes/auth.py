"""Authentication routes"""
import secrets
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models import (
    UserRegister, UserLogin, ChangePassword,
    RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest,
    TwoFASetupVerify, TwoFADisable, TwoFALoginVerify,
)
from db import get_db, User, PasswordReset
from utils.password import hash_password, verify_password
from utils.auth import (
    create_access_token, create_refresh_token, create_temp_2fa_token,
    decode_token, get_current_user, oauth2_scheme,
)
from config import JWT_SECRET_KEY, JWT_ALGORITHM

router = APIRouter()


def generate_user_id() -> str:
    return ''.join([str(secrets.randbelow(10)) for _ in range(12)])


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "bio": user.bio,
        "totp_enabled": user.totp_enabled,
    }


def _create_tokens(user: User, db: Session) -> dict:
    session_id = str(uuid.uuid4())
    user.session_id = session_id

    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "session_id": session_id}
    )
    refresh_token = create_refresh_token(data={"sub": user.id})

    # Store refresh token hash for validation
    user.refresh_token_hash = hash_password(refresh_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/auth/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    try:
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

        existing_user = db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()
        if existing_user:
            raise HTTPException(status_code=409, detail="User already exists")

        user_id = generate_user_id()
        while db.query(User).filter(User.id == user_id).first():
            user_id = generate_user_id()

        password_hash = hash_password(user_data.password)
        new_user = User(
            id=user_id,
            username=username,
            email=email,
            password_hash=password_hash,
            avatar=None,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        tokens = _create_tokens(new_user, db)
        return {
            "user": _user_dict(new_user),
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": "bearer",
            "message": "User registered successfully",
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/auth/login")
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    if not login_data.email and not login_data.username:
        raise HTTPException(status_code=400, detail="Email or username required")
    if not login_data.password:
        raise HTTPException(status_code=400, detail="Password is required")

    user = None
    if login_data.email:
        user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    elif login_data.username:
        user = db.query(User).filter(User.username == login_data.username.strip()).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.password_hash or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # If 2FA is enabled, return a temp token instead of real tokens
    if user.totp_enabled:
        temp_token = create_temp_2fa_token(data={"sub": user.id})
        return {
            "requires_2fa": True,
            "temp_token": temp_token,
            "user_id": user.id,
        }

    tokens = _create_tokens(user, db)
    return {
        "user": _user_dict(user),
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }


@router.post("/auth/refresh")
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(request.refresh_token)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Validate the refresh token hash
    if not user.refresh_token_hash or not verify_password(request.refresh_token, user.refresh_token_hash):
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "session_id": user.session_id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/auth/logout")
async def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.session_id = None
    user.refresh_token_hash = None
    db.commit()
    return {"message": "Logged out successfully"}


@router.post("/auth/change-password")
async def change_password(
    request: ChangePassword,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.currentPassword:
        raise HTTPException(status_code=400, detail="Current password is required")
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    if not user.password_hash or not verify_password(request.currentPassword, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    user.password_hash = hash_password(request.newPassword)
    # Invalidate sessions after password change
    user.session_id = None
    user.refresh_token_hash = None
    db.commit()

    return {"message": "Password changed successfully. Please log in again."}


@router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.strip().lower()).first()
    if not user:
        # Don't reveal whether email exists
        return {"message": "If the email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    reset = PasswordReset(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(reset)
    db.commit()

    # In production, send via email. For now, return token in response.
    return {
        "message": "If the email exists, a reset link has been sent.",
        "reset_token": token,  # Remove in production
    }


@router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    reset_entry = db.query(PasswordReset).filter(
        PasswordReset.token == request.token,
        PasswordReset.used == False,
    ).first()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if reset_entry.expires_at and datetime.utcnow() > reset_entry.expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user = db.query(User).filter(User.id == reset_entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(request.new_password)
    user.session_id = None
    user.refresh_token_hash = None
    reset_entry.used = True
    db.commit()

    return {"message": "Password reset successfully"}


# ── 2FA endpoints ──

@router.post("/auth/2fa/setup")
async def setup_2fa(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")

    from utils.totp import generate_totp_secret, get_totp_uri

    secret = generate_totp_secret()
    user.totp_secret = secret
    db.commit()

    uri = get_totp_uri(secret, user.email)
    return {
        "secret": secret,
        "uri": uri,
    }


@router.post("/auth/2fa/verify-setup")
async def verify_2fa_setup(
    request: TwoFASetupVerify,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from utils.totp import verify_totp_code, generate_recovery_codes, hash_recovery_code
    import json

    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA not set up. Call /auth/2fa/setup first.")

    if not verify_totp_code(user.totp_secret, request.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.totp_enabled = True
    codes = generate_recovery_codes()
    user.recovery_codes = json.dumps([hash_recovery_code(c) for c in codes])
    db.commit()

    return {
        "message": "2FA enabled successfully",
        "recovery_codes": codes,
    }


@router.post("/auth/2fa/disable")
async def disable_2fa(
    request: TwoFADisable,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    if not user.password_hash or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")

    user.totp_secret = None
    user.totp_enabled = False
    user.recovery_codes = None
    db.commit()

    return {"message": "2FA disabled successfully"}


@router.post("/auth/2fa/verify")
async def verify_2fa_login(request: TwoFALoginVerify, db: Session = Depends(get_db)):
    from utils.totp import verify_totp_code, verify_recovery_code
    import json

    try:
        payload = decode_token(request.temp_token)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid or expired 2FA token")

    if payload.get("type") != "2fa_temp":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.totp_enabled:
        raise HTTPException(status_code=401, detail="User not found or 2FA not enabled")

    # Check TOTP code first
    code_valid = False
    if user.totp_secret and verify_totp_code(user.totp_secret, request.code):
        code_valid = True
    else:
        # Check recovery codes
        if user.recovery_codes:
            try:
                stored_codes = json.loads(user.recovery_codes)
                for i, hashed in enumerate(stored_codes):
                    if verify_recovery_code(request.code, hashed):
                        # Remove used recovery code
                        stored_codes.pop(i)
                        user.recovery_codes = json.dumps(stored_codes) if stored_codes else None
                        db.commit()
                        code_valid = True
                        break
            except (json.JSONDecodeError, ValueError):
                pass

    if not code_valid:
        raise HTTPException(status_code=400, detail="Invalid 2FA code")

    tokens = _create_tokens(user, db)
    return {
        "user": _user_dict(user),
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }