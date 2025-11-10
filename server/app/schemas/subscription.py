"""
===========================================
FILE: app/schemas/subscription.py - UPDATED WITH QR CODE PAYMENT
Path: server/app/schemas/subscription.py
ADDED: QR code payment schemas, reference number submission, admin verification
PRESERVED: All original schemas
===========================================
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


# ========================================
# ORIGINAL SCHEMAS (PRESERVED)
# ========================================

class SubscriptionPlanResponse(BaseModel):
    """Subscription plan response - Complete with all fields"""
    id: int
    name: str
    plan_type: str
    monthly_price: Decimal
    yearly_price: Optional[Decimal] = None
    currency: str
    
    # Limits
    max_active_listings: int
    max_featured_listings: int
    max_premium_listings: int
    max_images_per_listing: int
    storage_mb: int
    boost_credits_monthly: int
    
    # Features
    priority_ranking: int
    advanced_analytics: bool
    homepage_featured: bool
    verified_badge: bool
    priority_support: bool
    
    # Status
    is_active: bool
    is_popular: bool
    
    model_config = ConfigDict(from_attributes=True)


class SubscriptionCreate(BaseModel):
    """Create subscription - Complete"""
    plan_id: int
    billing_cycle: str = Field("monthly", pattern="^(monthly|yearly)$")
    payment_method: str = Field("qr_code", pattern="^(qr_code|credit_card|bank_transfer|gcash|paymaya|paypal)$")
    promo_code: Optional[str] = Field(None, max_length=50)


class UserSubscriptionResponse(BaseModel):
    """User subscription response - Complete with all fields"""
    id: int
    user_id: int
    plan_id: int
    status: str
    billing_cycle: str
    current_period_start: datetime
    current_period_end: datetime
    next_billing_date: Optional[datetime] = None
    auto_renew: bool = True
    subscribed_at: datetime
    cancelled_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class SubscriptionUsageResponse(BaseModel):
    """Subscription usage response - Complete"""
    # Current usage
    active_listings: int
    featured_listings: int
    premium_listings: int
    boost_credits_used: int
    storage_used_mb: int
    
    # Limits
    max_active_listings: int
    max_featured_listings: int
    max_premium_listings: int
    boost_credits_monthly: int
    storage_mb: int
    
    # Period
    period_start: datetime
    period_end: datetime


class PromoCodeValidation(BaseModel):
    """Validate promo code request"""
    code: str = Field(..., min_length=1, max_length=50)


class PromoCodeResponse(BaseModel):
    """Promo code validation response - Complete"""
    valid: bool
    code: str
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    message: str


class SubscriptionPaymentResponse(BaseModel):
    """Subscription payment response - Complete"""
    id: int
    subscription_id: int
    user_id: int
    amount: Decimal
    currency: str
    payment_method: Optional[str] = None
    status: str
    provider: Optional[str] = None
    provider_transaction_id: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ========================================
# NEW SCHEMAS FOR QR CODE PAYMENT
# ========================================

class QRCodePaymentResponse(BaseModel):
    """Response after initiating QR code payment"""
    payment_id: int
    subscription_id: int
    amount: Decimal
    currency: str
    qr_code_image_url: str
    payment_instructions: str
    status: str = "pending"
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ReferenceNumberSubmit(BaseModel):
    """Submit payment reference number"""
    payment_id: int = Field(..., gt=0, description="Payment ID")
    reference_number: str = Field(
        ..., 
        min_length=5, 
        max_length=100, 
        description="Reference number from payment confirmation"
    )
    
    @field_validator('reference_number')
    @classmethod
    def validate_reference_number(cls, v):
        """Remove extra spaces and validate format"""
        cleaned = v.strip().replace(" ", "")
        if not cleaned:
            raise ValueError("Reference number cannot be empty")
        return cleaned


class ReferenceNumberSubmitResponse(BaseModel):
    """Response after submitting reference number"""
    success: bool
    message: str
    payment_id: int
    status: str
    submitted_at: datetime
    
    # Email confirmation
    email_sent: bool = False


class SubscriptionPaymentDetailedResponse(BaseModel):
    """Detailed payment response with all fields"""
    id: int
    subscription_id: int
    user_id: int
    plan_id: int
    amount: Decimal
    currency: str
    payment_method: Optional[str] = None
    status: str
    
    # QR Code Payment Fields
    reference_number: Optional[str] = None
    qr_code_shown: bool = False
    submitted_at: Optional[datetime] = None
    
    # Admin Verification
    admin_verified_by: Optional[int] = None
    admin_verified_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    paid_at: Optional[datetime] = None
    
    # Related data
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    plan_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class AdminVerifyPaymentRequest(BaseModel):
    """Admin request to verify payment"""
    payment_id: int = Field(..., gt=0, description="Payment ID to verify")
    action: str = Field(..., pattern="^(approve|reject)$", description="Action: approve or reject")
    admin_notes: Optional[str] = Field(None, max_length=1000, description="Optional notes")
    rejection_reason: Optional[str] = Field(None, max_length=500, description="Reason for rejection (required if rejecting)")
    
    @field_validator('rejection_reason')
    @classmethod
    def validate_rejection_reason(cls, v, info):
        """Ensure rejection reason is provided when rejecting"""
        values_data = info.data
        if values_data.get('action') == 'reject' and not v:
            raise ValueError("Rejection reason is required when rejecting a payment")
        return v


class AdminVerifyPaymentResponse(BaseModel):
    """Response after admin verification"""
    success: bool
    message: str
    payment_id: int
    previous_status: str
    new_status: str
    verified_by: int
    verified_at: datetime
    
    # Notification status
    user_email_sent: bool = False


class PendingPaymentSummary(BaseModel):
    """Summary of pending payments for admin dashboard"""
    payment_id: int
    user_id: int
    user_email: str
    user_name: str
    plan_name: str
    amount: Decimal
    currency: str
    reference_number: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    days_pending: int
    
    model_config = ConfigDict(from_attributes=True)


class PaymentSettingResponse(BaseModel):
    """Payment setting response"""
    id: int
    setting_key: str
    setting_value: str
    setting_type: str
    description: Optional[str] = None
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


class PaymentSettingUpdate(BaseModel):
    """Update payment setting"""
    setting_key: str = Field(..., max_length=100)
    setting_value: str = Field(..., max_length=5000)
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class PaymentVerificationLogResponse(BaseModel):
    """Payment verification log response"""
    id: int
    payment_id: int
    admin_id: int
    admin_name: str
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PaymentStatisticsResponse(BaseModel):
    """Payment statistics for admin dashboard"""
    total_pending: int
    total_completed_today: int
    total_completed_this_month: int
    total_failed: int
    total_amount_pending: Decimal
    total_amount_completed_today: Decimal
    total_amount_completed_this_month: Decimal
    average_verification_time_hours: float