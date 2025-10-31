from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class FuelType(str, enum.Enum):
    GASOLINE = "gasoline"
    DIESEL = "diesel"
    HYBRID = "hybrid"
    ELECTRIC = "electric"
    CNG = "cng"
    LPG = "lpg"
    PLUGIN_HYBRID = "plugin_hybrid"


class TransmissionType(str, enum.Enum):
    MANUAL = "manual"
    AUTOMATIC = "automatic"
    SEMI_AUTOMATIC = "semi_automatic"
    CVT = "cvt"


class DrivetrainType(str, enum.Enum):
    FWD = "fwd"
    RWD = "rwd"
    AWD = "awd"
    FOUR_WD = "4wd"


class ConditionRating(str, enum.Enum):
    EXCELLENT = "excellent"
    VERY_GOOD = "very_good"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


class CarStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    SOLD = "sold"
    RESERVED = "reserved"
    EXPIRED = "expired"
    REMOVED = "removed"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVISION = "needs_revision"


class Brand(Base):
    __tablename__ = "brands"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    logo_url = Column(String(500))
    country_origin = Column(String(100))
    brand_type = Column(Enum("mainstream", "luxury", "commercial", "sports", "electric"), default="mainstream")
    is_popular_in_ph = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    
    # Relationships
    models = relationship("Model", back_populates="brand")
    
    def __repr__(self):
        return f"<Brand {self.name}>"


class Model(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    body_type = Column(Enum("sedan", "suv", "hatchback", "pickup", "van", "coupe", "convertible", "wagon", "mpv"), nullable=False)
    generation = Column(String(50))
    year_start = Column(Integer)
    year_end = Column(Integer)
    is_popular_in_ph = Column(Boolean, default=False)
    
    # Relationships
    brand = relationship("Brand", back_populates="models")
    
    def __repr__(self):
        return f"<Model {self.brand.name} {self.name}>"


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    icon = Column(String(100))
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<Category {self.name}>"


class Feature(Base):
    __tablename__ = "features"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(Enum("safety", "comfort", "entertainment", "technology", "performance", "exterior", "interior"), nullable=False)
    description = Column(Text)
    icon = Column(String(100))
    is_premium = Column(Boolean, default=False)
    is_popular = Column(Boolean, default=False)
    
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
    
    # Pricing
    price = Column(DECIMAL(12, 2), nullable=False, index=True)
    currency = Column(String(3), default="PHP")
    original_price = Column(DECIMAL(12, 2))
    discount_percentage = Column(DECIMAL(5, 2))  # ← VERIFY THIS EXISTS
    negotiable = Column(Boolean, default=True)
    
    # Vehicle Details
    vin_number = Column(String(17), unique=True, index=True)
    plate_number = Column(String(20), index=True)
    engine_number = Column(String(50))
    chassis_number = Column(String(50))
    
    # Technical Specifications
    mileage = Column(Integer, nullable=False, index=True)
    fuel_type = Column(Enum(FuelType), nullable=False, index=True)
    transmission = Column(Enum(TransmissionType), nullable=False, index=True)
    engine_size = Column(String(20))  # e.g., "1.5L", "2000cc"
    horsepower = Column(Integer)
    torque = Column(Integer)
    drivetrain = Column(Enum(DrivetrainType))
    seats = Column(Integer)
    doors = Column(Integer)
    
    # Exterior
    exterior_color = Column(String(50), index=True)
    color_type = Column(Enum("solid", "metallic", "pearl", "matte"))
    
    # Condition
    condition_rating = Column(Enum(ConditionRating), nullable=False, index=True)
    accident_history = Column(Boolean, default=False)
    accident_details = Column(Text)
    flood_history = Column(Boolean, default=False)
    number_of_owners = Column(Integer, default=1)
    service_history_available = Column(Boolean, default=False)
    
    # Ownership & Documentation
    registration_status = Column(Enum("registered", "unregistered", "for_transfer", "expired"), default="registered")
    or_cr_status = Column(Enum("complete", "incomplete", "missing"), default="complete")
    lto_registered = Column(Boolean, default=True)
    deed_of_sale_available = Column(Boolean, default=True)
    casa_maintained = Column(Boolean, default=False)
    
    # Insurance & Warranty
    insurance_status = Column(Enum("active", "expired", "none"), default="none")
    insurance_expiry = Column(TIMESTAMP)
    warranty_remaining = Column(Boolean, default=False)
    warranty_details = Column(Text)
    warranty_expiry = Column(TIMESTAMP)
    
    # Trade & Finance Options
    financing_available = Column(Boolean, default=False)
    trade_in_accepted = Column(Boolean, default=False)
    installment_available = Column(Boolean, default=False)
    
    # Location
    city_id = Column(Integer, ForeignKey("ph_cities.id"), nullable=False, index=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=False, index=True)
    region_id = Column(Integer, ForeignKey("ph_regions.id"), nullable=False, index=True)
    detailed_address = Column(Text)
    barangay = Column(String(100))
    latitude = Column(DECIMAL(10, 8), index=True)
    longitude = Column(DECIMAL(11, 8), index=True)
    
    # Status & Visibility
    status = Column(Enum(CarStatus), default=CarStatus.PENDING, nullable=False, index=True)
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False, index=True)
    rejection_reason = Column(Text)
    is_featured = Column(Boolean, default=False, index=True)
    is_premium = Column(Boolean, default=False, index=True)
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
    views_count = Column(Integer, default=0)
    unique_views_count = Column(Integer, default=0)
    contact_count = Column(Integer, default=0)
    favorite_count = Column(Integer, default=0)
    average_rating = Column(DECIMAL(3, 2), default=0.00)
    quality_score = Column(Integer, default=0)
    completeness_score = Column(Integer, default=0)
    ranking_score = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(TIMESTAMP)
    expires_at = Column(TIMESTAMP, index=True)
    sold_at = Column(TIMESTAMP)
    deleted_at = Column(TIMESTAMP)
    
    # Relationships
    seller = relationship("User", foreign_keys=[seller_id], back_populates="cars")
    brand = relationship("Brand")
    model = relationship("Model")
    category = relationship("Category")
    city = relationship("PhCity")
    province = relationship("PhProvince")
    region = relationship("PhRegion")
    
    images = relationship("CarImage", back_populates="car", cascade="all, delete-orphan")
    features = relationship("CarFeature", back_populates="car", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="car", cascade="all, delete-orphan")
    views = relationship("CarView", back_populates="car")
    favorites = relationship("Favorite", back_populates="car")
    
    def __repr__(self):
        return f"<Car {self.id}: {self.title}>"


class CarImage(Base):
    __tablename__ = "car_images"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Image URLs
    image_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500))
    medium_url = Column(String(500))
    
    # Image Details
    file_name = Column(String(255))
    file_size = Column(Integer)
    image_type = Column(Enum("exterior", "interior", "engine", "dashboard", "wheels", "damage", "documents", "other"), default="exterior")
    
    # Display Options
    is_primary = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    caption = Column(String(255))
    
    # Image Metadata
    width = Column(Integer)
    height = Column(Integer)
    exif_data = Column(JSON)
    
    # Timestamps
    uploaded_at = Column(TIMESTAMP, default=datetime.utcnow)
    
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