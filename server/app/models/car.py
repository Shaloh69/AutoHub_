from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, Date, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class FuelType(str, enum.Enum):
    """Fuel type enum - UPPERCASE to match SQL schema"""
    GASOLINE = "GASOLINE"
    DIESEL = "DIESEL"
    ELECTRIC = "ELECTRIC"
    HYBRID = "HYBRID"
    PLUG_IN_HYBRID = "PLUG_IN_HYBRID"


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
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"
    # REMOVED: VERY_GOOD - not in SQL schema (line 457-458)


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
    """Body type enum - UPPERCASE to match normalized SQL schema"""
    SEDAN = "SEDAN"
    SUV = "SUV"
    PICKUP = "PICKUP"
    VAN = "VAN"
    HATCHBACK = "HATCHBACK"
    COUPE = "COUPE"
    MPV = "MPV"
    CROSSOVER = "CROSSOVER"
    WAGON = "WAGON"
    CONVERTIBLE = "CONVERTIBLE"


class MileageUnit(str, enum.Enum):
    """Mileage unit enum - UPPERCASE to match normalized SQL schema"""
    KM = "KM"
    MILES = "MILES"


class Visibility(str, enum.Enum):
    """Visibility enum - UPPERCASE to match normalized SQL schema"""
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    UNLISTED = "UNLISTED"


class RegistrationStatus(str, enum.Enum):
    """Registration status enum - UPPERCASE to match normalized SQL schema"""
    REGISTERED = "REGISTERED"
    UNREGISTERED = "UNREGISTERED"
    EXPIRED = "EXPIRED"
    FOR_RENEWAL = "FOR_RENEWAL"


class ORCRStatus(str, enum.Enum):
    """OR/CR status enum - UPPERCASE to match normalized SQL schema"""
    COMPLETE = "COMPLETE"
    INCOMPLETE = "INCOMPLETE"
    PROCESSING = "PROCESSING"
    LOST = "LOST"


