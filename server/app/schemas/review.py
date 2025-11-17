from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ReviewCreate(BaseModel):
    """Create review schema"""
    car_id: Optional[int] = None
    seller_id: int
    rating: Decimal = Field(..., ge=1, le=5, description="Rating from 1.00 to 5.00")
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = Field(None, max_length=2000)
    pros: Optional[str] = Field(None, max_length=1000)
    cons: Optional[str] = Field(None, max_length=1000)
    would_recommend: bool = True
    transaction_id: Optional[int] = None


class ReviewUpdate(BaseModel):
    """Update review schema"""
    rating: Optional[Decimal] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = Field(None, max_length=2000)
    pros: Optional[str] = Field(None, max_length=1000)
    cons: Optional[str] = Field(None, max_length=1000)
    would_recommend: Optional[bool] = None


class ReviewModerate(BaseModel):
    """Admin moderation schema"""
    status: str = Field(..., pattern="^(PENDING|APPROVED|REJECTED|HIDDEN)$")
    admin_notes: Optional[str] = Field(None, max_length=500)

    @field_validator('status', mode='before')
    @classmethod
    def uppercase_status(cls, v):
        """Convert status to uppercase to match database schema"""
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class ReviewHelpful(BaseModel):
    """Mark review as helpful"""
    helpful: bool = True


class ReviewResponse(BaseModel):
    """Review response model"""
    id: int
    car_id: Optional[int] = None
    seller_id: int
    buyer_id: int
    transaction_id: Optional[int] = None
    rating: Decimal
    title: Optional[str] = None
    comment: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    would_recommend: bool = True
    verified_purchase: bool = False
    helpful_count: int = 0
    reported_count: int = 0
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewDetailResponse(ReviewResponse):
    """Detailed review with user and car info"""
    buyer: Optional[dict] = None
    seller: Optional[dict] = None
    car: Optional[dict] = None


class ReviewStatsResponse(BaseModel):
    """Review statistics"""
    total_reviews: int = 0
    average_rating: Decimal = Decimal("0.00")
    rating_distribution: dict = {}
    verified_purchases: int = 0
    would_recommend_percentage: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)
