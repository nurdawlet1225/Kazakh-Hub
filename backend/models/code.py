"""Code-related Pydantic models"""
from pydantic import BaseModel
from typing import Optional, List, Any


class CodeCreate(BaseModel):
    title: str
    content: str
    language: str
    author: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    folderId: Optional[str] = None
    folderPath: Optional[str] = None
    isFolder: Optional[bool] = False
    folderStructure: Optional[Any] = None


class CodeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class CommentCreate(BaseModel):
    author: str
    content: str
    parentId: Optional[str] = None


class CommentUpdate(BaseModel):
    content: str


class LikeRequest(BaseModel):
    userId: str


class ViewRequest(BaseModel):
    userId: Optional[str] = None


class DeleteMultipleRequest(BaseModel):
    ids: List[str]

