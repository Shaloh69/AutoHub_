from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class ActionType(str, enum.Enum):
    VIEW_CAR = "view_car"
    SEARCH = "search"
    CONTACT_SELLER = "contact_seller"
    FAVORITE = "favorite"
    UNFAVORITE = "unfavorite"
    SHARE = "share"
    REPORT = "report"
    SAVE_SEARCH = "save_search"
    LOGIN = "login"
    REGISTER = "register"
    UPLOAD_CAR = "upload_car"


class TargetType(str, enum.Enum):
    CAR = "car"
    USER = "user"
    SEARCH = "search"
    CATEGORY = "category"
    BRAND = "brand"
    SYSTEM = "system"


class DeviceType(str, enum.Enum):
    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"


class NotificationType(str, enum.Enum):
    CAR_APPROVED = "car_approved"
    CAR_REJECTED = "car_rejected"
    CAR_NEEDS_REVISION = "car_needs_revision"
    NEW_INQUIRY = "new_inquiry"
    INQUIRY_RESPONSE = "inquiry_response"
    CAR_SOLD = "car_sold"
    NEW_RATING = "new_rating"
    PRICE_DROP_ALERT = "price_drop_alert"
    SAVED_SEARCH_MATCH = "saved_search_match"
    FEATURED_CAR_EXPIRING = "featured_car_expiring"
    CAR_EXPIRING = "car_expiring"
    PAYMENT_RECEIVED = "payment_received"
    DOCUMENT_REQUIRED = "document_required"
    TEST_DRIVE_SCHEDULED = "test_drive_scheduled"
    SYSTEM_MAINTENANCE = "system_maintenance"
    ACCOUNT_VERIFICATION = "account_verification"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    PROMOTION = "promotion"


class NotificationPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class UserAction(Base):
    __tablename__ = "user_actions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(255), index=True)
    action_type = Column(Enum(ActionType), nullable=False, index=True)
    target_type = Column(Enum(TargetType), nullable=False, index=True)
    target_id = Column(Integer, index=True)
    metadata = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    referrer = Column(String(500))
    page_url = Column(String(500))
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="actions")
    
    def __repr__(self):
        return f"<UserAction {self.id}: {self.action_type} on {self.target_type} {self.target_id}>"


class CarView(Base):
    __tablename__ = "car_views"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(255), index=True)
    ip_address = Column(String(45), index=True)
    user_agent = Column(Text)
    referrer = Column(String(500))
    page_url = Column(String(500))
    view_duration = Column(Integer, default=0)  # seconds
    is_unique_view = Column(Boolean, default=True, index=True)
    device_type = Column(Enum(DeviceType), default=DeviceType.DESKTOP)
    browser = Column(String(100))
    os = Column(String(100))
    city_id = Column(Integer, ForeignKey("ph_cities.id", ondelete="SET NULL"), nullable=True)
    viewed_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    car = relationship("Car", back_populates="views")
    user = relationship("User")
    city = relationship("PhCity")
    
    def __repr__(self):
        return f"<CarView {self.id}: Car {self.car_id} by {self.user_id or 'Anonymous'}>"


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    action_text = Column(String(100))
    action_url = Column(String(500))
    
    # Targeting
    is_read = Column(Boolean, default=False, index=True)
    is_push_sent = Column(Boolean, default=False)
    is_email_sent = Column(Boolean, default=False)
    is_sms_sent = Column(Boolean, default=False)
    
    # Related objects
    related_car_id = Column(Integer, ForeignKey("cars.id", ondelete="SET NULL"), nullable=True)
    related_inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="SET NULL"), nullable=True)
    related_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    related_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Scheduling
    send_at = Column(TIMESTAMP, nullable=True, index=True)
    expires_at = Column(TIMESTAMP, nullable=True)
    
    # Priority and grouping
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM, index=True)
    notification_group = Column(String(100))
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    read_at = Column(TIMESTAMP, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    related_car = relationship("Car", foreign_keys=[related_car_id])
    related_inquiry = relationship("Inquiry", foreign_keys=[related_inquiry_id])
    related_transaction = relationship("Transaction", foreign_keys=[related_transaction_id])
    related_user = relationship("User", foreign_keys=[related_user_id])
    
    def __repr__(self):
        return f"<Notification {self.id}: {self.type} for User {self.user_id}>"