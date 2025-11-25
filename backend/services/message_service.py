"""Message service for business logic"""
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from database import messages, save_messages, FIRESTORE_SYNC_AVAILABLE, FIRESTORE_SYNC_MESSAGE
from websocket import manager


class MessageService:
    """Service for message-related operations"""
    
    @staticmethod
    def get_user_messages(user_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a user"""
        user_messages = [
            msg for msg in messages
            if msg.get('fromUserId') == user_id or msg.get('toUserId') == user_id
        ]
        user_messages.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        return user_messages
    
    @staticmethod
    def get_conversation(user_id: str, friend_id: str) -> List[Dict[str, Any]]:
        """Get conversation between two users"""
        conversation_messages = [
            msg for msg in messages
            if (msg.get('fromUserId') == user_id and msg.get('toUserId') == friend_id) or
               (msg.get('fromUserId') == friend_id and msg.get('toUserId') == user_id)
        ]
        conversation_messages.sort(key=lambda x: x.get('createdAt', ''))
        return conversation_messages
    
    @staticmethod
    async def create_message(from_user_id: str, to_user_id: str, content: str, 
                           are_friends: bool) -> Dict[str, Any]:
        """Create a new message"""
        if not are_friends:
            raise ValueError("You can only message friends")
        
        new_message = {
            'id': str(uuid.uuid4()),
            'fromUserId': from_user_id,
            'toUserId': to_user_id,
            'content': content.strip(),
            'createdAt': datetime.now().isoformat(),
            'status': 'sent',
            'read': False,
            'readAt': None
        }
        
        messages.append(new_message)
        save_messages()
        
        # Firestore sync
        if FIRESTORE_SYNC_AVAILABLE and FIRESTORE_SYNC_MESSAGE:
            try:
                FIRESTORE_SYNC_MESSAGE(new_message)
            except Exception as e:
                print(f'Warning: Firestore sync failed for message: {e}')
        
        # Send via WebSocket to recipient if online
        await manager.send_personal_message({
            'type': 'new_message',
            'message': new_message
        }, to_user_id)
        
        # Update status to delivered if recipient is online
        if manager.is_user_online(to_user_id):
            new_message['status'] = 'delivered'
            save_messages()
        
        return new_message
    
    @staticmethod
    async def mark_message_read(message_id: str) -> Dict[str, Any]:
        """Mark a message as read"""
        message = next((msg for msg in messages if msg['id'] == message_id), None)
        if not message:
            raise ValueError("Message not found")
        
        message['read'] = True
        message['status'] = 'read'
        message['readAt'] = datetime.now().isoformat()
        save_messages()
        
        # Firestore sync
        if FIRESTORE_SYNC_AVAILABLE and FIRESTORE_SYNC_MESSAGE:
            try:
                FIRESTORE_SYNC_MESSAGE(message)
            except Exception as e:
                print(f'Warning: Firestore sync failed for message read: {e}')
        
        # Notify sender via WebSocket that message was read
        await manager.send_personal_message({
            'type': 'message_read',
            'messageId': message_id,
            'readAt': message['readAt']
        }, message['fromUserId'])
        
        return message
    
    @staticmethod
    async def mark_conversation_read(user_id: str, friend_id: str) -> int:
        """Mark all messages in a conversation as read"""
        updated_count = 0
        for msg in messages:
            if msg.get('fromUserId') == friend_id and msg.get('toUserId') == user_id and not msg.get('read', False):
                msg['read'] = True
                msg['status'] = 'read'
                msg['readAt'] = datetime.now().isoformat()
                updated_count += 1
        
        if updated_count > 0:
            save_messages()
            
            # Notify sender via WebSocket
            await manager.send_personal_message({
                'type': 'messages_read',
                'userId': user_id,
                'count': updated_count
            }, friend_id)
            
            # Firestore sync
            if FIRESTORE_SYNC_AVAILABLE and FIRESTORE_SYNC_MESSAGE:
                try:
                    for msg in messages:
                        if msg.get('fromUserId') == friend_id and msg.get('toUserId') == user_id:
                            FIRESTORE_SYNC_MESSAGE(msg)
                except Exception as e:
                    print(f'Warning: Firestore sync failed: {e}')
        
        return updated_count
    
    @staticmethod
    def get_unread_count_for_chat(user_id: str, friend_id: str) -> int:
        """Get unread message count for a specific chat"""
        unread_messages = [
            msg for msg in messages
            if msg.get('fromUserId') == friend_id and 
               msg.get('toUserId') == user_id and 
               not msg.get('read', False)
        ]
        return len(unread_messages)
    
    @staticmethod
    def get_total_unread_count(user_id: str) -> int:
        """Get total unread message count for a user"""
        unread_messages = [
            msg for msg in messages
            if msg.get('toUserId') == user_id and not msg.get('read', False)
        ]
        return len(unread_messages)

