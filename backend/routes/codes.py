"""Code routes"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models import CodeCreate, CodeUpdate, CommentCreate, CommentUpdate, LikeRequest, ViewRequest, DeleteMultipleRequest
from services.code_service import CodeService

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
async def create_code(code_data: CodeCreate):
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
async def update_code(code_id: str, code_data: CodeUpdate):
    """Update a code"""
    try:
        code_dict = {k: v for k, v in code_data.model_dump().items() if v is not None}
        return CodeService.update_code(code_id, code_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/codes/{code_id}")
async def delete_code(code_id: str):
    """Delete a code"""
    try:
        CodeService.delete_code(code_id)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=204)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/codes/delete-multiple")
async def delete_multiple_codes(request: DeleteMultipleRequest):
    """Delete multiple codes"""
    if not request.ids or len(request.ids) == 0:
        raise HTTPException(status_code=400, detail="IDs array required")
    
    deleted_count = CodeService.delete_multiple_codes(request.ids)
    return {"message": f"{deleted_count} код(тар) жойылды", "deletedCount": deleted_count}


@router.post("/codes/{code_id}/like")
async def like_code(code_id: str, request: LikeRequest):
    """Like a code"""
    try:
        return CodeService.like_code(code_id, request.userId)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/codes/{code_id}/unlike")
async def unlike_code(code_id: str, request: LikeRequest):
    """Unlike a code"""
    try:
        return CodeService.unlike_code(code_id, request.userId)
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
async def add_comment(code_id: str, comment_data: CommentCreate):
    """Add a comment to a code"""
    try:
        return CodeService.add_comment(code_id, comment_data.author, comment_data.content, comment_data.parentId)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/codes/{code_id}/comments/{comment_id}")
async def update_comment(code_id: str, comment_id: str, comment_data: CommentUpdate):
    """Update a comment"""
    try:
        return CodeService.update_comment(code_id, comment_id, comment_data.content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/codes/{code_id}/comments/{comment_id}")
async def delete_comment(code_id: str, comment_id: str):
    """Delete a comment"""
    try:
        return CodeService.delete_comment(code_id, comment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/codes/{code_id}/comments/{comment_id}/like")
async def like_comment(code_id: str, comment_id: str, request: LikeRequest):
    """Like/unlike a comment"""
    try:
        return CodeService.like_comment(code_id, comment_id, request.userId)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

