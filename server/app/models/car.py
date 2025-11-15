from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class FuelType(str, enum.Enum):
    """Fuel type enum - UPPERCASE to match SQL schema"""
    GASOLINE = "GASOLINE"
    DIESEL = "DIESEL"
    HYBRID = "HYBRID"
    ELECTRIC = "ELECTRIC"
    # Note: CNG, LPG, PLUGIN_HYBRID not in SQL schema, removed for alignment


class TransmissionType(str, enum.Enum):
    """Transmission type enum - UPPERCASE to match SQL schema"""
    MANUAL = "MANUAL"
    AUTOMATIC = "AUTOMATIC"
    CVT = "CVT"
    DCT = "DCT"
    # Note: SEMI_AUTOMATIC not in SQL schema, removed for alignment


class DrivetrainType(str, enum.Enum):
    """Drivetrain type enum - UPPERCASE to match SQL schema"""
    FWD = "FWD"
    RWD = "RWD"
    AWD = "AWD"
    FOUR_WD = "4WD"  # SQL uses '4WD' not '4wd'


class ConditionRating(str, enum.Enum):
    """Condition rating enum - UPPERCASE with underscores to match SQL schema"""
    BRAND_NEW = "BRAND_NEW"
    LIKE_NEW = "LIKE_NEW"
    EXCELLENT = "EXCELLENT"
    VERY_GOOD = "VERY_GOOD"  # Not in SQL, but keeping for compatibility
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"


class CarStatus(str, enum.Enum):
    """Car status enum - UPPERCASE to match SQL schema"""
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SOLD = "SOLD"
    RESERVED = "RESERVED"
    INACTIVE = "INACTIVE"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    # Note: REMOVED not in SQL schema, removed for alignment


