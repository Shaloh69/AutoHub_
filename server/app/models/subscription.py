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


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    plan_type = Column(Enum(PlanType), nullable=False, index=True)
    
    # Pricing
    monthly_price = Column(DECIMAL(10, 2), nullable=False)
    yearly_price = Column(DECIMAL(10, 2))
    currency = Column(String(3), default="PHP")
    
    # Limits
    max_active_listings = Column(Integer, nullable=False)
    max_featured_listings = Column(Integer, default=0)
    max_premium_listings = Column(Integer, default=0)
    max_images_per_listing = Column(Integer, default=10)
    storage_mb = Column(Integer, default=1000)
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
    
    # Relationships
    subscriptions = relationship("UserSubscription", back_populates="plan")


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    
    # Status
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, index=True)
    billing_cycle = Column(Enum("monthly", "yearly"), default="monthly")
    
    # Billing
    current_period_start = Column(TIMESTAMP, nullable=False)
    current_period_end = Column(TIMESTAMP, nullable=False)
    next_billing_date = Column(TIMESTAMP)
    auto_renew = Column(Boolean, default=True)
    
    # Timestamps
    subscribed_at = Column(TIMESTAMP, default=datetime.utcnow)
    cancelled_at = Column(TIMESTAMP)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    payments = relationship("SubscriptionPayment", back_populates="subscription")
    feature_usage = relationship("SubscriptionFeatureUsage", back_populates="subscription")


class SubscriptionPayment(Base):
    __tablename__ = "subscription_payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Payment Details
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="PHP")
    payment_method = Column(String(50))
    status = Column(Enum("pending", "completed", "failed", "refunded"), default="pending")
    
    # Provider Details
    provider = Column(String(50))
    provider_transaction_id = Column(String(255))
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    subscription = relationship("UserSubscription", back_populates="payments")


class SubscriptionUsage(Base):
    __tablename__ = "subscription_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=False)
    
    # Usage Metrics
    active_listings = Column(Integer, default=0)
    featured_listings = Column(Integer, default=0)
    premium_listings = Column(Integer, default=0)
    boost_credits_used = Column(Integer, default=0)
    storage_used_mb = Column(Integer, default=0)
    
    # Period
    period_start = Column(TIMESTAMP, nullable=False)
    period_end = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)


class SubscriptionFeatureUsage(Base):
    __tablename__ = "subscription_feature_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=False)
    feature_type = Column(String(50), nullable=False)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=True)
    credits_consumed = Column(Integer, default=1)
    used_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    subscription = relationship("UserSubscription", back_populates="feature_usage")


class PromotionCode(Base):
    __tablename__ = "promotion_codes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100))
    discount_type = Column(Enum("percentage", "fixed"), nullable=False)
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    valid_from = Column(TIMESTAMP)
    valid_until = Column(TIMESTAMP)
    max_uses = Column(Integer)
    times_used = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class PromotionCodeUsage(Base):
    __tablename__ = "promotion_code_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code_id = Column(Integer, ForeignKey("promotion_codes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"))
    used_at = Column(TIMESTAMP, default=datetime.utcnow)