"""
===========================================
FILE: app/schemas/auth.py - FIXED VERSION
Path: car_marketplace_ph/app/schemas/auth.py
REMOVED: PhoneVerification and PhoneVerificationRequest schemas
PRESERVED: All other authentication schemas
===========================================
"""
from pydantic import BaseModel, EmailStr, Field, field_validator, field_serializer, ConfigDict
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """User registration schema - COMPLETE with all fields"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    city_id: int
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    role: Optional[str] = "buyer"
    
    # Business info (for dealers)
    business_name: Optional[str] = Field(None, max_length=200)
    business_permit_number: Optional[str] = Field(None, max_length=100)
    tin_number: Optional[str] = Field(None, max_length=20)
    dti_registration: Optional[str] = Field(None, max_length=100)
    
    @field_validator('role')
    @classmethod
    def validate_and_normalize_role(cls, v):
        """Validate and normalize role to lowercase"""
        if v is None:
            return "buyer"
        
        v_lower = v.lower()
        allowed_roles = ['buyer', 'seller', 'dealer']
        
        if v_lower not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}. Got: {v}')
        
        return v_lower
    
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
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefresh(BaseModel):
    """Refresh token request - FIXED with validation"""
    refresh_token: str
    
    @field_validator('refresh_token')
    @classmethod
    def validate_refresh_token(cls, v):
        """Validate and clean refresh token - FIX: Strip whitespace"""
        if not v or not v.strip():
            raise ValueError('Refresh token cannot be empty')
        
        # FIX: Strip whitespace from token
        v = v.strip()
        
        # Basic validation - JWT tokens have 3 parts separated by dots
        parts = v.split('.')
        if len(parts) != 3:
            raise ValueError('Invalid token format')
        
        # Check minimum length
        if len(v) < 50:
            raise ValueError('Token appears to be invalid (too short)')
        
        return v


class PasswordReset(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation with token"""
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


# NOTE: PhoneVerification and PhoneVerificationRequest schemas removed
# Phone OTP verification feature has been removed from the system


class UserProfile(BaseModel):
    """COMPLETE user profile response with ALL fields"""
    # Basic info
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str  # Will be serialized from enum
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
    phone_verified: bool = False  # Kept for backward compatibility but OTP feature removed
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
    
    @field_serializer('role')
    def serialize_role(self, role, _info):
        """Convert UserRole enum to string value"""
        if role is None:
            return "buyer"
        # If it's already a string, return it
        if isinstance(role, str):
            return role
        # If it's an enum, get its value
        if hasattr(role, 'value'):
            return role.value
        # Fallback to string conversion
        return str(role).lower()
    
    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True
    )


class UserUpdate(BaseModel):
    """User profile update schema - all fields optional"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    city_id: Optional[int] = None
    address: Optional[str] = Field(None, max_length=500)
    barangay: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)
    
    # Business info updates (for dealers)
    business_name: Optional[str] = Field(None, max_length=200)
    business_permit_number: Optional[str] = Field(None, max_length=100)
    tin_number: Optional[str] = Field(None, max_length=20)
    dti_registration: Optional[str] = Field(None, max_length=100)


class IdentityVerificationRequest(BaseModel):
    """Identity verification request"""
    id_type: str = Field(..., pattern="^(passport|drivers_license|national_id|voters_id)$")
    id_number: str = Field(..., min_length=5, max_length=50)
    id_front_image: Optional[str] = None  # Base64 or URL
    id_back_image: Optional[str] = None  # Base64 or URL
    selfie_image: Optional[str] = None  # Base64 or URL