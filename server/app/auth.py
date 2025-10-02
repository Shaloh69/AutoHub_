from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from config import get_settings
from database import get_db
import secrets
import string

settings = get_settings()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer scheme for JWT
security = HTTPBearer()


class PasswordManager:
    """Handles password hashing and verification"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """
        Validate password strength
        Returns: (is_valid, error_message)
        """
        if len(password) < settings.PASSWORD_MIN_LENGTH:
            return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"
        
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        
        if not (has_upper and has_lower and has_digit):
            return False, "Password must contain uppercase, lowercase, and numbers"
        
        return True, ""
    
    @staticmethod
    def generate_random_password(length: int = 12) -> str:
        """Generate a random secure password"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password


class TokenManager:
    """Handles JWT token creation and validation"""
    
    @staticmethod
    def create_access_token(
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create a JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        })
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> dict:
        """Decode and validate a JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def create_email_verification_token(email: str) -> str:
        """Create a token for email verification"""
        data = {"email": email, "purpose": "email_verification"}
        expire = datetime.utcnow() + timedelta(hours=24)
        
        to_encode = data.copy()
        to_encode.update({"exp": expire})
        
        token = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return token
    
    @staticmethod
    def verify_email_token(token: str) -> Optional[str]:
        """Verify email verification token and return email"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            if payload.get("purpose") != "email_verification":
                return None
            
            return payload.get("email")
        except JWTError:
            return None
    
    @staticmethod
    def create_password_reset_token(email: str) -> str:
        """Create a token for password reset"""
        data = {"email": email, "purpose": "password_reset"}
        expire = datetime.utcnow() + timedelta(hours=1)
        
        to_encode = data.copy()
        to_encode.update({"exp": expire})
        
        token = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return token
    
    @staticmethod
    def verify_password_reset_token(token: str) -> Optional[str]:
        """Verify password reset token and return email"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            if payload.get("purpose") != "password_reset":
                return None
            
            return payload.get("email")
        except JWTError:
            return None


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    """
    Dependency to get current user ID from JWT token.
    Use this in endpoints that require authentication.
    """
    token = credentials.credentials
    payload = TokenManager.decode_token(token)
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    return user_id


def get_current_user(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Dependency to get current user object from database.
    Use this in endpoints that need user details.
    """
    from models import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is banned"
        )
    
    return user


def require_role(allowed_roles: list[str]):
    """
    Dependency factory to require specific user roles.
    Usage: @router.get("/admin", dependencies=[Depends(require_role(["admin"]))])
    """
    def role_checker(user = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker


def require_verification(verification_type: str):
    """
    Dependency factory to require specific verification status.
    Types: 'email', 'phone', 'identity', 'business'
    """
    def verification_checker(user = Depends(get_current_user)):
        verification_map = {
            'email': user.email_verified,
            'phone': user.phone_verified,
            'identity': user.identity_verified,
            'business': user.business_verified
        }
        
        if not verification_map.get(verification_type, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{verification_type.capitalize()} verification required"
            )
        return user
    return verification_checker


class OTPManager:
    """Handles OTP generation and validation"""
    
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate a numeric OTP"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))
    
    @staticmethod
    def store_otp(key: str, otp: str, ttl: int = 300):
        """Store OTP in Redis with TTL (default 5 minutes)"""
        from database import redis_client
        redis_client.setex(f"otp:{key}", ttl, otp)
    
    @staticmethod
    def verify_otp(key: str, otp: str) -> bool:
        """Verify OTP against stored value"""
        from database import redis_client
        stored_otp = redis_client.get(f"otp:{key}")
        
        if not stored_otp:
            return False
        
        if stored_otp == otp:
            redis_client.delete(f"otp:{key}")
            return True
        
        return False
    
    @staticmethod
    def invalidate_otp(key: str):
        """Invalidate an OTP"""
        from database import redis_client
        redis_client.delete(f"otp:{key}")


class RateLimiter:
    """Simple rate limiting using Redis"""
    
    @staticmethod
    def check_rate_limit(
        key: str,
        limit: int,
        window: int
    ) -> tuple[bool, int]:
        """
        Check if rate limit is exceeded.
        Returns: (is_allowed, remaining_requests)
        """
        from database import redis_client
        
        current = redis_client.get(f"rate_limit:{key}")
        
        if current is None:
            redis_client.setex(f"rate_limit:{key}", window, 1)
            return True, limit - 1
        
        current = int(current)
        if current >= limit:
            return False, 0
        
        redis_client.incr(f"rate_limit:{key}")
        return True, limit - current - 1
    
    @staticmethod
    def reset_rate_limit(key: str):
        """Reset rate limit for a key"""
        from database import redis_client
        redis_client.delete(f"rate_limit:{key}")