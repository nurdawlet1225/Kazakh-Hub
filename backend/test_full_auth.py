#!/usr/bin/env python3
"""Full authentication test: register, login, delete"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from db import init_db, get_db, User
    from utils.password import hash_password, verify_password
    from sqlalchemy.orm import Session
    import random
    
    print("=" * 60)
    print("FULL AUTHENTICATION SYSTEM TEST")
    print("=" * 60)
    
    # Initialize database
    print("\n[1/4] Initializing database...")
    try:
        init_db()
        print("✓ Database initialized")
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")
        sys.exit(1)
    
    # Generate test user data
    test_id = ''.join([str(random.randint(0, 9)) for _ in range(12)])
    test_username = f"testuser_{random.randint(1000, 9999)}"
    test_email = f"test_{random.randint(1000, 9999)}@example.com"
    test_password = "test123456"
    
    print(f"\nTest user data:")
    print(f"  ID: {test_id}")
    print(f"  Username: {test_username}")
    print(f"  Email: {test_email}")
    print(f"  Password: {test_password}")
    
    db = next(get_db())
    
    # ============================================
    # TEST 1: REGISTER (Create Account)
    # ============================================
    print("\n[2/4] TEST: Register (Create Account)")
    print("-" * 60)
    
    try:
        # Check if user already exists
        existing = db.query(User).filter(
            (User.email == test_email) | (User.username == test_username)
        ).first()
        
        if existing:
            print(f"⚠ Test user already exists, deleting old one...")
            db.delete(existing)
            db.commit()
        
        # Create new user (simulate registration)
        password_hash = hash_password(test_password)
        new_user = User(
            id=test_id,
            username=test_username,
            email=test_email,
            password_hash=password_hash,
            avatar=None
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✓ User created successfully!")
        print(f"  - User ID: {new_user.id}")
        print(f"  - Username: {new_user.username}")
        print(f"  - Email: {new_user.email}")
        print(f"  - Password hash: {new_user.password_hash[:30]}...")
        print(f"  - Created at: {new_user.created_at}")
        
    except Exception as e:
        print(f"✗ Registration failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        db.close()
        sys.exit(1)
    
    # ============================================
    # TEST 2: LOGIN (Authenticate)
    # ============================================
    print("\n[3/4] TEST: Login (Authenticate)")
    print("-" * 60)
    
    try:
        # Test login by email
        print("Testing login by email...")
        user_by_email = db.query(User).filter(User.email == test_email).first()
        
        if not user_by_email:
            print("✗ User not found by email")
            sys.exit(1)
        
        # Verify password
        if verify_password(test_password, user_by_email.password_hash):
            print(f"✓ Login by email successful!")
            print(f"  - Authenticated user: {user_by_email.username}")
        else:
            print("✗ Password verification failed")
            sys.exit(1)
        
        # Test login by username
        print("\nTesting login by username...")
        user_by_username = db.query(User).filter(User.username == test_username).first()
        
        if not user_by_username:
            print("✗ User not found by username")
            sys.exit(1)
        
        # Verify password
        if verify_password(test_password, user_by_username.password_hash):
            print(f"✓ Login by username successful!")
            print(f"  - Authenticated user: {user_by_username.email}")
        else:
            print("✗ Password verification failed")
            sys.exit(1)
        
        # Test wrong password
        print("\nTesting wrong password rejection...")
        if not verify_password("wrong_password", user_by_username.password_hash):
            print("✓ Wrong password correctly rejected")
        else:
            print("✗ Wrong password was accepted (SECURITY ISSUE!)")
            sys.exit(1)
        
    except Exception as e:
        print(f"✗ Login test failed: {e}")
        import traceback
        traceback.print_exc()
        db.close()
        sys.exit(1)
    
    # ============================================
    # TEST 3: DELETE ACCOUNT
    # ============================================
    print("\n[4/4] TEST: Delete Account")
    print("-" * 60)
    
    try:
        # Find user to delete
        user_to_delete = db.query(User).filter(User.id == test_id).first()
        
        if not user_to_delete:
            print("✗ User not found for deletion")
            sys.exit(1)
        
        deleted_username = user_to_delete.username
        deleted_email = user_to_delete.email
        
        # Delete user
        db.delete(user_to_delete)
        db.commit()
        
        print(f"✓ User deleted successfully!")
        print(f"  - Deleted user: {deleted_username}")
        print(f"  - Deleted email: {deleted_email}")
        
        # Verify deletion
        verify_deleted = db.query(User).filter(User.id == test_id).first()
        if not verify_deleted:
            print("✓ Deletion verified - user no longer exists in database")
        else:
            print("✗ Deletion failed - user still exists")
            sys.exit(1)
        
        # Try to login with deleted account (should fail)
        print("\nTesting login with deleted account...")
        deleted_user = db.query(User).filter(User.email == deleted_email).first()
        if not deleted_user:
            print("✓ Login with deleted account correctly fails")
        else:
            print("✗ Deleted user can still login (SECURITY ISSUE!)")
            sys.exit(1)
        
    except Exception as e:
        print(f"✗ Delete test failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        db.close()
        sys.exit(1)
    
    db.close()
    
    # ============================================
    # SUMMARY
    # ============================================
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nTest Summary:")
    print("  ✓ Database initialization")
    print("  ✓ User registration (create account)")
    print("  ✓ User login (by email)")
    print("  ✓ User login (by username)")
    print("  ✓ Wrong password rejection")
    print("  ✓ Account deletion")
    print("  ✓ Deletion verification")
    print("\n🎉 Authentication system is working correctly!")
    print("=" * 60)
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("\nPlease install dependencies:")
    print("  cd backend")
    print("  source venv/bin/activate")
    print("  pip install sqlalchemy bcrypt")
    sys.exit(1)
except Exception as e:
    print(f"✗ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)



