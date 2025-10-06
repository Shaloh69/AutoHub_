from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, TokenRefresh,
    PasswordReset, PasswordResetConfirm, PasswordChange,
    EmailVerification, PhoneVerification, PhoneVerificationRequest,
    UserProfile
)
from app.schemas.common import ResponseBase, MessageResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register new user account
    
    - **email**: Valid email address (unique)
    - **password**: Minimum 8 characters with uppercase, lowercase, and digit
    - **first_name**: User's first name
    - **last_name**: User's last name
    - **city_id**: Valid city ID from Philippines cities
    - **role**: User role (buyer, seller, dealer)
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
    
    Returns JWT access token and refresh token
    """
    try:
        user = AuthService.authenticate_user(db, credentials.email, credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        tokens = AuthService.generate_tokens(user)
        return TokenResponse(**tokens)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token
    """
    try:
        tokens = AuthService.refresh_access_token(db, token_data.refresh_token)
        return TokenResponse(**tokens)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user (revoke refresh token)
    """
    AuthService.revoke_refresh_token(current_user.id)
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile
    """
    return UserProfile.model_validate(current_user)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(verification: EmailVerification, db: Session = Depends(get_db)):
    """
    Verify email address with token
    
    Token is sent to user's email after registration
    """
    success = AuthService.verify_email(db, verification.token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    return MessageResponse(message="Email verified successfully")


@router.post("/request-phone-verification", response_model=MessageResponse)
async def request_phone_verification(
    request: PhoneVerificationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Request phone verification OTP
    
    OTP will be sent via SMS to the provided phone number
    """
    otp = AuthService.generate_phone_otp(current_user.id, request.phone)
    
    # In development, return OTP in response
    # In production, only send via SMS
    return MessageResponse(
        message=f"OTP sent to {request.phone}",
        data={"otp": otp} if True else None  # Remove in production
    )


@router.post("/verify-phone", response_model=MessageResponse)
async def verify_phone(
    verification: PhoneVerification,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify phone number with OTP
    """
    success = AuthService.verify_phone_otp(
        db, current_user.id, verification.phone, verification.otp
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    return MessageResponse(message="Phone verified successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: PasswordReset, db: Session = Depends(get_db)):
    """
    Request password reset
    
    Sends password reset link to user's email
    """
    token = AuthService.generate_password_reset_token(db, request.email)
    if not token:
        # Don't reveal if email exists
        return MessageResponse(
            message="If the email exists, a password reset link has been sent"
        )
    
    # TODO: Send email with reset link
    # In development, return token in response
    return MessageResponse(
        message="Password reset link sent to your email",
        data={"token": token} if True else None  # Remove in production
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password with token
    """
    success = AuthService.reset_password(
        db, reset_data.token, reset_data.new_password
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return MessageResponse(message="Password reset successfully")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change password (requires current password)
    """
    try:
        AuthService.change_password(
            db, current_user,
            password_data.old_password,
            password_data.new_password
        )
        return MessageResponse(message="Password changed successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))