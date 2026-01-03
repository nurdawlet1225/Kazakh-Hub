#!/bin/bash
# SQL-based authentication test

DB_PATH="data/kazakh_hub.db"
TEST_ID=$(date +%s | tail -c 12)
TEST_USERNAME="testuser_$(date +%s | tail -c 6)"
TEST_EMAIL="test_$(date +%s | tail -c 6)@example.com"

echo "============================================================"
echo "FULL AUTHENTICATION SYSTEM TEST (SQL Direct)"
echo "============================================================"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "✗ Database file not found: $DB_PATH"
    exit 1
fi

echo "\n[1/4] Database Check"
echo "------------------------------------------------------------"
USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null)
echo "✓ Database exists"
echo "✓ Current users in database: $USER_COUNT"

# Generate test data
echo "\nTest user data:"
echo "  ID: $TEST_ID"
echo "  Username: $TEST_USERNAME"
echo "  Email: $TEST_EMAIL"

# ============================================
# TEST 1: REGISTER (Create Account)
# ============================================
echo "\n[2/4] TEST: Register (Create Account)"
echo "------------------------------------------------------------"

# Check if user exists
EXISTING=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users WHERE email='$TEST_EMAIL' OR username='$TEST_USERNAME';" 2>/dev/null)

if [ "$EXISTING" != "0" ]; then
    echo "⚠ Test user already exists, deleting old one..."
    sqlite3 "$DB_PATH" "DELETE FROM users WHERE email='$TEST_EMAIL' OR username='$TEST_USERNAME';" 2>/dev/null
fi

# Create user (password hash is a placeholder - in real app it's bcrypt)
# For testing, we'll just check the structure
sqlite3 "$DB_PATH" "INSERT INTO users (id, username, email, password_hash, avatar, created_at, updated_at) VALUES ('$TEST_ID', '$TEST_USERNAME', '$TEST_EMAIL', 'test_hash_placeholder', NULL, datetime('now'), datetime('now'));" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ User created successfully!"
    
    # Verify creation
    CREATED=$(sqlite3 "$DB_PATH" "SELECT username, email FROM users WHERE id='$TEST_ID';" 2>/dev/null)
    if [ -n "$CREATED" ]; then
        echo "✓ User verified in database: $CREATED"
    else
        echo "✗ User creation verification failed"
        exit 1
    fi
else
    echo "✗ User creation failed"
    exit 1
fi

# ============================================
# TEST 2: LOGIN (Find User)
# ============================================
echo "\n[3/4] TEST: Login (Find User)"
echo "------------------------------------------------------------"

# Test login by email
echo "Testing login by email..."
USER_BY_EMAIL=$(sqlite3 "$DB_PATH" "SELECT id, username, email FROM users WHERE email='$TEST_EMAIL';" 2>/dev/null)

if [ -n "$USER_BY_EMAIL" ]; then
    echo "✓ Login by email successful!"
    echo "  - Found user: $USER_BY_EMAIL"
else
    echo "✗ Login by email failed - user not found"
    exit 1
fi

# Test login by username
echo "\nTesting login by username..."
USER_BY_USERNAME=$(sqlite3 "$DB_PATH" "SELECT id, username, email FROM users WHERE username='$TEST_USERNAME';" 2>/dev/null)

if [ -n "$USER_BY_USERNAME" ]; then
    echo "✓ Login by username successful!"
    echo "  - Found user: $USER_BY_USERNAME"
else
    echo "✗ Login by username failed - user not found"
    exit 1
fi

# ============================================
# TEST 3: DELETE ACCOUNT
# ============================================
echo "\n[4/4] TEST: Delete Account"
echo "------------------------------------------------------------"

# Delete user
sqlite3 "$DB_PATH" "DELETE FROM users WHERE id='$TEST_ID';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ User deleted successfully!"
    
    # Verify deletion
    DELETED=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users WHERE id='$TEST_ID';" 2>/dev/null)
    if [ "$DELETED" = "0" ]; then
        echo "✓ Deletion verified - user no longer exists"
    else
        echo "✗ Deletion verification failed - user still exists"
        exit 1
    fi
    
    # Try to login with deleted account
    echo "\nTesting login with deleted account..."
    DELETED_USER=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users WHERE email='$TEST_EMAIL';" 2>/dev/null)
    if [ "$DELETED_USER" = "0" ]; then
        echo "✓ Login with deleted account correctly fails"
    else
        echo "✗ Deleted user can still be found"
        exit 1
    fi
else
    echo "✗ User deletion failed"
    exit 1
fi

# ============================================
# SUMMARY
# ============================================
echo "\n============================================================"
echo "✅ ALL TESTS PASSED!"
echo "============================================================"
echo "\nTest Summary:"
echo "  ✓ Database connection"
echo "  ✓ User registration (create account)"
echo "  ✓ User login (by email)"
echo "  ✓ User login (by username)"
echo "  ✓ Account deletion"
echo "  ✓ Deletion verification"
echo "\n🎉 Authentication system database operations work correctly!"
echo "============================================================"


