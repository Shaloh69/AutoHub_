"""
===========================================
FILE: app/schemas/car.py (NORMALIZED & UPDATED)
Path: car_marketplace_ph/app/schemas/car.py
===========================================
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime, date
from decimal import Decimal


class CarCreate(BaseModel):
    """Create car listing schema - NORMALIZED"""
    # Basic Information (Using FKs)
    brand_id: int
    model_id: int
    category_id: Optional[int] = None
    title: str = Field(..., min_length=10, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    year: int = Field(..., ge=1900, le=2026)
    trim: Optional[str] = Field(None, max_length=100)

    # Pricing (NORMALIZED - using currency_id FK only)
    price: Decimal = Field(..., gt=0, le=9999999999.99)
    currency_id: int = Field(1)  # FK to currencies table
    original_price: Optional[Decimal] = Field(None, le=9999999999.99)
    price_negotiable: bool = True
    financing_available: bool = False
    trade_in_accepted: bool = False

    # Vehicle Details
    vin_number: Optional[str] = Field(None, max_length=17)
    plate_number: Optional[str] = Field(None, max_length=20)
    engine_number: Optional[str] = Field(None, max_length=50)
    chassis_number: Optional[str] = Field(None, max_length=50)
    body_type: Optional[str] = Field(None, pattern="^(SEDAN|SUV|PICKUP|VAN|HATCHBACK|COUPE|MPV|CROSSOVER|WAGON|CONVERTIBLE)$")

    # Technical Specifications (NORMALIZED - no engine_type, only fuel_type)
    mileage: int = Field(..., ge=0)
    mileage_unit: str = Field("KM", pattern="^(KM|MILES)$")
    fuel_type: str = Field(..., pattern="^(GASOLINE|DIESEL|ELECTRIC|HYBRID|PLUG_IN_HYBRID)$")
    transmission: str = Field(..., pattern="^(MANUAL|AUTOMATIC|CVT|DCT)$")
    engine_size: Optional[str] = Field(None, max_length=20)
    cylinders: Optional[int] = Field(None, ge=1, le=16)
    horsepower: Optional[int] = Field(None, ge=0)
    torque: Optional[int] = Field(None, ge=0)
    drivetrain: Optional[str] = Field(None, pattern="^(FWD|RWD|AWD|4WD)$")
    seats: Optional[int] = Field(None, ge=2, le=50)
    doors: Optional[int] = Field(None, ge=2, le=6)

    # Colors (NORMALIZED - using FKs only)
    color_id: Optional[int] = None  # FK to standard_colors
    interior_color_id: Optional[int] = None  # FK to standard_colors

    # Condition (NORMALIZED - using car_condition only)
    car_condition: str = Field(..., pattern="^(BRAND_NEW|LIKE_NEW|EXCELLENT|GOOD|FAIR|POOR)$")
    accident_history: bool = False
    accident_details: Optional[str] = Field(None, max_length=1000)
    flood_history: bool = False
    number_of_owners: int = Field(1, ge=1)
    service_history_available: bool = False

    # Ownership & Documentation (NORMALIZED ENUMs)
    registration_status: Optional[str] = Field("REGISTERED", pattern="^(REGISTERED|UNREGISTERED|EXPIRED|FOR_RENEWAL)$")
    registration_expiry: Optional[date] = None
    or_cr_status: Optional[str] = Field("COMPLETE", pattern="^(COMPLETE|INCOMPLETE|PROCESSING|LOST)$")
    lto_registered: bool = False
    deed_of_sale_available: bool = False
    has_emission_test: bool = False
    casa_maintained: bool = False

    # Insurance & Warranty (NORMALIZED ENUMs)
    insurance_status: Optional[str] = Field("NONE", pattern="^(ACTIVE|EXPIRED|NONE)$")
    insurance_expiry: Optional[date] = None
    warranty_remaining: bool = False
    warranty_details: Optional[str] = Field(None, max_length=500)
    warranty_expiry: Optional[date] = None

    # Location
    city_id: int
    province_id: Optional[int] = None  # Auto-set from city
    region_id: Optional[int] = None    # Auto-set from city
    detailed_address: Optional[str] = Field(None, max_length=500)
    barangay: Optional[str] = Field(None, max_length=100)
    latitude: Optional[Decimal] = Field(None, ge=4.5, le=21.5)
    longitude: Optional[Decimal] = Field(None, ge=116.0, le=127.0)

    # Features
    feature_ids: List[int] = []

    # SEO (optional, auto-generated if not provided)
    seo_slug: Optional[str] = Field(None, max_length=255)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)

    model_config = ConfigDict(
        protected_namespaces=()
    )


class CarUpdate(BaseModel):
    """Update car listing schema - ALL FIELDS OPTIONAL"""
    # Basic Information
    brand_id: Optional[int] = None
    model_id: Optional[int] = None
    category_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=10, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    year: Optional[int] = Field(None, ge=1900, le=2026)
    trim: Optional[str] = Field(None, max_length=100)

    # Pricing (NORMALIZED)
    price: Optional[Decimal] = Field(None, gt=0, le=9999999999.99)
    currency_id: Optional[int] = None
    original_price: Optional[Decimal] = Field(None, le=9999999999.99)
    price_negotiable: Optional[bool] = None
    financing_available: Optional[bool] = None
    trade_in_accepted: Optional[bool] = None

    # Vehicle Details
    vin_number: Optional[str] = Field(None, max_length=17)
    plate_number: Optional[str] = Field(None, max_length=20)
    engine_number: Optional[str] = Field(None, max_length=50)
    chassis_number: Optional[str] = Field(None, max_length=50)
    body_type: Optional[str] = Field(None, pattern="^(SEDAN|SUV|PICKUP|VAN|HATCHBACK|COUPE|MPV|CROSSOVER|WAGON|CONVERTIBLE)$")

    # Technical Specifications (NORMALIZED)
    mileage: Optional[int] = Field(None, ge=0)
    mileage_unit: Optional[str] = Field(None, pattern="^(KM|MILES)$")
    fuel_type: Optional[str] = Field(None, pattern="^(GASOLINE|DIESEL|ELECTRIC|HYBRID|PLUG_IN_HYBRID)$")
    transmission: Optional[str] = Field(None, pattern="^(MANUAL|AUTOMATIC|CVT|DCT)$")
    engine_size: Optional[str] = Field(None, max_length=20)
    cylinders: Optional[int] = Field(None, ge=1, le=16)
    horsepower: Optional[int] = Field(None, ge=0)
    torque: Optional[int] = Field(None, ge=0)
    drivetrain: Optional[str] = Field(None, pattern="^(FWD|RWD|AWD|4WD)$")
    seats: Optional[int] = Field(None, ge=2, le=50)
    doors: Optional[int] = Field(None, ge=2, le=6)

    # Colors (NORMALIZED - using FKs)
    color_id: Optional[int] = None
    interior_color_id: Optional[int] = None

    # Condition (NORMALIZED)
    car_condition: Optional[str] = Field(None, pattern="^(BRAND_NEW|LIKE_NEW|EXCELLENT|GOOD|FAIR|POOR)$")
    accident_history: Optional[bool] = None
    accident_details: Optional[str] = Field(None, max_length=1000)
    flood_history: Optional[bool] = None
    number_of_owners: Optional[int] = Field(None, ge=1)
    service_history_available: Optional[bool] = None

    # Ownership & Documentation (NORMALIZED)
    registration_status: Optional[str] = Field(None, pattern="^(REGISTERED|UNREGISTERED|EXPIRED|FOR_RENEWAL)$")
    registration_expiry: Optional[date] = None
    or_cr_status: Optional[str] = Field(None, pattern="^(COMPLETE|INCOMPLETE|PROCESSING|LOST)$")
    lto_registered: Optional[bool] = None
    deed_of_sale_available: Optional[bool] = None
    has_emission_test: Optional[bool] = None
    casa_maintained: Optional[bool] = None

    # Insurance & Warranty (NORMALIZED)
    insurance_status: Optional[str] = Field(None, pattern="^(ACTIVE|EXPIRED|NONE)$")
    insurance_expiry: Optional[date] = None
    warranty_remaining: Optional[bool] = None
    warranty_details: Optional[str] = Field(None, max_length=500)
    warranty_expiry: Optional[date] = None

    # Location
    city_id: Optional[int] = None
    detailed_address: Optional[str] = Field(None, max_length=500)
    barangay: Optional[str] = Field(None, max_length=100)
    latitude: Optional[Decimal] = Field(None, ge=4.5, le=21.5)
    longitude: Optional[Decimal] = Field(None, ge=116.0, le=127.0)

    # Features
    feature_ids: Optional[List[int]] = None

    # Status
    status: Optional[str] = Field(None, pattern="^(DRAFT|PENDING|ACTIVE|SOLD|RESERVED|INACTIVE|REJECTED|EXPIRED)$")

    # SEO
    seo_slug: Optional[str] = Field(None, max_length=255)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)

    model_config = ConfigDict(
        protected_namespaces=()
    )


class CarResponse(BaseModel):
    """Car listing response"""
    id: int
    seller_id: int
    brand_id: int
    model_id: int
    category_id: Optional[int] = None
    color_id: Optional[int] = None
    interior_color_id: Optional[int] = None

    # Basic info
    title: str
    description: Optional[str] = None
    year: int
    price: Decimal
    currency_id: int
    mileage: int
    fuel_type: str
    transmission: str
    car_condition: str

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

    # Related data (populated by eager loading or joins)
    images: List[Any] = []
    brand_rel: Optional[Any] = None
    model_rel: Optional[Any] = None
    city: Optional[Any] = None

    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )


class CityResponse(BaseModel):
    """City response for car location"""
    id: int
    name: str
    province_id: int

    model_config = ConfigDict(from_attributes=True)


class CarImageResponse(BaseModel):
    """Car image in responses"""
    id: int
    image_url: str
    is_main: bool
    image_type: str
    display_order: int
    caption: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CarDetailResponse(CarResponse):
    """Detailed car response with all fields"""
    # Vehicle Details
    vin_number: Optional[str] = None
    plate_number: Optional[str] = None
    trim: Optional[str] = None
    body_type: Optional[str] = None

    # Technical Specifications
    engine_size: Optional[str] = None
    cylinders: Optional[int] = None
    horsepower: Optional[int] = None
    torque: Optional[int] = None
    fuel_economy_city: Optional[Decimal] = None
    fuel_economy_highway: Optional[Decimal] = None
    drivetrain: Optional[str] = None
    seats: Optional[int] = None
    doors: Optional[int] = None
    mileage_unit: str = "KM"

    # Condition
    accident_history: bool
    accident_details: Optional[str] = None
    flood_history: bool
    number_of_owners: int
    service_history_available: bool

    # Documentation
    registration_status: str
    registration_expiry: Optional[date] = None
    or_cr_status: str
    lto_registered: bool
    deed_of_sale_available: bool
    has_emission_test: bool
    casa_maintained: bool

    # Insurance & Warranty
    insurance_status: str
    insurance_expiry: Optional[date] = None
    warranty_remaining: bool
    warranty_details: Optional[str] = None
    warranty_expiry: Optional[date] = None

    # Options
    price_negotiable: bool
    financing_available: bool
    trade_in_accepted: bool
    installment_available: bool

    # Location details
    detailed_address: Optional[str] = None
    barangay: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

    # Media
    main_image: Optional[str] = None
    video_url: Optional[str] = None
    virtual_tour_url: Optional[str] = None

    # Related data (populated by service)
    images: List[CarImageResponse] = []
    features: List[Any] = []
    seller: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


class CarImageUpload(BaseModel):
    """Car image upload response"""
    id: int
    car_id: int
    image_url: str
    is_main: bool
    display_order: int
    image_type: str
    caption: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CarBoost(BaseModel):
    """Boost car listing request"""
    duration_hours: int = Field(168, ge=1, le=720)  # Default 1 week, max 30 days


class BrandResponse(BaseModel):
    """Brand response"""
    id: int
    name: str
    slug: str
    logo_url: Optional[str] = None
    country_of_origin: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    is_popular: bool
    display_order: int = 0
    total_models: int = 0
    total_listings: int = 0
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class ModelResponse(BaseModel):
    """Model response"""
    id: int
    brand_id: int
    name: str
    slug: str
    model_type: str
    description: Optional[str] = None
    year_introduced: Optional[int] = None
    is_active: bool = True
    total_listings: int = 0

    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )


class CategoryResponse(BaseModel):
    """Category response"""
    id: int
    parent_id: Optional[int] = None
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int
    is_active: bool
    total_listings: int = 0

    model_config = ConfigDict(from_attributes=True)


class FeatureResponse(BaseModel):
    """Feature response"""
    id: int
    name: str
    slug: str
    category: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_premium: bool
    display_order: int = 0

    model_config = ConfigDict(from_attributes=True)


class ColorResponse(BaseModel):
    """Standard color response"""
    id: int
    name: str
    hex_code: Optional[str] = None
    category: str
    is_popular: bool

    model_config = ConfigDict(from_attributes=True)


class PriceHistoryResponse(BaseModel):
    """Price history response"""
    id: int
    car_id: int
    old_price: Optional[Decimal] = None
    new_price: Decimal
    change_percentage: Optional[Decimal] = None
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
