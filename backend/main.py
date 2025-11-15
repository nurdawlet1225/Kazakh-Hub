from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
import json
import os
import uuid
from datetime import datetime
import re

app = FastAPI(title="Kazakh Hub API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data file paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CODES_FILE = os.path.join(DATA_DIR, "codes.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
PASSWORDS_FILE = os.path.join(DATA_DIR, "passwords.json")
FRIENDS_FILE = os.path.join(DATA_DIR, "friends.json")
MESSAGES_FILE = os.path.join(DATA_DIR, "messages.json")
FRIEND_REQUESTS_FILE = os.path.join(DATA_DIR, "friendRequests.json")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# File validation constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB
DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.jar',
    '.app', '.deb', '.pkg', '.rpm', '.msi', '.dmg', '.sh', '.ps1',
    '.bin', '.dll', '.so', '.dylib', '.sys', '.drv', '.ocx', '.cpl',
    '.php', '.asp', '.aspx', '.jsp', '.class'
]

# Email validation helper
def validate_email(email: str) -> str:
    """Simple email validation"""
    if not email or '@' not in email:
        raise ValueError('Invalid email format')
    parts = email.split('@')
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError('Invalid email format')
    if '.' not in parts[1]:
        raise ValueError('Invalid email format')
    return email

# Data models
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

class MessageCreate(BaseModel):
    fromUserId: str
    toUserId: str
    content: str

class FriendRequestCreate(BaseModel):
    fromUserId: str
    toUserId: str

class DeleteMultipleRequest(BaseModel):
    ids: List[str]

class DeleteUserRequest(BaseModel):
    userId: Optional[str] = None
    email: Optional[str] = None
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            return validate_email(v)
        return v

# Data loading and saving functions
def load_data():
    global codes, users, passwords, friends, messages, friend_requests
    
    # Load codes
    try:
        if os.path.exists(CODES_FILE):
            with open(CODES_FILE, 'r', encoding='utf-8') as f:
                codes = json.load(f)
        else:
            codes = []
    except Exception as e:
        print(f'Error loading codes: {e}')
        codes = []
    
    # Load users
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                users = json.load(f)
        else:
            users = [{
                'id': '1',
                'username': 'current-user',
                'email': 'user@example.com',
                'avatar': None
            }]
            save_users()
    except Exception as e:
        print(f'Error loading users: {e}')
        users = [{
            'id': '1',
            'username': 'current-user',
            'email': 'user@example.com',
            'avatar': None
        }]
    
    # Load passwords
    try:
        if os.path.exists(PASSWORDS_FILE):
            with open(PASSWORDS_FILE, 'r', encoding='utf-8') as f:
                passwords_obj = json.load(f)
                passwords = passwords_obj
        else:
            passwords = {}
    except Exception as e:
        print(f'Error loading passwords: {e}')
        passwords = {}
    
    # Load friends
    try:
        if os.path.exists(FRIENDS_FILE):
            with open(FRIENDS_FILE, 'r', encoding='utf-8') as f:
                friends = json.load(f)
        else:
            friends = {}
    except Exception as e:
        print(f'Error loading friends: {e}')
        friends = {}
    
    # Load messages
    try:
        if os.path.exists(MESSAGES_FILE):
            with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
                messages = json.load(f)
        else:
            messages = []
    except Exception as e:
        print(f'Error loading messages: {e}')
        messages = []
    
    # Load friend requests
    try:
        if os.path.exists(FRIEND_REQUESTS_FILE):
            with open(FRIEND_REQUESTS_FILE, 'r', encoding='utf-8') as f:
                friend_requests = json.load(f)
        else:
            friend_requests = []
    except Exception as e:
        print(f'Error loading friend requests: {e}')
        friend_requests = []

def save_codes():
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        json_data = json.dumps(codes, indent=2, ensure_ascii=False)
        with open(CODES_FILE, 'w', encoding='utf-8') as f:
            f.write(json_data)
        print(f'Codes saved successfully, file size: {len(json_data)} bytes')
    except Exception as e:
        print(f'Error saving codes: {e}')
        raise

def save_users():
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f'Error saving users: {e}')

def save_passwords():
    try:
        with open(PASSWORDS_FILE, 'w', encoding='utf-8') as f:
            json.dump(passwords, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f'Error saving passwords: {e}')

def save_friends():
    try:
        with open(FRIENDS_FILE, 'w', encoding='utf-8') as f:
            json.dump(friends, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f'Error saving friends: {e}')

