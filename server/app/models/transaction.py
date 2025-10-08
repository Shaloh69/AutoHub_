from sqlalchemy import Column, Integer, String, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    DEPOSIT_PAID = "deposit_paid"
    FINANCING_APPROVED = "financing_approved"
    DOCUMENTS_READY = "documents_ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="RESTRICT"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="SET NULL"))
    
    # Transaction Details
    agreed_price = Column(DECIMAL(12, 2), nullable=False)
    original_price = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), default="PHP")
    deposit_amount = Column(DECIMAL(12, 2))
    balance_amount = Column(DECIMAL(12, 2))
    
    # Payment Details
    payment_method = Column(Enum("cash", "bank_transfer", "financing", "installment"), default="cash")
    financing_provider = Column(String(200))
    down_payment = Column(DECIMAL(12, 2))
    monthly_installment = Column(DECIMAL(12, 2))
    installment_months = Column(Integer)
    
    # Trade-in
    trade_in_accepted = Column(Boolean, default=False)
    trade_in_value = Column(DECIMAL(12, 2))
    trade_in_vehicle_details = Column(Text)
    
    # Status & Progress
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False, index=True)
    documents_verified = Column(Boolean, default=False)
    payment_verified = Column(Boolean, default=False)
    transfer_completed = Column(Boolean, default=False)
    
    # Timestamps
    initiated_at = Column(TIMESTAMP, default=datetime.utcnow)
    deposit_paid_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    cancelled_at = Column(TIMESTAMP)
    
    # Relationships
    seller = relationship("User", foreign_keys=[seller_id], back_populates="sales")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="purchases")


class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    old_price = Column(DECIMAL(12, 2))
    new_price = Column(DECIMAL(12, 2), nullable=False)
    price_change_percent = Column(DECIMAL(6, 2))
    change_reason = Column(Enum("manual", "market_adjustment", "promotion", "negotiation"), default="manual")
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)