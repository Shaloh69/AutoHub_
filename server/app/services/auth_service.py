from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
import secrets
from app.models.user import User
from app.models.location import PhCity
from app.config import settings
from app.database import cache
import hashlib

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service"""
    
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
    def decode_token(token: str) -> Optional[Dict]:
        """Decode JWT token"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError:
            return None
    
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
        
        # Hash password
        hashed_password = AuthService.hash_password(user_data.pop("password"))
        
        # Create user
        user = User(
            **user_data,
            password_hash=hashed_password,
            province_id=city.province_id,
            region_id=city.province.region_id
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Generate email verification token
        token = AuthService.generate_verification_token(user.id, "email")
        cache.set(f"email_verify:{token}", str(user.id), ttl=86400)  # 24 hours
        
        # TODO: Send verification email
        
        return user
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        if not AuthService.verify_password(password, user.password_hash):
            return None
        
        if not user.is_active:
            raise ValueError("Account is inactive")
        
        if user.is_banned:
            raise ValueError("Account is banned")
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        user.login_count += 1
        db.commit()
        
        return user
    
    @staticmethod
    def generate_tokens(user: User) -> Dict[str, str]:
        """Generate access and refresh tokens"""
        access_token = AuthService.create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role.value}
        )
        refresh_token = AuthService.create_refresh_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        # Store refresh token in cache
        cache.set(f"refresh_token:{user.id}", refresh_token, ttl=settings.JWT_REFRESH_EXPIRATION_DAYS * 86400)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value
        }
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Dict[str, str]:
        """Refresh access token"""
        payload = AuthService.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")
        
        user_id = int(payload.get("sub"))
        
        # Verify refresh token in cache
        cached_token = cache.get(f"refresh_token:{user_id}")
        if not cached_token or cached_token != refresh_token:
            raise ValueError("Refresh token expired or revoked")
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")
        
        # Generate new tokens
        return AuthService.generate_tokens(user)
    
    @staticmethod
    def revoke_refresh_token(user_id: int):
        """Revoke refresh token"""
        cache.delete(f"refresh_token:{user_id}")
    
    @staticmethod
    def generate_verification_token(user_id: int, token_type: str) -> str:
        """Generate verification token"""
        token = secrets.token_urlsafe(32)
        return token
    
    @staticmethod
    def verify_email(db: Session, token: str) -> bool:
        """Verify email with token"""
        user_id = cache.get(f"email_verify:{token}")
        if not user_id:
            return False
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            return False
        
        user.email_verified = True
        db.commit()
        
        cache.delete(f"email_verify:{token}")
        return True
    
    @staticmethod
    def generate_password_reset_token(db: Session, email: str) -> Optional[str]:
        """Generate password reset token"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        token = secrets.token_urlsafe(32)
        cache.set(f"password_reset:{token}", str(user.id), ttl=3600)  # 1 hour
        
        # TODO: Send password reset email
        
        return token
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> bool:
        """Reset password with token"""
        user_id = cache.get(f"password_reset:{token}")
        if not user_id:
            return False
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            return False
        
        user.password_hash = AuthService.hash_password(new_password)
        db.commit()
        
        cache.delete(f"password_reset:{token}")
        return True
    
    @staticmethod
    def change_password(db: Session, user: User, old_password: str, new_password: str) -> bool:
        """Change password"""
        if not AuthService.verify_password(old_password, user.password_hash):
            raise ValueError("Current password is incorrect")
        
        user.password_hash = AuthService.hash_password(new_password)
        db.commit()
        
        # Revoke all refresh tokens
        AuthService.revoke_refresh_token(user.id)
        
        return True
    
    @staticmethod
    def generate_phone_otp(user_id: int, phone: str) -> str:
        """Generate phone verification OTP"""
        import random
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Store OTP in cache
        cache.set(f"phone_otp:{user_id}:{phone}", otp, ttl=600)  # 10 minutes
        
        # TODO: Send OTP via SMS
        
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
        
        user.phone = phone
        user.phone_verified = True
        db.commit()
        
        cache.delete(f"phone_otp:{user_id}:{phone}")
        return True