class InsuranceStatus(str, enum.Enum):
    """Insurance status enum - UPPERCASE to match normalized SQL schema"""
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    NONE = "NONE"


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
    model_type = Column(Enum("SEDAN", "SUV", "PICKUP", "VAN", "HATCHBACK", "COUPE", "MPV", "CROSSOVER"), default="SEDAN")
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
    category = Column(Enum("SAFETY", "COMFORT", "TECHNOLOGY", "PERFORMANCE", "EXTERIOR", "INTERIOR"), default="COMFORT", index=True)
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
    interior_color_id = Column(Integer, ForeignKey("standard_colors.id", ondelete="SET NULL"))

    # Basic Information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    year = Column(Integer, nullable=False, index=True)
    trim = Column(String(100))  # Trim level/variant

    # Pricing (NORMALIZED - using FK only)
    price = Column(DECIMAL(12, 2), nullable=False, index=True)
    currency_id = Column(Integer, ForeignKey("currencies.id"), default=1)
    original_price = Column(DECIMAL(12, 2))
    discount_amount = Column(DECIMAL(12, 2))
    discount_percentage = Column(DECIMAL(5, 2))
    price_negotiable = Column(Boolean, default=True)

    # Vehicle Details (NORMALIZED - removed VIN duplicate)
    vin_number = Column(String(17), unique=True, index=True)
    plate_number = Column(String(20), index=True)
    engine_number = Column(String(50))
    chassis_number = Column(String(50))
    body_type = Column(Enum(BodyType))

    # Technical Specifications (NORMALIZED - removed engine_type, using fuel_type)
    mileage = Column(Integer, nullable=False, default=0, index=True)
    mileage_unit = Column(Enum(MileageUnit), default=MileageUnit.KM)
    fuel_type = Column(Enum(FuelType), default=FuelType.GASOLINE, index=True)
    transmission = Column(Enum(TransmissionType), default=TransmissionType.AUTOMATIC, index=True)
    engine_size = Column(String(20))  # e.g., "1.5L", "2000cc"
    cylinders = Column(Integer)
    horsepower = Column(Integer)
    torque = Column(Integer)
    fuel_economy_city = Column(DECIMAL(5, 2))  # km/L or mpg
    fuel_economy_highway = Column(DECIMAL(5, 2))  # km/L or mpg
    drivetrain = Column(Enum(DrivetrainType))
    seats = Column(Integer)
    doors = Column(Integer)

    # Condition (NORMALIZED - removed duplicate condition fields)
    car_condition = Column(Enum(ConditionRating), default=ConditionRating.GOOD, index=True)
    accident_history = Column(Boolean, default=False)
    accident_details = Column(Text)
    flood_history = Column(Boolean, default=False)
    number_of_owners = Column(Integer, default=1)
    service_history_available = Column(Boolean, default=False)

    # Ownership & Documentation (NORMALIZED - using proper ENUMs)
    registration_status = Column(Enum(RegistrationStatus), default=RegistrationStatus.REGISTERED)
    registration_expiry = Column(Date)
    or_cr_status = Column(Enum(ORCRStatus), default=ORCRStatus.COMPLETE)
    lto_registered = Column(Boolean, default=False)
    deed_of_sale_available = Column(Boolean, default=False)
    has_emission_test = Column(Boolean, default=False)
    casa_maintained = Column(Boolean, default=False)

    # Insurance & Warranty (NORMALIZED - using proper ENUMs)
    insurance_status = Column(Enum(InsuranceStatus), default=InsuranceStatus.NONE)
    insurance_expiry = Column(Date)
    warranty_remaining = Column(Boolean, default=False)
    warranty_details = Column(Text)
    warranty_expiry = Column(Date)

    # Trade & Finance Options
    financing_available = Column(Boolean, default=False)
    trade_in_accepted = Column(Boolean, default=False)
    installment_available = Column(Boolean, default=False)

    # Location (NORMALIZED - removed exact_location duplicate)
    city_id = Column(Integer, ForeignKey("ph_cities.id"), nullable=False, index=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=False, index=True)
    region_id = Column(Integer, ForeignKey("ph_regions.id"), nullable=False, index=True)
    detailed_address = Column(Text)
    barangay = Column(String(100))
    latitude = Column(DECIMAL(10, 8), index=True)
    longitude = Column(DECIMAL(11, 8), index=True)

    # Media
    main_image = Column(String(500))
    total_images = Column(Integer, default=0)
    video_url = Column(String(500))
    virtual_tour_url = Column(String(500))

    # Status & Visibility (NORMALIZED - removed duplicates)
    status = Column(Enum(CarStatus), default=CarStatus.DRAFT, nullable=False, index=True)
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False, index=True)
    visibility = Column(Enum(Visibility), default=Visibility.PUBLIC)
    rejection_reason = Column(Text)
    admin_notes = Column(Text)
    is_featured = Column(Boolean, default=False, index=True)
    is_premium = Column(Boolean, default=False, index=True)
    verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True, index=True)
    featured_until = Column(TIMESTAMP)
    premium_until = Column(TIMESTAMP)
    boosted_until = Column(TIMESTAMP)

    # SEO & Search (NORMALIZED - removed keywords duplicate)
    seo_slug = Column(String(255), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    search_keywords = Column(Text)

    # Metrics & Analytics (NORMALIZED - removed view_count duplicate)
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

    # Table-level constraints and indexes
    __table_args__ = (
        Index('idx_location', 'city_id', 'province_id', 'region_id'),
        Index('idx_fulltext', 'title', 'description', 'search_keywords', mysql_prefix='FULLTEXT'),
    )

    # Relationships
    seller = relationship("User", foreign_keys=[seller_id], back_populates="cars")
    brand_rel = relationship("Brand")
    model_rel = relationship("Model")  # Renamed from 'model' to avoid conflict with model Column
    category = relationship("Category")
    color_rel = relationship("StandardColor", foreign_keys=[color_id])
    interior_color_rel = relationship("StandardColor", foreign_keys=[interior_color_id])
    currency_rel = relationship("Currency", foreign_keys=[currency_id])
    city = relationship("PhCity")
    province = relationship("PhProvince")
    region = relationship("PhRegion")

    images = relationship("CarImage", back_populates="car", cascade="all, delete-orphan")
    documents = relationship("CarDocument", back_populates="car", cascade="all, delete-orphan")
    features = relationship("CarFeature", back_populates="car", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="car", cascade="all, delete-orphan")
    views = relationship("CarView", back_populates="car")
    favorites = relationship("Favorite", back_populates="car")
    reviews = relationship("Review", back_populates="car")
    
    def __repr__(self):
        return f"<Car {self.id}: {self.title}>"

    # Note: Brand and Model are stored as FKs, not string names
    # - Use brand_id and model_id columns (FKs to brands/models tables)
    # - Use brand_rel and model_rel relationships for accessing brand/model objects
    # - API layer converts these to response format via CarResponse schema


class CarImage(Base):
    __tablename__ = "car_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)

    # Image URL
    image_url = Column(String(500), nullable=False)

    # Image Type - UPPERCASE to match normalized SQL schema
    image_type = Column(Enum("EXTERIOR", "INTERIOR", "ENGINE", "DAMAGE", "DOCUMENT", "OTHER"), default="EXTERIOR")

    # Display Options
    is_main = Column(Boolean, default=False, index=True)
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