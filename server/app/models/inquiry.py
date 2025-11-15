from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class InquiryType(str, enum.Enum):
    GENERAL = "general"
    TEST_DRIVE = "test_drive"
    PRICE_NEGOTIATION = "price_negotiation"
    INSPECTION = "inspection"
    PURCHASE_INTENT = "purchase_intent"
    FINANCING = "financing"
    TRADE_IN = "trade_in"


class InquiryStatus(str, enum.Enum):
    NEW = "new"
    READ = "read"
    REPLIED = "replied"
    IN_NEGOTIATION = "in_negotiation"
    TEST_DRIVE_SCHEDULED = "test_drive_scheduled"
    CLOSED = "closed"
    CONVERTED = "converted"
    SPAM = "spam"


class ResponseType(str, enum.Enum):
    MESSAGE = "message"
    PRICE_COUNTER = "price_counter"
    SCHEDULE_TEST_DRIVE = "schedule_test_drive"
    SEND_DOCUMENTS = "send_documents"
    FINAL_OFFER = "final_offer"


class Inquiry(Base):
    __tablename__ = "inquiries"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    # FIXED: Changed buyer_id to SET NULL to allow guest inquiries (SQL schema uses SET NULL)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Basic Info
    subject = Column(String(255))
    message = Column(Text, nullable=False)
    buyer_name = Column(String(200))
    buyer_email = Column(String(255))
    buyer_phone = Column(String(20))
    
    # Inquiry Details
    inquiry_type = Column(Enum(InquiryType), default=InquiryType.GENERAL, index=True)
    offered_price = Column(DECIMAL(12, 2))
    test_drive_requested = Column(Boolean, default=False)
    inspection_requested = Column(Boolean, default=False)
    financing_needed = Column(Boolean, default=False)
    trade_in_vehicle = Column(Boolean, default=False)
    
    # Status
    status = Column(Enum(InquiryStatus), default=InquiryStatus.NEW, index=True)
    is_read = Column(Boolean, default=False)
    priority = Column(Enum("low", "medium", "high", "urgent"), default="medium")
    
    # Response tracking
    response_count = Column(Integer, default=0)
    last_response_at = Column(TIMESTAMP)
    last_response_by = Column(Integer, ForeignKey("users.id"))
    
    # Ratings
    buyer_rating = Column(DECIMAL(3, 2))
    seller_rating = Column(DECIMAL(3, 2))
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(TIMESTAMP)
    
    # Relationships
    car = relationship("Car", back_populates="inquiries")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="sent_inquiries")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="received_inquiries")
    responses = relationship("InquiryResponse", back_populates="inquiry", cascade="all, delete-orphan")
    attachments = relationship("InquiryAttachment", back_populates="inquiry", cascade="all, delete-orphan")


class InquiryResponse(Base):
    __tablename__ = "inquiry_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    # FIXED: Added is_from_seller from SQL schema
    is_from_seller = Column(Boolean, default=False)
    # NOTE: response_type, counter_offer_price, is_automated are NOT in SQL schema
    # Keeping them for backwards compatibility, but they won't persist to database
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    inquiry = relationship("Inquiry", back_populates="responses")


class InquiryAttachment(Base):
    __tablename__ = "inquiry_attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    # FIXED: Removed file_name - not in SQL schema
    file_type = Column(String(50))
    file_size = Column(Integer)
    uploaded_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    inquiry = relationship("Inquiry", back_populates="attachments")


class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="favorites")
    car = relationship("Car", back_populates="favorites")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Reporter
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Reported Entity (user or car)
    reported_user_id = Column(Integer, ForeignKey("users.id"), index=True)
    reported_car_id = Column(Integer, ForeignKey("cars.id"), index=True)
    
    # Report Details
    report_type = Column(
        Enum("spam", "fraud", "inappropriate", "scam", "fake_listing", "other", name="report_type"),
        nullable=False
    )
    description = Column(Text, nullable=False)
    
    # Status
    status = Column(
        Enum("pending", "investigating", "resolved", "dismissed", name="report_status"),
        default="pending",
        nullable=False,
        index=True
    )
    
    # Resolution
    resolution = Column(Text)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(TIMESTAMP)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], backref="reports_made")
    reported_user = relationship("User", foreign_keys=[reported_user_id], backref="reports_received")
    reported_car = relationship("Car", foreign_keys=[reported_car_id], backref="reports")
    resolver = relationship("User", foreign_keys=[resolved_by], backref="reports_resolved")