from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class InquiryCreate(BaseModel):
    """Create inquiry"""
    car_id: int
    subject: Optional[str] = Field(None, max_length=255)
    message: str = Field(..., min_length=10)
    
    # Optional contact info (for guests)
    buyer_name: Optional[str] = Field(None, max_length=200)
    buyer_email: Optional[EmailStr] = None
    buyer_phone: Optional[str] = Field(None, max_length=20)
    
    # Inquiry details
    inquiry_type: str = Field("general", pattern="^(general|test_drive|price_negotiation|inspection|purchase_intent|financing|trade_in)$")
    offered_price: Optional[Decimal] = Field(None, gt=0)
    test_drive_requested: bool = False
    inspection_requested: bool = False
    financing_needed: bool = False
    trade_in_vehicle: Optional[str] = None


class InquiryResponse(BaseModel):
    """Inquiry response"""
    id: int
    car_id: int
    buyer_id: int
    seller_id: int
    
    subject: Optional[str] = None
    message: str
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    buyer_phone: Optional[str] = None
    
    inquiry_type: str
    offered_price: Optional[Decimal] = None
    test_drive_requested: bool
    inspection_requested: bool
    financing_needed: bool
    
    status: str
    is_read: bool
    priority: str
    response_count: int
    last_response_at: Optional[datetime] = None
    
    buyer_rating: Optional[Decimal] = None
    seller_rating: Optional[Decimal] = None
    
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class InquiryDetailResponse(InquiryResponse):
    """Detailed inquiry with relationships"""
    car: Optional[dict] = None
    buyer: Optional[dict] = None
    seller: Optional[dict] = None
    responses: List[dict] = []


class InquiryResponseCreate(BaseModel):
    """Create inquiry response"""
    message: str = Field(..., min_length=1)
    response_type: str = Field("message", pattern="^(message|price_counter|schedule_test_drive|send_documents|final_offer)$")
    is_internal_note: bool = False
    
    # For price negotiations
    counter_offer_price: Optional[Decimal] = Field(None, gt=0)
    
    # For test drive scheduling
    suggested_datetime: Optional[datetime] = None
    meeting_location: Optional[str] = None


class InquiryResponseResponse(BaseModel):
    """Inquiry response response"""
    id: int
    inquiry_id: int
    user_id: int
    message: str
    response_type: str
    counter_offer_price: Optional[Decimal] = None
    suggested_datetime: Optional[datetime] = None
    meeting_location: Optional[str] = None
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class InquiryUpdate(BaseModel):
    """Update inquiry"""
    status: Optional[str] = Field(None, pattern="^(new|read|replied|in_negotiation|test_drive_scheduled|closed|converted|spam)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    closed_reason: Optional[str] = Field(None, pattern="^(resolved|no_response|spam|inappropriate|car_sold|buyer_cancelled)$")


class InquiryRating(BaseModel):
    """Rate inquiry interaction"""
    rating: Decimal = Field(..., ge=0, le=5)
    review: Optional[str] = Field(None, max_length=500)


class FavoriteResponse(BaseModel):
    """Favorite response"""
    id: int
    user_id: int
    car_id: int
    created_at: datetime
    car: Optional[dict] = None
    
    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    """Notification response"""
    id: int
    user_id: int
    type: str
    title: str
    message: str
    action_text: Optional[str] = None
    action_url: Optional[str] = None
    
    is_read: bool
    priority: str
    
    related_car_id: Optional[int] = None
    related_inquiry_id: Optional[int] = None
    related_transaction_id: Optional[int] = None
    
    created_at: datetime
    read_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class NotificationUpdate(BaseModel):
    """Update notification"""
    is_read: bool = True


class NotificationPreferences(BaseModel):
    """Notification preferences"""
    email_notifications: bool = True
    sms_notifications: bool = True
    push_notifications: bool = True
    
    # Specific notification types
    notify_new_inquiry: bool = True
    notify_inquiry_response: bool = True
    notify_price_drop: bool = True
    notify_car_approved: bool = True
    notify_car_expiring: bool = True