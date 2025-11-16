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
    """Subscription plan model - 100% aligned with SQL schema (lines 842-876)"""
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text)

    # Pricing - FIXED: Match SQL schema exactly
    price = Column(DECIMAL(10, 2), nullable=False)  # Not monthly_price/yearly_price
    currency_id = Column(Integer, ForeignKey("currencies.id"), default=1)
    billing_cycle = Column(Enum("MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"), default="MONTHLY")

    # Limits - FIXED: Match SQL column names exactly
    max_listings = Column(Integer, default=5)  # Not max_active_listings
    max_photos_per_listing = Column(Integer, default=10)  # Not max_images_per_listing
    max_featured_listings = Column(Integer, default=0)

    # Features - FIXED: Match SQL schema exactly
    can_add_video = Column(Boolean, default=False)
    can_add_virtual_tour = Column(Boolean, default=False)
    priority_support = Column(Boolean, default=False)
    advanced_analytics = Column(Boolean, default=False)
    featured_badge = Column(Boolean, default=False)

    # Status
    is_popular = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)

    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship("UserSubscription", back_populates="plan")
    payments = relationship("SubscriptionPayment", back_populates="plan")


class UserSubscription(Base):
    """User subscription model - 100% aligned with SQL schema (lines 888-920)"""
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)

    # Subscription Details
    status = Column(
        Enum("ACTIVE", "CANCELLED", "EXPIRED", "SUSPENDED", "PENDING", name="subscription_status"),
        default="ACTIVE",
        index=True
    )
    billing_cycle = Column(
        Enum("MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME", name="billing_cycle"),
        default="MONTHLY",
        index=True
    )
    auto_renew = Column(Boolean, default=True)

    # Dates - FIXED: Added missing columns from SQL schema
    subscribed_at = Column(TIMESTAMP, default=datetime.utcnow)
    current_period_start = Column(TIMESTAMP)
    current_period_end = Column(TIMESTAMP)
    next_billing_date = Column(TIMESTAMP, index=True)
    started_at = Column(TIMESTAMP, default=datetime.utcnow)
    expires_at = Column(TIMESTAMP)
    cancelled_at = Column(TIMESTAMP)

    # Legacy billing fields (kept for compatibility)
    last_billing_at = Column(TIMESTAMP)
    next_billing_at = Column(TIMESTAMP)

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
    """Subscription payment model - 100% aligned with SQL schema (lines 925-954)"""
    __tablename__ = "subscription_payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)

    # Payment Details
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency_id = Column(Integer, ForeignKey("currencies.id"), default=1)  # FIXED: Use FK not string
    payment_method = Column(String(50))
    transaction_id = Column(String(255))
    status = Column(Enum("PENDING", "COMPLETED", "FAILED", "REFUNDED"), default="PENDING", index=True)

    # QR Code Payment Fields (from SQL migration)
    reference_number = Column(String(100), index=True)
    qr_code_shown = Column(Boolean, default=False)
    submitted_at = Column(TIMESTAMP)

    # Admin Verification Fields (from SQL migration)
    admin_verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
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
    """Subscription feature usage model - 100% aligned with SQL schema (lines 983-995)"""
    __tablename__ = "subscription_feature_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False)
    feature_name = Column(String(100), nullable=False, index=True)
    usage_count = Column(Integer, default=0)
    last_used_at = Column(TIMESTAMP)
    
    # Relationships
    subscription = relationship("UserSubscription", back_populates="feature_usage")


class PromotionCode(Base):
    """Promotion code model - 100% aligned with SQL schema (lines 1000-1015)"""
    __tablename__ = "promotion_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text)
    discount_type = Column(Enum("PERCENTAGE", "FIXED_AMOUNT", "FREE_FEATURE"), default="PERCENTAGE")
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    max_uses = Column(Integer)
    current_uses = Column(Integer, default=0)
    valid_from = Column(TIMESTAMP)
    valid_until = Column(TIMESTAMP)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    usages = relationship("PromotionCodeUsage", back_populates="promo_code")


class PromotionCodeUsage(Base):
    """Promotion code usage model - 100% aligned with SQL schema (lines 1020-1034)"""
    __tablename__ = "promotion_code_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code_id = Column(Integer, ForeignKey("promotion_codes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"))
    discount_amount = Column(DECIMAL(10, 2))  # FIXED: Was discount_applied
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
        Enum("STRING", "TEXT", "IMAGE", "NUMBER", "BOOLEAN"),
        default="STRING"
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
        Enum("VERIFIED", "REJECTED", "REQUESTED_INFO"),
        nullable=False
    )
    previous_status = Column(Enum("PENDING", "COMPLETED", "FAILED", "REFUNDED"))
    new_status = Column(Enum("PENDING", "COMPLETED", "FAILED", "REFUNDED"))
    notes = Column(Text)
    
    # Audit
    ip_address = Column(String(45))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    payment = relationship("SubscriptionPayment", foreign_keys=[payment_id])
    admin = relationship("User", foreign_keys=[admin_id])