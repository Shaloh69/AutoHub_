"""
===========================================
FILE: app/schemas/auth.py - COMPLETE VERSION WITH ROLE UPGRADE
Path: car_marketplace_ph/app/schemas/auth.py
NEW FEATURE: Role upgrade functionality for buyers
===========================================
"""
from pydantic import BaseModel, EmailStr, Field, field_validator, field_serializer, model_validator, ConfigDict
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
    role: Optional[str] = "BUYER"

    # Business info (for dealers)
    business_name: Optional[str] = Field(None, max_length=200)
    business_permit_number: Optional[str] = Field(None, max_length=100)
    tin_number: Optional[str] = Field(None, max_length=20)
    dti_registration: Optional[str] = Field(None, max_length=100)

    @field_validator('role')
    @classmethod
    def validate_and_normalize_role(cls, v):
        """Validate and normalize role to UPPERCASE"""
        if v is None:
            return "BUYER"

        v_upper = v.upper()
        allowed_roles = ['BUYER', 'SELLER', 'DEALER']

        if v_upper not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}. ADMIN and MODERATOR roles cannot be registered directly.')

        return v_upper


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class TokenRefresh(BaseModel):
    """Refresh token request"""
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
        """Validate password strength"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class PasswordChange(BaseModel):
    """Change password (requires old password)"""
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength"""
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


class UserProfile(BaseModel):
    """COMPLETE user profile response with ALL fields"""
    # Basic info
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    phone_number: Optional[str] = None  # Alias for phone (for frontend compatibility)
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
    business_address: Optional[str] = None
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

    @model_validator(mode='after')
    def populate_phone_number(self):
        """Populate phone_number from phone for frontend compatibility"""
        if self.phone and not self.phone_number:
            self.phone_number = self.phone
        return self

    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
        populate_by_name=True
    )


class UserUpdate(BaseModel):
    """User profile update schema - all fields optional"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    phone_number: Optional[str] = Field(None, max_length=20)  # Alias for phone
    bio: Optional[str] = Field(None, max_length=1000)
    city_id: Optional[int] = None
    address: Optional[str] = Field(None, max_length=500)
    barangay: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)

    # Business info updates (for dealers)
    business_name: Optional[str] = Field(None, max_length=200)
    business_address: Optional[str] = Field(None, max_length=500)
    business_permit_number: Optional[str] = Field(None, max_length=100)
    tin_number: Optional[str] = Field(None, max_length=20)
    dti_registration: Optional[str] = Field(None, max_length=100)


class RoleUpgradeRequest(BaseModel):
    """
    NEW: Role upgrade request schema
    Allows buyers to upgrade to seller or dealer
    """
    new_role: str = Field(..., pattern="^(SELLER|DEALER)$")
    reason: Optional[str] = Field(None, max_length=500, description="Optional reason for role upgrade")

    # Required for dealer role
    business_name: Optional[str] = Field(None, max_length=200)
    business_permit_number: Optional[str] = Field(None, max_length=100)
    tin_number: Optional[str] = Field(None, max_length=20)
    dti_registration: Optional[str] = Field(None, max_length=100)

    @field_validator('new_role')
    @classmethod
    def validate_role(cls, v):
        """Validate that role is either SELLER or DEALER"""
        v_upper = v.upper()
        if v_upper not in ['SELLER', 'DEALER']:
            raise ValueError('Can only upgrade to SELLER or DEALER role')
        return v_upper

    @field_validator('business_name')
    @classmethod
    def validate_business_info(cls, v, info):
        """Validate business info is provided for dealer role"""
        # Get the new_role from values if it exists
        values_data = info.data
        if values_data.get('new_role') == 'DEALER' and not v:
            raise ValueError('Business name is required for DEALER role')
        return v


class RoleUpgradeResponse(BaseModel):
    """Role upgrade response"""
    success: bool
    message: str
    old_role: str
    new_role: str
    upgraded_at: datetime
    requires_verification: bool = False
    verification_message: Optional[str] = None


class IdentityVerificationRequest(BaseModel):
    """Identity verification request"""
    id_type: str = Field(..., pattern="^(PASSPORT|DRIVERS_LICENSE|NATIONAL_ID|VOTERS_ID)$")
    id_number: str = Field(..., min_length=5, max_length=50)
    id_front_image: Optional[str] = None  # Base64 or URL
    id_back_image: Optional[str] = None  # Base64 or URL
    selfie_image: Optional[str] = None  # Base64 or URL