"""Password hashing utilities using bcrypt"""
import bcrypt


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    if not password:
        return ""
    # bcrypt has a 72-byte limit, truncate if necessary
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a hash"""
    if not password or not password_hash:
        return False
    try:
        pwd_bytes = password.encode('utf-8')[:72]
        return bcrypt.checkpw(pwd_bytes, password_hash.encode('utf-8'))
    except Exception:
        return False



