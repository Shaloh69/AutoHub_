from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum, Date, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class BrandType(str, enum.Enum):
    LUXURY = "luxury"
    MAINSTREAM = "mainstream"
    ECONOMY = "economy"
    COMMERCIAL = "commercial"
    MOTORCYCLE = "motorcycle"


class BodyType(str, enum.Enum):
    SEDAN = "sedan"
    HATCHBACK = "hatchback"
    SUV = "suv"
    COUPE = "coupe"
    CONVERTIBLE = "convertible"
    PICKUP = "pickup"
    VAN = "van"
    WAGON = "wagon"
    CROSSOVER = "crossover"
    MINIVAN = "minivan"
    MPV = "mpv"
    JEEPNEY = "jeepney"
    TRICYCLE = "tricycle"


class FuelType(str, enum.Enum):
    GASOLINE = "gasoline"
    DIESEL = "diesel"
    HYBRID = "hybrid"
    ELECTRIC = "electric"
    CNG = "cng"
    LPG = "lpg"
    PLUGIN_HYBRID = "plugin-hybrid"


class Transmission(str, enum.Enum):
    MANUAL = "manual"
    AUTOMATIC = "automatic"
    SEMI_AUTOMATIC = "semi-automatic"
    CVT = "cvt"


class Drivetrain(str, enum.Enum):
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
    APPROVED = "approved"
    REJECTED = "rejected"
    SOLD = "sold"
    RESERVED = "reserved"
    REMOVED = "removed"
    EXPIRED = "expired"
    SUSPENDED = "suspended"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVISION = "needs_revision"


class FeatureCategory(str, enum.Enum):
    SAFETY = "safety"
    COMFORT = "comfort"
    TECHNOLOGY = "technology"
    PERFORMANCE = "performance"
    EXTERIOR = "exterior"
    INTERIOR = "interior"
    ENTERTAINMENT = "entertainment"
    CONVENIENCE = "convenience"


class ImageType(str, enum.Enum):
    EXTERIOR = "exterior"
    INTERIOR = "interior"
    ENGINE = "engine"
    DOCUMENTS = "documents"
    DAMAGE = "damage"
    SERVICE_RECORDS = "service_records"
    OTHER = "other"


class ViewAngle(str, enum.Enum):
    FRONT = "front"
    REAR = "rear"
    SIDE_LEFT = "side_left"
    SIDE_RIGHT = "side_right"
    INTERIOR_DASHBOARD = "interior_dashboard"
    INTERIOR_SEATS = "interior_seats"
    ENGINE_BAY = "engine_bay"
    DOCUMENT = "document"
    OTHER = "other"


