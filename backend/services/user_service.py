"""User service for business logic"""
from typing import Optional, List, Dict, Any
import uuid
from database import users, passwords, save_users, save_passwords
from utils.validators import validate_email


class UserService:
    """Service for user-related operations"""
    
    @staticmethod
    def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Find user by ID"""
        return next((u for u in users if u['id'] == user_id), None)
    
    @staticmethod
    def find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
        """Find user by username"""
        return next((user for user in users if user['username'] == username), None)
    
    @staticmethod
    def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Find user by email"""
        return next((u for u in users if u['email'] == email), None)
    
    @staticmethod
    def create_user(username: str, email: str, password: Optional[str] = None, firebase_uid: Optional[str] = None) -> Dict[str, Any]:
        """Create a new user"""
        # Validate inputs
        if not username or not username.strip():
            raise ValueError("Username cannot be empty")
        if not email or not email.strip():
            raise ValueError("Email cannot be empty")
        
        # Normalize inputs
        username = username.strip()
        email = email.strip().lower()
        
        # Check if user already exists (double check)
        if UserService.find_user_by_email(email):
            raise ValueError(f"User with email {email} already exists")
        if UserService.find_user_by_username(username):
            raise ValueError(f"User with username {username} already exists")
        
        user_id = firebase_uid if firebase_uid else str(uuid.uuid4())
        
        new_user = {
            'id': user_id,
            'username': username,
            'email': email,
            'avatar': None
        }
        
        users.append(new_user)
        
        # Only save password if it's provided and not empty
        if password and password.strip():
            passwords[email] = password.strip()  # In real app, hash the password
            save_passwords()
        
        # Save users to file
        try:
            save_users()
        except Exception as e:
            # Remove user from list if save failed
            if new_user in users:
                users.remove(new_user)
            raise Exception(f"Failed to save user to database: {str(e)}")
        
        return new_user
    
    @staticmethod
    def update_user(user_id: Optional[str] = None, current_email: Optional[str] = None, 
                   username: Optional[str] = None, email: Optional[str] = None, 
                   avatar: Optional[str] = None) -> Dict[str, Any]:
        """Update user information"""
        user = None
        
        if user_id:
            user = UserService.find_user_by_id(user_id)
        elif current_email:
            user = UserService.find_user_by_email(current_email)
        elif email:
            user = UserService.find_user_by_email(email)
        elif username:
            user = UserService.find_user_by_username(username)
        
        if not user:
            raise ValueError("User not found")
        
        if username is not None and username.strip():
            user['username'] = username.strip()
        
        if email is not None and email.strip():
            email_taken = next((u for u in users if u['id'] != user['id'] and u['email'] == email.strip()), None)
            if email_taken:
                raise ValueError("Email already in use by another user")
            user['email'] = email.strip()
        
        if avatar is not None:
            if avatar == '' or avatar is None:
                user['avatar'] = None
            elif isinstance(avatar, str) and avatar.startswith('data:image'):
                user['avatar'] = avatar
            else:
                raise ValueError("Invalid avatar format")
        
        save_users()
        return user
    
    @staticmethod
    def delete_user(user_id: Optional[str] = None, email: Optional[str] = None) -> None:
        """Delete a user and all associated data"""
        user = None
        if user_id:
            user = UserService.find_user_by_id(user_id)
        elif email:
            user = UserService.find_user_by_email(email)
        
        if not user:
            raise ValueError("User not found")
        
        user_email = user['email']
        user_id_to_delete = user['id']
        
        # Delete user from users array
        users.remove(user)
        save_users()
        
        # Delete password
        if user_email in passwords:
            del passwords[user_email]
        save_passwords()
        
        return user_id_to_delete, user['username']
    
    @staticmethod
    def search_users(query: str) -> List[Dict[str, Any]]:
        """Search users by username or email"""
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

