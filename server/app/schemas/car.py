from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class CarCreate(BaseModel):
    """Create car listing schema"""
    brand_id: int
    model_id: int
    category_id: Optional[int] = None
    
    # Basic Info
    title: str = Field(..., min_length=10, max_length=255)
    description: Optional[str] = None
    year: int = Field(..., ge=1900, le=2026)
    price: Decimal = Field(..., gt=0, le=100000000)
    currency: str = Field("PHP", pattern="^[A-Z]{3}$")
    negotiable: bool = True
    financing_available: bool = False
    trade_in_accepted: bool = False
    
    # Technical Specifications
    mileage: int = Field(..., ge=0)
    fuel_type: str = Field(..., pattern="^(gasoline|diesel|hybrid|electric|cng|lpg|plugin-hybrid)$")
    transmission: str = Field(..., pattern="^(manual|automatic|semi-automatic|cvt)$")
    engine_size: Optional[str] = Field(None, max_length=20)
    horsepower: Optional[int] = Field(None, ge=0, le=2000)
    drivetrain: Optional[str] = Field(None, pattern="^(fwd|rwd|awd|4wd)$")
    
    # Colors
    exterior_color_id: Optional[int] = None
    interior_color_id: Optional[int] = None
    custom_exterior_color: Optional[str] = Field(None, max_length=50)
    custom_interior_color: Optional[str] = Field(None, max_length=50)
    
    # Condition & History
    condition_rating: str = Field(..., pattern="^(excellent|very_good|good|fair|poor)$")
    accident_history: bool = False
    accident_details: Optional[str] = None
    flood_history: bool = False
    service_history: bool = True
    service_records_available: bool = False
    number_of_owners: int = Field(1, ge=1, le=20)
    warranty_remaining: bool = False
    warranty_details: Optional[str] = None
    
    # Vehicle Identification
    vin: Optional[str] = Field(None, max_length=17)
    engine_number: Optional[str] = Field(None, max_length=50)
    chassis_number: Optional[str] = Field(None, max_length=50)
    plate_number: Optional[str] = Field(None, max_length=20)
    registration_expiry: Optional[date] = None
    or_cr_available: bool = True
    
    # Philippines Specific
    lto_registered: bool = True
    casa_maintained: bool = False
    comprehensive_insurance: bool = False
    insurance_company: Optional[str] = Field(None, max_length=100)
    insurance_expiry: Optional[date] = None
    
    # Location
    city_id: int
    province_id: int
    region_id: int
    barangay: Optional[str] = Field(None, max_length=100)
    detailed_address: Optional[str] = None
    latitude: Optional[Decimal] = Field(14.5995, ge=4.0, le=21.0)
    longitude: Optional[Decimal] = Field(120.9842, ge=116.0, le=127.0)
    
    # Features
    feature_ids: List[int] = []


class CarUpdate(BaseModel):
    """Update car listing schema"""
    title: Optional[str] = Field(None, min_length=10, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, le=100000000)
    negotiable: Optional[bool] = None
    financing_available: Optional[bool] = None
    trade_in_accepted: Optional[bool] = None
    mileage: Optional[int] = Field(None, ge=0)
    condition_rating: Optional[str] = Field(None, pattern="^(excellent|very_good|good|fair|poor)$")
    service_records_available: Optional[bool] = None
    warranty_remaining: Optional[bool] = None
    warranty_details: Optional[str] = None
    registration_expiry: Optional[date] = None
    insurance_expiry: Optional[date] = None
    detailed_address: Optional[str] = None
    feature_ids: Optional[List[int]] = None


class CarResponse(BaseModel):
    """Car response schema"""
    id: int
    seller_id: int
    brand_id: int
    model_id: int
    category_id: Optional[int] = None
    
    # Basic Info
    title: str
    description: Optional[str] = None
    year: int
    price: Decimal
    currency: str
    negotiable: bool
    financing_available: bool
    trade_in_accepted: bool
    
    # Technical
    mileage: int
    fuel_type: str
    transmission: str
    engine_size: Optional[str] = None
    horsepower: Optional[int] = None
    drivetrain: Optional[str] = None
    
    # Condition
    condition_rating: str
    accident_history: bool
    flood_history: bool
    number_of_owners: int
    
    # Location
    city_id: int
    province_id: int
    region_id: int
    barangay: Optional[str] = None
    latitude: Decimal
    longitude: Decimal
    
    # Status
    status: str
    approval_status: str
    is_featured: bool
    is_premium: bool
    is_active: bool
    
    # Metrics
    views_count: int
    contact_count: int
    favorite_count: int
    average_rating: Decimal
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CarDetailResponse(CarResponse):
    """Detailed car response with relationships"""
    seller: Optional[dict] = None
    brand: Optional[dict] = None
    model: Optional[dict] = None
    city: Optional[dict] = None
    images: List[dict] = []
    features: List[dict] = []


class CarSearchParams(BaseModel):
    """Car search parameters"""
    q: Optional[str] = None
    brand_id: Optional[int] = None
    model_id: Optional[int] = None
    category_id: Optional[int] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = None
    min_year: Optional[int] = Field(None, ge=1900)
    max_year: Optional[int] = Field(None, le=2026)
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    min_mileage: Optional[int] = Field(None, ge=0)
    max_mileage: Optional[int] = None
    condition_rating: Optional[str] = None
    city_id: Optional[int] = None
    province_id: Optional[int] = None
    region_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[int] = Field(None, ge=1, le=500)
    is_featured: Optional[bool] = None
    negotiable: Optional[bool] = None
    financing_available: Optional[bool] = None
    sort_by: str = Field("created_at", pattern="^(created_at|price|year|mileage|views_count)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")


class CarImageUpload(BaseModel):
    """Car image upload response"""
    id: int
    car_id: int
    image_url: str
    thumbnail_url: Optional[str] = None
    is_primary: bool
    display_order: int
    image_type: str
    
    model_config = ConfigDict(from_attributes=True)


class CarBoost(BaseModel):
    """Boost car listing"""
    duration_hours: int = Field(168, ge=1, le=720)  # Default 1 week, max 30 days


class CarFeature(BaseModel):
    """Car feature schema"""
    id: int
    car_id: int
    feature_id: int
    
    model_config = ConfigDict(from_attributes=True)


class BrandResponse(BaseModel):
    """Brand response"""
    id: int
    name: str
    logo_url: Optional[str] = None
    country_origin: Optional[str] = None
    brand_type: str
    is_popular_in_ph: bool
    
    model_config = ConfigDict(from_attributes=True)


class ModelResponse(BaseModel):
    """Model response"""
    id: int
    brand_id: int
    name: str
    body_type: str
    generation: Optional[str] = None
    year_start: Optional[int] = None
    year_end: Optional[int] = None
    is_popular_in_ph: bool
    
    model_config = ConfigDict(from_attributes=True)


class FeatureResponse(BaseModel):
    """Feature response"""
    id: int
    name: str
    category: str
    description: Optional[str] = None
    is_premium: bool
    is_popular: bool
    
    model_config = ConfigDict(from_attributes=True)


class PriceHistoryResponse(BaseModel):
    """Price history response"""
    id: int
    car_id: int
    old_price: Optional[Decimal] = None
    new_price: Decimal
    price_change_percent: Optional[Decimal] = None
    change_reason: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)