class ApprovalStatus(str, enum.Enum):
    """Approval status enum - UPPERCASE to match SQL schema"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    # Note: NEEDS_REVISION not in SQL schema, removed for alignment


class BodyType(str, enum.Enum):
    SEDAN = "sedan"
    SUV = "suv"
    PICKUP = "pickup"
    VAN = "van"
    HATCHBACK = "hatchback"
    COUPE = "coupe"
    MPV = "mpv"
    CROSSOVER = "crossover"
    WAGON = "wagon"
    CONVERTIBLE = "convertible"


class EngineType(str, enum.Enum):
    GASOLINE = "gasoline"
    DIESEL = "diesel"
    ELECTRIC = "electric"
    HYBRID = "hybrid"
    PLUGIN_HYBRID = "plug-in-hybrid"


class MileageUnit(str, enum.Enum):
    KM = "km"
    MILES = "miles"


class Visibility(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    UNLISTED = "unlisted"


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    logo_url = Column(String(500))
    country_of_origin = Column(String(100))
    website = Column(String(255))
    description = Column(Text)
    is_popular = Column(Boolean, default=False, index=True)
    display_order = Column(Integer, default=0)
    total_models = Column(Integer, default=0)
    total_listings = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(TIMESTAMP, default=datetime.now, index=True)

    # Relationships
    models = relationship("Model", back_populates="brand")

    def __repr__(self):
        return f"<Brand {self.name}>"


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    slug = Column(String(100), nullable=False)
    model_type = Column(Enum("sedan", "suv", "pickup", "van", "hatchback", "coupe", "mpv", "crossover"), default="sedan")
    description = Column(Text)
    year_introduced = Column(Integer)
    is_active = Column(Boolean, default=True)
    total_listings = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, default=datetime.now)

    # Relationships
    brand = relationship("Brand", back_populates="models")

    def __repr__(self):
        return f"<Model {self.brand.name} {self.name}>"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    icon = Column(String(100))
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    total_listings = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, default=datetime.now)

    def __repr__(self):
        return f"<Category {self.name}>"


class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(Enum("safety", "comfort", "technology", "performance", "exterior", "interior"), default="comfort", index=True)
    description = Column(Text)
    icon = Column(String(100))
    is_premium = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)

    def __repr__(self):
        return f"<Feature {self.name}>"


class Car(Base):
    __tablename__ = "cars"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), index=True)
    color_id = Column(Integer, ForeignKey("standard_colors.id", ondelete="SET NULL"), index=True)
    
    # Basic Information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    year = Column(Integer, nullable=False, index=True)
    make = Column(String(100), nullable=False)  # Brand name as string (separate from brand_id)
    model = Column(String(100), nullable=False)  # Model name as string (separate from model_id)
    trim = Column(String(100))  # Trim level/variant
    
    # Pricing
    price = Column(DECIMAL(12, 2), nullable=False, index=True)
    currency = Column(String(3), default="PHP")
    currency_id = Column(Integer, ForeignKey("currencies.id"), default=1)
    original_price = Column(DECIMAL(12, 2))
    discount_amount = Column(DECIMAL(12, 2))
    discount_percentage = Column(DECIMAL(5, 2))
    negotiable = Column(Boolean, default=True)
    price_negotiable = Column(Boolean, default=True)  # Duplicate for SQL compatibility
    
    # Vehicle Details
    vin = Column(String(17), unique=True, index=True)  # Primary VIN field
    vin_number = Column(String(17), unique=True, index=True)  # Duplicate for compatibility
    plate_number = Column(String(20), index=True)
    engine_number = Column(String(50))
    chassis_number = Column(String(50))
    body_type = Column(Enum(BodyType))
    
    # Technical Specifications
    mileage = Column(Integer, nullable=False, index=True)
    mileage_unit = Column(Enum(MileageUnit), default=MileageUnit.KM)
    fuel_type = Column(Enum(FuelType), nullable=False, index=True)
    engine_type = Column(Enum(EngineType))  # Separate from fuel_type
    transmission = Column(Enum(TransmissionType), nullable=False, index=True)
    engine_size = Column(String(20))  # e.g., "1.5L", "2000cc"
    cylinders = Column(Integer)
    horsepower = Column(Integer)
    torque = Column(Integer)
    fuel_economy_city = Column(DECIMAL(5, 2))  # km/L or mpg
    fuel_economy_highway = Column(DECIMAL(5, 2))  # km/L or mpg
    drivetrain = Column(Enum(DrivetrainType))
    seats = Column(Integer)
    doors = Column(Integer)
    
    # Exterior & Interior
    exterior_color = Column(String(50), index=True)
    interior_color = Column(String(50))
    # NOTE: color_type removed - not in SQL schema
    
    # Condition
    condition_rating = Column(Enum(ConditionRating), nullable=False, index=True)
    car_condition = Column(Enum(ConditionRating), nullable=False, index=True)  # SQL uses this name
    accident_history = Column(Boolean, default=False)
    accident_details = Column(Text)
    flood_history = Column(Boolean, default=False)
    number_of_owners = Column(Integer, default=1)
    previous_owners = Column(Integer, default=1)  # Separate field for SQL compatibility
    service_history = Column(Boolean, default=False)
    service_history_available = Column(Boolean, default=False)
    
    # Ownership & Documentation
    registration_status = Column(Enum("registered", "unregistered", "for_transfer", "expired"), default="registered")
    registration_valid = Column(Boolean, default=True)
    # FIXED: Changed from TIMESTAMP to Date to match SQL schema
    registration_expiry = Column(Date)
    or_cr_status = Column(Enum("complete", "incomplete", "missing"), default="complete")
    lto_registered = Column(Boolean, default=True)
    deed_of_sale_available = Column(Boolean, default=True)
    has_emission_test = Column(Boolean, default=False)
    casa_maintained = Column(Boolean, default=False)

    # Insurance & Warranty
    has_insurance = Column(Boolean, default=False)
    insurance_status = Column(Enum("active", "expired", "none"), default="none")
    # FIXED: Changed from TIMESTAMP to Date to match SQL schema
    insurance_expiry = Column(Date)
    warranty_remaining = Column(Boolean, default=False)
    warranty_details = Column(Text)
    # FIXED: Changed from TIMESTAMP to Date to match SQL schema
    warranty_expiry = Column(Date)
    
    # Trade & Finance Options
    financing_available = Column(Boolean, default=False)
    trade_in_accepted = Column(Boolean, default=False)
    installment_available = Column(Boolean, default=False)
    
    # Location
    city_id = Column(Integer, ForeignKey("ph_cities.id"), nullable=False, index=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=False, index=True)
    region_id = Column(Integer, ForeignKey("ph_regions.id"), nullable=False, index=True)
    detailed_address = Column(Text)
    exact_location = Column(Text)  # Exact location details
    barangay = Column(String(100))
    latitude = Column(DECIMAL(10, 8), index=True)
    longitude = Column(DECIMAL(11, 8), index=True)

    # Media
    main_image = Column(String(500))
    total_images = Column(Integer, default=0)
    video_url = Column(String(500))
    virtual_tour_url = Column(String(500))
    
    # Status & Visibility
    status = Column(Enum(CarStatus), default=CarStatus.PENDING, nullable=False, index=True)
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False, index=True)
    visibility = Column(Enum(Visibility), default=Visibility.PUBLIC)
    rejection_reason = Column(Text)
    rejected_reason = Column(Text)  # SQL uses this name
    admin_notes = Column(Text)
    featured = Column(Boolean, default=False, index=True)  # SQL uses this name
    is_featured = Column(Boolean, default=False, index=True)
    is_premium = Column(Boolean, default=False, index=True)
    verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True, index=True)
    featured_until = Column(TIMESTAMP)
    premium_until = Column(TIMESTAMP)
    boosted_until = Column(TIMESTAMP)
    
    # SEO & Search
    seo_slug = Column(String(255), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    keywords = Column(Text)
    search_keywords = Column(Text)  # ← VERIFY THIS EXISTS
    
    # Metrics & Analytics
    view_count = Column(Integer, default=0)  # SQL uses this name
    views_count = Column(Integer, default=0)
    unique_views_count = Column(Integer, default=0)
    inquiry_count = Column(Integer, default=0)
    contact_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    favorite_count = Column(Integer, default=0)
    average_rating = Column(DECIMAL(3, 2), default=0.00)
    quality_score = Column(Integer, default=0)
    completeness_score = Column(Integer, default=0)
    ranking_score = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.now, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    published_at = Column(TIMESTAMP)
    expires_at = Column(TIMESTAMP, index=True)
    sold_at = Column(TIMESTAMP)
    deleted_at = Column(TIMESTAMP)
    
    # Relationships
    seller = relationship("User", foreign_keys=[seller_id], back_populates="cars")
    brand_rel = relationship("Brand")
    model_rel = relationship("Model")  # Renamed from 'model' to avoid conflict with model Column
    category = relationship("Category")
    city = relationship("PhCity")
    province = relationship("PhProvince")
    region = relationship("PhRegion")
    
    images = relationship("CarImage", back_populates="car", cascade="all, delete-orphan")
    features = relationship("CarFeature", back_populates="car", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="car", cascade="all, delete-orphan")
    views = relationship("CarView", back_populates="car")
    favorites = relationship("Favorite", back_populates="car")
    reviews = relationship("Review", back_populates="car")
    
    def __repr__(self):
        return f"<Car {self.id}: {self.title}>"


class CarImage(Base):
    __tablename__ = "car_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)

    # Image URL - FIXED: Only image_url exists in SQL schema
    image_url = Column(String(500), nullable=False)

    # Image Type - SQL enum: 'exterior', 'interior', 'engine', 'damage', 'document', 'other'
    image_type = Column(Enum("exterior", "interior", "engine", "damage", "document", "other"), default="exterior")

    # Display Options
    is_main = Column(Boolean, default=False, index=True)  # SQL uses 'is_main' not 'is_primary'
    display_order = Column(Integer, default=0)
    caption = Column(String(255))

    # Timestamps
    uploaded_at = Column(TIMESTAMP, default=datetime.now)

    # Relationships
    car = relationship("Car", back_populates="images")

    def __repr__(self):
        return f"<CarImage {self.id}: Car {self.car_id}>"


class CarFeature(Base):
    __tablename__ = "car_features"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    feature_id = Column(Integer, ForeignKey("features.id"), nullable=False, index=True)
    
    # Relationships
    car = relationship("Car", back_populates="features")
    feature = relationship("Feature")
    
    def __repr__(self):
        return f"<CarFeature Car {self.car_id}: {self.feature.name}>"