def save_messages():
    try:
        with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
            json.dump(messages, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f'Error saving messages: {e}')

def save_friend_requests():
    try:
        with open(FRIEND_REQUESTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(friend_requests, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f'Error saving friend requests: {e}')

# Initialize data
codes = []
users = []
passwords = {}
friends = {}
messages = []
friend_requests = []
load_data()

# Helper functions
def find_code_by_id(code_id: str):
    return next((code for code in codes if code['id'] == code_id), None)

def find_user_by_username(username: str):
    return next((user for user in users if user['username'] == username), None)

def validate_file_on_server(title: str, content: str):
    # Check file extension
    ext = title.lower()[title.rfind('.'):] if '.' in title else ''
    if ext in DANGEROUS_EXTENSIONS:
        return {'valid': False, 'error': f'Қауіпті файл түрі блокталды: {ext}'}
    
    # Check content size
    if content and len(content) > MAX_CONTENT_LENGTH:
        return {'valid': False, 'error': f'Файл өлшемі тым үлкен. Максималды өлшем: {MAX_CONTENT_LENGTH / (1024 * 1024)}MB'}
    
    # Check for potentially malicious content patterns
    malicious_patterns = [
        re.compile(r'<script[^>]*>[\s\S]*?</script>', re.IGNORECASE),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'eval\s*\(', re.IGNORECASE),
        re.compile(r'exec\s*\(', re.IGNORECASE),
    ]
    
    for pattern in malicious_patterns:
        if pattern.search(content):
            return {'valid': False, 'error': 'Файлда қауіпті контент табылды'}
    
    return {'valid': True}

# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    print(f"{datetime.now().isoformat()} - {request.method} {request.url.path}")
    response = await call_next(request)
    return response

# Routes
@app.get("/")
async def root():
    return {
        "message": "Kazakh Hub Backend API",
        "note": "This is the backend server. Please use the frontend at http://localhost:5174",
        "api": "http://localhost:3000/api",
        "frontend": "http://localhost:5174"
    }

@app.get("/api")
async def api_root():
    return {
        "message": "Kazakh Hub API",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /api/health",
            "codes": {
                "getAll": "GET /api/codes",
                "getOne": "GET /api/codes/{id}",
                "create": "POST /api/codes",
                "update": "PUT /api/codes/{id}",
                "delete": "DELETE /api/codes/{id}"
            },
            "users": {
                "current": "GET /api/user",
                "profile": "GET /api/users/{id}"
            }
        }
    }

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Kazakh Hub API is running"}

# Code endpoints
@app.get("/api/codes")
async def get_codes(folderId: Optional[str] = Query(None)):
    if folderId:
        folder_files = [code for code in codes if code.get('folderId') == folderId]
        return folder_files
    else:
        all_codes = [code for code in codes if not code.get('folderId')]
        return all_codes

@app.get("/api/codes/{code_id}")
async def get_code(code_id: str):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    return code

