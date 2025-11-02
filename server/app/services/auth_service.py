"""
===========================================
FILE: app/services/auth_service.py - COMPLETE FIXED VERSION
Path: car_marketplace_ph/app/services/auth_service.py
FIXED: Refresh token whitespace handling + all original functionality preserved
===========================================
"""
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets
from app.models.user import User
from app.models.location import PhCity
from app.config import settings
from app.database import cache

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service - COMPLETE FIXED VERSION"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode JWT token - FIXED: Strip whitespace"""
        try:
            # FIX: Strip whitespace from token
            token = token.strip()
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError as e:
            print(f"Token decode error: {e}")
            return None
    
    @staticmethod
    def generate_tokens(user: User) -> Dict[str, Any]:
        """Generate access and refresh tokens - FIXED: Clean token before storage"""
        # FIX: Use getattr for all user attributes
        user_id = int(getattr(user, 'id', 0))
        user_email = str(getattr(user, 'email', ''))
        user_role_obj = getattr(user, 'role', None)
        user_role = user_role_obj.value if user_role_obj else 'buyer'
        
        access_token = AuthService.create_access_token({"sub": str(user_id)})
        refresh_token = AuthService.create_refresh_token({"sub": str(user_id)})
        
        # FIX: Strip and validate token before storage
        refresh_token = refresh_token.strip()
        
        # Store refresh token in cache with proper TTL
        ttl_seconds = settings.JWT_REFRESH_EXPIRATION_DAYS * 86400
        success = cache.set(f"refresh_token:{user_id}", refresh_token, ttl=ttl_seconds)
        
        if not success:
            print(f"WARNING: Failed to store refresh token in cache for user {user_id}")
        else:
            print(f"DEBUG: Stored refresh token for user {user_id}, length: {len(refresh_token)}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
            "user_id": user_id,
            "email": user_email,
            "role": user_role
        }
    
    @staticmethod
    def register_user(db: Session, user_data: dict) -> User:
        """Register new user"""
        # Check if email exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            raise ValueError("Email already registered")
        
        # Verify city exists
        city = db.query(PhCity).filter(PhCity.id == user_data["city_id"]).first()
        if not city:
            raise ValueError("Invalid city_id")
        
        # Set province and region from city - FIX: Use getattr
        user_data["province_id"] = int(getattr(city, 'province_id', 0))
        province = getattr(city, 'province', None)
        if province:
            user_data["region_id"] = int(getattr(province, 'region_id', 0))
        
        # Hash password
        password = user_data.pop("password")
        user_data["password_hash"] = AuthService.hash_password(password)
        
        # Create user
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Send verification email
        AuthService.send_verification_email(user)
        
        return user
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        # FIX: Use getattr for password_hash
        password_hash = str(getattr(user, 'password_hash', ''))
        if not AuthService.verify_password(password, password_hash):
            # Increment login attempts - FIX: Use getattr and setattr
            login_attempts = int(getattr(user, 'login_attempts', 0))
            setattr(user, 'login_attempts', login_attempts + 1)
            
            if login_attempts + 1 >= 5:
                setattr(user, 'locked_until', datetime.utcnow() + timedelta(minutes=30))
            db.commit()
            return None
        
        # Reset login attempts on successful login - FIX: Use setattr
        setattr(user, 'login_attempts', 0)
        setattr(user, 'last_login_at', datetime.utcnow())
        db.commit()
        
        return user
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh access token using refresh token - COMPLETE FIX"""
        # FIX: Strip whitespace from incoming token
        refresh_token = refresh_token.strip()
        
        print(f"DEBUG: Attempting to refresh token, length: {len(refresh_token)}")
        
        # Decode and validate token
        payload = AuthService.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            print("ERROR: Token decode failed or invalid token type")
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            print("ERROR: No user_id in token payload")
            return None
        
        print(f"DEBUG: Token decoded successfully for user_id: {user_id}")
        
        # Verify refresh token in cache
        cached_token = cache.get(f"refresh_token:{user_id}")
        
        if not cached_token:
            print(f"ERROR: No cached token found for user {user_id}")
            return None
        
        # FIX: Strip whitespace from cached token and normalize comparison
        cached_token = str(cached_token).strip()
        
        print(f"DEBUG: Cached token length: {len(cached_token)}")
        print(f"DEBUG: Input token length: {len(refresh_token)}")
        print(f"DEBUG: Tokens match: {cached_token == refresh_token}")
        
        if cached_token != refresh_token:
            print(f"ERROR: Token mismatch for user {user_id}")
            if len(cached_token) != len(refresh_token):
                print(f"ERROR: Length mismatch - cached: {len(cached_token)}, input: {len(refresh_token)}")
            return None
        
        # Generate new access token
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            print(f"ERROR: User {user_id} not found in database")
            return None
        
        access_token = AuthService.create_access_token({"sub": user_id})
        
        print(f"DEBUG: Successfully generated new access token for user {user_id}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600
        }
    
    @staticmethod
    def revoke_refresh_token(user_id: int):
        """Revoke refresh token"""
        cache.delete(f"refresh_token:{user_id}")
        print(f"DEBUG: Revoked refresh token for user {user_id}")
    
    @staticmethod
    def send_verification_email(user: User):
        """Send email verification link"""
        token = secrets.token_urlsafe(32)
        # FIX: Use getattr for user.id and user.email
        user_id = int(getattr(user, 'id', 0))
        user_email = str(getattr(user, 'email', ''))
        
        cache.set(f"email_verify:{token}", str(user_id), ttl=86400)  # 24 hours
        
        # TODO: Send actual email
        print(f"Verification token for {user_email}: {token}")
    
    @staticmethod
    def verify_email(db: Session, token: str) -> bool:
        """Verify email with token"""
        user_id = cache.get(f"email_verify:{token}")
        if not user_id:
            return False
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            return False
        
        # FIX: Use setattr
        setattr(user, 'email_verified', True)
        setattr(user, 'verified_at', datetime.utcnow())
        db.commit()
        
        cache.delete(f"email_verify:{token}")
        return True
    
    @staticmethod
    def request_password_reset(db: Session, email: str) -> str:
        """Request password reset"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if email exists
            return "reset_requested"
        
        token = secrets.token_urlsafe(32)
        # FIX: Use getattr
        user_id = int(getattr(user, 'id', 0))
        cache.set(f"password_reset:{token}", str(user_id), ttl=3600)  # 1 hour
        
        # TODO: Send reset email
        print(f"Password reset token for {email}: {token}")
        
        return "reset_requested"
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> bool:
        """Reset password with token"""
        user_id = cache.get(f"password_reset:{token}")
        if not user_id:
            return False
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            return False
        
        # FIX: Use setattr
        setattr(user, 'password_hash', AuthService.hash_password(new_password))
        db.commit()
        
        cache.delete(f"password_reset:{token}")
        
        # Revoke all refresh tokens - FIX: Use getattr
        user_id_value = int(getattr(user, 'id', 0))
        AuthService.revoke_refresh_token(user_id_value)
        
        return True
    
    @staticmethod
    def change_password(db: Session, user: User, old_password: str, new_password: str) -> bool:
        """Change password"""
        # FIX: Use getattr
        password_hash = str(getattr(user, 'password_hash', ''))
        if not AuthService.verify_password(old_password, password_hash):
            raise ValueError("Current password is incorrect")
        
        # FIX: Use setattr
        setattr(user, 'password_hash', AuthService.hash_password(new_password))
        db.commit()
        
        # Revoke all refresh tokens - FIX: Use getattr
        user_id = int(getattr(user, 'id', 0))
        AuthService.revoke_refresh_token(user_id)
        
        return True
    
    @staticmethod
    def generate_phone_otp(user_id: int, phone: str) -> str:
        """Generate phone verification OTP"""
        import random
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Store OTP in cache
        cache.set(f"phone_otp:{user_id}:{phone}", otp, ttl=600)  # 10 minutes
        
        # TODO: Send OTP via SMS
        print(f"OTP for {phone}: {otp}")
        
        return otp
    
    @staticmethod
    def verify_phone_otp(db: Session, user_id: int, phone: str, otp: str) -> bool:
        """Verify phone OTP"""
        cached_otp = cache.get(f"phone_otp:{user_id}:{phone}")
        if not cached_otp or cached_otp != otp:
            return False
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # FIX: Use setattr
        setattr(user, 'phone', phone)
        setattr(user, 'phone_verified', True)
        db.commit()
        
        cache.delete(f"phone_otp:{user_id}:{phone}")
        return True