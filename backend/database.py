"""Database operations for loading and saving data"""
import json
import os
import tempfile
from typing import List, Dict, Any
from config import (
    CODES_FILE, USERS_FILE, FRIENDS_FILE,
    MESSAGES_FILE, FRIEND_REQUESTS_FILE, FIRESTORE_SYNC_AVAILABLE,
    FIRESTORE_SYNC_CODE, FIRESTORE_SYNC_MESSAGE, FIRESTORE_DELETE_CODE
)

# Global data storage
codes: List[Dict[str, Any]] = []
users: List[Dict[str, Any]] = []
friends: Dict[str, List[str]] = {}
messages: List[Dict[str, Any]] = []
friend_requests: List[Dict[str, Any]] = []


def load_data():
    """Load all data from JSON files"""
    global codes, users, friends, messages, friend_requests
    
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


def _atomic_write(filepath: str, data: str) -> None:
    """Write data to a file atomically using write-then-rename pattern."""
    dir_path = os.path.dirname(filepath)
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)
    # Write to temporary file first, then rename for atomic operation
    fd, tmp_path = tempfile.mkstemp(dir=dir_path, suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(data)
        os.replace(tmp_path, filepath)
    except Exception:
        # Clean up temp file on error
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def save_codes():
    """Save codes to file and sync to Firestore"""
    try:
        json_data = json.dumps(codes, indent=2, ensure_ascii=False)
        _atomic_write(CODES_FILE, json_data)
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
        json_data = json.dumps(users, indent=2, ensure_ascii=False)
        _atomic_write(USERS_FILE, json_data)
        print(f'Users saved successfully, count: {len(users)}')
    except Exception as e:
        print(f'Error saving users: {e}')
        raise


def save_friends():
    """Save friends to file"""
    try:
        json_data = json.dumps(friends, indent=2, ensure_ascii=False)
        _atomic_write(FRIENDS_FILE, json_data)
        print(f'Friends saved successfully, count: {len(friends)} users')
    except Exception as e:
        print(f'Error saving friends: {e}')
        raise


def save_messages():
    """Save messages to file and sync to Firestore"""
    try:
        json_data = json.dumps(messages, indent=2, ensure_ascii=False)
        _atomic_write(MESSAGES_FILE, json_data)

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
        json_data = json.dumps(friend_requests, indent=2, ensure_ascii=False)
        _atomic_write(FRIEND_REQUESTS_FILE, json_data)
        print(f'Friend requests saved successfully, count: {len(friend_requests)}')
    except Exception as e:
        print(f'Error saving friend requests: {e}')
        raise

