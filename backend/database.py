"""Database operations for loading and saving data"""
import json
import os
from typing import List, Dict, Any
from config import (
    CODES_FILE, USERS_FILE, PASSWORDS_FILE, FRIENDS_FILE,
    MESSAGES_FILE, FRIEND_REQUESTS_FILE, FIRESTORE_SYNC_AVAILABLE,
    FIRESTORE_SYNC_CODE, FIRESTORE_SYNC_MESSAGE, FIRESTORE_DELETE_CODE
)

# Global data storage
codes: List[Dict[str, Any]] = []
users: List[Dict[str, Any]] = []
passwords: Dict[str, str] = {}
friends: Dict[str, List[str]] = {}
messages: List[Dict[str, Any]] = []
friend_requests: List[Dict[str, Any]] = []


def load_data():
    """Load all data from JSON files"""
    global codes, users, passwords, friends, messages, friend_requests
    
    # Load codes
    try:
        if os.path.exists(CODES_FILE):
            with open(CODES_FILE, 'r', encoding='utf-8') as f:
                loaded_codes = json.load(f)
                codes.clear()
                codes.extend(loaded_codes)
        else:
            codes.clear()
    except Exception as e:
        print(f'Error loading codes: {e}')
        codes.clear()
    
    # Load users
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                loaded_users = json.load(f)
                users.clear()
                users.extend(loaded_users)
        else:
            users.clear()
            users.append({
                'id': '1',
                'username': 'current-user',
                'email': 'user@example.com',
                'avatar': None
            })
            save_users()
    except Exception as e:
        print(f'Error loading users: {e}')
        users.clear()
        users.append({
            'id': '1',
            'username': 'current-user',
            'email': 'user@example.com',
            'avatar': None
        })
    
    # Load passwords
    try:
        if os.path.exists(PASSWORDS_FILE):
            with open(PASSWORDS_FILE, 'r', encoding='utf-8') as f:
                passwords_obj = json.load(f)
                passwords.clear()
                passwords.update(passwords_obj)
        else:
            passwords.clear()
    except Exception as e:
        print(f'Error loading passwords: {e}')
        passwords.clear()
    
    # Load friends
    try:
        if os.path.exists(FRIENDS_FILE):
            with open(FRIENDS_FILE, 'r', encoding='utf-8') as f:
                friends_obj = json.load(f)
                friends.clear()
                friends.update(friends_obj)
        else:
            friends.clear()
    except Exception as e:
        print(f'Error loading friends: {e}')
        friends.clear()
    
    # Load messages
    try:
        if os.path.exists(MESSAGES_FILE):
            with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
                loaded_messages = json.load(f)
                messages.clear()
                messages.extend(loaded_messages)
        else:
            messages.clear()
    except Exception as e:
        print(f'Error loading messages: {e}')
        messages.clear()
    
    # Load friend requests
    try:
        if os.path.exists(FRIEND_REQUESTS_FILE):
            with open(FRIEND_REQUESTS_FILE, 'r', encoding='utf-8') as f:
                loaded_friend_requests = json.load(f)
                friend_requests.clear()
                friend_requests.extend(loaded_friend_requests)
        else:
            friend_requests.clear()
    except Exception as e:
        print(f'Error loading friend requests: {e}')
        friend_requests.clear()


def save_codes():
    """Save codes to file and sync to Firestore"""
    try:
        os.makedirs(os.path.dirname(CODES_FILE), exist_ok=True)
        json_data = json.dumps(codes, indent=2, ensure_ascii=False)
        with open(CODES_FILE, 'w', encoding='utf-8') as f:
            f.write(json_data)
        print(f'Codes saved successfully, file size: {len(json_data)} bytes')
        
        # Firestore-ға синхрондау
        if FIRESTORE_SYNC_AVAILABLE and FIRESTORE_SYNC_CODE:
            try:
                for code in codes:
                    FIRESTORE_SYNC_CODE(code)
            except Exception as e:
                print(f'Warning: Firestore sync failed: {e}')
    except Exception as e:
        print(f'Error saving codes: {e}')
        raise


def save_users():
    """Save users to file"""
    try:
        # Ensure directory exists
        users_dir = os.path.dirname(USERS_FILE)
        if users_dir:
            os.makedirs(users_dir, exist_ok=True)
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
        print(f'Users saved successfully, count: {len(users)}')
    except Exception as e:
        print(f'Error saving users: {e}')
        raise


def save_passwords():
    """Save passwords to file"""
    try:
        # Ensure directory exists
        password_dir = os.path.dirname(PASSWORDS_FILE)
        if password_dir:
            os.makedirs(password_dir, exist_ok=True)
        with open(PASSWORDS_FILE, 'w', encoding='utf-8') as f:
            json.dump(passwords, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f'Error saving passwords: {e}')
        raise


def save_friends():
    """Save friends to file"""
    try:
        # Ensure directory exists
        friends_dir = os.path.dirname(FRIENDS_FILE)
        if friends_dir:
            os.makedirs(friends_dir, exist_ok=True)
        with open(FRIENDS_FILE, 'w', encoding='utf-8') as f:
            json.dump(friends, f, indent=2, ensure_ascii=False)
        print(f'Friends saved successfully, count: {len(friends)} users')
    except Exception as e:
        print(f'Error saving friends: {e}')
        raise


def save_messages():
    """Save messages to file and sync to Firestore"""
    try:
        # Ensure directory exists
        messages_dir = os.path.dirname(MESSAGES_FILE)
        if messages_dir:
            os.makedirs(messages_dir, exist_ok=True)
        with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
            json.dump(messages, f, indent=2, ensure_ascii=False)
        
        # Firestore-ға синхрондау (соңғы хабарламаларды)
        if FIRESTORE_SYNC_AVAILABLE and FIRESTORE_SYNC_MESSAGE:
            try:
                # Соңғы 100 хабарламаны синхрондау (performance үшін)
                recent_messages = messages[-100:] if len(messages) > 100 else messages
                for message in recent_messages:
                    FIRESTORE_SYNC_MESSAGE(message)
            except Exception as e:
                print(f'Warning: Firestore messages sync failed: {e}')
    except Exception as e:
        print(f'Error saving messages: {e}')
        raise


def save_friend_requests():
    """Save friend requests to file"""
    try:
        # Ensure directory exists
        friend_requests_dir = os.path.dirname(FRIEND_REQUESTS_FILE)
        if friend_requests_dir:
            os.makedirs(friend_requests_dir, exist_ok=True)
        with open(FRIEND_REQUESTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(friend_requests, f, indent=2, ensure_ascii=False)
        print(f'Friend requests saved successfully, count: {len(friend_requests)}')
    except Exception as e:
        print(f'Error saving friend requests: {e}')
        raise

