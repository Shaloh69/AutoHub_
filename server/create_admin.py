"""
===========================================
FILE: create_admin.py
ADMIN ACCOUNT SEEDER
===========================================
Run this script to create admin accounts
Usage: python create_admin.py
===========================================
"""
import sys
import os
from pathlib import Path

# Add server directory to path
server_path = Path(__file__).parent / "server"
sys.path.insert(0, str(server_path))

from fastapi.datastructures import Default
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models.user import User
from app.services.auth_service import AuthService
from datetime import datetime

def create_admin_account(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    phone: str = Default("")
):
    """
    Create an admin account
    
    Args:
        email: Admin email
        password: Admin password
        first_name: First name
        last_name: Last name
        phone: Phone number (optional)
    """
    # Create database session
    db = next(get_db())
    
    try:
        # Check if admin already exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"❌ User with email {email} already exists")
            return False
        
        # Hash password
        password_hash = AuthService.hash_password(password)
        
        # Create admin user
        admin = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role="admin",  # IMPORTANT: Admin role
            email_verified=True,  # Pre-verified
            phone_verified=True if phone else False,
            is_active=True,
            city_id=1,  # Default to Manila
            province_id=1,
            region_id=1,
            created_at=datetime.utcnow()
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("=" * 60)
        print("✅ ADMIN ACCOUNT CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Email: {email}")
        print(f"Name: {first_name} {last_name}")
        print(f"Role: ADMIN")
        print(f"ID: {admin.id}")
        print(f"Email Verified: Yes")
        print("=" * 60)
        print("⚠️  IMPORTANT: Save the password securely!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def create_moderator_account(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    phone: str = Default("")
):
    """Create a moderator account"""
    db = next(get_db())
    
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"❌ User with email {email} already exists")
            return False
        
        password_hash = AuthService.hash_password(password)
        
        moderator = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role="moderator",  # Moderator role
            email_verified=True,
            phone_verified=True if phone else False,
            is_active=True,
            city_id=1,
            province_id=1,
            region_id=1,
            created_at=datetime.utcnow()
        )
        
        db.add(moderator)
        db.commit()
        db.refresh(moderator)
        
        print("=" * 60)
        print("✅ MODERATOR ACCOUNT CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Email: {email}")
        print(f"Name: {first_name} {last_name}")
        print(f"Role: MODERATOR")
        print(f"ID: {moderator.id}")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating moderator: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def interactive_create_admin():
    """Interactive admin creation"""
    print("\n" + "=" * 60)
    print("🔐 CAR MARKETPLACE PHILIPPINES - ADMIN ACCOUNT CREATOR")
    print("=" * 60 + "\n")
    
    account_type = input("Create (1) Admin or (2) Moderator? [1/2]: ").strip()
    
    email = input("Email: ").strip()
    password = input("Password (min 8 characters): ").strip()
    
    if len(password) < 8:
        print("❌ Password must be at least 8 characters")
        return
    
    confirm_password = input("Confirm Password: ").strip()
    
    if password != confirm_password:
        print("❌ Passwords do not match")
        return
    
    first_name = input("First Name: ").strip()
    last_name = input("Last Name: ").strip()
    phone = input("Phone (optional, press Enter to skip): ").strip() or None
    
    print("\n📋 Summary:")
    print(f"  Email: {email}")
    print(f"  Name: {first_name} {last_name}")
    print(f"  Phone: {phone or 'Not provided'}")
    print(f"  Role: {'ADMIN' if account_type == '1' else 'MODERATOR'}")
    
    confirm = input("\nCreate this account? (yes/no): ").strip().lower()
    
    if confirm in ['yes', 'y']:
        if account_type == '1':
            create_admin_account(email, password, first_name, last_name, phone) # type: ignore
        else:
            create_moderator_account(email, password, first_name, last_name, phone) # type: ignore
    else:
        print("❌ Account creation cancelled")


if __name__ == "__main__":
    print("\n🚀 Admin Account Seeder")
    print("This script creates admin/moderator accounts for Car Marketplace PH\n")
    
    if len(sys.argv) > 1:
        # Command line mode
        if sys.argv[1] == "--help":
            print("Usage:")
            print("  python create_admin.py                    # Interactive mode")
            print("  python create_admin.py <email> <password> <firstname> <lastname> [phone]")
            print("\nExample:")
            print("  python create_admin.py admin@example.com MySecurePass123 John Doe +639123456789")
        else:
            if len(sys.argv) >= 5:
                email = sys.argv[1]
                password = sys.argv[2]
                first_name = sys.argv[3]
                last_name = sys.argv[4]
                phone = sys.argv[5] if len(sys.argv) > 5 else None
                
                create_admin_account(email, password, first_name, last_name, phone) # type: ignore
            else:
                print("❌ Invalid arguments. Use --help for usage information")
    else:
        # Interactive mode
        interactive_create_admin()