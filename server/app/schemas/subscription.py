from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class SubscriptionPlanResponse(BaseModel):
    """Subscription plan response"""
    id: int
    name: str
    display_name: str
    description: Optional[str] = None
    plan_type: str
    
    # Pricing
    monthly_price: Decimal
    yearly_price: Decimal
    setup_fee: Decimal
    currency: str
    trial_days: int
    
    # Limits
    max_active_listings: int
    max_featured_listings: int
    max_premium_listings: int
    max_images_per_listing: int
    monthly_boost_credits: int
    monthly_featured_credits: int
    storage_quota_gb: int
    
    # Features
    priority_ranking_boost: int
    featured_in_homepage: bool
    featured_in_category: bool
    advanced_analytics: bool
    priority_customer_support: bool
    verified_seller_badge: bool
    
    # Status
    is_active: bool
    is_popular: bool
    display_order: int
    
    model_config = ConfigDict(from_attributes=True)


class SubscriptionCreate(BaseModel):
    """Create subscription"""
    plan_id: int
    billing_cycle: str = Field(..., pattern="^(monthly|yearly|lifetime)$")
    payment_method: str = Field(..., pattern="^(credit_card|bank_transfer|gcash|paymaya|paypal|cash)$")
    promotion_code: Optional[str] = Field(None, max_length=50)
    auto_renew: bool = True


class SubscriptionResponse(BaseModel):
    """User subscription response"""
    id: int
    user_id: int
    plan_id: int
    status: str
    billing_cycle: str
    
    # Pricing
    monthly_price: Decimal
    yearly_price: Decimal
    currency: str
    
    # Dates
    started_at: datetime
    trial_ends_at: Optional[datetime] = None
    current_period_start: datetime
    current_period_end: datetime
    next_billing_date: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # Payment
    payment_method: str
    auto_renew: bool
    
    # Discounts
    discount_percent: Decimal
    discount_amount: Decimal
    promotion_code: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SubscriptionDetailResponse(SubscriptionResponse):
    """Detailed subscription with plan info"""
    plan: Optional[SubscriptionPlanResponse] = None
    usage: Optional[dict] = None


class SubscriptionCancel(BaseModel):
    """Cancel subscription"""
    cancel_reason: str = Field(..., pattern="^(voluntary|payment_failed|fraud|policy_violation|downgrade|upgrade)$")
    cancel_notes: Optional[str] = None


class SubscriptionUpgrade(BaseModel):
    """Upgrade subscription"""
    new_plan_id: int
    billing_cycle: Optional[str] = Field(None, pattern="^(monthly|yearly|lifetime)$")
    prorate: bool = True


class SubscriptionUsageResponse(BaseModel):
    """Subscription usage response"""
    subscription_id: int
    period_start: datetime
    period_end: datetime
    
    # Usage metrics
    active_listings_count: int
    featured_listings_used: int
    premium_listings_used: int
    total_images_uploaded: int
    boost_credits_used: int
    featured_credits_used: int
    email_campaigns_sent: int
    storage_used_gb: Decimal
    reports_generated: int
    api_calls_made: int
    
    # Overage
    overage_fee: Decimal
    overage_description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class PromotionCodeValidate(BaseModel):
    """Validate promotion code"""
    code: str = Field(..., max_length=50)
    plan_id: int


class PromotionCodeResponse(BaseModel):
    """Promotion code response"""
    id: int
    code: str
    name: str
    description: Optional[str] = None
    discount_type: str
    discount_value: Decimal
    max_uses: Optional[int] = None
    max_uses_per_user: int
    current_uses: int
    starts_at: datetime
    expires_at: datetime
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


class SubscriptionPaymentResponse(BaseModel):
    """Subscription payment response"""
    id: int
    subscription_id: int
    amount: Decimal
    currency: str
    payment_type: str
    payment_method: str
    status: str
    billing_period_start: datetime
    billing_period_end: datetime
    processed_at: Optional[datetime] = None
    invoice_number: Optional[str] = None
    invoice_url: Optional[str] = None
    receipt_url: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PaymentIntentCreate(BaseModel):
    """Create payment intent"""
    subscription_id: int
    amount: Decimal
    currency: str = "PHP"
    payment_method: str = Field(..., pattern="^(credit_card|bank_transfer|gcash|paymaya|paypal)$")
    save_payment_method: bool = False


class PaymentIntentResponse(BaseModel):
    """Payment intent response"""
    client_secret: str
    payment_intent_id: str
    amount: Decimal
    currency: str
    status: str


class WebhookEvent(BaseModel):
    """Payment webhook event"""
    event_type: str
    data: dict
    signature: Optional[str] = None