"""Chat service for business logic"""
from typing import List, Dict, Any
from database import messages, users


class ChatService:
    """Service for chat-related operations"""
    
    @staticmethod
    def get_chats(user_id: str) -> List[Dict[str, Any]]:
        """Get list of all chats (conversations) for a user"""
        # Get all unique conversation partners
        conversation_partners = set()
        for msg in messages:
            if msg.get('fromUserId') == user_id:
                conversation_partners.add(msg.get('toUserId'))
            elif msg.get('toUserId') == user_id:
                conversation_partners.add(msg.get('fromUserId'))
        
        chats = []
        for partner_id in conversation_partners:
            partner = next((u for u in users if u['id'] == partner_id), None)
            if not partner:
                continue
            
            # Get last message
            conversation_messages = [
                msg for msg in messages
                if (msg.get('fromUserId') == user_id and msg.get('toUserId') == partner_id) or
                   (msg.get('fromUserId') == partner_id and msg.get('toUserId') == user_id)
            ]
            if not conversation_messages:
                continue
            
            last_message = max(conversation_messages, key=lambda x: x.get('createdAt', ''))
            
            # Count unread messages
            unread_count = sum(
                1 for msg in conversation_messages
                if msg.get('toUserId') == user_id and not msg.get('read', False)
            )
            
            chats.append({
                'partnerId': partner_id,
                'partner': {
                    'id': partner['id'],
                    'username': partner['username'],
                    'email': partner['email'],
                    'avatar': partner.get('avatar')
                },
                'lastMessage': last_message,
                'unreadCount': unread_count,
                'lastMessageTime': last_message.get('createdAt')
            })
        
        # Sort by last message time (most recent first)
        chats.sort(key=lambda x: x.get('lastMessageTime', ''), reverse=True)
        return chats

