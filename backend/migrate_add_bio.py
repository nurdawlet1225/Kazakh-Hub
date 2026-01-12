"""Migration script to add bio column to users table"""
from db import engine
from sqlalchemy import text, inspect

def migrate():
    """Add bio column to users table if it doesn't exist"""
    with engine.connect() as conn:
        # Check if bio column exists
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        if 'bio' not in columns:
            print("Adding bio column to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN bio VARCHAR(500)"))
            conn.commit()
            print("Bio column added successfully!")
        else:
            print("Bio column already exists.")
    
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
