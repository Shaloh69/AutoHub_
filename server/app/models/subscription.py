"""
===========================================
FILE: app/models/subscription.py - FIXED VERSION
Path: server/app/models/subscription.py
FIX: Added missing 'user' relationship in UserSubscription model
PRESERVED: All original functionality
===========================================
"""
from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    plan_type = Column(String(50), default="standard")
    
    # Pricing
    monthly_price = Column(DECIMAL(10, 2), nullable=False)
    yearly_price = Column(DECIMAL(10, 2))
    currency = Column(String(3), default="PHP")
    
    # Limits
    max_active_listings = Column(Integer, default=5)
    max_featured_listings = Column(Integer, default=0)
    max_premium_listings = Column(Integer, default=0)
    max_images_per_listing = Column(Integer, default=10)
    storage_mb = Column(Integer, default=100)
    boost_credits_monthly = Column(Integer, default=0)
    
    # Features
    priority_ranking = Column(Integer, default=0)
    advanced_analytics = Column(Boolean, default=False)
    homepage_featured = Column(Boolean, default=False)
    verified_badge = Column(Boolean, default=False)
    priority_support = Column(Boolean, default=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_popular = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship("UserSubscription", back_populates="plan")
    payments = relationship("SubscriptionPayment", back_populates="plan")


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    
    # Subscription Details
    # FIXED: Changed to UPPERCASE to match SQL schema
    status = Column(
        Enum("ACTIVE", "CANCELLED", "EXPIRED", "SUSPENDED", "PENDING", name="subscription_status"),
        default="PENDING"
    )
    billing_cycle = Column(
        Enum("MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME", name="billing_cycle"),
        default="MONTHLY"
    )
    auto_renew = Column(Boolean, default=True)
    
    # Dates
    subscribed_at = Column(TIMESTAMP, default=datetime.utcnow)
    current_period_start = Column(TIMESTAMP)
    current_period_end = Column(TIMESTAMP)
    next_billing_date = Column(TIMESTAMP)
    cancelled_at = Column(TIMESTAMP)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # ✅ FIXED: Added missing 'user' relationship with explicit foreign_keys
    user = relationship("User", foreign_keys=[user_id], back_populates="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    payments = relationship("SubscriptionPayment", back_populates="subscription")
    usage = relationship("SubscriptionUsage", back_populates="subscription")
    feature_usage = relationship("SubscriptionFeatureUsage", back_populates="subscription")


class SubscriptionPayment(Base):
    __tablename__ = "subscription_payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    
    # Payment Details
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="PHP")
    payment_method = Column(String(50))
    status = Column(Enum("pending", "completed", "failed", "refunded"), default="pending")
    
    # Provider Details (for credit card, GCash, etc.)
    provider = Column(String(50))
    provider_transaction_id = Column(String(255))
    transaction_id = Column(String(255))  # Legacy field
    
    # NEW: QR Code Payment Fields
    reference_number = Column(String(100), index=True)  # User-submitted reference number
    qr_code_shown = Column(Boolean, default=False)  # Track if QR was shown
    submitted_at = Column(TIMESTAMP)  # When user submitted reference number
    
    # NEW: Admin Verification Fields
    admin_verified_by = Column(Integer, ForeignKey("users.id"), index=True)
    admin_verified_at = Column(TIMESTAMP)
    admin_notes = Column(Text)
    rejection_reason = Column(Text)
    
    # Billing Period
    billing_period_start = Column(Date)
    billing_period_end = Column(Date)
    paid_at = Column(TIMESTAMP)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    subscription = relationship("UserSubscription", back_populates="payments")
    plan = relationship("SubscriptionPlan", back_populates="payments")
    verified_by_admin = relationship("User", foreign_keys=[admin_verified_by])


class SubscriptionUsage(Base):
    __tablename__ = "subscription_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=False)

    # FIXED: Usage Metrics - aligned with SQL schema
    current_listings = Column(Integer, default=0)  # was 'active_listings'
    current_featured = Column(Integer, default=0)  # was 'featured_listings'
    total_listings_created = Column(Integer, default=0)  # NEW - from SQL

    # FIXED: Reset tracking - aligned with SQL schema
    reset_at = Column(TIMESTAMP)  # NEW - from SQL
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscription = relationship("UserSubscription", back_populates="usage")


class SubscriptionFeatureUsage(Base):
    __tablename__ = "subscription_feature_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Feature tracking
    feature_name = Column(String(100), nullable=False)
    usage_count = Column(Integer, default=0)
    limit_count = Column(Integer)
    last_used_at = Column(TIMESTAMP)
    reset_at = Column(TIMESTAMP)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscription = relationship("UserSubscription", back_populates="feature_usage")


class PromotionCode(Base):
    __tablename__ = "promotion_codes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text)
    
    # Discount Details
    # FIXED: Added 'free_feature' to match SQL schema
    discount_type = Column(Enum("percentage", "fixed_amount", "free_feature"), nullable=False)
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    
    # Validity
    valid_from = Column(TIMESTAMP)
    valid_until = Column(TIMESTAMP)
    max_uses = Column(Integer)
    max_uses_per_user = Column(Integer, default=1)
    current_uses = Column(Integer, default=0)
    
    # Restrictions
    min_purchase_amount = Column(DECIMAL(10, 2))
    applicable_plans = Column(String(255))  # Comma-separated plan IDs
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    usages = relationship("PromotionCodeUsage", back_populates="promo_code")


class PromotionCodeUsage(Base):
    __tablename__ = "promotion_code_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    promo_code_id = Column(Integer, ForeignKey("promotion_codes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"))
    
    # Usage Details
    discount_applied = Column(DECIMAL(10, 2))
    original_amount = Column(DECIMAL(10, 2))
    final_amount = Column(DECIMAL(10, 2))
    
    # Timestamp
    used_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    promo_code = relationship("PromotionCode", back_populates="usages")


# NEW: Payment Settings Model
class PaymentSetting(Base):
    __tablename__ = "payment_settings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(100), nullable=False, unique=True, index=True)
    setting_value = Column(Text, nullable=False)
    setting_type = Column(
        Enum("string", "text", "image", "number", "boolean"),
        default="string"
    )
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Audit
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


# NEW: Payment Verification Logs Model
class PaymentVerificationLog(Base):
    __tablename__ = "payment_verification_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_id = Column(Integer, ForeignKey("subscription_payments.id"), nullable=False, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Action Details
    action = Column(
        Enum("verified", "rejected", "requested_info"),
        nullable=False
    )
    previous_status = Column(Enum("pending", "completed", "failed", "refunded"))
    new_status = Column(Enum("pending", "completed", "failed", "refunded"))
    notes = Column(Text)
    
    # Audit
    ip_address = Column(String(45))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    payment = relationship("SubscriptionPayment", foreign_keys=[payment_id])
    admin = relationship("User", foreign_keys=[admin_id])