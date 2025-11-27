"""Kazakh Hub Backend API - Main application file"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import uvicorn
import os

# Import database and config
from database import load_data, codes
from config import FIRESTORE_SYNC_AVAILABLE, FIRESTORE_INIT

# Import routes
from routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    import asyncio
    from database import save_codes, save_users, save_friends, save_messages, save_friend_requests, save_passwords
    
    # Startup
    load_data()
    print(f"Loaded {len(codes)} codes from file")
    
    # Initialize Firestore if available
    if FIRESTORE_SYNC_AVAILABLE and FIRESTORE_INIT:
        try:
            FIRESTORE_INIT()
        except Exception as e:
            print(f"Warning: Firestore initialization failed: {e}")
    
    # Auto-save task
    async def auto_save():
        while True:
            await asyncio.sleep(30)  # Save every 30 seconds
            try:
                save_codes()
                save_users()
                save_friends()
                save_messages()
                save_friend_requests()
                save_passwords()
                print("Auto-saved all data")
            except Exception as e:
                print(f"Error in auto-save: {e}")
    
    # Start auto-save task
    auto_save_task = asyncio.create_task(auto_save())
    
    yield
    
    # Shutdown - save all data before closing
    try:
        save_codes()
        save_users()
        save_friends()
        save_messages()
        save_friend_requests()
        save_passwords()
        print("All data saved on shutdown")
    except Exception as e:
        print(f"Error saving data on shutdown: {e}")
    
    # Cancel auto-save task
    auto_save_task.cancel()
    try:
        await auto_save_task
    except asyncio.CancelledError:
        pass
    
    # Shutdown (if needed)
    pass


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Kazakh Hub API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    print(f"{datetime.now().isoformat()} - {request.method} {request.url.path}")
    response = await call_next(request)
    return response

# Root endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Kazakh Hub Backend API",
        "note": "This is the backend server. Please use the frontend at http://localhost:5174",
        "api": "http://localhost:3000/api",
        "frontend": "http://localhost:5174"
    }

@app.get("/api")
async def api_root():
    """API root endpoint with documentation"""
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
            },
            "messages": {
                "getAll": "GET /api/messages/{user_id}",
                "getConversation": "GET /api/messages/{user_id}/{friend_id}",
                "create": "POST /api/messages",
                "markRead": "PUT /api/messages/{message_id}/read"
            },
            "friends": {
                "getAll": "GET /api/friends/{user_id}",
                "add": "POST /api/friends/{user_id}/add",
                "remove": "DELETE /api/friends/{user_id}/remove/{friend_id}"
            },
            "chats": {
                "getAll": "GET /api/chats/{user_id}"
            },
            "websocket": {
                "connect": "WS /api/ws/{user_id}"
            }
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Kazakh Hub API is running"}

# Include API routes
app.include_router(api_router)

# Include WebSocket endpoint directly (WebSocket doesn't work well with APIRouter)
from fastapi import WebSocket, WebSocketDisconnect
from database import messages, save_messages
from websocket import manager

@app.websocket("/api/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time messaging"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get('type')
            
            if message_type == 'ping':
                await websocket.send_json({'type': 'pong'})
            elif message_type == 'mark_delivered':
                # Mark message as delivered
                message_id = data.get('messageId')
                if message_id:
                    message = next((msg for msg in messages if msg['id'] == message_id), None)
                    if message and message.get('status') == 'sent':
                        message['status'] = 'delivered'
                        save_messages()
            elif message_type == 'typing':
                # Forward typing indicator to recipient
                recipient_id = data.get('recipientId')
                if recipient_id:
                    await manager.send_personal_message({
                        'type': 'typing',
                        'userId': user_id,
                        'isTyping': data.get('isTyping', False)
                    }, recipient_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)
