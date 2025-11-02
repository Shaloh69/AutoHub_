"""
===========================================
FILE: app/services/auth_service.py - IMPROVED VERSION
Path: server/app/services/auth_service.py
IMPROVEMENTS:
- ✅ Replaced print statements with actual email sending
- ✅ Integrated EmailService for verification and password reset
- ✅ Added async email support
- ✅ Added comprehensive error handling
- ✅ Added logging instead of print statements
- ✅ Improved security measures
- ✅ Added SMS sending preparation
- ✅ Better token management
- ✅ All original functionality preserved
===========================================
"""
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets
import asyncio
import logging
from app.models.user import User
from app.models.location import PhCity
from app.config import settings
from app.database import cache
from app.services.email_service import EmailService

# Setup logging
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service with email integration - IMPROVED VERSION"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
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
        """Decode JWT token with proper error handling"""
        try:
            # Strip whitespace from token
            token = token.strip()
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError as e:
            logger.warning(f"Token decode error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected token decode error: {e}")
            return None
    
    @staticmethod
    def generate_tokens(user: User) -> Dict[str, Any]:
        """Generate access and refresh tokens with proper role handling"""
        # Use getattr for all user attributes
        user_id = int(getattr(user, 'id', 0))
        user_email = str(getattr(user, 'email', ''))
        user_role_obj = getattr(user, 'role', None)
        
        # Handle both string and enum cases for role
        if user_role_obj is None:
            user_role = 'buyer'
        elif isinstance(user_role_obj, str):
            user_role = user_role_obj
        elif hasattr(user_role_obj, 'value'):
            user_role = user_role_obj.value
        else:
            user_role = str(user_role_obj).lower()
        
        # Generate tokens
        access_token = AuthService.create_access_token({"sub": str(user_id)})
        refresh_token = AuthService.create_refresh_token({"sub": str(user_id)})
        
        # Strip and validate token before storage
        refresh_token = refresh_token.strip()
        
        # Store refresh token in cache with proper TTL
        ttl_seconds = settings.JWT_REFRESH_EXPIRATION_DAYS * 86400
        success = cache.set(f"refresh_token:{user_id}", refresh_token, ttl=ttl_seconds)
        
        if not success:
            logger.error(f"Failed to store refresh token in cache for user {user_id}")
        else:
            logger.info(f"Stored refresh token for user {user_id}")
        
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
        """
        Register new user with email verification
        
        IMPROVED: Now sends actual verification email
        """
        # Check if email exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            raise ValueError("Email already registered")
    
        # Verify city exists
        city = db.query(PhCity).filter(PhCity.id == user_data["city_id"]).first()
        if not city:
            raise ValueError("Invalid city_id")
        
        # Set province and region from city
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
        
        # Send verification email (async)
        try:
            asyncio.create_task(AuthService.send_verification_email_async(user))
            logger.info(f"Verification email queued for {user.email}")
        except Exception as e:
            logger.error(f"Failed to queue verification email: {e}")
            # Don't fail registration if email fails
        
        return user
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"Authentication failed: User not found for email {email}")
            return None
        
        # Check if account is locked
        locked_until = getattr(user, 'locked_until', None)
        if locked_until and locked_until > datetime.utcnow():
            logger.warning(f"Authentication failed: Account locked for user {email}")
            return None
        
        # Verify password
        password_hash = str(getattr(user, 'password_hash', ''))
        if not AuthService.verify_password(password, password_hash):
            # Increment login attempts
            login_attempts = int(getattr(user, 'login_attempts', 0))
            setattr(user, 'login_attempts', login_attempts + 1)
            
            # Lock account after 5 failed attempts
            if login_attempts + 1 >= 5:
                setattr(user, 'locked_until', datetime.utcnow() + timedelta(minutes=30))
                logger.warning(f"Account locked for user {email} after 5 failed attempts")
            
            db.commit()
            logger.warning(f"Authentication failed: Invalid password for user {email}")
            return None
        
        # Reset login attempts on successful login
        setattr(user, 'login_attempts', 0)
        setattr(user, 'locked_until', None)
        setattr(user, 'last_login_at', datetime.utcnow())
        db.commit()
        
        logger.info(f"User {email} authenticated successfully")
        return user
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh access token using refresh token"""
        # Strip whitespace from incoming token
        refresh_token = refresh_token.strip()
        
        logger.debug(f"Attempting to refresh token, length: {len(refresh_token)}")
        
        # Decode and validate token
        payload = AuthService.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            logger.warning("Token decode failed or invalid token type")
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("No user_id in token payload")
            return None
        
        # Verify refresh token in cache
        cached_token = cache.get(f"refresh_token:{user_id}")
        
        if not cached_token:
            logger.warning(f"No cached token found for user {user_id}")
            return None
        
        # Strip whitespace from cached token and compare
        cached_token = str(cached_token).strip()
        
        if cached_token != refresh_token:
            logger.warning(f"Token mismatch for user {user_id}")
            return None
        
        # Get user from database
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            logger.error(f"User {user_id} not found in database")
            return None
        
        # Generate new access token
        access_token = AuthService.create_access_token({"sub": user_id})
        
        logger.info(f"Successfully generated new access token for user {user_id}")
        
        # Return the same refresh token (it's still valid)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600
        }
    
    @staticmethod
    def revoke_refresh_token(user_id: int):
        """Revoke refresh token"""
        cache.delete(f"refresh_token:{user_id}")
        logger.info(f"Revoked refresh token for user {user_id}")
    
    @staticmethod
    async def send_verification_email_async(user: User):
        """
        Send email verification link (async version)
        
        IMPROVED: Now sends actual email instead of printing
        """
        try:
            # Generate verification token
            token = secrets.token_urlsafe(32)
            user_id = int(getattr(user, 'id', 0))
            user_email = str(getattr(user, 'email', ''))
            user_first_name = str(getattr(user, 'first_name', ''))
            user_last_name = str(getattr(user, 'last_name', ''))
            user_name = f"{user_first_name} {user_last_name}".strip()
            
            # Store token in cache (24 hours)
            cache.set(f"email_verify:{token}", str(user_id), ttl=86400)
            
            # Send actual email
            success = await EmailService.send_verification_email(
                email=user_email,
                token=token,
                user_name=user_name
            )
            
            if success:
                logger.info(f"✅ Verification email sent to {user_email}")
            else:
                logger.error(f"❌ Failed to send verification email to {user_email}")
            
            return success
        except Exception as e:
            logger.error(f"Error sending verification email: {e}")
            return False
    
    @staticmethod
    def send_verification_email(user: User):
        """
        Send email verification link (sync wrapper)
        
        IMPROVED: Creates async task for email sending
        """
        try:
            # Try to get or create event loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Run the async email sending
            loop.run_until_complete(AuthService.send_verification_email_async(user))
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            # Fallback to token generation only
            token = secrets.token_urlsafe(32)
            user_id = int(getattr(user, 'id', 0))
            user_email = str(getattr(user, 'email', ''))
            cache.set(f"email_verify:{token}", str(user_id), ttl=86400)
            logger.warning(f"Verification token generated for {user_email} (email not sent): {token}")
    
    @staticmethod
    def verify_email(db: Session, token: str) -> bool:
        """
        Verify email with token
        
        IMPROVED: Sends welcome email after verification
        """
        user_id = cache.get(f"email_verify:{token}")
        if not user_id:
            logger.warning("Invalid or expired email verification token")
            return False
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return False
        
        # Mark email as verified
        setattr(user, 'email_verified', True)
        setattr(user, 'verified_at', datetime.utcnow())
        db.commit()
        
        # Delete token from cache
        cache.delete(f"email_verify:{token}")
        
        user_email = str(getattr(user, 'email', ''))
        logger.info(f"Email verified successfully for {user_email}")
        
        # Send welcome email (async, don't block)
        try:
            asyncio.create_task(AuthService.send_welcome_email_async(user))
        except Exception as e:
            logger.error(f"Failed to queue welcome email: {e}")
        
        return True
    
    @staticmethod
    async def send_welcome_email_async(user: User):
        """Send welcome email after verification"""
        try:
            user_email = str(getattr(user, 'email', ''))
            user_first_name = str(getattr(user, 'first_name', ''))
            user_last_name = str(getattr(user, 'last_name', ''))
            user_name = f"{user_first_name} {user_last_name}".strip()
            
            success = await EmailService.send_welcome_email(
                email=user_email,
                user_name=user_name
            )
            
            if success:
                logger.info(f"✅ Welcome email sent to {user_email}")
            else:
                logger.error(f"❌ Failed to send welcome email to {user_email}")
        except Exception as e:
            logger.error(f"Error sending welcome email: {e}")
    
    @staticmethod
    def request_password_reset(db: Session, email: str) -> str:
        """
        Request password reset
        
        IMPROVED: Sends actual password reset email
        """
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if email exists (security best practice)
            logger.info(f"Password reset requested for non-existent email: {email}")
            return "reset_requested"
        
        try:
            # Generate reset token
            token = secrets.token_urlsafe(32)
            user_id = int(getattr(user, 'id', 0))
            user_email = str(getattr(user, 'email', ''))
            user_first_name = str(getattr(user, 'first_name', ''))
            user_last_name = str(getattr(user, 'last_name', ''))
            user_name = f"{user_first_name} {user_last_name}".strip()
            
            # Store token in cache (1 hour)
            cache.set(f"password_reset:{token}", str(user_id), ttl=3600)
            
            # Send password reset email (async)
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Run async email sending
            success = loop.run_until_complete(
                EmailService.send_password_reset_email(
                    email=user_email,
                    token=token,
                    user_name=user_name
                )
            )
            
            if success:
                logger.info(f"✅ Password reset email sent to {user_email}")
            else:
                logger.error(f"❌ Failed to send password reset email to {user_email}")
        except Exception as e:
            logger.error(f"Error in password reset request: {e}")
            # Fallback - still generate token
            token = secrets.token_urlsafe(32)
            user_id = int(getattr(user, 'id', 0))
            cache.set(f"password_reset:{token}", str(user_id), ttl=3600)
            logger.warning(f"Password reset token generated for {email} (email not sent): {token}")
        
        return "reset_requested"
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> bool:
        """Reset password with token"""
        user_id = cache.get(f"password_reset:{token}")
        if not user_id:
            logger.warning("Invalid or expired password reset token")
            return False
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return False
        
        # Update password
        setattr(user, 'password_hash', AuthService.hash_password(new_password))
        db.commit()
        
        # Delete token from cache
        cache.delete(f"password_reset:{token}")
        
        # Revoke all refresh tokens for security
        user_id_value = int(getattr(user, 'id', 0))
        AuthService.revoke_refresh_token(user_id_value)
        
        user_email = str(getattr(user, 'email', ''))
        logger.info(f"Password reset successfully for {user_email}")
        
        return True
    
    @staticmethod
    def change_password(db: Session, user: User, old_password: str, new_password: str) -> bool:
        """Change password for authenticated user"""
        # Verify old password
        password_hash = str(getattr(user, 'password_hash', ''))
        if not AuthService.verify_password(old_password, password_hash):
            logger.warning(f"Password change failed: incorrect old password for user {user.email}")
            raise ValueError("Current password is incorrect")
        
        # Update to new password
        setattr(user, 'password_hash', AuthService.hash_password(new_password))
        db.commit()
        
        # Revoke all refresh tokens for security
        user_id = int(getattr(user, 'id', 0))
        AuthService.revoke_refresh_token(user_id)
        
        logger.info(f"Password changed successfully for {user.email}")
        return True
    
    @staticmethod
    def generate_phone_otp(user_id: int, phone: str) -> str:
        """
        Generate phone verification OTP
        
        IMPROVED: Prepared for SMS integration
        """
        import random
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Store OTP in cache (10 minutes)
        cache.set(f"phone_otp:{user_id}:{phone}", otp, ttl=600)
        
        # TODO: Integrate SMS service (Semaphore/Twilio)
        # For now, log the OTP
        logger.info(f"OTP generated for {phone}: {otp} (SMS integration pending)")
        
        # In production, you would send SMS here:
        # if settings.SMS_PROVIDER == "semaphore":
        #     send_semaphore_sms(phone, f"Your verification code is: {otp}")
        # elif settings.SMS_PROVIDER == "twilio":
        #     send_twilio_sms(phone, f"Your verification code is: {otp}")
        
        return otp
    
    @staticmethod
    def verify_phone_otp(db: Session, user_id: int, phone: str, otp: str) -> bool:
        """Verify phone OTP"""
        cached_otp = cache.get(f"phone_otp:{user_id}:{phone}")
        if not cached_otp or cached_otp != otp:
            logger.warning(f"Invalid OTP for phone {phone}")
            return False
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return False
        
        # Update phone and mark as verified
        setattr(user, 'phone', phone)
        setattr(user, 'phone_verified', True)
        db.commit()
        
        # Delete OTP from cache
        cache.delete(f"phone_otp:{user_id}:{phone}")
        
        logger.info(f"Phone {phone} verified successfully for user {user_id}")
        return True