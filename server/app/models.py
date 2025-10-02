from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date, 
    Numeric, Enum, ForeignKey, Index, JSON, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import POINT
from datetime import datetime
from database import Base
import enum


# Enums
class UserRole(str, enum.Enum):
    BUYER = "buyer"
    SELLER = "seller"
    DEALER = "dealer"
    ADMIN = "admin"
    MODERATOR = "moderator"


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


class FuelType(str, enum.Enum):
    GASOLINE = "gasoline"
    DIESEL = "diesel"
    HYBRID = "hybrid"
    ELECTRIC = "electric"
    CNG = "cng"
    LPG = "lpg"
    PLUGIN_HYBRID = "plugin-hybrid"


class TransmissionType(str, enum.Enum):
    MANUAL = "manual"
    AUTOMATIC = "automatic"
    SEMI_AUTOMATIC = "semi-automatic"
    CVT = "cvt"


# Models
class Currency(Base):
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(3), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    symbol = Column(String(10), nullable=False)
    exchange_rate_to_php = Column(Numeric(10, 4), default=1.0000)
    is_active = Column(Boolean, default=True, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PHRegion(Base):
    __tablename__ = "ph_regions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    region_code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    long_name = Column(String(200))
    is_active = Column(Boolean, default=True)
    
    provinces = relationship("PHProvince", back_populates="region")
    users = relationship("User", back_populates="region")
    cars = relationship("Car", back_populates="region")


class PHProvince(Base):
    __tablename__ = "ph_provinces"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    region_id = Column(Integer, ForeignKey("ph_regions.id"), nullable=False, index=True)
    province_code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    capital = Column(String(100))
    is_active = Column(Boolean, default=True)
    
    region = relationship("PHRegion", back_populates="provinces")
    cities = relationship("PHCity", back_populates="province")
    users = relationship("User", back_populates="province")
    cars = relationship("Car", back_populates="province")


class PHCity(Base):
    __tablename__ = "ph_cities"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=False, index=True)
    city_code = Column(String(10), unique=True)
    name = Column(String(100), nullable=False, index=True)
    city_type = Column(Enum("city", "municipality", "district"), default="city", index=True)
    is_highly_urbanized = Column(Boolean, default=False)
    latitude = Column(Numeric(10, 8), nullable=False, default=0)
    longitude = Column(Numeric(11, 8), nullable=False, default=0)
    postal_codes = Column(JSON)
    is_active = Column(Boolean, default=True)
    location_point = Column(POINT, nullable=False)
    
    province = relationship("PHProvince", back_populates="cities")
    users = relationship("User", back_populates="city")
    cars = relationship("Car", back_populates="city")
    
    __table_args__ = (
        Index('idx_coordinates', 'latitude', 'longitude'),
    )


class StandardColor(Base):
    __tablename__ = "standard_colors"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    hex_code = Column(String(7))
    color_family = Column(
        Enum("black", "white", "silver", "gray", "red", "blue", "green", 
             "yellow", "orange", "brown", "purple", "other"),
        nullable=False,
        index=True
    )
    is_common = Column(Boolean, default=True, index=True)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.BUYER, index=True)
    profile_image = Column(String(500))
    
    # Address
    address = Column(Text)
    city_id = Column(Integer, ForeignKey("ph_cities.id"))
    province_id = Column(Integer, ForeignKey("ph_provinces.id"))
    region_id = Column(Integer, ForeignKey("ph_regions.id"))
    postal_code = Column(String(10))
    barangay = Column(String(100))
    
    # Business info
    business_name = Column(String(200))
    business_permit_number = Column(String(100))
    tin_number = Column(String(20))
    dealer_license_number = Column(String(100))
    
    # Verification
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    identity_verified = Column(Boolean, default=False)
    business_verified = Column(Boolean, default=False)
    
    # Documents
    valid_id_front_url = Column(String(500))
    valid_id_back_url = Column(String(500))
    selfie_with_id_url = Column(String(500))
    business_permit_url = Column(String(500))
    
    # Ratings
    average_rating = Column(Numeric(3, 2), default=0.00, index=True)
    total_ratings = Column(Integer, default=0)
    total_sales = Column(Integer, default=0)
    total_purchases = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_banned = Column(Boolean, default=False, index=True)
    ban_reason = Column(Text)
    ban_expires_at = Column(DateTime)
    
    # Fraud
    fraud_score = Column(Numeric(3, 2), default=0.00, index=True)
    warning_count = Column(Integer, default=0)
    last_warning_at = Column(DateTime)
    
    # Preferences
    preferred_currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    
    # Tracking
    last_login_at = Column(DateTime, index=True)
    last_login_ip = Column(String(45))
    login_count = Column(Integer, default=0)
    
    # Subscription fields
    current_subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"))
    subscription_status = Column(
        Enum("none", "active", "cancelled", "expired", "trial"),
        default="none",
        index=True
    )
    subscription_expires_at = Column(DateTime, index=True)
    total_subscription_payments = Column(Numeric(12, 2), default=0.00)
    subscription_started_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    city = relationship("PHCity", back_populates="users")
    province = relationship("PHProvince", back_populates="users")
    region = relationship("PHRegion", back_populates="users")
    cars = relationship("Car", back_populates="seller", foreign_keys="Car.seller_id")
    inquiries_sent = relationship("Inquiry", back_populates="buyer", foreign_keys="Inquiry.buyer_id")
    inquiries_received = relationship("Inquiry", back_populates="seller", foreign_keys="Inquiry.seller_id")
    
    __table_args__ = (
        Index('idx_location', 'city_id', 'province_id', 'region_id'),
        Index('idx_verified', 'identity_verified', 'phone_verified', 'business_verified'),
        Index('idx_active', 'is_active', 'is_banned'),
    )


