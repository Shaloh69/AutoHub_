from sqlalchemy import Column, Integer, String, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class TransactionType(str, enum.Enum):
    """Transaction type enum - lowercase to match SQL schema exactly"""
    sale = "sale"
    reservation = "reservation"
    deposit = "deposit"


class TransactionStatus(str, enum.Enum):
    """Transaction status enum - lowercase to match SQL schema exactly"""
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    disputed = "disputed"
    # REMOVED: DEPOSIT_PAID, FINANCING_APPROVED, DOCUMENTS_READY (not in SQL)


class PaymentStatus(str, enum.Enum):
    """Payment status enum - lowercase to match SQL schema exactly"""
    pending = "pending"
    partial = "partial"
    completed = "completed"
    refunded = "refunded"


class Transaction(Base):
    """Transaction model - 100% aligned with SQL schema (lines 771-819)"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # FIXED: Changed ondelete from RESTRICT to CASCADE to match SQL schema
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="SET NULL"))

    # Transaction Details
    transaction_type = Column(Enum(TransactionType), default=TransactionType.sale)
    agreed_price = Column(DECIMAL(12, 2), nullable=False)
    currency_id = Column(Integer, ForeignKey("currencies.id"), default=1)
    deposit_amount = Column(DECIMAL(12, 2))
    final_amount = Column(DECIMAL(12, 2))

    # Payment Details
    payment_method = Column(Enum("cash", "bank_transfer", "check", "financing", "trade_in", "mixed"), default="cash")
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)

    # Trade-in
    has_trade_in = Column(Boolean, default=False)
    trade_in_car_id = Column(Integer, ForeignKey("cars.id", ondelete="SET NULL"))
    trade_in_value = Column(DECIMAL(12, 2))

    # Notes
    seller_notes = Column(Text)
    buyer_notes = Column(Text)
    admin_notes = Column(Text)

    # Status
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pending, nullable=False, index=True)

    # Timestamps
    confirmed_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    cancelled_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = relationship("User", foreign_keys=[seller_id], back_populates="sales")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="purchases")


class PriceHistory(Base):
    """Price history model - 100% aligned with SQL schema (lines 824-837)"""
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    old_price = Column(DECIMAL(12, 2), nullable=False)
    new_price = Column(DECIMAL(12, 2), nullable=False)
    change_percentage = Column(DECIMAL(5, 2))
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    reason = Column(String(255))
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)