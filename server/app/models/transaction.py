from sqlalchemy import Column, Integer, String, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    FINANCING = "financing"
    TRADE_IN = "trade_in"
    INSTALLMENT = "installment"
    CHECK = "check"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    DEPOSIT_PAID = "deposit_paid"
    FINANCING_APPROVED = "financing_approved"
    DOCUMENTS_READY = "documents_ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"
    REFUNDED = "refunded"


class ChangeReason(str, enum.Enum):
    MANUAL = "manual"
    MARKET_ADJUSTMENT = "market_adjustment"
    PROMOTION = "promotion"
    NEGOTIATION = "negotiation"
    CURRENCY_UPDATE = "currency_update"
    ADMIN_CORRECTION = "admin_correction"


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="RESTRICT"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="SET NULL"), nullable=True)
    
    # Transaction Details
    agreed_price = Column(DECIMAL(12, 2), nullable=False)
    original_price = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    deposit_amount = Column(DECIMAL(12, 2))
    balance_amount = Column(DECIMAL(12, 2))
    
    # Payment Information
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    financing_bank = Column(String(100))
    down_payment = Column(DECIMAL(12, 2))
    loan_amount = Column(DECIMAL(12, 2))
    monthly_payment = Column(DECIMAL(12, 2))
    loan_term_months = Column(Integer)
    
    # Trade-in Information
    trade_in_vehicle_id = Column(Integer, ForeignKey("cars.id", ondelete="SET NULL"), nullable=True)
    trade_in_value = Column(DECIMAL(12, 2))
    
    # Transaction Status
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, index=True)
    
    # Important Dates
    agreement_date = Column(TIMESTAMP, nullable=True)
    deposit_date = Column(TIMESTAMP, nullable=True)
    completion_date = Column(TIMESTAMP, nullable=True, index=True)
    transfer_date = Column(TIMESTAMP, nullable=True)
    
    # Documentation
    contract_url = Column(String(500))
    receipt_url = Column(String(500))
    transfer_documents_url = Column(String(500))
    
    # Location of transaction
    meeting_location = Column(Text)
    transaction_city_id = Column(Integer, ForeignKey("ph_cities.id", ondelete="SET NULL"), nullable=True)
    
    # Notes
    seller_notes = Column(Text)
    buyer_notes = Column(Text)
    admin_notes = Column(Text)
    
    # Commission and fees
    platform_fee = Column(DECIMAL(12, 2), default=0)
    payment_processing_fee = Column(DECIMAL(12, 2), default=0)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    car = relationship("Car")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="sales")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="purchases")
    inquiry = relationship("Inquiry")
    trade_in_vehicle = relationship("Car", foreign_keys=[trade_in_vehicle_id])
    transaction_city = relationship("PhCity")
    
    def __repr__(self):
        return f"<Transaction {self.id}: Car {self.car_id}, Status {self.status}>"


class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    old_price = Column(DECIMAL(12, 2))
    new_price = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    price_change_percent = Column(DECIMAL(5, 2))
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    change_reason = Column(Enum(ChangeReason), default=ChangeReason.MANUAL, index=True)
    reason_notes = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    car = relationship("Car", back_populates="price_history")
    changer = relationship("User")
    
    def __repr__(self):
        return f"<PriceHistory {self.id}: Car {self.car_id}, {self.old_price} -> {self.new_price}>"