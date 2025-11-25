"""User-related Pydantic models"""
from pydantic import BaseModel, field_validator
from typing import Optional
from utils.validators import validate_email


class UserRegister(BaseModel):
    username: str
    email: str
    password: Optional[str] = None  # Optional for Firebase auth users
    firebase_uid: Optional[str] = None  # Firebase user ID
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        return validate_email(v)


class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None  # Optional for Firebase auth users
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            return validate_email(v)
        return v


class ChangePassword(BaseModel):
    userId: Optional[str] = None
    email: Optional[str] = None
    currentPassword: Optional[str] = None
    newPassword: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            return validate_email(v)
        return v


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    userId: Optional[str] = None
    currentEmail: Optional[str] = None
    
    @field_validator('email', 'currentEmail')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            return validate_email(v)
        return v


class DeleteUserRequest(BaseModel):
    userId: Optional[str] = None
    email: Optional[str] = None
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            return validate_email(v)
        return v

