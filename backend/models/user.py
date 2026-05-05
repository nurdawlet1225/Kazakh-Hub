"""User-related Pydantic models"""
from pydantic import BaseModel, field_validator
from typing import Optional
from utils.validators import validate_email


class UserRegister(BaseModel):
    username: str
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        return validate_email(v)


class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            return validate_email(v)
        return v


class ChangePassword(BaseModel):
    currentPassword: str
    newPassword: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
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


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        return validate_email(v)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class TwoFACode(BaseModel):
    code: str


class TwoFASetupVerify(BaseModel):
    code: str


class TwoFADisable(BaseModel):
    password: str


class TwoFALoginVerify(BaseModel):
    temp_token: str
    code: str