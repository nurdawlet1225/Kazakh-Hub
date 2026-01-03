#!/usr/bin/env python3
"""Test authentication endpoints"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from db import init_db, get_db, User
    from utils.password import hash_password, verify_password
    from sqlalchemy.orm import Session
    
    print("=" * 50)
    print("Authentication System Test")
    print("=" * 50)
    
    # 1. Initialize database
    print("\n1. Initializing database...")
    try:
        init_db()
        print("✓ Database initialized successfully")
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")
        sys.exit(1)
    
    # 2. Test password hashing
    print("\n2. Testing password hashing...")
    try:
        test_password = "test123456"
        password_hash = hash_password(test_password)
        print(f"✓ Password hashed: {password_hash[:20]}...")
        
        # Test verification
        is_valid = verify_password(test_password, password_hash)
        is_invalid = verify_password("wrong_password", password_hash)
        
        if is_valid and not is_invalid:
            print("✓ Password verification works correctly")
        else:
            print("✗ Password verification failed")
            sys.exit(1)
    except Exception as e:
        print(f"✗ Password hashing test failed: {e}")
        sys.exit(1)
    
    # 3. Test database operations
    print("\n3. Testing database operations...")
    try:
        db = next(get_db())
        
        # Check if test user exists
        test_email = "test@example.com"
        existing_user = db.query(User).filter(User.email == test_email).first()
        
        if existing_user:
            print(f"⚠ Test user already exists, deleting...")
            db.delete(existing_user)
            db.commit()
        
        # Create test user
        test_user = User(
            id="123456789012",
            username="testuser",
            email=test_email,
            password_hash=hash_password("test123456"),
            avatar=None
        )
        
        db.add(test_user)
        db.commit()
        print("✓ Test user created successfully")
        
        # Test finding user
        found_user = db.query(User).filter(User.email == test_email).first()
        if found_user and found_user.username == "testuser":
            print("✓ User retrieval works correctly")
        else:
            print("✗ User retrieval failed")
            sys.exit(1)
        
        # Test login (password verification)
        if verify_password("test123456", found_user.password_hash):
            print("✓ Login password verification works")
        else:
            print("✗ Login password verification failed")
            sys.exit(1)
        
        # Clean up
        db.delete(found_user)
        db.commit()
        print("✓ Test user deleted (cleanup)")
        
        db.close()
        
    except Exception as e:
        print(f"✗ Database operations test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✓ All tests passed!")
    print("=" * 50)
    print("\nThe authentication system is working correctly.")
    print("You can now test registration and login through the frontend.")
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("\nPlease install dependencies:")
    print("  pip install sqlalchemy bcrypt")
    sys.exit(1)
except Exception as e:
    print(f"✗ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)


