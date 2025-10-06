from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class PlanType(str, enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"
    LIFETIME = "lifetime"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    PENDING = "pending"
    TRIAL = "trial"
    PAST_DUE = "past_due"


class CancelReason(str, enum.Enum):
    VOLUNTARY = "voluntary"
    PAYMENT_FAILED = "payment_failed"
    FRAUD = "fraud"
    POLICY_VIOLATION = "policy_violation"
    DOWNGRADE = "downgrade"
    UPGRADE = "upgrade"


class SubPaymentMethod(str, enum.Enum):
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    GCASH = "gcash"
    PAYMAYA = "paymaya"
    PAYPAL = "paypal"
    CASH = "cash"


class PaymentType(str, enum.Enum):
    SUBSCRIPTION = "subscription"
    SETUP_FEE = "setup_fee"
    OVERAGE = "overage"
    UPGRADE = "upgrade"
    DOWNGRADE = "downgrade"
    REFUND = "refund"


class SubPaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class FeatureType(str, enum.Enum):
    FEATURED_LISTING = "featured_listing"
    PREMIUM_LISTING = "premium_listing"
    BOOST_LISTING = "boost_listing"
    ANALYTICS_REPORT = "analytics_report"
    EMAIL_CAMPAIGN = "email_campaign"
    API_CALL = "api_call"
    STORAGE_UPLOAD = "storage_upload"
    PRIORITY_SUPPORT = "priority_support"
    COMPETITOR_INSIGHT = "competitor_insight"
    MARKET_REPORT = "market_report"
    LEAD_EXPORT = "lead_export"


class FeatureUsageStatus(str, enum.Enum):
    USED = "used"
    PENDING = "pending"
    FAILED = "failed"
    REFUNDED = "refunded"


class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_TRIAL = "free_trial"
    UPGRADE_BONUS = "upgrade_bonus"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    plan_type = Column(Enum(PlanType), nullable=False, index=True)
    
    # Pricing
    monthly_price = Column(DECIMAL(10, 2), nullable=False, default=0.00, index=True)
    yearly_price = Column(DECIMAL(10, 2), nullable=False, default=0.00, index=True)
    setup_fee = Column(DECIMAL(10, 2), default=0.00)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    
    # Billing
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.MONTHLY)
    trial_days = Column(Integer, default=0)
    
    # Listing Limits
    max_active_listings = Column(Integer, default=5)
    max_featured_listings = Column(Integer, default=0)
    max_premium_listings = Column(Integer, default=0)
    max_images_per_listing = Column(Integer, default=10)
    
    # Visibility Features
    priority_ranking_boost = Column(Integer, default=0)
    featured_in_homepage = Column(Boolean, default=False)
    featured_in_category = Column(Boolean, default=False)
    featured_in_search = Column(Boolean, default=False)
    social_media_promotion = Column(Boolean, default=False)
    
    # Analytics & Insights
    advanced_analytics = Column(Boolean, default=False)
    competitor_insights = Column(Boolean, default=False)
    market_value_reports = Column(Boolean, default=False)
    custom_reports = Column(Boolean, default=False)
    
    # Communication Features
    priority_customer_support = Column(Boolean, default=False)
    dedicated_account_manager = Column(Boolean, default=False)
    phone_support = Column(Boolean, default=False)
    live_chat_support = Column(Boolean, default=False)
    
    # Marketing Tools
    auto_boost_listings = Column(Boolean, default=False)
    email_marketing_tools = Column(Boolean, default=False)
    lead_management_tools = Column(Boolean, default=False)
    crm_integration = Column(Boolean, default=False)
    
    # Verification & Trust
    verified_seller_badge = Column(Boolean, default=False)
    background_check_included = Column(Boolean, default=False)
    insurance_coverage = Column(Boolean, default=False)
    transaction_protection = Column(Boolean, default=False)
    
    # Advanced Features
    api_access = Column(Boolean, default=False)
    white_label_options = Column(Boolean, default=False)
    custom_branding = Column(Boolean, default=False)
    bulk_upload_tools = Column(Boolean, default=False)
    
    # Plan Management
    is_active = Column(Boolean, default=True, index=True)
    is_popular = Column(Boolean, default=False, index=True)
    is_featured = Column(Boolean, default=False)
    display_order = Column(Integer, default=0, index=True)
    
    # Limits and Quotas
    monthly_boost_credits = Column(Integer, default=0)
    monthly_featured_credits = Column(Integer, default=0)
    monthly_email_campaigns = Column(Integer, default=0)
    storage_quota_gb = Column(Integer, default=1)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship("UserSubscription", back_populates="plan")
    
    def __repr__(self):
        return f"<SubscriptionPlan {self.id}: {self.display_name}>"


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Subscription Details
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.PENDING, index=True)
    billing_cycle = Column(Enum(BillingCycle), nullable=False)
    
    # Pricing (locked in at time of subscription)
    monthly_price = Column(DECIMAL(10, 2), nullable=False)
    yearly_price = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    
    # Billing Dates
    started_at = Column(TIMESTAMP, nullable=False)
    trial_ends_at = Column(TIMESTAMP, nullable=True)
    current_period_start = Column(TIMESTAMP, nullable=False, index=True)
    current_period_end = Column(TIMESTAMP, nullable=False, index=True)
    next_billing_date = Column(TIMESTAMP, nullable=True, index=True)
    cancelled_at = Column(TIMESTAMP, nullable=True)
    expires_at = Column(TIMESTAMP, nullable=True)
    
    # Payment Information
    payment_method = Column(Enum(SubPaymentMethod), default=SubPaymentMethod.CREDIT_CARD)
    payment_provider = Column(String(100))
    external_subscription_id = Column(String(255), unique=True, index=True)
    
    # Cancellation
    cancel_reason = Column(Enum(CancelReason), nullable=True)
    cancel_notes = Column(Text)
    cancelled_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Auto-renewal
    auto_renew = Column(Boolean, default=True)
    auto_renew_disabled_at = Column(TIMESTAMP, nullable=True)
    
    # Discounts and Promotions
    discount_percent = Column(DECIMAL(5, 2), default=0.00)
    discount_amount = Column(DECIMAL(10, 2), default=0.00)
    promotion_code = Column(String(50))
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    canceller = relationship("User", foreign_keys=[cancelled_by])
    
    usage_records = relationship("SubscriptionUsage", back_populates="subscription", cascade="all, delete-orphan")
    payments = relationship("SubscriptionPayment", back_populates="subscription", cascade="all, delete-orphan")
    feature_usage = relationship("SubscriptionFeatureUsage", back_populates="subscription", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<UserSubscription {self.id}: User {self.user_id}, Plan {self.plan_id}, Status {self.status}>"


class SubscriptionUsage(Base):
    __tablename__ = "subscription_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Usage Period
    period_start = Column(TIMESTAMP, nullable=False, index=True)
    period_end = Column(TIMESTAMP, nullable=False, index=True)
    
    # Listing Usage
    active_listings_count = Column(Integer, default=0)
    featured_listings_used = Column(Integer, default=0)
    premium_listings_used = Column(Integer, default=0)
    total_images_uploaded = Column(Integer, default=0)
    
    # Boost and Credits Usage
    boost_credits_used = Column(Integer, default=0)
    featured_credits_used = Column(Integer, default=0)
    email_campaigns_sent = Column(Integer, default=0)
    
    # Storage Usage
    storage_used_gb = Column(DECIMAL(8, 3), default=0.000)
    
    # Analytics Usage
    reports_generated = Column(Integer, default=0)
    api_calls_made = Column(Integer, default=0)
    
    # Overage Charges
    overage_fee = Column(DECIMAL(10, 2), default=0.00)
    overage_description = Column(Text)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscription = relationship("UserSubscription", back_populates="usage_records")
    user = relationship("User")
    
    def __repr__(self):
        return f"<SubscriptionUsage {self.id}: Subscription {self.subscription_id}>"


class SubscriptionPayment(Base):
    __tablename__ = "subscription_payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Payment Details
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    payment_type = Column(Enum(PaymentType), nullable=False, index=True)
    
    # Payment Processing
    payment_method = Column(Enum(SubPaymentMethod), nullable=False)
    payment_provider = Column(String(100))
    transaction_id = Column(String(255), index=True)
    external_payment_id = Column(String(255), index=True)
    
    # Payment Status
    status = Column(Enum(SubPaymentStatus), nullable=False, default=SubPaymentStatus.PENDING, index=True)
    
    # Billing Period
    billing_period_start = Column(TIMESTAMP, nullable=False, index=True)
    billing_period_end = Column(TIMESTAMP, nullable=False, index=True)
    
    # Processing Details
    processed_at = Column(TIMESTAMP, nullable=True, index=True)
    failed_at = Column(TIMESTAMP, nullable=True)
    failure_reason = Column(Text)
    refunded_at = Column(TIMESTAMP, nullable=True)
    refund_amount = Column(DECIMAL(10, 2), default=0.00)
    refund_reason = Column(Text)
    
    # Fees and Taxes
    platform_fee = Column(DECIMAL(10, 2), default=0.00)
    payment_processing_fee = Column(DECIMAL(10, 2), default=0.00)
    tax_amount = Column(DECIMAL(10, 2), default=0.00)
    
    # Invoice Information
    invoice_number = Column(String(100), unique=True)
    invoice_url = Column(String(500))
    receipt_url = Column(String(500))
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscription = relationship("UserSubscription", back_populates="payments")
    user = relationship("User")
    
    def __repr__(self):
        return f"<SubscriptionPayment {self.id}: {self.amount} {self.currency}, Status {self.status}>"


class SubscriptionFeatureUsage(Base):
    __tablename__ = "subscription_feature_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    feature_type = Column(Enum(FeatureType), nullable=False, index=True)
    
    # Feature Usage Details
    related_car_id = Column(Integer, ForeignKey("cars.id", ondelete="SET NULL"), nullable=True, index=True)
    feature_data = Column(JSON)
    usage_count = Column(Integer, default=1)
    
    # Resource Consumption
    credits_consumed = Column(Integer, default=0)
    storage_consumed_mb = Column(Integer, default=0)
    
    # Status
    status = Column(Enum(FeatureUsageStatus), default=FeatureUsageStatus.USED)
    notes = Column(Text)
    
    # Timestamp
    used_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User")
    subscription = relationship("UserSubscription", back_populates="feature_usage")
    related_car = relationship("Car")
    
    def __repr__(self):
        return f"<SubscriptionFeatureUsage {self.id}: {self.feature_type}>"


class PromotionCode(Base):
    __tablename__ = "promotion_codes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Discount Details
    discount_type = Column(Enum(DiscountType), nullable=False)
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    
    # Applicable Plans
    applicable_plans = Column(JSON)
    
    # Usage Limits
    max_uses = Column(Integer, nullable=True, index=True)
    max_uses_per_user = Column(Integer, default=1)
    current_uses = Column(Integer, default=0, index=True)
    
    # Validity Period
    starts_at = Column(TIMESTAMP, nullable=False, index=True)
    expires_at = Column(TIMESTAMP, nullable=False, index=True)
    
    # Conditions
    minimum_subscription_months = Column(Integer, default=1)
    new_users_only = Column(Boolean, default=False)
    specific_user_ids = Column(JSON)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User")
    usages = relationship("PromotionCodeUsage", back_populates="promotion_code", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PromotionCode {self.id}: {self.code}>"


class PromotionCodeUsage(Base):
    __tablename__ = "promotion_code_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    promotion_code_id = Column(Integer, ForeignKey("promotion_codes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Usage Details
    discount_applied = Column(DECIMAL(10, 2), nullable=False)
    original_amount = Column(DECIMAL(10, 2), nullable=False)
    final_amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    
    # Timestamp
    used_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    promotion_code = relationship("PromotionCode", back_populates="usages")
    user = relationship("User")
    subscription = relationship("UserSubscription")
    
    def __repr__(self):
        return f"<PromotionCodeUsage {self.id}: Code {self.promotion_code_id}, User {self.user_id}>"