@app.post("/api/codes")
async def create_code(code_data: CodeCreate):
    try:
        validation = validate_file_on_server(code_data.title, code_data.content)
        if not validation['valid']:
            raise HTTPException(status_code=400, detail=validation['error'])
        
        new_code = {
            'id': str(uuid.uuid4()),
            'title': code_data.title,
            'content': code_data.content,
            'language': code_data.language,
            'author': code_data.author,
            'description': code_data.description,
            'tags': code_data.tags or [],
            'likes': [],
            'comments': [],
            'folderId': code_data.folderId,
            'folderPath': code_data.folderPath,
            'isFolder': code_data.isFolder,
            'folderStructure': code_data.folderStructure,
            'views': 0,
            'viewedBy': [],
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        codes.append(new_code)
        save_codes()
        return new_code
    except HTTPException:
        raise
    except Exception as e:
        print(f'POST /api/codes - Error: {e}')
        raise HTTPException(
            status_code=500,
            detail="Қате орын алды! Сервер қатесі."
        )

@app.put("/api/codes/{code_id}")
async def update_code(code_id: str, code_data: CodeUpdate):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    
    if code_data.title is not None:
        code['title'] = code_data.title
    if code_data.content is not None:
        code['content'] = code_data.content
    if code_data.language is not None:
        code['language'] = code_data.language
    if code_data.description is not None:
        code['description'] = code_data.description
    if code_data.tags is not None:
        code['tags'] = code_data.tags
    code['updatedAt'] = datetime.now().isoformat()
    
    save_codes()
    return code

@app.delete("/api/codes/{code_id}")
async def delete_code(code_id: str):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    
    # If it's a folder, delete all files in the folder first
    if code.get('isFolder'):
        folder_files = [c for c in codes if c.get('folderId') == code_id]
        for file in folder_files:
            codes.remove(file)
    
    # Delete the code itself
    codes.remove(code)
    save_codes()
    return JSONResponse(status_code=204)

@app.post("/api/codes/delete-multiple")
async def delete_multiple_codes(request: DeleteMultipleRequest):
    if not request.ids or len(request.ids) == 0:
        raise HTTPException(status_code=400, detail="IDs array required")
    
    deleted_count = 0
    codes_to_delete = [c for c in codes if c['id'] in request.ids]
    
    # First, delete all files in folders that are being deleted
    for code in codes_to_delete:
        if code.get('isFolder'):
            folder_files = [c for c in codes if c.get('folderId') == code['id']]
            for file in folder_files:
                codes.remove(file)
                deleted_count += 1
    
    # Then delete the codes themselves
    for code_id in request.ids:
        code = find_code_by_id(code_id)
        if code:
            codes.remove(code)
            deleted_count += 1
    
    save_codes()
    return {"message": f"{deleted_count} код(тар) жойылды", "deletedCount": deleted_count}

@app.post("/api/codes/{code_id}/like")
async def like_code(code_id: str, request: LikeRequest):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    
    if 'likes' not in code:
        code['likes'] = []
    
    if request.userId not in code['likes']:
        code['likes'].append(request.userId)
        code['updatedAt'] = datetime.now().isoformat()
        save_codes()
    
    return code

@app.post("/api/codes/{code_id}/unlike")
async def unlike_code(code_id: str, request: LikeRequest):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    
    if 'likes' not in code:
        code['likes'] = []
    
    code['likes'] = [id for id in code['likes'] if id != request.userId]
    code['updatedAt'] = datetime.now().isoformat()
    save_codes()
    return code

@app.post("/api/codes/{code_id}/view")
async def view_code(code_id: str, request: ViewRequest):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    
    if 'views' not in code:
        code['views'] = 0
    if 'viewedBy' not in code:
        code['viewedBy'] = []
    
    if request.userId:
        if request.userId not in code['viewedBy']:
            code['viewedBy'].append(request.userId)
            code['views'] = (code.get('views', 0) or 0) + 1
            code['updatedAt'] = datetime.now().isoformat()
            save_codes()
    else:
        code['views'] = (code.get('views', 0) or 0) + 1
        code['updatedAt'] = datetime.now().isoformat()
        save_codes()
    
    return code

@app.post("/api/codes/{code_id}/comments")
async def add_comment(code_id: str, comment_data: CommentCreate):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    
    if 'comments' not in code:
        code['comments'] = []
    
    new_comment = {
        'id': str(uuid.uuid4()),
        'author': comment_data.author,
        'content': comment_data.content,
        'createdAt': datetime.now().isoformat(),
        'replies': [],
        'likes': [],
        'parentId': comment_data.parentId
    }
    
    code['comments'].append(new_comment)
    code['updatedAt'] = datetime.now().isoformat()
    save_codes()
    return code

@app.put("/api/codes/{code_id}/comments/{comment_id}")
async def update_comment(code_id: str, comment_id: str, comment_data: CommentUpdate):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    
    if 'comments' not in code:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment = next((c for c in code['comments'] if c['id'] == comment_id), None)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment['content'] = comment_data.content
    code['updatedAt'] = datetime.now().isoformat()
    save_codes()
    return code

@app.delete("/api/codes/{code_id}/comments/{comment_id}")
async def delete_comment(code_id: str, comment_id: str):
    code = find_code_by_id(code_id)
    if not code:
        raise HTTPException(status_code=404, detail="Code file not found")
    
    if 'comments' not in code:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment_index = next((i for i, c in enumerate(code['comments']) if c['id'] == comment_id), None)
    if comment_index is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    code['comments'].pop(comment_index)
    code['updatedAt'] = datetime.now().isoformat()
    save_codes()
    return code

@app.post("/api/codes/{code_id}/comments/{comment_id}/like")
async def like_comment(code_id: str, comment_id: str, request: LikeRequest):
    code = find_code_by_id(code_id)
    if not code or 'comments' not in code:
        raise HTTPException(status_code=404, detail="Code file or comment not found")
    
    comment = next((c for c in code['comments'] if c['id'] == comment_id), None)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if 'likes' not in comment:
        comment['likes'] = []
    
    # Toggle like
    if request.userId in comment['likes']:
        comment['likes'] = [id for id in comment['likes'] if id != request.userId]
    else:
        comment['likes'].append(request.userId)
    
    code['updatedAt'] = datetime.now().isoformat()
    save_codes()
    return code


# Authentication endpoints
@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = next((u for u in users if u['email'] == user_data.email or u['username'] == user_data.username), None)
    if existing_user:
        # If user exists, return existing user (for Firebase auth sync)
        return {"user": existing_user, "message": "User already exists"}
    
    # Use Firebase UID if provided, otherwise generate UUID
    user_id = user_data.firebase_uid if user_data.firebase_uid else str(uuid.uuid4())
    
    new_user = {
        'id': user_id,
        'username': user_data.username,
        'email': user_data.email,
        'avatar': None
    }
    
    users.append(new_user)
    # Only save password if provided (not for Firebase auth)
    if user_data.password:
        passwords[user_data.email] = user_data.password  # In real app, hash the password
        save_passwords()
    save_users()
    return {"user": new_user, "message": "User registered successfully"}

@app.post("/api/auth/login")
async def login(login_data: UserLogin):
    if not login_data.email and not login_data.username:
        raise HTTPException(status_code=400, detail="Email or username required")
    
    user = None
    
    if login_data.email:
        user = next((u for u in users if u['email'] == login_data.email), None)
    elif login_data.username:
        user = next((u for u in users if u['username'] == login_data.username), None)
    
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

@app.get("/api/user")
async def get_current_user():
    user = find_user_by_username('current-user')
    if not user and users:
        user = users[0]
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/auth/change-password")
async def change_password(request: ChangePassword):
    if not request.newPassword:
        raise HTTPException(status_code=400, detail="New password required")
    
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    user = None
    if request.userId:
        user = next((u for u in users if u['id'] == request.userId), None)
    elif request.email:
        user = next((u for u in users if u['email'] == request.email), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.currentPassword:
        stored_password = passwords.get(user['email'])
        if stored_password != request.currentPassword:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    passwords[user['email']] = request.newPassword
    save_passwords()
    return {"message": "Password changed successfully"}

@app.put("/api/user")
async def update_user(user_data: UserUpdate):
    try:
        user = None
        
        if user_data.userId:
            user = next((u for u in users if u['id'] == user_data.userId), None)
        
        if not user and user_data.currentEmail:
            user = next((u for u in users if u['email'] == user_data.currentEmail), None)
        
        if not user and user_data.email:
            user = next((u for u in users if u['email'] == user_data.email), None)
        
        if not user and user_data.username:
            user = find_user_by_username(user_data.username)
        
        if not user:
            user = find_user_by_username('current-user') or (users[0] if users else None)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user_data.username is not None and user_data.username.strip():
            user['username'] = user_data.username.strip()
        
        if user_data.email is not None and user_data.email.strip():
            email_taken = next((u for u in users if u['id'] != user['id'] and u['email'] == user_data.email.strip()), None)
            if email_taken:
                raise HTTPException(status_code=400, detail="Email already in use by another user")
            user['email'] = user_data.email.strip()
        
        if user_data.avatar is not None:
            if user_data.avatar == '' or user_data.avatar is None:
                user['avatar'] = None
            elif isinstance(user_data.avatar, str) and user_data.avatar.startswith('data:image'):
                user['avatar'] = user_data.avatar
            else:
                raise HTTPException(status_code=400, detail="Invalid avatar format")
        
        save_users()
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f'Error updating user profile: {e}')
        raise HTTPException(status_code=500, detail="Internal server error while updating profile")

@app.delete("/api/user")
async def delete_user(request: DeleteUserRequest):
    try:
        user = None
        if request.userId:
            user = next((u for u in users if u['id'] == request.userId), None)
        elif request.email:
            user = next((u for u in users if u['email'] == request.email), None)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user['email']
        user_id_to_delete = user['id']
        
        # Delete user from users array
        users.remove(user)
        save_users()
        
        # Delete password
        if user_email in passwords:
            del passwords[user_email]
        save_passwords()
        
        # Delete user's codes
        codes[:] = [code for code in codes if code.get('author') != user['username']]
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
                    if comment.get('author') != user['username']
                ]
                for comment in code['comments']:
                    if 'likes' in comment:
                        comment['likes'] = [id for id in comment['likes'] if id != user_id_to_delete]
                    if 'replies' in comment:
                        comment['replies'] = [reply for reply in comment['replies'] if reply.get('author') != user['username']]
        save_codes()
        
        return {"message": "Account deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f'Error deleting account: {e}')
        raise HTTPException(status_code=500, detail="Internal server error while deleting account")

@app.delete("/api/users/delete-all")
async def delete_all_accounts():
    """
    Барлық аккаунттарды жою - Бұл операция қайтымсыз!
    Барлық пайдаланушылар, кодтар, хабарламалар, достар және басқа деректер жойылады.
    """
    try:
        # Барлық пайдаланушыларды санау
        users_count = len(users)
        
        # Барлық пайдаланушыларды жою
        users.clear()
        save_users()
        
        # Барлық парольдерді жою
        passwords.clear()
        save_passwords()
        
        # Барлық кодтарды жою
        codes.clear()
        save_codes()
        
        # Барлық достарды жою
        friends.clear()
        save_friends()
        
        # Барлық хабарламаларды жою
        messages.clear()
        save_messages()
        
        # Барлық дос болу сұрауларын жою
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

# Friends endpoints
@app.get("/api/friends/{user_id}")
async def get_friends(user_id: str):
    user_friends = friends.get(user_id, [])
    friends_list = []
    for friend_id in user_friends:
        friend = next((u for u in users if u['id'] == friend_id), None)
        if friend:
            friends_list.append({
                'id': friend['id'],
                'username': friend['username'],
                'email': friend['email'],
                'avatar': friend.get('avatar')
            })
    return friends_list

@app.post("/api/friends/{user_id}/add")
async def add_friend(user_id: str, request: Dict[str, str] = Body(...)):
    friend_id = request.get('friendId')
    if not friend_id:
        raise HTTPException(status_code=400, detail="Friend ID is required")
    
    if user_id == friend_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a friend")
    
    if user_id not in friends:
        friends[user_id] = []
    
    if friend_id not in friends[user_id]:
        friends[user_id].append(friend_id)
        save_friends()
    
    # Add reverse friendship (bidirectional)
    if friend_id not in friends:
        friends[friend_id] = []
    
    if user_id not in friends[friend_id]:
        friends[friend_id].append(user_id)
        save_friends()
    
    return {"message": "Friend added successfully"}

@app.delete("/api/friends/{user_id}/remove/{friend_id}")
async def remove_friend(user_id: str, friend_id: str):
    if user_id in friends:
        friends[user_id] = [id for id in friends[user_id] if id != friend_id]
        save_friends()
    
    if friend_id in friends:
        friends[friend_id] = [id for id in friends[friend_id] if id != user_id]
        save_friends()
    
    return {"message": "Friend removed successfully"}

# Messages endpoints
@app.get("/api/messages/{user_id}")
async def get_messages(user_id: str):
    user_messages = [
        msg for msg in messages
        if msg.get('fromUserId') == user_id or msg.get('toUserId') == user_id
    ]
    user_messages.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
    return user_messages

@app.get("/api/messages/{user_id}/{friend_id}")
async def get_conversation(user_id: str, friend_id: str):
    conversation_messages = [
        msg for msg in messages
        if (msg.get('fromUserId') == user_id and msg.get('toUserId') == friend_id) or
           (msg.get('fromUserId') == friend_id and msg.get('toUserId') == user_id)
    ]
    conversation_messages.sort(key=lambda x: x.get('createdAt', ''))
    return conversation_messages

@app.post("/api/messages")
async def create_message(message_data: MessageCreate):
    if not message_data.fromUserId or not message_data.toUserId or not message_data.content:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Check if users are friends
    user_friends = friends.get(message_data.fromUserId, [])
    if message_data.toUserId not in user_friends:
        raise HTTPException(status_code=403, detail="You can only message friends")
    
    new_message = {
        'id': str(uuid.uuid4()),
        'fromUserId': message_data.fromUserId,
        'toUserId': message_data.toUserId,
        'content': message_data.content.strip(),
        'createdAt': datetime.now().isoformat(),
        'read': False
    }
    
    messages.append(new_message)
    save_messages()
    return new_message

@app.put("/api/messages/{message_id}/read")
async def mark_message_read(message_id: str):
    message = next((msg for msg in messages if msg['id'] == message_id), None)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message['read'] = True
    save_messages()
    return message

# Friend Requests endpoints
@app.get("/api/friend-requests/{user_id}")
async def get_friend_requests(user_id: str):
    requests = [
        req for req in friend_requests
        if (req.get('toUserId') == user_id and req.get('status') == 'pending') or
           (req.get('fromUserId') == user_id and req.get('status') == 'pending')
    ]
    
    requests_with_users = []
    for req in requests:
        other_user_id = req['fromUserId'] if req['fromUserId'] != user_id else req['toUserId']
        other_user = next((u for u in users if u['id'] == other_user_id), None)
        if other_user:
            requests_with_users.append({
                **req,
                'otherUser': {
                    'id': other_user['id'],
                    'username': other_user['username'],
                    'email': other_user['email'],
                    'avatar': other_user.get('avatar')
                },
                'isIncoming': req.get('toUserId') == user_id
            })
    
    return requests_with_users

@app.get("/api/friend-requests/incoming/{user_id}")
async def get_incoming_friend_requests(user_id: str):
    incoming_requests = [
        req for req in friend_requests
        if req.get('toUserId') == user_id and req.get('status') == 'pending'
    ]
    
    requests_with_users = []
    for req in incoming_requests:
        from_user = next((u for u in users if u['id'] == req['fromUserId']), None)
        if from_user:
            requests_with_users.append({
                **req,
                'fromUser': {
                    'id': from_user['id'],
                    'username': from_user['username'],
                    'email': from_user['email'],
                    'avatar': from_user.get('avatar')
                }
            })
    
    return requests_with_users

@app.post("/api/friend-requests")
async def create_friend_request(request: FriendRequestCreate):
    if not request.fromUserId or not request.toUserId:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    if request.fromUserId == request.toUserId:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if already friends
    user_friends = friends.get(request.fromUserId, [])
    if request.toUserId in user_friends:
        raise HTTPException(status_code=400, detail="Already friends")
    
    # Check if request already exists
    existing_request = next((
        req for req in friend_requests
        if ((req.get('fromUserId') == request.fromUserId and req.get('toUserId') == request.toUserId) or
            (req.get('fromUserId') == request.toUserId and req.get('toUserId') == request.fromUserId)) and
           req.get('status') == 'pending'
    ), None)
    
    if existing_request:
        raise HTTPException(status_code=400, detail="Friend request already exists")
    
    new_request = {
        'id': str(uuid.uuid4()),
        'fromUserId': request.fromUserId,
        'toUserId': request.toUserId,
        'status': 'pending',
        'createdAt': datetime.now().isoformat()
    }
    
    friend_requests.append(new_request)
    save_friend_requests()
    return new_request

@app.put("/api/friend-requests/{request_id}/accept")
async def accept_friend_request(request_id: str):
    request = next((req for req in friend_requests if req['id'] == request_id), None)
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if request.get('status') != 'pending':
        raise HTTPException(status_code=400, detail="Request already processed")
    
    request['status'] = 'accepted'
    
    # Add to friends list
    if request['fromUserId'] not in friends:
        friends[request['fromUserId']] = []
    if request['toUserId'] not in friends:
        friends[request['toUserId']] = []
    
    if request['toUserId'] not in friends[request['fromUserId']]:
        friends[request['fromUserId']].append(request['toUserId'])
    if request['fromUserId'] not in friends[request['toUserId']]:
        friends[request['toUserId']].append(request['fromUserId'])
    
    save_friend_requests()
    save_friends()
    return {"message": "Friend request accepted", "request": request}

@app.put("/api/friend-requests/{request_id}/reject")
async def reject_friend_request(request_id: str):
    request = next((req for req in friend_requests if req['id'] == request_id), None)
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if request.get('status') != 'pending':
        raise HTTPException(status_code=400, detail="Request already processed")
    
    request['status'] = 'rejected'
    save_friend_requests()
    return {"message": "Friend request rejected", "request": request}

@app.get("/api/users/search")
async def search_users(query: Optional[str] = Query(None)):
    if not query or len(query.strip()) < 1:
        return []
    
    search_term = query.lower().strip()
    matching_users = [
        {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'avatar': user.get('avatar')
        }
        for user in users
        if search_term in user['username'].lower() or search_term in user['email'].lower()
    ]
    return matching_users

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)

