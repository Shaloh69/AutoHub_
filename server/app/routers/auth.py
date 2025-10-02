from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import PasswordManager, TokenManager, OTPManager, RateLimiter
from models import User, PHCity
from schemas import (
    UserRegister, UserLogin, TokenResponse, PasswordReset, 
    PasswordResetConfirm, EmailVerification, PhoneVerification,
    UserProfile, SuccessResponse, ErrorResponse
)
from utils import EmailService, ValidationHelper
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate phone if provided
    if user_data.phone and not ValidationHelper.validate_phone_number(user_data.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Philippine phone number"
        )
    
    # Validate city exists
    city = db.query(PHCity).filter(PHCity.id == user_data.city_id).first()
    if not city:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid city ID"
        )
    
    # Validate password strength
    is_valid, error = PasswordManager.validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Create user
    hashed_password = PasswordManager.hash_password(user_data.password)
    
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=user_data.role,
        city_id=user_data.city_id,
        province_id=city.province_id,
        region_id=city.province.region_id,
        is_active=True,
        email_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send verification email
    verification_token = TokenManager.create_email_verification_token(new_user.email)
    EmailService.send_verification_email(new_user.email, verification_token)
    
    # Generate tokens
    access_token = TokenManager.create_access_token({"sub": new_user.id})
    refresh_token = TokenManager.create_refresh_token({"sub": new_user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=30 * 60
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    
    # Rate limiting
    is_allowed, remaining = RateLimiter.check_rate_limit(
        f"login:{credentials.email}",
        limit=5,
        window=300  # 5 attempts per 5 minutes
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    # Find user
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not PasswordManager.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )
    
    # Check if user is banned
    if user.is_banned:
        if user.ban_expires_at and user.ban_expires_at > datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is banned until {user.ban_expires_at}. Reason: {user.ban_reason}"
            )
        elif not user.ban_expires_at:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is permanently banned. Reason: {user.ban_reason}"
            )
        else:
            # Ban expired, unban user
            user.is_banned = False
            user.ban_reason = None
            user.ban_expires_at = None
            db.commit()
    
    # Update login stats
    user.last_login_at = datetime.utcnow()
    user.login_count += 1
    db.commit()
    
    # Generate tokens
    access_token = TokenManager.create_access_token({"sub": user.id})
    refresh_token = TokenManager.create_refresh_token({"sub": user.id})
    
    # Reset rate limit on successful login
    RateLimiter.reset_rate_limit(f"login:{credentials.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=30 * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token"""
    
    try:
        payload = TokenManager.decode_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Verify user exists and is active
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Generate new tokens
        new_access_token = TokenManager.create_access_token({"sub": user_id})
        new_refresh_token = TokenManager.create_refresh_token({"sub": user_id})
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=30 * 60
        )
    
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


@router.post("/verify-email", response_model=SuccessResponse)
async def verify_email(verification: EmailVerification, db: Session = Depends(get_db)):
    """Verify user email"""
    
    email = TokenManager.verify_email_token(verification.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.email_verified:
        return SuccessResponse(message="Email already verified")
    
    user.email_verified = True
    db.commit()
    
    return SuccessResponse(message="Email verified successfully")


@router.post("/request-phone-verification", response_model=SuccessResponse)
async def request_phone_verification(phone: str, db: Session = Depends(get_db)):
    """Request phone verification OTP"""
    
    # Validate phone
    if not ValidationHelper.validate_phone_number(phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Philippine phone number"
        )
    
    # Rate limiting
    is_allowed, remaining = RateLimiter.check_rate_limit(
        f"phone_otp:{phone}",
        limit=3,
        window=300  # 3 attempts per 5 minutes
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again later."
        )
    
    # Generate and store OTP
    otp = OTPManager.generate_otp(6)
    OTPManager.store_otp(phone, otp, ttl=300)
    
    # In production, send SMS via provider (GCash, etc.)
    # For now, just log it
    print(f"OTP for {phone}: {otp}")
    
    return SuccessResponse(
        message="OTP sent successfully",
        data={"otp": otp}  # Remove this in production
    )


@router.post("/verify-phone", response_model=SuccessResponse)
async def verify_phone(
    verification: PhoneVerification,
    db: Session = Depends(get_db),
    user_id: int = Depends(lambda: 1)  # Replace with get_current_user_id
):
    """Verify phone with OTP"""
    
    # Validate OTP
    if not OTPManager.verify_otp(verification.phone, verification.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Update user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.phone = verification.phone
    user.phone_verified = True
    db.commit()
    
    return SuccessResponse(message="Phone verified successfully")


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(request: PasswordReset, db: Session = Depends(get_db)):
    """Request password reset"""
    
    # Rate limiting
    is_allowed, remaining = RateLimiter.check_rate_limit(
        f"reset:{request.email}",
        limit=3,
        window=3600  # 3 attempts per hour
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many reset requests. Please try again later."
        )
    
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success for security (don't reveal if email exists)
    if user:
        reset_token = TokenManager.create_password_reset_token(user.email)
        EmailService.send_password_reset_email(user.email, reset_token)
    
    return SuccessResponse(
        message="If the email exists, a password reset link has been sent"
    )


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(reset: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password with token"""
    
    email = TokenManager.verify_password_reset_token(reset.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate new password
    is_valid, error = PasswordManager.validate_password_strength(reset.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Update password
    user.password_hash = PasswordManager.hash_password(reset.new_password)
    db.commit()
    
    return SuccessResponse(message="Password reset successfully")


@router.post("/logout", response_model=SuccessResponse)
async def logout():
    """Logout user (client should discard tokens)"""
    return SuccessResponse(message="Logged out successfully")