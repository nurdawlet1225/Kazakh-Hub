"""Application configuration"""
import os

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

# Firestore sync availability
try:
    from firestore_sync import init_firestore, sync_code_to_firestore, sync_message_to_firestore, delete_code_from_firestore
    FIRESTORE_SYNC_AVAILABLE = True
    FIRESTORE_INIT = init_firestore
    FIRESTORE_SYNC_CODE = sync_code_to_firestore
    FIRESTORE_SYNC_MESSAGE = sync_message_to_firestore
    FIRESTORE_DELETE_CODE = delete_code_from_firestore
except ImportError:
    FIRESTORE_SYNC_AVAILABLE = False
    FIRESTORE_INIT = None
    FIRESTORE_SYNC_CODE = None
    FIRESTORE_SYNC_MESSAGE = None
    FIRESTORE_DELETE_CODE = None
    print("Warning: Firestore sync module not available. Real-time features will be disabled.")

