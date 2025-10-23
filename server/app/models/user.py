"""
===========================================
FILE: app/models/user.py
Path: car_marketplace_ph/app/models/user.py
COMPLETE FIXED VERSION - Enum properly configured
===========================================
"""
from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    """User role enum - values are lowercase to match database"""
    BUYER = "buyer"
    SELLER = "seller"
    DEALER = "dealer"
    ADMIN = "admin"
    MODERATOR = "moderator"


class VerificationLevel(str, enum.Enum):
    """Verification level enum"""
    NONE = "none"
    EMAIL = "email"
    PHONE = "phone"
    IDENTITY = "identity"
    BUSINESS = "business"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    # CRITICAL FIX: Use native_enum=False to store enum values as strings
    role = Column(
        SQLEnum(UserRole, native_enum=False, length=20),
        default=UserRole.BUYER,
        nullable=False,
        index=True
    )
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), index=True)
    date_of_birth = Column(Date)
    gender = Column(SQLEnum("male", "female", "other", "prefer_not_to_say", native_enum=False, length=20))
    
    # Profile
    profile_image = Column(String(500))
    bio = Column(Text)
    
    # Location
    city_id = Column(Integer, ForeignKey("ph_cities.id"), nullable=True, index=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=True, index=True)
    region_id = Column(Integer, ForeignKey("ph_regions.id"), nullable=True, index=True)
    address = Column(Text)
    postal_code = Column(String(10))
    barangay = Column(String(100))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    
    # Business Information (for dealers)
    business_name = Column(String(200))
    business_permit_number = Column(String(100))
    tin_number = Column(String(20))
    dti_registration = Column(String(100))
    business_address = Column(Text)
    # NOTE: showroom_address removed - not in database schema
    
    # Verification
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    identity_verified = Column(Boolean, default=False)
    business_verified = Column(Boolean, default=False)
    verification_level = Column(
        SQLEnum(VerificationLevel, native_enum=False, length=20),
        default=VerificationLevel.NONE
    )
    verified_at = Column(TIMESTAMP)
    
    # Identity Documents
    id_card_type = Column(String(50))
    id_card_number = Column(String(100))
    id_card_image_front = Column(String(500))
    id_card_image_back = Column(String(500))
    selfie_verification_image = Column(String(500))
    
    # Statistics
    average_rating = Column(DECIMAL(3, 2), default=0.00)
    total_ratings = Column(Integer, default=0)
    total_sales = Column(Integer, default=0)
    total_purchases = Column(Integer, default=0)
    total_views = Column(Integer, default=0)
    total_listings = Column(Integer, default=0)
    active_listings = Column(Integer, default=0)
    sold_listings = Column(Integer, default=0)
    
    # Account Status
    is_active = Column(Boolean, default=True, index=True)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(Text)
    banned_at = Column(TIMESTAMP)
    banned_by = Column(Integer, ForeignKey("users.id"))
    
    # Subscription
    current_subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"))
    subscription_status = Column(String(50))
    subscription_expires_at = Column(TIMESTAMP)
    
    # Security
    last_login_at = Column(TIMESTAMP)
    last_login_ip = Column(String(45))
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(TIMESTAMP)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(100))
    
    # Preferences
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="Asia/Manila")
    currency_preference = Column(String(3), default="PHP")
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    push_notifications = Column(Boolean, default=True)
    marketing_emails = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(TIMESTAMP)
    
    # Relationships
    city = relationship("PhCity", foreign_keys=[city_id])
    province = relationship("PhProvince", foreign_keys=[province_id])
    region = relationship("PhRegion", foreign_keys=[region_id])
    
    # FIX: Add missing current_subscription relationship
    current_subscription = relationship(
        "UserSubscription",
        foreign_keys=[current_subscription_id],
        post_update=True,  # Avoid circular dependency
        uselist=False
    )
    
    # Car relationships
    cars = relationship("Car", foreign_keys="Car.seller_id", back_populates="seller")
    
    # Inquiry relationships
    sent_inquiries = relationship("Inquiry", foreign_keys="Inquiry.buyer_id", back_populates="buyer")
    received_inquiries = relationship("Inquiry", foreign_keys="Inquiry.seller_id", back_populates="seller")
    
    # Transaction relationships
    sales = relationship("Transaction", foreign_keys="Transaction.seller_id", back_populates="seller")
    purchases = relationship("Transaction", foreign_keys="Transaction.buyer_id", back_populates="buyer")
    
    # Subscription relationships
    subscriptions = relationship("UserSubscription", foreign_keys="UserSubscription.user_id", back_populates="user")
    
    # Analytics
    actions = relationship("UserAction", back_populates="user")
    notifications = relationship("Notification", back_populates="user")  # ← FIXED
    favorites = relationship("Favorite", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.id}: {self.email}>"
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_verified(self):
        """Check if user has email and phone verified"""
        return self.email_verified and self.phone_verified
    
    @property
    def is_dealer_verified(self):
        """Check if user is a verified dealer"""
        return self.role == UserRole.DEALER and self.business_verified
    
    @property
    def can_list_cars(self):
        """Check if user can list cars"""
        return self.is_active and not self.is_banned and self.is_verified # type: ignore