class Brand(Base):
    __tablename__ = "brands"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    logo_url = Column(String(500))
    country_origin = Column(String(100))
    brand_type = Column(
        Enum("luxury", "mainstream", "economy", "commercial", "motorcycle"),
        default="mainstream",
        index=True
    )
    is_popular_in_ph = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True)
    seo_slug = Column(String(150), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    models = relationship("Model", back_populates="brand")
    cars = relationship("Car", back_populates="brand")


class Model(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    body_type = Column(
        Enum("sedan", "hatchback", "suv", "coupe", "convertible", "pickup", 
             "van", "wagon", "crossover", "minivan", "mpv", "jeepney", "tricycle"),
        nullable=False,
        index=True
    )
    generation = Column(String(50))
    year_start = Column(Integer)
    year_end = Column(Integer)
    is_popular_in_ph = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True)
    seo_slug = Column(String(200), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    brand = relationship("Brand", back_populates="models")
    cars = relationship("Car", back_populates="model")
    
    __table_args__ = (
        Index('idx_years', 'year_start', 'year_end'),
    )


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("categories.id"), index=True)
    icon_class = Column(String(100))
    image_url = Column(String(500))
    is_featured = Column(Boolean, default=False, index=True)
    sort_order = Column(Integer, default=0, index=True)
    is_active = Column(Boolean, default=True)
    seo_slug = Column(String(150), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    cars = relationship("Car", back_populates="category")


class Feature(Base):
    __tablename__ = "features"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(
        Enum("safety", "comfort", "technology", "performance", 
             "exterior", "interior", "entertainment", "convenience"),
        nullable=False,
        index=True
    )
    description = Column(Text)
    icon_class = Column(String(100))
    is_premium = Column(Boolean, default=False, index=True)
    is_popular = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Car(Base):
    __tablename__ = "cars"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="RESTRICT"), nullable=False, index=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="RESTRICT"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    # Basic info
    title = Column(String(255), nullable=False)
    description = Column(Text)
    year = Column(Integer, nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False, index=True)
    original_price = Column(Numeric(12, 2))
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    negotiable = Column(Boolean, default=True)
    financing_available = Column(Boolean, default=False)
    trade_in_accepted = Column(Boolean, default=False)
    
    # Technical specs
    mileage = Column(Integer, nullable=False)
    fuel_type = Column(Enum(FuelType), nullable=False, index=True)
    transmission = Column(Enum(TransmissionType), nullable=False, index=True)
    engine_size = Column(String(20))
    horsepower = Column(Integer)
    drivetrain = Column(Enum("fwd", "rwd", "awd", "4wd"))
    
    # Colors
    exterior_color_id = Column(Integer, ForeignKey("standard_colors.id"))
    interior_color_id = Column(Integer, ForeignKey("standard_colors.id"))
    custom_exterior_color = Column(String(50))
    custom_interior_color = Column(String(50))
    
    # Condition
    condition_rating = Column(
        Enum("excellent", "very_good", "good", "fair", "poor"),
        nullable=False,
        index=True
    )
    accident_history = Column(Boolean, default=False)
    accident_details = Column(Text)
    flood_history = Column(Boolean, default=False)
    service_history = Column(Boolean, default=True)
    service_records_available = Column(Boolean, default=False)
    number_of_owners = Column(Integer, default=1)
    warranty_remaining = Column(Boolean, default=False)
    warranty_details = Column(Text)
    
    # Vehicle ID
    vin = Column(String(17), unique=True)
    engine_number = Column(String(50))
    chassis_number = Column(String(50))
    plate_number = Column(String(20))
    registration_expiry = Column(Date)
    or_cr_available = Column(Boolean, default=True)
    
    # Philippines specific
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
    latitude = Column(Numeric(10, 8), nullable=False, default=14.5995)
    longitude = Column(Numeric(11, 8), nullable=False, default=120.9842)
    location_point = Column(POINT, nullable=False)
    
    # Status
    status = Column(Enum(CarStatus), nullable=False, default=CarStatus.PENDING, index=True)
    approval_status = Column(
        Enum("pending", "approved", "rejected", "needs_revision"),
        nullable=False,
        default="pending",
        index=True
    )
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)
    revision_notes = Column(Text)
    
    # Premium features
    is_featured = Column(Boolean, default=False, index=True)
    featured_until = Column(DateTime, index=True)
    is_premium = Column(Boolean, default=False, index=True)
    premium_until = Column(DateTime, index=True)
    boost_count = Column(Integer, default=0)
    last_boosted_at = Column(DateTime)
    subscription_boosted = Column(Boolean, default=False)
    subscription_boost_expires_at = Column(DateTime)
    subscription_featured_type = Column(
        Enum("none", "basic", "premium", "enterprise"),
        default="none",
        index=True
    )
    
    # Metrics
    views_count = Column(Integer, default=0)
    unique_views_count = Column(Integer, default=0)
    contact_count = Column(Integer, default=0)
    favorite_count = Column(Integer, default=0)
    average_rating = Column(Numeric(3, 2), default=0.00, index=True)
    total_ratings = Column(Integer, default=0)
    
    # SEO
    search_score = Column(Numeric(5, 2), default=0, index=True)
    seo_slug = Column(String(255), unique=True, index=True)
    meta_title = Column(String(255))
    meta_description = Column(Text)
    keywords = Column(Text)
    quality_score = Column(Numeric(3, 2), default=0.00, index=True)
    completeness_score = Column(Numeric(3, 2), default=0.00)
    
    # Timestamps
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, index=True)
    sold_at = Column(DateTime)
    last_price_update = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = relationship("User", back_populates="cars", foreign_keys=[seller_id])
    brand = relationship("Brand", back_populates="cars")
    model = relationship("Model", back_populates="cars")
    category = relationship("Category", back_populates="cars")
    city = relationship("PHCity", back_populates="cars")
    province = relationship("PHProvince", back_populates="cars")
    region = relationship("PHRegion", back_populates="cars")
    images = relationship("CarImage", back_populates="car", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="car", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_brand_model', 'brand_id', 'model_id'),
        Index('idx_location', 'city_id', 'province_id', 'region_id'),
        Index('idx_fuel_transmission', 'fuel_type', 'transmission'),
        Index('idx_status', 'status', 'approval_status'),
        Index('idx_location_price', 'city_id', 'price'),
        Index('idx_seller_status', 'seller_id', 'status', 'created_at'),
    )


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
    image_type = Column(
        Enum("exterior", "interior", "engine", "documents", "damage", "service_records", "other"),
        default="exterior",
        index=True
    )
    view_angle = Column(
        Enum("front", "rear", "side_left", "side_right", "interior_dashboard",
             "interior_seats", "engine_bay", "document", "other")
    )
    is_360_view = Column(Boolean, default=False)
    processing_status = Column(
        Enum("uploading", "processing", "ready", "failed"),
        default="uploading",
        index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    
    car = relationship("Car", back_populates="images")


class Inquiry(Base):
    __tablename__ = "inquiries"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(255))
    message = Column(Text, nullable=False)
    buyer_name = Column(String(200))
    buyer_email = Column(String(255))
    buyer_phone = Column(String(20))
    
    inquiry_type = Column(
        Enum("general", "test_drive", "price_negotiation", "inspection",
             "purchase_intent", "financing", "trade_in"),
        default="general",
        index=True
    )
    offered_price = Column(Numeric(12, 2))
    test_drive_requested = Column(Boolean, default=False)
    inspection_requested = Column(Boolean, default=False)
    financing_needed = Column(Boolean, default=False)
    trade_in_vehicle = Column(Text)
    
    status = Column(
        Enum("new", "read", "replied", "in_negotiation", "test_drive_scheduled", "closed", "converted", "spam"),
        default="new",
        index=True
    )
    is_read = Column(Boolean, default=False)
    priority = Column(Enum("low", "medium", "high", "urgent"), default="medium", index=True)
    
    response_count = Column(Integer, default=0)
    last_response_at = Column(DateTime)
    last_response_by = Column(Integer, ForeignKey("users.id"))
    
    auto_close_at = Column(DateTime)
    closed_reason = Column(
        Enum("resolved", "no_response", "spam", "inappropriate", "car_sold", "buyer_cancelled")
    )
    
    buyer_rating = Column(Numeric(3, 2))
    seller_rating = Column(Numeric(3, 2))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    car = relationship("Car", back_populates="inquiries")
    buyer = relationship("User", back_populates="inquiries_sent", foreign_keys=[buyer_id])
    seller = relationship("User", back_populates="inquiries_received", foreign_keys=[seller_id])
    responses = relationship("InquiryResponse", back_populates="inquiry", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_seller_status', 'seller_id', 'status', 'created_at'),
    )