class Brand(Base):
    __tablename__ = "brands"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    logo_url = Column(String(500))
    country_origin = Column(String(100))
    brand_type = Column(Enum(BrandType), default=BrandType.MAINSTREAM, index=True)
    is_popular_in_ph = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True)
    seo_slug = Column(String(150), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    models = relationship("Model", back_populates="brand", cascade="all, delete-orphan")
    cars = relationship("Car", back_populates="brand")
    
    def __repr__(self):
        return f"<Brand {self.id}: {self.name}>"


class Model(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    body_type = Column(Enum(BodyType), nullable=False, index=True)
    generation = Column(String(50))
    year_start = Column(Integer, index=True)
    year_end = Column(Integer, index=True)
    is_popular_in_ph = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True)
    seo_slug = Column(String(200), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    brand = relationship("Brand", back_populates="models")
    cars = relationship("Car", back_populates="model")
    
    def __repr__(self):
        return f"<Model {self.id}: {self.brand.name if self.brand else ''} {self.name}>"


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    icon_class = Column(String(100))
    image_url = Column(String(500))
    is_featured = Column(Boolean, default=False, index=True)
    sort_order = Column(Integer, default=0, index=True)
    is_active = Column(Boolean, default=True)
    seo_slug = Column(String(150), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    cars = relationship("Car", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.id}: {self.name}>"


class Feature(Base):
    __tablename__ = "features"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(Enum(FeatureCategory), nullable=False, index=True)
    description = Column(Text)
    icon_class = Column(String(100))
    is_premium = Column(Boolean, default=False, index=True)
    is_popular = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    car_features = relationship("CarFeature", back_populates="feature")
    
    def __repr__(self):
        return f"<Feature {self.id}: {self.name}>"


class Car(Base):
    __tablename__ = "cars"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="RESTRICT"), nullable=False, index=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="RESTRICT"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    
    # Basic Info
    title = Column(String(255), nullable=False)
    description = Column(Text)
    year = Column(Integer, nullable=False, index=True)
    price = Column(DECIMAL(12, 2), nullable=False, index=True)
    original_price = Column(DECIMAL(12, 2))
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    negotiable = Column(Boolean, default=True)
    financing_available = Column(Boolean, default=False)
    trade_in_accepted = Column(Boolean, default=False)
    
    # Technical Specifications
    mileage = Column(Integer, nullable=False)
    fuel_type = Column(Enum(FuelType), nullable=False, index=True)
    transmission = Column(Enum(Transmission), nullable=False, index=True)
    engine_size = Column(String(20))
    horsepower = Column(Integer)
    drivetrain = Column(Enum(Drivetrain))
    
    # Colors
    exterior_color_id = Column(Integer, ForeignKey("standard_colors.id", ondelete="SET NULL"))
    interior_color_id = Column(Integer, ForeignKey("standard_colors.id", ondelete="SET NULL"))
    custom_exterior_color = Column(String(50))
    custom_interior_color = Column(String(50))
    
    # Condition & History
    condition_rating = Column(Enum(ConditionRating), nullable=False, index=True)
    accident_history = Column(Boolean, default=False)
    accident_details = Column(Text)
    flood_history = Column(Boolean, default=False)
    service_history = Column(Boolean, default=True)
    service_records_available = Column(Boolean, default=False)
    number_of_owners = Column(Integer, default=1)
    warranty_remaining = Column(Boolean, default=False)
    warranty_details = Column(Text)
    
    # Vehicle Identification
    vin = Column(String(17), unique=True)
    engine_number = Column(String(50))
    chassis_number = Column(String(50))
    plate_number = Column(String(20))
    registration_expiry = Column(Date)
    or_cr_available = Column(Boolean, default=True)
    
    # Philippines Specific
    lto_registered = Column(Boolean, default=True)
    casa_maintained = Column(Boolean, default=False)
    comprehensive_insurance = Column(Boolean, default=False)
    insurance_company = Column(String(100))
    insurance_expiry = Column(Date)
    
    # Location
    city_id = Column(Integer, ForeignKey("ph_cities.id", ondelete="RESTRICT"), nullable=False, index=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id", ondelete="RESTRICT"), nullable=False, index=True)
    region_id = Column(Integer, ForeignKey("ph_regions.id", ondelete="RESTRICT"), nullable=False, index=True)
    barangay = Column(String(100))
    detailed_address = Column(Text)
    latitude = Column(DECIMAL(10, 8), nullable=False, default=14.5995)
    longitude = Column(DECIMAL(11, 8), nullable=False, default=120.9842)
    
    # Listing Management
    status = Column(Enum(CarStatus), nullable=False, default=CarStatus.PENDING, index=True)
    approval_status = Column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.PENDING, index=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(TIMESTAMP, nullable=True)
    rejection_reason = Column(Text)
    revision_notes = Column(Text)
    
    # Premium Features
    is_featured = Column(Boolean, default=False, index=True)
    featured_until = Column(TIMESTAMP, nullable=True, index=True)
    is_premium = Column(Boolean, default=False, index=True)
    premium_until = Column(TIMESTAMP, nullable=True, index=True)
    boost_count = Column(Integer, default=0)
    last_boosted_at = Column(TIMESTAMP, nullable=True)
    
    # Subscription features
    subscription_boosted = Column(Boolean, default=False, index=True)
    subscription_boost_expires_at = Column(TIMESTAMP, nullable=True, index=True)
    subscription_featured_type = Column(
        Enum("none", "basic", "premium", "enterprise", name="subscription_featured_type_enum"),
        default="none",
        index=True
    )
    
    # Performance Metrics
    views_count = Column(Integer, default=0)
    unique_views_count = Column(Integer, default=0)
    contact_count = Column(Integer, default=0)
    favorite_count = Column(Integer, default=0)
    average_rating = Column(DECIMAL(3, 2), default=0.00, index=True)
    total_ratings = Column(Integer, default=0)
    
    # Search & SEO
    search_score = Column(DECIMAL(5, 2), default=0, index=True)
    seo_slug = Column(String(255), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    keywords = Column(Text)
    
    # Quality Score
    quality_score = Column(DECIMAL(3, 2), default=0.00, index=True)
    completeness_score = Column(DECIMAL(3, 2), default=0.00)
    
    # Timestamps
    is_active = Column(Boolean, default=True, index=True)
    expires_at = Column(TIMESTAMP, nullable=True, index=True)
    sold_at = Column(TIMESTAMP, nullable=True)
    last_price_update = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Constraints
    __table_args__ = (
        CheckConstraint('year >= 1900 AND year <= 2026', name='chk_year'),
        CheckConstraint('mileage >= 0', name='chk_mileage'),
        CheckConstraint('price > 0', name='chk_price'),
        CheckConstraint('number_of_owners > 0', name='chk_owners'),
        CheckConstraint('quality_score >= 0 AND quality_score <= 10', name='chk_quality_score'),
        CheckConstraint('completeness_score >= 0 AND completeness_score <= 100', name='chk_completeness_score'),
        CheckConstraint('latitude BETWEEN 4.0 AND 21.0', name='chk_car_latitude_ph'),
        CheckConstraint('longitude BETWEEN 116.0 AND 127.0', name='chk_car_longitude_ph'),
    )
    
    # Relationships
    seller = relationship("User", foreign_keys=[seller_id], back_populates="cars")
    brand = relationship("Brand", back_populates="cars")
    model = relationship("Model", back_populates="cars")
    category = relationship("Category", back_populates="cars")
    city = relationship("PhCity", foreign_keys=[city_id])
    province = relationship("PhProvince", foreign_keys=[province_id])
    region = relationship("PhRegion", foreign_keys=[region_id])
    exterior_color = relationship("StandardColor", foreign_keys=[exterior_color_id])
    interior_color = relationship("StandardColor", foreign_keys=[interior_color_id])
    
    images = relationship("CarImage", back_populates="car", cascade="all, delete-orphan")
    features = relationship("CarFeature", back_populates="car", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="car", cascade="all, delete-orphan")
    views = relationship("CarView", back_populates="car", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="car", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="car", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Car {self.id}: {self.title}>"


class CarImage(Base):
    __tablename__ = "car_images"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500))
    medium_url = Column(String(500))
    large_url = Column(String(500))
    alt_text = Column(String(255))
    is_primary = Column(Boolean, default=False, index=True)
    display_order = Column(Integer, default=0, index=True)
    file_size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    image_type = Column(Enum(ImageType), default=ImageType.EXTERIOR, index=True)
    view_angle = Column(Enum(ViewAngle))
    is_360_view = Column(Boolean, default=False)
    processing_status = Column(
        Enum("uploading", "processing", "ready", "failed", name="processing_status_enum"),
        default="uploading",
        index=True
    )
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    car = relationship("Car", back_populates="images")
    
    def __repr__(self):
        return f"<CarImage {self.id} for Car {self.car_id}>"


class CarFeature(Base):
    __tablename__ = "car_features"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    feature_id = Column(Integer, ForeignKey("features.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    car = relationship("Car", back_populates="features")
    feature = relationship("Feature", back_populates="car_features")
    
    def __repr__(self):
        return f"<CarFeature: Car {self.car_id}, Feature {self.feature_id}>"