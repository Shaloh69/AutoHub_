from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """User registration schema"""
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
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
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
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours in seconds
    user_id: int
    email: str
    role: str


class TokenRefresh(BaseModel):
    """Token refresh schema"""
    refresh_token: str


class PasswordReset(BaseModel):
    """Password reset request schema"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
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
    """Password change schema"""
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class EmailVerification(BaseModel):
    """Email verification schema"""
    token: str


class PhoneVerification(BaseModel):
    """Phone verification schema"""
    phone: str = Field(..., max_length=20)
    otp: str = Field(..., min_length=4, max_length=6)


class PhoneVerificationRequest(BaseModel):
    """Request phone verification OTP"""
    phone: str = Field(..., max_length=20)


class UserProfile(BaseModel):
    """User profile response"""
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str
    profile_image: Optional[str] = None
    
    # Location
    city_id: Optional[int] = None
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    address: Optional[str] = None
    barangay: Optional[str] = None
    
    # Business info
    business_name: Optional[str] = None
    
    # Verification
    email_verified: bool = False
    phone_verified: bool = False
    identity_verified: bool = False
    business_verified: bool = False
    
    # Stats
    average_rating: float = 0.0
    total_ratings: int = 0
    total_sales: int = 0
    total_purchases: int = 0
    
    # Account status
    is_active: bool = True
    is_banned: bool = False
    
    # Subscription
    subscription_status: Optional[str] = None
    subscription_expires_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """User profile update schema"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    city_id: Optional[int] = None
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    postal_code: Optional[str] = Field(None, max_length=10)
    barangay: Optional[str] = Field(None, max_length=100)
    business_name: Optional[str] = Field(None, max_length=200)
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None


class IdentityVerificationRequest(BaseModel):
    """Identity verification request"""
    id_type: str = Field(..., pattern="^(drivers_license|passport|national_id|voters_id)$")
    id_number: str = Field(..., max_length=50)