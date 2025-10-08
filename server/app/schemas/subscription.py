from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


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
    payment_method: str = Field(..., pattern="^(credit_card|bank_transfer|gcash|paymaya|paypal|cash)$")
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
