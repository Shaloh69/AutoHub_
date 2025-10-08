"""
===========================================
FILE: app/schemas/car.py (COMPLETE - MISSING PIECE!)
Path: car_marketplace_ph/app/schemas/car.py
THIS WAS INCOMPLETE BEFORE - NOW COMPLETE
===========================================
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class CarCreate(BaseModel):
    """Create car listing schema - ALL FIELDS"""
    # Basic Information
    brand_id: int
    model_id: int
    category_id: Optional[int] = None
    title: str = Field(..., min_length=10, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    year: int = Field(..., ge=1900, le=2026)
    
    # Pricing
    price: Decimal = Field(..., gt=0)
    currency: str = Field("PHP", max_length=3)
    original_price: Optional[Decimal] = None
    negotiable: bool = True
    financing_available: bool = False
    trade_in_accepted: bool = False
    
    # Vehicle Details
    vin_number: Optional[str] = Field(None, max_length=17)
    plate_number: Optional[str] = Field(None, max_length=20)
    engine_number: Optional[str] = Field(None, max_length=50)
    chassis_number: Optional[str] = Field(None, max_length=50)
    
    # Technical Specifications
    mileage: int = Field(..., ge=0)
    fuel_type: str = Field(..., pattern="^(gasoline|diesel|hybrid|electric|cng|lpg|plugin_hybrid)$")
    transmission: str = Field(..., pattern="^(manual|automatic|semi_automatic|cvt)$")
    engine_size: Optional[str] = Field(None, max_length=20)
    horsepower: Optional[int] = Field(None, ge=0)
    torque: Optional[int] = Field(None, ge=0)
    drivetrain: Optional[str] = Field(None, pattern="^(fwd|rwd|awd|4wd)$")
    seats: Optional[int] = Field(None, ge=2, le=50)
    doors: Optional[int] = Field(None, ge=2, le=6)
    
    # Exterior
    exterior_color: Optional[str] = Field(None, max_length=50)
    color_type: Optional[str] = Field(None, pattern="^(solid|metallic|pearl|matte)$")
    
    # Condition
    condition_rating: str = Field(..., pattern="^(excellent|very_good|good|fair|poor)$")
    accident_history: bool = False
    accident_details: Optional[str] = Field(None, max_length=1000)
    flood_history: bool = False
    number_of_owners: int = Field(1, ge=1)
    service_history_available: bool = False
    
    # Ownership & Documentation
    registration_status: Optional[str] = Field("registered", pattern="^(registered|unregistered|for_transfer|expired)$")
    or_cr_status: Optional[str] = Field("complete", pattern="^(complete|incomplete|missing)$")
    lto_registered: bool = True
    deed_of_sale_available: bool = True
    casa_maintained: bool = False
    
    # Insurance & Warranty
    insurance_status: Optional[str] = Field("none", pattern="^(active|expired|none)$")
    insurance_expiry: Optional[datetime] = None
    warranty_remaining: bool = False
    warranty_details: Optional[str] = Field(None, max_length=500)
    warranty_expiry: Optional[datetime] = None
    
    # Location
    city_id: int
    province_id: Optional[int] = None  # Auto-set from city
    region_id: Optional[int] = None    # Auto-set from city
    detailed_address: Optional[str] = Field(None, max_length=500)
    barangay: Optional[str] = Field(None, max_length=100)
    latitude: Decimal = Field(..., ge=4.5, le=21.5)  # Philippines bounds
    longitude: Decimal = Field(..., ge=116.0, le=127.0)  # Philippines bounds
    
    # Features
    feature_ids: List[int] = []
    
    # SEO (optional, auto-generated if not provided)
    seo_slug: Optional[str] = Field(None, max_length=255)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)


class CarUpdate(BaseModel):
    """Update car listing schema - ALL FIELDS OPTIONAL"""
    # Basic Information
    brand_id: Optional[int] = None
    model_id: Optional[int] = None
    category_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=10, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    year: Optional[int] = Field(None, ge=1900, le=2026)
    
    # Pricing
    price: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=3)
    original_price: Optional[Decimal] = None
    negotiable: Optional[bool] = None
    financing_available: Optional[bool] = None
    trade_in_accepted: Optional[bool] = None
    
    # Vehicle Details
    vin_number: Optional[str] = Field(None, max_length=17)
    plate_number: Optional[str] = Field(None, max_length=20)
    engine_number: Optional[str] = Field(None, max_length=50)
    chassis_number: Optional[str] = Field(None, max_length=50)
    
    # Technical Specifications
    mileage: Optional[int] = Field(None, ge=0)
    fuel_type: Optional[str] = Field(None, pattern="^(gasoline|diesel|hybrid|electric|cng|lpg|plugin_hybrid)$")
    transmission: Optional[str] = Field(None, pattern="^(manual|automatic|semi_automatic|cvt)$")
    engine_size: Optional[str] = Field(None, max_length=20)
    horsepower: Optional[int] = Field(None, ge=0)
    torque: Optional[int] = Field(None, ge=0)
    drivetrain: Optional[str] = Field(None, pattern="^(fwd|rwd|awd|4wd)$")
    seats: Optional[int] = Field(None, ge=2, le=50)
    doors: Optional[int] = Field(None, ge=2, le=6)
    
    # Exterior
    exterior_color: Optional[str] = Field(None, max_length=50)
    color_type: Optional[str] = Field(None, pattern="^(solid|metallic|pearl|matte)$")
    
    # Condition
    condition_rating: Optional[str] = Field(None, pattern="^(excellent|very_good|good|fair|poor)$")
    accident_history: Optional[bool] = None
    accident_details: Optional[str] = Field(None, max_length=1000)
    flood_history: Optional[bool] = None
    number_of_owners: Optional[int] = Field(None, ge=1)
    service_history_available: Optional[bool] = None
    
    # Ownership & Documentation
    registration_status: Optional[str] = Field(None, pattern="^(registered|unregistered|for_transfer|expired)$")
    or_cr_status: Optional[str] = Field(None, pattern="^(complete|incomplete|missing)$")
    lto_registered: Optional[bool] = None
    deed_of_sale_available: Optional[bool] = None
    casa_maintained: Optional[bool] = None
    
    # Insurance & Warranty
    insurance_status: Optional[str] = Field(None, pattern="^(active|expired|none)$")
    insurance_expiry: Optional[datetime] = None
    warranty_remaining: Optional[bool] = None
    warranty_details: Optional[str] = Field(None, max_length=500)
    warranty_expiry: Optional[datetime] = None
    
    # Location
    city_id: Optional[int] = None
    detailed_address: Optional[str] = Field(None, max_length=500)
    barangay: Optional[str] = Field(None, max_length=100)
    latitude: Optional[Decimal] = Field(None, ge=4.5, le=21.5)
    longitude: Optional[Decimal] = Field(None, ge=116.0, le=127.0)
    
    # Features
    feature_ids: Optional[List[int]] = None
    
    # Status
    status: Optional[str] = Field(None, pattern="^(draft|pending|active|sold|reserved|expired|removed)$")
    
    # SEO
    seo_slug: Optional[str] = Field(None, max_length=255)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)


class CarResponse(BaseModel):
    """Car listing response"""
    id: int
    seller_id: int
    brand_id: int
    model_id: int
    category_id: Optional[int] = None
    
    # Basic info
    title: str
    description: Optional[str] = None
    year: int
    price: Decimal
    currency: str
    mileage: int
    fuel_type: str
    transmission: str
    condition_rating: str
    
    # Location
    city_id: int
    province_id: int
    region_id: int
    
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
    """Detailed car response with all fields"""
    # Vehicle Details
    vin_number: Optional[str] = None
    plate_number: Optional[str] = None
    engine_size: Optional[str] = None
    horsepower: Optional[int] = None
    drivetrain: Optional[str] = None
    seats: Optional[int] = None
    doors: Optional[int] = None
    
    # Exterior
    exterior_color: Optional[str] = None
    color_type: Optional[str] = None
    
    # Condition
    accident_history: bool
    flood_history: bool
    number_of_owners: int
    service_history_available: bool
    
    # Documentation
    registration_status: str
    or_cr_status: str
    lto_registered: bool
    warranty_remaining: bool
    
    # Options
    negotiable: bool
    financing_available: bool
    trade_in_accepted: bool
    
    # Location details
    detailed_address: Optional[str] = None
    barangay: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Related data (populated by service)
    images: List[dict] = []
    features: List[dict] = []
    seller: Optional[dict] = None
    brand: Optional[dict] = None
    model: Optional[dict] = None
    city: Optional[dict] = None


class CarImageUpload(BaseModel):
    """Car image upload response"""
    id: int
    car_id: int
    image_url: str
    thumbnail_url: Optional[str] = None
    medium_url: Optional[str] = None
    is_primary: bool
    display_order: int
    image_type: str
    
    model_config = ConfigDict(from_attributes=True)


class CarBoost(BaseModel):
    """Boost car listing request"""
    duration_hours: int = Field(168, ge=1, le=720)  # Default 1 week, max 30 days


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