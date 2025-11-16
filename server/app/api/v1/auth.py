"""
===========================================
FILE: app/api/v1/auth.py - FIXED VERSION
Path: car_marketplace_ph/app/api/v1/auth.py
REMOVED: Phone OTP verification endpoints
PRESERVED: All other authentication endpoints
===========================================
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, TokenRefresh,
    PasswordReset, PasswordResetConfirm, PasswordChange,
    EmailVerification,
    UserProfile
)
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register new user account
    
    - Creates user with hashed password
    - Sends email verification
    - Returns JWT tokens
    - Checks for duplicate email
    - Validates city_id
    - Sets province and region from city
    """
    try:
        user = AuthService.register_user(db, user_data.model_dump())
        tokens = AuthService.generate_tokens(user)
        return TokenResponse(**tokens)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password
    
    - Validates credentials
    - Updates last login timestamp
    - Resets login attempts on success
    - Locks account after 5 failed attempts
    - Returns access and refresh tokens
    """
    user = AuthService.authenticate_user(db, credentials.email, credentials.password)
    
    if not user:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    tokens = AuthService.generate_tokens(user)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token
    
    - Validates refresh token
    - Checks token in cache
    - Generates new access token
    - Keeps same refresh token
    """
    tokens = AuthService.refresh_access_token(db, token_data.refresh_token)
    
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return TokenResponse(**tokens)


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user
    
    - Revokes refresh token
    - Clears token from cache
    - User must login again
    """
    AuthService.revoke_refresh_token(int(current_user.id))  # type: ignore
    return MessageResponse(message="Logged out successfully", success=True)


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user profile
    
    - Returns full user profile
    - Requires valid access token
    - Includes verification status
    - Includes statistics
    """
    return UserProfile.model_validate(current_user)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(verification: EmailVerification, db: Session = Depends(get_db)):
    """
    Verify email address with token
    
    - Validates token from email
    - Marks email as verified
    - Sets verified_at timestamp
    - Deletes token from cache
    """
    success = AuthService.verify_email(db, verification.token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    return MessageResponse(message="Email verified successfully", success=True)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """
    Request password reset
    
    - Generates reset token
    - Sends reset email
    - Token valid for 1 hour
    - Doesn't reveal if email exists (security)
    """
    AuthService.request_password_reset(db, reset_data.email)
    return MessageResponse(
        message="If the email exists, a password reset link has been sent",
        success=True
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password with token
    
    - Validates reset token
    - Updates password hash
    - Revokes all refresh tokens
    - Deletes reset token
    """
    success = AuthService.reset_password(
        db, reset_data.token, reset_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return MessageResponse(
        message="Password reset successfully. Please login with your new password.",
        success=True
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change password (authenticated user)
    
    - Requires current password
    - Validates old password
    - Updates to new password
    - Revokes all refresh tokens
    - User must login again
    """
    try:
        AuthService.change_password(
            db, current_user, password_data.old_password, password_data.new_password
        )
        return MessageResponse(
            message="Password changed successfully. Please login again.",
            success=True
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification_email(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Resend email verification

    - Generates new verification token
    - Sends verification email
    - Only for unverified users
    """
    if current_user.email_verified:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )

    # Use the async version to avoid event loop conflicts
    await AuthService.send_verification_email_async(current_user)
    return MessageResponse(
        message="Verification email sent successfully",
        success=True
    )


@router.get("/check-email/{email}")
async def check_email_availability(email: str, db: Session = Depends(get_db)):
    """
    Check if email is available
    
    - Returns availability status
    - Used for registration form validation
    - Public endpoint (no auth required)
    """
    from app.models.user import User
    
    existing = db.query(User).filter(User.email == email).first()
    
    return {
        "email": email,
        "available": existing is None,
        "message": "Email is available" if existing is None else "Email is already registered"
    }


@router.get("/verification-status")
async def get_verification_status(current_user: User = Depends(get_current_user)):
    """
    Get user verification status

    - Returns all verification statuses
    - Email, phone, identity, business
    - Used for onboarding flow
    - NOTE: phone_verified kept for backward compatibility but OTP feature removed
    """
    return {
        "user_id": current_user.id,  # type: ignore
        "email_verified": current_user.email_verified,  # type: ignore
        "phone_verified": current_user.phone_verified,  # type: ignore
        "identity_verified": current_user.identity_verified,  # type: ignore
        "business_verified": current_user.business_verified,  # type: ignore
        "verification_level": current_user.verification_level,  # type: ignore
        "can_list_cars": current_user.can_list_cars,  # type: ignore
        "is_fully_verified": (
            current_user.email_verified and   # type: ignore
            current_user.identity_verified  # type: ignore
        )
    }


@router.get("/debug/check-token/{token}")
async def debug_check_token(token: str):
    """
    DEBUG ENDPOINT: Check if a verification token exists in cache

    - Returns token status without consuming it
    - Useful for debugging email verification issues
    - Should be disabled in production
    """
    from app.database import cache

    cache_key = f"email_verify:{token}"
    exists = cache.exists(cache_key)
    value = cache.get(cache_key) if exists else None

    return {
        "token_preview": f"{token[:10]}..." if len(token) > 10 else token,
        "token_length": len(token),
        "cache_key": cache_key,
        "exists": exists,
        "user_id": value if exists else None,
        "message": "Token found" if exists else "Token not found or expired"
    }