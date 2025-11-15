from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class TransactionCreate(BaseModel):
    """Create transaction - Complete with all fields"""
    car_id: int
    agreed_price: Decimal = Field(..., gt=0)
    payment_method: str = Field(..., pattern="^(cash|bank_transfer|financing|installment)$")
    deposit_amount: Optional[Decimal] = Field(None, ge=0)
    financing_provider: Optional[str] = Field(None, max_length=200)
    down_payment: Optional[Decimal] = Field(None, ge=0)
    monthly_installment: Optional[Decimal] = Field(None, ge=0)
    installment_months: Optional[int] = Field(None, ge=1, le=60)
    trade_in_accepted: bool = False
    trade_in_value: Optional[Decimal] = Field(None, ge=0)
    trade_in_vehicle_details: Optional[str] = Field(None, max_length=1000)


class TransactionUpdate(BaseModel):
    """Update transaction - Complete"""
    status: Optional[str] = Field(None, pattern="^(pending|confirmed|completed|cancelled|disputed)$")  # Fixed: Match SQL schema exactly
    documents_verified: Optional[bool] = None
    payment_verified: Optional[bool] = None
    transfer_completed: Optional[bool] = None


class TransactionResponse(BaseModel):
    """Transaction response - Complete"""
    id: int
    car_id: int
    seller_id: int
    buyer_id: int
    inquiry_id: Optional[int] = None
    agreed_price: Decimal
    original_price: Decimal
    currency: str
    payment_method: str
    status: str
    initiated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TransactionDetailResponse(TransactionResponse):
    """Detailed transaction response - Complete with all fields"""
    deposit_amount: Optional[Decimal] = None
    balance_amount: Optional[Decimal] = None
    financing_provider: Optional[str] = None
    down_payment: Optional[Decimal] = None
    monthly_installment: Optional[Decimal] = None
    installment_months: Optional[int] = None
    trade_in_accepted: bool = False
    trade_in_value: Optional[Decimal] = None
    trade_in_vehicle_details: Optional[str] = None
    documents_verified: bool = False
    payment_verified: bool = False
    transfer_completed: bool = False
    deposit_paid_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    car: Optional[dict] = None
    seller: Optional[dict] = None
    buyer: Optional[dict] = None