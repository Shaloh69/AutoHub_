from sqlalchemy import Column, Integer, String, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class TransactionType(str, enum.Enum):
    SALE = "sale"
    RESERVATION = "reservation"
    DEPOSIT = "deposit"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DEPOSIT_PAID = "deposit_paid"
    FINANCING_APPROVED = "financing_approved"
    DOCUMENTS_READY = "documents_ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETED = "completed"
    REFUNDED = "refunded"


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="RESTRICT"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="SET NULL"))
    
    # Transaction Details
    transaction_type = Column(Enum(TransactionType), default=TransactionType.SALE)
    agreed_price = Column(DECIMAL(12, 2), nullable=False)
    original_price = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), default="PHP")
    currency_id = Column(Integer, ForeignKey("currencies.id"), default=1)
    deposit_amount = Column(DECIMAL(12, 2))
    final_amount = Column(DECIMAL(12, 2))
    balance_amount = Column(DECIMAL(12, 2))
    
    # Payment Details
    payment_method = Column(Enum("cash", "bank_transfer", "check", "financing", "trade_in", "mixed"), default="cash")
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    financing_provider = Column(String(200))
    down_payment = Column(DECIMAL(12, 2))
    monthly_installment = Column(DECIMAL(12, 2))
    installment_months = Column(Integer)
    
    # Trade-in
    has_trade_in = Column(Boolean, default=False)
    trade_in_accepted = Column(Boolean, default=False)
    trade_in_car_id = Column(Integer, ForeignKey("cars.id", ondelete="SET NULL"))
    trade_in_value = Column(DECIMAL(12, 2))
    trade_in_vehicle_details = Column(Text)

    # Notes
    seller_notes = Column(Text)
    buyer_notes = Column(Text)
    admin_notes = Column(Text)

    # Status & Progress
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False, index=True)
    documents_verified = Column(Boolean, default=False)
    payment_verified = Column(Boolean, default=False)
    transfer_completed = Column(Boolean, default=False)
    
    # Timestamps
    initiated_at = Column(TIMESTAMP, default=datetime.utcnow)
    deposit_paid_at = Column(TIMESTAMP)
    confirmed_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    cancelled_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = relationship("User", foreign_keys=[seller_id], back_populates="sales")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="purchases")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    old_price = Column(DECIMAL(12, 2), nullable=False)
    new_price = Column(DECIMAL(12, 2), nullable=False)
    change_percentage = Column(DECIMAL(5, 2))  # SQL uses this name
    price_change_percent = Column(DECIMAL(6, 2))  # Keep for compatibility
    reason = Column(String(255))  # SQL uses VARCHAR
    change_reason = Column(Enum("manual", "market_adjustment", "promotion", "negotiation"), default="manual")
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    changed_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)