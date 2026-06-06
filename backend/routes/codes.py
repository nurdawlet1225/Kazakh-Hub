"""Code routes"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from models import CodeCreate, CodeUpdate, CommentCreate, CommentUpdate, LikeRequest, ViewRequest, DeleteMultipleRequest
from services.code_service import CodeService
from utils.auth import get_current_user, get_optional_user
from db import User

router = APIRouter()


@router.get("/codes")
async def get_codes(
    folderId: Optional[str] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0),
    includeContent: Optional[bool] = Query(False)
):
    """Get codes, optionally filtered by folder with pagination support"""
    return CodeService.get_codes(folderId, limit=limit, offset=offset, include_content=includeContent)


@router.get("/codes/{code_id}")
async def get_code(code_id: str):
    """Get a code by ID"""
    code = CodeService.find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    return code


@router.post("/codes")
async def create_code(code_data: CodeCreate, user: User = Depends(get_current_user)):
    """Create a new code"""
    try:
        code_dict = code_data.model_dump()
        return CodeService.create_code(code_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f'POST /api/codes - Error: {e}')
        raise HTTPException(status_code=500, detail="Қате орын алды! Сервер қатесі.")


@router.put("/codes/{code_id}")
async def update_code(code_id: str, code_data: CodeUpdate, user: User = Depends(get_current_user)):
    """Update a code"""
    try:
        existing_code = CodeService.find_code_by_id(code_id)
        if not existing_code:
            raise HTTPException(status_code=404, detail="Code file not found")
        if existing_code.get('author') != user.username:
            raise HTTPException(status_code=403, detail="You can only edit your own codes")
        code_dict = {k: v for k, v in code_data.model_dump().items() if v is not None}
        return CodeService.update_code(code_id, code_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/codes/{code_id}")
async def delete_code(code_id: str, user: User = Depends(get_current_user)):
    """Delete a code"""
    try:
        existing_code = CodeService.find_code_by_id(code_id)
        if not existing_code:
            raise HTTPException(status_code=404, detail="Code file not found")
        if existing_code.get('author') != user.username:
            raise HTTPException(status_code=403, detail="You can only delete your own codes")
        CodeService.delete_code(code_id)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=204)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/codes/delete-multiple")
async def delete_multiple_codes(request: DeleteMultipleRequest, user: User = Depends(get_current_user)):
    """Delete multiple codes"""
    if not request.ids or len(request.ids) == 0:
        raise HTTPException(status_code=400, detail="IDs array required")

    # Verify ownership of all codes
    for code_id in request.ids:
        existing_code = CodeService.find_code_by_id(code_id)
        if existing_code and existing_code.get('author') != user.username:
            raise HTTPException(status_code=403, detail=f"You can only delete your own codes")

    deleted_count = CodeService.delete_multiple_codes(request.ids)
    return {"message": f"{deleted_count} код(тар) жойылды", "deletedCount": deleted_count}


@router.post("/codes/{code_id}/like")
async def like_code(code_id: str, user: User = Depends(get_current_user)):
    """Like a code"""
    try:
        return CodeService.like_code(code_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/codes/{code_id}/unlike")
async def unlike_code(code_id: str, user: User = Depends(get_current_user)):
    """Unlike a code"""
    try:
        return CodeService.unlike_code(code_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/codes/{code_id}/view")
async def view_code(code_id: str, request: ViewRequest):
    """Increment view count for a code"""
    try:
        return CodeService.view_code(code_id, request.userId)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/codes/{code_id}/comments")
async def add_comment(code_id: str, comment_data: CommentCreate, user: User = Depends(get_current_user)):
    """Add a comment to a code"""
    try:
        return CodeService.add_comment(code_id, user.username, comment_data.content, comment_data.parentId)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/codes/{code_id}/comments/{comment_id}")
async def update_comment(code_id: str, comment_id: str, comment_data: CommentUpdate, user: User = Depends(get_current_user)):
    """Update a comment"""
    try:
        return CodeService.update_comment(code_id, comment_id, comment_data.content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/codes/{code_id}/comments/{comment_id}")
async def delete_comment(code_id: str, comment_id: str, user: User = Depends(get_current_user)):
    """Delete a comment"""
    try:
        return CodeService.delete_comment(code_id, comment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/codes/{code_id}/comments/{comment_id}/like")
async def like_comment(code_id: str, comment_id: str, user: User = Depends(get_current_user)):
    """Like/unlike a comment"""
    try:
        return CodeService.like_comment(code_id, comment_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

