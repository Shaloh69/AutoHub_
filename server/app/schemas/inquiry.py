from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class InquiryCreate(BaseModel):
    """Create inquiry schema - Complete with all fields"""
    car_id: int
    subject: Optional[str] = Field(None, max_length=255)
    message: str = Field(..., min_length=10, max_length=2000)
    buyer_name: Optional[str] = Field(None, max_length=200)
    buyer_email: Optional[EmailStr] = None
    buyer_phone: Optional[str] = Field(None, max_length=20)
    inquiry_type: Optional[str] = Field("GENERAL", pattern="^(GENERAL|TEST_DRIVE|PRICE_NEGOTIATION|INSPECTION|PURCHASE_INTENT|FINANCING|TRADE_IN)$")
    offered_price: Optional[Decimal] = None
    test_drive_requested: bool = False
    inspection_requested: bool = False
    financing_needed: bool = False
    trade_in_vehicle: bool = False


class InquiryUpdate(BaseModel):
    """Update inquiry schema"""
    status: Optional[str] = Field(None, pattern="^(NEW|READ|REPLIED|IN_NEGOTIATION|TEST_DRIVE_SCHEDULED|CLOSED|CONVERTED|SPAM)$")
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH|URGENT)$")


class InquiryRating(BaseModel):
    """Rate inquiry interaction"""
    rating: Decimal = Field(..., ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=500)


class InquiryResponseCreate(BaseModel):
    """Create inquiry response - Complete"""
    message: str = Field(..., min_length=1, max_length=2000)
    response_type: Optional[str] = Field("MESSAGE", pattern="^(MESSAGE|PRICE_COUNTER|SCHEDULE_TEST_DRIVE|SEND_DOCUMENTS|FINAL_OFFER)$")
    counter_offer_price: Optional[Decimal] = None


class InquiryResponseResponse(BaseModel):
    """Inquiry response model - Complete"""
    id: int
    inquiry_id: int
    user_id: int
    message: str
    response_type: str
    counter_offer_price: Optional[Decimal] = None
    is_automated: bool = False
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class InquiryResponse(BaseModel):
    """Inquiry response model - Complete with all fields"""
    id: int
    car_id: int
    buyer_id: Optional[int] = None
    seller_id: int
    subject: Optional[str] = None
    message: str
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    buyer_phone: Optional[str] = None
    inquiry_type: str
    offered_price: Optional[Decimal] = None
    test_drive_requested: bool = False
    inspection_requested: bool = False
    financing_needed: bool = False
    trade_in_vehicle: bool = False
    status: str
    is_read: bool
    priority: str
    response_count: int = 0
    last_response_at: Optional[datetime] = None
    buyer_rating: Optional[Decimal] = None
    seller_rating: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class InquiryDetailResponse(InquiryResponse):
    """Detailed inquiry with responses - Complete"""
    responses: List[InquiryResponseResponse] = []
    car: Optional[dict] = None
    buyer: Optional[dict] = None
    seller: Optional[dict] = None


class FavoriteResponse(BaseModel):
    """Favorite response - Complete"""
    id: int
    user_id: int
    car_id: int
    notes: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    """Notification response - Complete"""
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NotificationUpdate(BaseModel):
    """Update notification"""
    is_read: bool = True