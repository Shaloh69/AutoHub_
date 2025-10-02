from pydantic import BaseModel, EmailStr, Field, validator, constr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from models import UserRole, CarStatus, FuelType, TransmissionType


# Base Response Schema
class ResponseBase(BaseModel):
    success: bool = True
    message: str = "Success"
    data: Optional[dict] = None


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    first_name: constr(min_length=2, max_length=100)
    last_name: constr(min_length=2, max_length=100)
    phone: Optional[str] = None
    city_id: int
    role: UserRole = UserRole.BUYER
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: constr(min_length=8)


class EmailVerification(BaseModel):
    token: str


class PhoneVerification(BaseModel):
    phone: str
    otp: str


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRole


class UserProfile(UserBase):
    id: int
    profile_image: Optional[str] = None
    city_id: Optional[int] = None
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    barangay: Optional[str] = None
    email_verified: bool
    phone_verified: bool
    identity_verified: bool
    business_verified: bool
    average_rating: Decimal
    total_ratings: int
    total_sales: int
    total_purchases: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city_id: Optional[int] = None
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    barangay: Optional[str] = None
    postal_code: Optional[str] = None
    business_name: Optional[str] = None
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None


# Location Schemas
class CityResponse(BaseModel):
    id: int
    name: str
    province_id: int
    city_type: str
    is_highly_urbanized: bool
    
    class Config:
        from_attributes = True


class ProvinceResponse(BaseModel):
    id: int
    name: str
    region_id: int
    province_code: str
    
    class Config:
        from_attributes = True


class RegionResponse(BaseModel):
    id: int
    name: str
    region_code: str
    long_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# Brand & Model Schemas
class BrandBase(BaseModel):
    id: int
    name: str
    logo_url: Optional[str] = None
    country_origin: Optional[str] = None
    is_popular_in_ph: bool
    
    class Config:
        from_attributes = True


class ModelBase(BaseModel):
    id: int
    brand_id: int
    name: str
    body_type: str
    generation: Optional[str] = None
    year_start: Optional[int] = None
    year_end: Optional[int] = None
    
    class Config:
        from_attributes = True


# Car Schemas
class CarCreate(BaseModel):
    brand_id: int
    model_id: int
    title: constr(min_length=10, max_length=255)
    description: constr(min_length=50)
    year: int = Field(ge=1900, le=2026)
    price: Decimal = Field(gt=0, le=50000000)
    mileage: int = Field(ge=0)
    fuel_type: FuelType
    transmission: TransmissionType
    city_id: int
    province_id: int
    region_id: int
    condition_rating: str
    negotiable: bool = True
    financing_available: bool = False
    trade_in_accepted: bool = False
    
    # Optional fields
    category_id: Optional[int] = None
    engine_size: Optional[str] = None
    horsepower: Optional[int] = None
    drivetrain: Optional[str] = None
    exterior_color_id: Optional[int] = None
    interior_color_id: Optional[int] = None
    custom_exterior_color: Optional[str] = None
    custom_interior_color: Optional[str] = None
    accident_history: bool = False
    accident_details: Optional[str] = None
    flood_history: bool = False
    service_history: bool = True
    service_records_available: bool = False
    number_of_owners: int = 1
    warranty_remaining: bool = False
    warranty_details: Optional[str] = None
    vin: Optional[str] = None
    engine_number: Optional[str] = None
    chassis_number: Optional[str] = None
    plate_number: Optional[str] = None
    registration_expiry: Optional[date] = None
    or_cr_available: bool = True
    lto_registered: bool = True
    casa_maintained: bool = False
    comprehensive_insurance: bool = False
    insurance_company: Optional[str] = None
    insurance_expiry: Optional[date] = None
    barangay: Optional[str] = None
    detailed_address: Optional[str] = None
    latitude: Optional[Decimal] = Field(default=14.5995, ge=4.0, le=21.0)
    longitude: Optional[Decimal] = Field(default=120.9842, ge=116.0, le=127.0)
    
    @validator('year')
    def validate_year(cls, v):
        if v > 2026:
            raise ValueError('Year cannot be in the future')
        return v
    
    @validator('price')
    def validate_price(cls, v):
        if v < 50000:
            raise ValueError('Price must be at least 50,000 PHP')
        return v


class CarUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    mileage: Optional[int] = None
    negotiable: Optional[bool] = None
    financing_available: Optional[bool] = None
    trade_in_accepted: Optional[bool] = None
    condition_rating: Optional[str] = None
    accident_history: Optional[bool] = None
    accident_details: Optional[str] = None
    warranty_remaining: Optional[bool] = None
    warranty_details: Optional[str] = None
    detailed_address: Optional[str] = None


