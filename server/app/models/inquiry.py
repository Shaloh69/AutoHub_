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


class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ClosedReason(str, enum.Enum):
    RESOLVED = "resolved"
    NO_RESPONSE = "no_response"
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    CAR_SOLD = "car_sold"
    BUYER_CANCELLED = "buyer_cancelled"


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
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
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
    trade_in_vehicle = Column(Text)
    
    # Communication tracking
    status = Column(Enum(InquiryStatus), default=InquiryStatus.NEW, index=True)
    is_read = Column(Boolean, default=False)
    priority = Column(Enum(Priority), default=Priority.MEDIUM, index=True)
    
    # Response tracking
    response_count = Column(Integer, default=0)
    last_response_at = Column(TIMESTAMP, nullable=True)
    last_response_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Auto-close feature
    auto_close_at = Column(TIMESTAMP, nullable=True)
    closed_reason = Column(Enum(ClosedReason), nullable=True)
    
    # Rating after inquiry
    buyer_rating = Column(DECIMAL(3, 2), nullable=True)
    seller_rating = Column(DECIMAL(3, 2), nullable=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    car = relationship("Car", back_populates="inquiries")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="sent_inquiries")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="received_inquiries")
    last_responder = relationship("User", foreign_keys=[last_response_by])
    
    responses = relationship("InquiryResponse", back_populates="inquiry", cascade="all, delete-orphan")
    attachments = relationship("InquiryAttachment", back_populates="inquiry", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Inquiry {self.id}: Car {self.car_id}, Buyer {self.buyer_id}>"


class InquiryResponse(Base):
    __tablename__ = "inquiry_responses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    is_internal_note = Column(Boolean, default=False)
    is_automated = Column(Boolean, default=False)
    response_type = Column(Enum(ResponseType), default=ResponseType.MESSAGE, index=True)
    
    # For price negotiations
    counter_offer_price = Column(DECIMAL(12, 2))
    
    # For test drive scheduling
    suggested_datetime = Column(TIMESTAMP, nullable=True)
    meeting_location = Column(Text)
    
    # Message status
    is_read = Column(Boolean, default=False)
    read_at = Column(TIMESTAMP, nullable=True)
    
    # Timestamp
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    inquiry = relationship("Inquiry", back_populates="responses")
    user = relationship("User")
    attachments = relationship("InquiryAttachment", back_populates="response", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<InquiryResponse {self.id} for Inquiry {self.inquiry_id}>"


class InquiryAttachment(Base):
    __tablename__ = "inquiry_attachments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    response_id = Column(Integer, ForeignKey("inquiry_responses.id", ondelete="CASCADE"), nullable=True, index=True)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False, index=True)
    file_size = Column(Integer, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_image = Column(Boolean, default=False)
    thumbnail_url = Column(String(500))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    inquiry = relationship("Inquiry", back_populates="attachments")
    response = relationship("InquiryResponse", back_populates="attachments")
    uploader = relationship("User")
    
    def __repr__(self):
        return f"<InquiryAttachment {self.id}: {self.file_name}>"


class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="favorites")
    car = relationship("Car", back_populates="favorites")
    
    def __repr__(self):
        return f"<Favorite: User {self.user_id}, Car {self.car_id}>"