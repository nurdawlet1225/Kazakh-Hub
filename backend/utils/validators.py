"""Validation utility functions"""
import re
from config import MAX_CONTENT_LENGTH, DANGEROUS_EXTENSIONS


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


def validate_file_on_server(title: str, content: str):
    """Validate file on server side"""
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