class CarImageResponse(BaseModel):
    id: int
    car_id: int
    image_url: str
    thumbnail_url: Optional[str] = None
    medium_url: Optional[str] = None
    is_primary: bool
    display_order: int
    image_type: str
    
    class Config:
        from_attributes = True


class CarResponse(BaseModel):
    id: int
    seller_id: int
    brand_id: int
    model_id: int
    title: str
    description: Optional[str] = None
    year: int
    price: Decimal
    currency: str
    mileage: int
    fuel_type: str
    transmission: str
    condition_rating: str
    city_id: int
    province_id: int
    region_id: int
    status: str
    approval_status: str
    is_featured: bool
    is_premium: bool
    views_count: int
    favorite_count: int
    average_rating: Decimal
    created_at: datetime
    updated_at: datetime
    
    # Related data
    images: List[CarImageResponse] = []
    
    class Config:
        from_attributes = True


class CarListResponse(BaseModel):
    items: List[CarResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CarSearchParams(BaseModel):
    query: Optional[str] = None
    brand_id: Optional[int] = None
    model_id: Optional[int] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    fuel_type: Optional[FuelType] = None
    transmission: Optional[TransmissionType] = None
    city_id: Optional[int] = None
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    radius_km: Optional[int] = Field(default=25, ge=1, le=500)
    condition_rating: Optional[str] = None
    min_mileage: Optional[int] = None
    max_mileage: Optional[int] = None
    is_featured: Optional[bool] = None
    sort_by: str = Field(default="created_at", regex="^(price|year|mileage|created_at|views_count|rating)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class NearbySearchParams(BaseModel):
    latitude: Decimal = Field(ge=4.0, le=21.0)
    longitude: Decimal = Field(ge=116.0, le=127.0)
    radius_km: int = Field(default=25, ge=1, le=500)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# Inquiry Schemas
class InquiryCreate(BaseModel):
    car_id: int
    subject: Optional[str] = None
    message: constr(min_length=10)
    inquiry_type: str = "general"
    offered_price: Optional[Decimal] = None
    test_drive_requested: bool = False
    inspection_requested: bool = False
    financing_needed: bool = False
    trade_in_vehicle: Optional[str] = None


class InquiryResponse(BaseModel):
    id: int
    car_id: int
    buyer_id: int
    seller_id: int
    subject: Optional[str] = None
    message: str
    inquiry_type: str
    status: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class InquiryResponseCreate(BaseModel):
    message: constr(min_length=10)
    response_type: str = "message"
    counter_offer_price: Optional[Decimal] = None
    suggested_datetime: Optional[datetime] = None
    meeting_location: Optional[str] = None


# Subscription Schemas
class SubscriptionPlanResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str] = None
    plan_type: str
    monthly_price: Decimal
    yearly_price: Decimal
    trial_days: int
    max_active_listings: int
    max_featured_listings: int
    max_premium_listings: int
    max_images_per_listing: int
    priority_ranking_boost: int
    featured_in_homepage: bool
    advanced_analytics: bool
    priority_customer_support: bool
    verified_seller_badge: bool
    monthly_boost_credits: int
    is_popular: bool
    
    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    plan_id: int
    billing_cycle: str = Field(regex="^(monthly|yearly)$")
    payment_method: str
    promotion_code: Optional[str] = None


class UserSubscriptionResponse(BaseModel):
    id: int
    user_id: int
    plan_id: int
    status: str
    billing_cycle: str
    current_period_start: datetime
    current_period_end: datetime
    next_billing_date: Optional[datetime] = None
    auto_renew: bool
    monthly_price: Decimal
    yearly_price: Decimal
    
    class Config:
        from_attributes = True


# Analytics Schemas
class CarAnalytics(BaseModel):
    views_total: int
    views_unique: int
    contacts: int
    favorites: int
    avg_view_duration: int
    conversion_rate: Decimal


class DashboardStats(BaseModel):
    total_listings: int
    active_listings: int
    pending_listings: int
    sold_listings: int
    total_views: int
    total_inquiries: int
    total_favorites: int
    avg_rating: Decimal


# Payment Schemas
class PaymentIntent(BaseModel):
    amount: Decimal
    currency: str = "PHP"
    payment_method: str
    description: Optional[str] = None


class PaymentResponse(BaseModel):
    payment_id: str
    status: str
    amount: Decimal
    currency: str
    created_at: datetime


# Favorite Schemas
class FavoriteCreate(BaseModel):
    car_id: int


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    car_id: int
    created_at: datetime
    car: CarResponse
    
    class Config:
        from_attributes = True


# Error Response Schema
class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


# Success Response Schema
class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[dict] = None