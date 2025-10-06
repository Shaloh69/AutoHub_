from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum
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


class User(Base):
    __tablename__ = "users"
    
    # Primary Key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.BUYER, index=True)
    profile_image = Column(String(500))
    
    # Philippines Address
    address = Column(Text)
    city_id = Column(Integer, ForeignKey("ph_cities.id", ondelete="SET NULL"))
    province_id = Column(Integer, ForeignKey("ph_provinces.id", ondelete="SET NULL"))
    region_id = Column(Integer, ForeignKey("ph_regions.id", ondelete="SET NULL"))
    postal_code = Column(String(10))
    barangay = Column(String(100))
    
    # Business Information (for dealers)
    business_name = Column(String(200))
    business_permit_number = Column(String(100))
    tin_number = Column(String(20))
    dealer_license_number = Column(String(100))
    
    # Verification Status
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    identity_verified = Column(Boolean, default=False)
    business_verified = Column(Boolean, default=False)
    
    # Verification Documents
    valid_id_front_url = Column(String(500))
    valid_id_back_url = Column(String(500))
    selfie_with_id_url = Column(String(500))
    business_permit_url = Column(String(500))
    
    # Rating Statistics
    average_rating = Column(DECIMAL(3, 2), default=0.00, index=True)
    total_ratings = Column(Integer, default=0)
    total_sales = Column(Integer, default=0)
    total_purchases = Column(Integer, default=0)
    
    # Account Status
    is_active = Column(Boolean, default=True, index=True)
    is_banned = Column(Boolean, default=False, index=True)
    ban_reason = Column(Text)
    ban_expires_at = Column(TIMESTAMP, nullable=True)
    
    # Fraud Prevention
    fraud_score = Column(DECIMAL(3, 2), default=0.00, index=True)
    warning_count = Column(Integer, default=0)
    last_warning_at = Column(TIMESTAMP, nullable=True)
    
    # Preferences
    preferred_currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    
    # Tracking
    last_login_at = Column(TIMESTAMP, nullable=True, index=True)
    last_login_ip = Column(String(45))
    login_count = Column(Integer, default=0)
    
    # Subscription fields
    current_subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="SET NULL"), nullable=True)
    subscription_status = Column(
        Enum("none", "active", "cancelled", "expired", "trial", name="subscription_status_enum"),
        default="none",
        index=True
    )
    subscription_expires_at = Column(TIMESTAMP, nullable=True, index=True)
    total_subscription_payments = Column(DECIMAL(12, 2), default=0.00)
    subscription_started_at = Column(TIMESTAMP, nullable=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    current_subscription = relationship("UserSubscription", foreign_keys=[current_subscription_id], uselist=False)
    
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