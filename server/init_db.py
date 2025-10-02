"""
Database Initialization and Seeding Script
Car Marketplace Philippines

This script initializes the database with sample data for testing and development.
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import (
    User, Brand, Model, PHRegion, PHProvince, PHCity,
    Currency, StandardColor, Category, Feature, SubscriptionPlan
)
from auth import PasswordManager
from datetime import datetime
import sys


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")


def seed_currencies(db: Session):
    """Seed currency data"""
    print("\nSeeding currencies...")
    
    currencies = [
        {"code": "PHP", "name": "Philippine Peso", "symbol": "₱", "exchange_rate_to_php": 1.0000},
        {"code": "USD", "name": "US Dollar", "symbol": "$", "exchange_rate_to_php": 56.50},
        {"code": "EUR", "name": "Euro", "symbol": "€", "exchange_rate_to_php": 61.20},
        {"code": "JPY", "name": "Japanese Yen", "symbol": "¥", "exchange_rate_to_php": 0.38},
    ]
    
    for curr_data in currencies:
        existing = db.query(Currency).filter(Currency.code == curr_data["code"]).first()
        if not existing:
            currency = Currency(**curr_data)
            db.add(currency)
    
    db.commit()
    print("✓ Currencies seeded")


def seed_regions(db: Session):
    """Seed Philippines regions"""
    print("\nSeeding Philippines regions...")
    
    regions = [
        {"region_code": "NCR", "name": "Metro Manila", "long_name": "National Capital Region"},
        {"region_code": "CAR", "name": "Cordillera", "long_name": "Cordillera Administrative Region"},
        {"region_code": "III", "name": "Central Luzon", "long_name": "Central Luzon"},
        {"region_code": "IV-A", "name": "CALABARZON", "long_name": "CALABARZON"},
        {"region_code": "VII", "name": "Central Visayas", "long_name": "Central Visayas"},
        {"region_code": "XI", "name": "Davao", "long_name": "Davao Region"},
    ]
    
    for region_data in regions:
        existing = db.query(PHRegion).filter(PHRegion.region_code == region_data["region_code"]).first()
        if not existing:
            region = PHRegion(**region_data)
            db.add(region)
    
    db.commit()
    print("✓ Regions seeded")


def seed_provinces(db: Session):
    """Seed Philippines provinces"""
    print("\nSeeding provinces...")
    
    ncr = db.query(PHRegion).filter(PHRegion.region_code == "NCR").first()
    cl = db.query(PHRegion).filter(PHRegion.region_code == "III").first()
    cal = db.query(PHRegion).filter(PHRegion.region_code == "IV-A").first()
    
    provinces = [
        {"region_id": ncr.id, "province_code": "NCR", "name": "Metro Manila", "capital": "Manila"},
        {"region_id": cl.id, "province_code": "BUL", "name": "Bulacan", "capital": "Malolos"},
        {"region_id": cal.id, "province_code": "CAV", "name": "Cavite", "capital": "Trece Martires"},
        {"region_id": cal.id, "province_code": "LAG", "name": "Laguna", "capital": "Santa Cruz"},
    ]
    
    for prov_data in provinces:
        existing = db.query(PHProvince).filter(PHProvince.province_code == prov_data["province_code"]).first()
        if not existing:
            province = PHProvince(**prov_data)
            db.add(province)
    
    db.commit()
    print("✓ Provinces seeded")


def seed_cities(db: Session):
    """Seed Philippines cities"""
    print("\nSeeding cities...")
    
    ncr_province = db.query(PHProvince).filter(PHProvince.province_code == "NCR").first()
    
    cities = [
        {"province_id": ncr_province.id, "name": "Manila", "city_type": "city", 
         "is_highly_urbanized": True, "latitude": 14.5995, "longitude": 120.9842},
        {"province_id": ncr_province.id, "name": "Quezon City", "city_type": "city", 
         "is_highly_urbanized": True, "latitude": 14.6760, "longitude": 121.0437},
        {"province_id": ncr_province.id, "name": "Makati", "city_type": "city", 
         "is_highly_urbanized": True, "latitude": 14.5547, "longitude": 121.0244},
        {"province_id": ncr_province.id, "name": "Pasig", "city_type": "city", 
         "is_highly_urbanized": True, "latitude": 14.5764, "longitude": 121.0851},
    ]
    
    for city_data in cities:
        existing = db.query(PHCity).filter(
            PHCity.name == city_data["name"],
            PHCity.province_id == city_data["province_id"]
        ).first()
        if not existing:
            city = PHCity(**city_data)
            db.add(city)
    
    db.commit()
    print("✓ Cities seeded")


def seed_colors(db: Session):
    """Seed standard car colors"""
    print("\nSeeding car colors...")
    
    colors = [
        {"name": "Pearl White", "hex_code": "#F8F8FF", "color_family": "white", "is_common": True},
        {"name": "Jet Black", "hex_code": "#000000", "color_family": "black", "is_common": True},
        {"name": "Silver Metallic", "hex_code": "#C0C0C0", "color_family": "silver", "is_common": True},
        {"name": "Space Gray", "hex_code": "#4A4A4A", "color_family": "gray", "is_common": True},
        {"name": "Cherry Red", "hex_code": "#DC143C", "color_family": "red", "is_common": True},
        {"name": "Royal Blue", "hex_code": "#4169E1", "color_family": "blue", "is_common": True},
    ]
    
    for color_data in colors:
        existing = db.query(StandardColor).filter(StandardColor.name == color_data["name"]).first()
        if not existing:
            color = StandardColor(**color_data)
            db.add(color)
    
    db.commit()
    print("✓ Colors seeded")


def seed_brands(db: Session):
    """Seed car brands"""
    print("\nSeeding car brands...")
    
    brands = [
        {"name": "Toyota", "country_origin": "Japan", "brand_type": "mainstream", 
         "is_popular_in_ph": True, "seo_slug": "toyota"},
        {"name": "Honda", "country_origin": "Japan", "brand_type": "mainstream", 
         "is_popular_in_ph": True, "seo_slug": "honda"},
        {"name": "Mitsubishi", "country_origin": "Japan", "brand_type": "mainstream", 
         "is_popular_in_ph": True, "seo_slug": "mitsubishi"},
        {"name": "Nissan", "country_origin": "Japan", "brand_type": "mainstream", 
         "is_popular_in_ph": True, "seo_slug": "nissan"},
        {"name": "Ford", "country_origin": "USA", "brand_type": "mainstream", 
         "is_popular_in_ph": True, "seo_slug": "ford"},
    ]
    
    for brand_data in brands:
        existing = db.query(Brand).filter(Brand.name == brand_data["name"]).first()
        if not existing:
            brand = Brand(**brand_data)
            db.add(brand)
    
    db.commit()
    print("✓ Brands seeded")


def seed_models(db: Session):
    """Seed car models"""
    print("\nSeeding car models...")
    
    toyota = db.query(Brand).filter(Brand.name == "Toyota").first()
    honda = db.query(Brand).filter(Brand.name == "Honda").first()
    
    if toyota:
        models = [
            {"brand_id": toyota.id, "name": "Vios", "body_type": "sedan", "seo_slug": "toyota-vios"},
            {"brand_id": toyota.id, "name": "Fortuner", "body_type": "suv", "seo_slug": "toyota-fortuner"},
            {"brand_id": toyota.id, "name": "Hilux", "body_type": "pickup", "seo_slug": "toyota-hilux"},
        ]
        
        for model_data in models:
            existing = db.query(Model).filter(
                Model.brand_id == model_data["brand_id"],
                Model.name == model_data["name"]
            ).first()
            if not existing:
                model = Model(**model_data)
                db.add(model)
    
    if honda:
        models = [
            {"brand_id": honda.id, "name": "City", "body_type": "sedan", "seo_slug": "honda-city"},
            {"brand_id": honda.id, "name": "CR-V", "body_type": "suv", "seo_slug": "honda-crv"},
        ]
        
        for model_data in models:
            existing = db.query(Model).filter(
                Model.brand_id == model_data["brand_id"],
                Model.name == model_data["name"]
            ).first()
            if not existing:
                model = Model(**model_data)
                db.add(model)
    
    db.commit()
    print("✓ Models seeded")


def seed_features(db: Session):
    """Seed car features"""
    print("\nSeeding car features...")
    
    features = [
        {"name": "Air Conditioning", "category": "comfort", "is_popular": True},
        {"name": "Anti-lock Braking System (ABS)", "category": "safety", "is_popular": True},
        {"name": "Airbags", "category": "safety", "is_popular": True},
        {"name": "Bluetooth Connectivity", "category": "technology", "is_popular": True},
        {"name": "Backup Camera", "category": "safety", "is_popular": False},
        {"name": "Leather Seats", "category": "interior", "is_premium": True},
    ]
    
    for feature_data in features:
        existing = db.query(Feature).filter(Feature.name == feature_data["name"]).first()
        if not existing:
            feature = Feature(**feature_data)
            db.add(feature)
    
    db.commit()
    print("✓ Features seeded")


def seed_subscription_plans(db: Session):
    """Seed subscription plans"""
    print("\nSeeding subscription plans...")
    
    plans = [
        {
            "name": "free", "display_name": "Free Seller", "plan_type": "free",
            "monthly_price": 0, "yearly_price": 0, "max_active_listings": 3,
            "max_featured_listings": 0, "max_images_per_listing": 5, "display_order": 1
        },
        {
            "name": "basic", "display_name": "Basic Seller", "plan_type": "basic",
            "monthly_price": 499, "yearly_price": 4990, "max_active_listings": 10,
            "max_featured_listings": 2, "max_images_per_listing": 15, 
            "verified_seller_badge": True, "display_order": 2
        },
        {
            "name": "premium", "display_name": "Premium Seller", "plan_type": "premium",
            "monthly_price": 999, "yearly_price": 9990, "max_active_listings": 25,
            "max_featured_listings": 5, "max_images_per_listing": 25,
            "featured_in_homepage": True, "advanced_analytics": True,
            "verified_seller_badge": True, "is_popular": True, "display_order": 3
        },
    ]
    
    for plan_data in plans:
        existing = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == plan_data["name"]).first()
        if not existing:
            plan = SubscriptionPlan(**plan_data)
            db.add(plan)
    
    db.commit()
    print("✓ Subscription plans seeded")


def seed_admin_user(db: Session):
    """Create admin user"""
    print("\nCreating admin user...")
    
    existing = db.query(User).filter(User.email == "admin@carmarketplace.ph").first()
    if existing:
        print("⚠ Admin user already exists")
        return
    
    manila = db.query(PHCity).filter(PHCity.name == "Manila").first()
    if not manila:
        print("✗ Manila city not found. Please seed cities first.")
        return
    
    admin = User(
        email="admin@carmarketplace.ph",
        password_hash=PasswordManager.hash_password("Admin123!"),
        first_name="System",
        last_name="Administrator",
        role="admin",
        city_id=manila.id,
        province_id=manila.province_id,
        region_id=manila.province.region_id,
        email_verified=True,
        phone_verified=True,
        identity_verified=True,
        is_active=True
    )
    
    db.add(admin)
    db.commit()
    
    print("✓ Admin user created")
    print("  Email: admin@carmarketplace.ph")
    print("  Password: Admin123!")


def main():
    """Main initialization function"""
    print("=" * 50)
    print("Car Marketplace Philippines - Database Initialization")
    print("=" * 50)
    
    try:
        # Create tables
        create_tables()
        
        # Create database session
        db = SessionLocal()
        
        # Seed data
        seed_currencies(db)
        seed_regions(db)
        seed_provinces(db)
        seed_cities(db)
        seed_colors(db)
        seed_brands(db)
        seed_models(db)
        seed_features(db)
        seed_subscription_plans(db)
        seed_admin_user(db)
        
        db.close()
        
        print("\n" + "=" * 50)
        print("✓ Database initialization completed successfully!")
        print("=" * 50)
        
        return 0
        
    except Exception as e:
        print(f"\n✗ Error during initialization: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())