"""WebSocket routes"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database import messages, save_messages
from websocket import manager

router = APIRouter()


@router.websocket("/ws/{user_id}")
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

