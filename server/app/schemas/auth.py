"""
===========================================
FILE: app/schemas/auth.py
Path: car_marketplace_ph/app/schemas/auth.py
100% COMPLETE - ALL AUTH SCHEMAS
===========================================
"""
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """User registration schema - Complete with all validations"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    city_id: int
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    role: Optional[str] = Field("buyer", pattern="^(buyer|seller|dealer)$")
    
    # Business info (for dealers)
    business_name: Optional[str] = Field(None, max_length=200)
    business_permit_number: Optional[str] = Field(None, max_length=100)
    tin_number: Optional[str] = Field(None, max_length=20)
    dti_registration: Optional[str] = Field(None, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema with all fields"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours in seconds
    user_id: int
    email: str
    role: str


class TokenRefresh(BaseModel):
    """Token refresh request"""
    refresh_token: str


class PasswordReset(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation with new password"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class PasswordChange(BaseModel):
    """Password change request (authenticated)"""
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class EmailVerification(BaseModel):
    """Email verification with token"""
    token: str


class PhoneVerification(BaseModel):
    """Phone verification with OTP"""
    phone: str = Field(..., max_length=20)
    otp: str = Field(..., min_length=4, max_length=6)


class PhoneVerificationRequest(BaseModel):
    """Request phone verification OTP"""
    phone: str = Field(..., max_length=20)


class UserProfile(BaseModel):
    """Complete user profile response"""
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    
    # Location info
    city_id: Optional[int] = None
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    address: Optional[str] = None
    barangay: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Business info (for dealers)
    business_name: Optional[str] = None
    business_permit_number: Optional[str] = None
    tin_number: Optional[str] = None
    
    # Verification status
    email_verified: bool = False
    phone_verified: bool = False
    identity_verified: bool = False
    business_verified: bool = False
    verification_level: Optional[str] = None
    
    # Statistics
    average_rating: float = 0.0
    total_ratings: int = 0
    total_sales: int = 0
    total_purchases: int = 0
    total_views: int = 0
    total_listings: int = 0
    active_listings: int = 0
    sold_listings: int = 0
    
    # Account status
    is_active: bool = True
    is_banned: bool = False
    
    # Subscription info
    subscription_status: Optional[str] = None
    subscription_expires_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """User profile update schema - all fields optional"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    
    # Location
    address: Optional[str] = None
    city_id: Optional[int] = None
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    postal_code: Optional[str] = Field(None, max_length=10)
    barangay: Optional[str] = Field(None, max_length=100)
    
    # Business info
    business_name: Optional[str] = Field(None, max_length=200)
    business_permit_number: Optional[str] = Field(None, max_length=100)
    tin_number: Optional[str] = Field(None, max_length=20)
    
    # Preferences
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    language: Optional[str] = Field(None, max_length=10)


class IdentityVerificationRequest(BaseModel):
    """Identity verification request"""
    id_type: str = Field(..., pattern="^(drivers_license|passport|national_id|voters_id)$")
    id_number: str = Field(..., max_length=50)
    id_expiry_date: Optional[str] = None  # Format: YYYY-MM-DD


class BusinessVerificationRequest(BaseModel):
    """Business verification request (for dealers)"""
    business_name: str = Field(..., max_length=200)
    business_permit_number: str = Field(..., max_length=100)
    tin_number: str = Field(..., max_length=20)
    dti_registration: Optional[str] = Field(None, max_length=100)
    business_address: Optional[str] = None
    business_phone: Optional[str] = Field(None, max_length=20)
    business_email: Optional[EmailStr] = None