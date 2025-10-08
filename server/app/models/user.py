from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    BUYER = "buyer"
    SELLER = "seller"
    DEALER = "dealer"
    ADMIN = "admin"
    MODERATOR = "moderator"


class VerificationLevel(str, enum.Enum):
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
    role = Column(Enum(UserRole), default=UserRole.BUYER, nullable=False, index=True)
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), index=True)
    date_of_birth = Column(Date)
    gender = Column(Enum("male", "female", "other", "prefer_not_to_say"))
    
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
    business_phone = Column(String(20))
    business_email = Column(String(255))
    business_website = Column(String(255))
    
    # Verification Status
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    identity_verified = Column(Boolean, default=False)
    business_verified = Column(Boolean, default=False)
    verification_level = Column(Enum(VerificationLevel), default=VerificationLevel.NONE)
    verified_at = Column(TIMESTAMP)
    
    # Verification Documents
    id_type = Column(Enum("drivers_license", "passport", "national_id", "voters_id"))
    id_number = Column(String(50))
    id_expiry_date = Column(Date)
    id_front_image = Column(String(500))
    id_back_image = Column(String(500))
    selfie_image = Column(String(500))
    
    # Preferences
    preferred_currency = Column(Integer, ForeignKey("currencies.id"), default=1)
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="Asia/Manila")
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    
    # Rating & Trust
    average_rating = Column(DECIMAL(3, 2), default=0.00)
    total_ratings = Column(Integer, default=0)
    positive_feedback = Column(Integer, default=0)
    negative_feedback = Column(Integer, default=0)
    response_rate = Column(DECIMAL(5, 2), default=0.00)
    response_time_hours = Column(Integer)
    total_sales = Column(Integer, default=0)
    total_purchases = Column(Integer, default=0)
    
    # Fraud Detection
    fraud_score = Column(Integer, default=0)
    warnings_count = Column(Integer, default=0)
    last_warning_at = Column(TIMESTAMP)
    warning_reasons = Column(Text)
    
    # Account Status
    is_active = Column(Boolean, default=True, index=True)
    is_banned = Column(Boolean, default=False, index=True)
    ban_reason = Column(Text)
    banned_at = Column(TIMESTAMP)
    banned_until = Column(TIMESTAMP)
    
    # Subscription
    current_subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"))
    subscription_status = Column(Enum("free", "trial", "active", "cancelled", "expired"), default="free")
    subscription_expires_at = Column(TIMESTAMP)
    
    # Statistics
    total_views = Column(Integer, default=0)
    total_listings = Column(Integer, default=0)
    active_listings = Column(Integer, default=0)
    sold_listings = Column(Integer, default=0)
    
    # Security
    last_login_at = Column(TIMESTAMP)
    last_login_ip = Column(String(45))
    login_attempts = Column(Integer, default=0)
    locked_until = Column(TIMESTAMP)
    password_changed_at = Column(TIMESTAMP)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(100))
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(TIMESTAMP)
    
    # Relationships
    city = relationship("PhCity", foreign_keys=[city_id], backref="users")
    province = relationship("PhProvince", foreign_keys=[province_id], backref="users")
    region = relationship("PhRegion", foreign_keys=[region_id], backref="users")
    currency = relationship("Currency", foreign_keys=[preferred_currency], backref="users")
    
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
    notifications = relationship("Notification", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.id}: {self.email}>"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_verified(self):
        return self.email_verified and self.phone_verified
    
    @property
    def is_dealer_verified(self):
        return self.role == UserRole.DEALER and self.business_verified
    
    @property
    def can_list_cars(self):
        return self.is_active and not self.is_banned and self.is_verified