class InquiryResponse(Base):
    __tablename__ = "inquiry_responses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    is_internal_note = Column(Boolean, default=False)
    is_automated = Column(Boolean, default=False)
    response_type = Column(
        Enum("message", "price_counter", "schedule_test_drive", "send_documents", "final_offer"),
        default="message",
        index=True
    )
    counter_offer_price = Column(Numeric(12, 2))
    suggested_datetime = Column(DateTime)
    meeting_location = Column(Text)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    inquiry = relationship("Inquiry", back_populates="responses")


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    plan_type = Column(
        Enum("free", "basic", "premium", "pro", "enterprise"),
        nullable=False,
        index=True
    )
    
    monthly_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    yearly_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    setup_fee = Column(Numeric(10, 2), default=0.00)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    billing_cycle = Column(Enum("monthly", "yearly", "lifetime"), nullable=False, default="monthly")
    trial_days = Column(Integer, default=0)
    
    max_active_listings = Column(Integer, default=5)
    max_featured_listings = Column(Integer, default=0)
    max_premium_listings = Column(Integer, default=0)
    max_images_per_listing = Column(Integer, default=10)
    
    priority_ranking_boost = Column(Integer, default=0)
    featured_in_homepage = Column(Boolean, default=False)
    featured_in_category = Column(Boolean, default=False)
    featured_in_search = Column(Boolean, default=False)
    social_media_promotion = Column(Boolean, default=False)
    
    advanced_analytics = Column(Boolean, default=False)
    competitor_insights = Column(Boolean, default=False)
    market_value_reports = Column(Boolean, default=False)
    custom_reports = Column(Boolean, default=False)
    
    priority_customer_support = Column(Boolean, default=False)
    dedicated_account_manager = Column(Boolean, default=False)
    phone_support = Column(Boolean, default=False)
    live_chat_support = Column(Boolean, default=False)
    
    auto_boost_listings = Column(Boolean, default=False)
    email_marketing_tools = Column(Boolean, default=False)
    lead_management_tools = Column(Boolean, default=False)
    crm_integration = Column(Boolean, default=False)
    
    verified_seller_badge = Column(Boolean, default=False)
    background_check_included = Column(Boolean, default=False)
    insurance_coverage = Column(Boolean, default=False)
    transaction_protection = Column(Boolean, default=False)
    
    api_access = Column(Boolean, default=False)
    white_label_options = Column(Boolean, default=False)
    custom_branding = Column(Boolean, default=False)
    bulk_upload_tools = Column(Boolean, default=False)
    
    is_active = Column(Boolean, default=True, index=True)
    is_popular = Column(Boolean, default=False, index=True)
    is_featured = Column(Boolean, default=False)
    display_order = Column(Integer, default=0, index=True)
    
    monthly_boost_credits = Column(Integer, default=0)
    monthly_featured_credits = Column(Integer, default=0)
    monthly_email_campaigns = Column(Integer, default=0)
    storage_quota_gb = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_pricing', 'monthly_price', 'yearly_price'),
    )


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    status = Column(
        Enum("active", "cancelled", "expired", "suspended", "pending", "trial", "past_due"),
        nullable=False,
        default="pending",
        index=True
    )
    billing_cycle = Column(Enum("monthly", "yearly", "lifetime"), nullable=False)
    
    monthly_price = Column(Numeric(10, 2), nullable=False)
    yearly_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), ForeignKey("currencies.code"), default="PHP")
    
    started_at = Column(DateTime, nullable=False)
    trial_ends_at = Column(DateTime)
    current_period_start = Column(DateTime, nullable=False, index=True)
    current_period_end = Column(DateTime, nullable=False, index=True)
    next_billing_date = Column(DateTime, index=True)
    cancelled_at = Column(DateTime)
    expires_at = Column(DateTime)
    
    payment_method = Column(
        Enum("credit_card", "bank_transfer", "gcash", "paymaya", "paypal", "cash"),
        default="credit_card"
    )
    payment_provider = Column(String(100))
    external_subscription_id = Column(String(255), index=True)
    
    cancel_reason = Column(
        Enum("voluntary", "payment_failed", "fraud", "policy_violation", "downgrade", "upgrade")
    )
    cancel_notes = Column(Text)
    cancelled_by = Column(Integer, ForeignKey("users.id"))
    
    auto_renew = Column(Boolean, default=True)
    auto_renew_disabled_at = Column(DateTime)
    
    discount_percent = Column(Numeric(5, 2), default=0.00)
    discount_amount = Column(Numeric(10, 2), default=0.00)
    promotion_code = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_billing_dates', 'current_period_start', 'current_period_end'),
        Index('idx_user_active', 'user_id', 'status', 'current_period_end'),
    )