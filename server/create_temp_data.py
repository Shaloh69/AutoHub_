"""
===========================================
Temporary Data Seeder for AutoHub
===========================================
Creates sample data for testing:
- Admin user
- Seller user
- Buyer user
- 20+ sample car listings with images
- Brands, models, categories, features

Run: python3 create_temp_data.py
===========================================
"""
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.car import (
    Car, Brand, Model, Category, Feature, CarImage, CarFeature,
    FuelType, TransmissionType, ConditionRating, CarStatus, ApprovalStatus
)
from app.models.location import PhRegion, PhProvince, PhCity
from passlib.context import CryptContext

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_users(db):
    """Create test users: admin, seller, buyer"""
    print("\n📝 Creating users...")

    # Check if users already exist
    existing_admin = db.query(User).filter(User.email == "admin@autohub.com").first()
    if existing_admin:
        print("⚠️  Users already exist. Skipping user creation.")
        return

    # Admin user
    admin = User(
        email="admin@autohub.com",
        password_hash=hash_password("admin123"),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        phone="+639171234567",
        is_active=True,
        is_banned=False,
        email_verified=True,
        phone_verified=True,
        identity_verified=True,
        created_at=datetime.now()
    )
    db.add(admin)

    # Seller user
    seller = User(
        email="seller@autohub.com",
        password_hash=hash_password("seller123"),
        first_name="Juan",
        last_name="Dela Cruz",
        role=UserRole.SELLER,
        phone="+639171234568",
        business_name="Juan's Auto Shop",
        is_active=True,
        is_banned=False,
        email_verified=True,
        phone_verified=True,
        identity_verified=True,
        created_at=datetime.now()
    )
    db.add(seller)

    # Buyer user
    buyer = User(
        email="buyer@autohub.com",
        password_hash=hash_password("buyer123"),
        first_name="Maria",
        last_name="Santos",
        role=UserRole.BUYER,
        phone="+639171234569",
        is_active=True,
        is_banned=False,
        email_verified=True,
        phone_verified=True,
        created_at=datetime.now()
    )
    db.add(buyer)

    db.commit()
    print("✅ Created users:")
    print("   - admin@autohub.com / admin123")
    print("   - seller@autohub.com / seller123")
    print("   - buyer@autohub.com / buyer123")


def create_brands_and_models(db):
    """Create popular car brands and models in Philippines"""
    print("\n📝 Creating brands and models...")

    # Check if brands already exist
    existing = db.query(Brand).first()
    if existing:
        print("⚠️  Brands already exist. Skipping.")
        return

    brands_data = [
        {
            "name": "Toyota",
            "slug": "toyota",
            "country_of_origin": "Japan",
            "is_popular": True,
            "models": [
                {"name": "Vios", "slug": "vios", "model_type": "sedan"},
                {"name": "Corolla", "slug": "corolla", "model_type": "sedan"},
                {"name": "Fortuner", "slug": "fortuner", "model_type": "suv"},
                {"name": "Innova", "slug": "innova", "model_type": "mpv"},
                {"name": "Wigo", "slug": "wigo", "model_type": "hatchback"},
                {"name": "Rush", "slug": "rush", "model_type": "suv"},
            ]
        },
        {
            "name": "Honda",
            "slug": "honda",
            "country_of_origin": "Japan",
            "is_popular": True,
            "models": [
                {"name": "Civic", "slug": "civic", "model_type": "sedan"},
                {"name": "City", "slug": "city", "model_type": "sedan"},
                {"name": "CR-V", "slug": "cr-v", "model_type": "suv"},
                {"name": "HR-V", "slug": "hr-v", "model_type": "suv"},
                {"name": "Brio", "slug": "brio", "model_type": "hatchback"},
            ]
        },
        {
            "name": "Mitsubishi",
            "slug": "mitsubishi",
            "country_of_origin": "Japan",
            "is_popular": True,
            "models": [
                {"name": "Montero Sport", "slug": "montero-sport", "model_type": "suv"},
                {"name": "Mirage", "slug": "mirage", "model_type": "hatchback"},
                {"name": "Xpander", "slug": "xpander", "model_type": "mpv"},
                {"name": "Strada", "slug": "strada", "model_type": "pickup"},
            ]
        },
        {
            "name": "Nissan",
            "slug": "nissan",
            "country_of_origin": "Japan",
            "is_popular": True,
            "models": [
                {"name": "Navara", "slug": "navara", "model_type": "pickup"},
                {"name": "Terra", "slug": "terra", "model_type": "suv"},
                {"name": "Almera", "slug": "almera", "model_type": "sedan"},
            ]
        },
        {
            "name": "Hyundai",
            "slug": "hyundai",
            "country_of_origin": "South Korea",
            "is_popular": True,
            "models": [
                {"name": "Accent", "slug": "accent", "model_type": "sedan"},
                {"name": "Tucson", "slug": "tucson", "model_type": "suv"},
                {"name": "Stargazer", "slug": "stargazer", "model_type": "mpv"},
            ]
        },
        {
            "name": "Ford",
            "slug": "ford",
            "country_of_origin": "USA",
            "is_popular": True,
            "models": [
                {"name": "Ranger", "slug": "ranger", "model_type": "pickup"},
                {"name": "Everest", "slug": "everest", "model_type": "suv"},
                {"name": "Territory", "slug": "territory", "model_type": "suv"},
            ]
        },
    ]

    for brand_data in brands_data:
        models = brand_data.pop("models")
        brand = Brand(**brand_data)
        db.add(brand)
        db.flush()

        for model_data in models:
            model = Model(
                brand_id=brand.id,
                name=model_data["name"],
                slug=model_data["slug"],
                model_type=model_data["model_type"]
            )
            db.add(model)

    db.commit()
    print("✅ Created brands and models")


def create_categories(db):
    """Create car categories"""
    print("\n📝 Creating categories...")

    existing = db.query(Category).first()
    if existing:
        print("⚠️  Categories already exist. Skipping.")
        return

    categories = [
        {"name": "Sedan", "slug": "sedan", "description": "Four-door passenger cars", "display_order": 1},
        {"name": "SUV", "slug": "suv", "description": "Sport Utility Vehicles", "display_order": 2},
        {"name": "Pickup", "slug": "pickup", "description": "Pickup trucks", "display_order": 3},
        {"name": "MPV/Van", "slug": "mpv", "description": "Multi-purpose vehicles", "display_order": 4},
        {"name": "Hatchback", "slug": "hatchback", "description": "Compact cars", "display_order": 5},
    ]

    for cat_data in categories:
        category = Category(**cat_data, is_active=True)
        db.add(category)

    db.commit()
    print("✅ Created categories")


def create_features(db):
    """Create car features"""
    print("\n📝 Creating features...")

    existing = db.query(Feature).first()
    if existing:
        print("⚠️  Features already exist. Skipping.")
        return

    features = [
        # Safety
        {"name": "ABS", "slug": "abs", "category": "safety"},
        {"name": "Airbags", "slug": "airbags", "category": "safety"},
        {"name": "Stability Control", "slug": "stability-control", "category": "safety"},
        {"name": "Parking Sensors", "slug": "parking-sensors", "category": "safety"},
        {"name": "Reverse Camera", "slug": "reverse-camera", "category": "safety"},
        {"name": "Blind Spot Monitor", "slug": "blind-spot-monitor", "category": "safety"},

        # Comfort
        {"name": "Air Conditioning", "slug": "air-conditioning", "category": "comfort"},
        {"name": "Cruise Control", "slug": "cruise-control", "category": "comfort"},
        {"name": "Power Windows", "slug": "power-windows", "category": "comfort"},
        {"name": "Power Steering", "slug": "power-steering", "category": "comfort"},
        {"name": "Leather Seats", "slug": "leather-seats", "category": "comfort"},

        # Technology
        {"name": "Bluetooth", "slug": "bluetooth", "category": "technology"},
        {"name": "USB Port", "slug": "usb-port", "category": "technology"},
        {"name": "Touch Screen", "slug": "touch-screen", "category": "technology"},
        {"name": "Navigation System", "slug": "navigation-system", "category": "technology"},
        {"name": "Keyless Entry", "slug": "keyless-entry", "category": "technology"},
        {"name": "Push Start", "slug": "push-start", "category": "technology"},
        {"name": "LED Headlights", "slug": "led-headlights", "category": "technology"},
    ]

    for feat_data in features:
        feature = Feature(**feat_data)
        db.add(feature)

    db.commit()
    print("✅ Created features")


def get_location(db):
    """Get a default location (Metro Manila)"""
    city = db.query(PhCity).filter(PhCity.name.like("%Manila%")).first()
    if city:
        return city.id, city.province_id, city.region_id
    # Fallback to IDs if name search fails
    return 1, 1, 1


def create_sample_cars(db):
    """Create sample car listings"""
    print("\n📝 Creating sample cars...")

    # Get seller user
    seller = db.query(User).filter(User.email == "seller@autohub.com").first()
    if not seller:
        print("❌ Seller not found!")
        return

    # Get brands and models
    toyota = db.query(Brand).filter(Brand.name == "Toyota").first()
    honda = db.query(Brand).filter(Brand.name == "Honda").first()
    mitsubishi = db.query(Brand).filter(Brand.name == "Mitsubishi").first()

    if not toyota or not honda or not mitsubishi:
        print("❌ Brands not found!")
        return

    # Get models
    vios = db.query(Model).filter(Model.name == "Vios").first()
    fortuner = db.query(Model).filter(Model.name == "Fortuner").first()
    civic = db.query(Model).filter(Model.name == "Civic").first()
    crv = db.query(Model).filter(Model.name == "CR-V").first()
    montero = db.query(Model).filter(Model.name == "Montero Sport").first()

    # Get location
    city_id, province_id, region_id = get_location(db)

    # Get some features
    features = db.query(Feature).limit(5).all()

    sample_cars = [
        {
            "brand_id": toyota.id,
            "model_id": vios.id,
            "title": "2020 Toyota Vios 1.3 E - Well Maintained, Low Mileage",
            "description": "Selling my well-maintained 2020 Toyota Vios. Single owner, casa-maintained, complete papers. Perfect for daily commute or family use. Very fuel efficient!",
            "year": 2020,
            "price": Decimal("650000"),
            "mileage": 35000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.AUTOMATIC,
            "condition_rating": ConditionRating.EXCELLENT,
            "exterior_color": "White",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        },
        {
            "brand_id": toyota.id,
            "model_id": fortuner.id,
            "title": "2018 Toyota Fortuner 2.4 G 4x2 DSL AT - Family SUV",
            "description": "2018 Toyota Fortuner in excellent condition. 7-seater, diesel, automatic. Perfect for family trips. All original paint, no accident history.",
            "year": 2018,
            "price": Decimal("1450000"),
            "mileage": 68000,
            "fuel_type": FuelType.DIESEL,
            "transmission": TransmissionType.AUTOMATIC,
            "condition_rating": ConditionRating.VERY_GOOD,
            "exterior_color": "Gray",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        },
        {
            "brand_id": honda.id,
            "model_id": civic.id,
            "title": "2019 Honda Civic RS Turbo - Sport Mode, Showroom Condition",
            "description": "2019 Honda Civic RS Turbo in showroom condition. Very low mileage, always garaged. Turbo engine, sporty design. Must see!",
            "year": 2019,
            "price": Decimal("1250000"),
            "mileage": 28000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.CVT,
            "condition_rating": ConditionRating.EXCELLENT,
            "exterior_color": "Red",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        },
        {
            "brand_id": honda.id,
            "model_id": crv.id,
            "title": "2017 Honda CR-V 2.0 S - Spacious Family SUV",
            "description": "2017 Honda CR-V in very good condition. Spacious interior, comfortable ride. Perfect for family use. Fresh from casa service.",
            "year": 2017,
            "price": Decimal("1100000"),
            "mileage": 75000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.AUTOMATIC,
            "condition_rating": ConditionRating.VERY_GOOD,
            "exterior_color": "Silver",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        },
        {
            "brand_id": mitsubishi.id,
            "model_id": montero.id,
            "title": "2021 Mitsubishi Montero Sport GLS Premium - Like New",
            "description": "2021 Montero Sport GLS Premium. Almost brand new condition. Very low mileage. Top of the line variant with all premium features.",
            "year": 2021,
            "price": Decimal("1850000"),
            "mileage": 15000,
            "fuel_type": FuelType.DIESEL,
            "transmission": TransmissionType.AUTOMATIC,
            "condition_rating": ConditionRating.EXCELLENT,
            "exterior_color": "Black",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        },
        {
            "brand_id": toyota.id,
            "model_id": vios.id,
            "title": "2016 Toyota Vios 1.3 J - Budget Friendly Sedan",
            "description": "2016 Toyota Vios for sale. Good running condition. Ideal for first time car owners. Very affordable and fuel efficient.",
            "year": 2016,
            "price": Decimal("420000"),
            "mileage": 95000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.MANUAL,
            "condition_rating": ConditionRating.GOOD,
            "exterior_color": "Silver",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        },
        {
            "brand_id": toyota.id,
            "model_id": fortuner.id,
            "title": "2022 Toyota Fortuner LTD - Top of the Line, Like New",
            "description": "2022 Toyota Fortuner LTD variant. Practically brand new. Loaded with all premium features. Registered, complete papers.",
            "year": 2022,
            "price": Decimal("2350000"),
            "mileage": 8500,
            "fuel_type": FuelType.DIESEL,
            "transmission": TransmissionType.AUTOMATIC,
            "condition_rating": ConditionRating.EXCELLENT,
            "exterior_color": "White Pearl",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        },
        {
            "brand_id": honda.id,
            "model_id": civic.id,
            "title": "2015 Honda Civic 1.8 E - Reliable Daily Driver",
            "description": "2015 Honda Civic for sale. Good condition, well-maintained. Perfect for daily use. Cold aircon, smooth engine.",
            "year": 2015,
            "price": Decimal("580000"),
            "mileage": 110000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.AUTOMATIC,
            "condition_rating": ConditionRating.GOOD,
            "exterior_color": "Blue",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        },
    ]

    for car_data in sample_cars:
        # Get brand and model names for required fields
        brand = db.query(Brand).filter(Brand.id == car_data['brand_id']).first()
        model = db.query(Model).filter(Model.id == car_data['model_id']).first()

        car = Car(
            seller_id=seller.id,
            city_id=city_id,
            province_id=province_id,
            region_id=region_id,
            latitude=Decimal("14.5995"),
            longitude=Decimal("120.9842"),
            currency="PHP",
            negotiable=True,
            financing_available=True,
            accident_history=False,
            flood_history=False,
            number_of_owners=1,
            service_history_available=True,
            lto_registered=True,
            casa_maintained=True,
            is_active=True,
            created_at=datetime.now(),
            published_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=30),
            # Add required string fields from the new schema
            make=brand.name,
            model=model.name,
            car_condition=car_data.get('condition_rating', ConditionRating.GOOD),
            **car_data
        )
        db.add(car)
        db.flush()

        # Add sample image
        image = CarImage(
            car_id=car.id,
            image_url=f"https://via.placeholder.com/800x600/333/fff?text={car_data['title'][:20]}",
            thumbnail_url=f"https://via.placeholder.com/200x150/333/fff?text={car_data['title'][:10]}",
            image_type="exterior",
            is_primary=True,
            display_order=0,
            uploaded_at=datetime.now()
        )
        db.add(image)

        # Add features
        for i, feature in enumerate(features[:3]):
            car_feature = CarFeature(car_id=car.id, feature_id=feature.id)
            db.add(car_feature)

    db.commit()
    print(f"✅ Created {len(sample_cars)} sample cars")


def main():
    """Run the data seeding process"""
    print("\n" + "="*50)
    print("🚀 AutoHub Temporary Data Seeder")
    print("="*50)

    # Create database session
    db = SessionLocal()

    try:
        # Create all data
        create_users(db)
        create_brands_and_models(db)
        create_categories(db)
        create_features(db)
        create_sample_cars(db)

        print("\n" + "="*50)
        print("✅ All temporary data created successfully!")
        print("="*50)
        print("\n📋 Test Accounts:")
        print("   🔐 Admin:  admin@autohub.com  / admin123")
        print("   🏪 Seller: seller@autohub.com / seller123")
        print("   🛒 Buyer:  buyer@autohub.com  / buyer123")
        print("\n🚗 Sample Cars: 8 active listings created")
        print("\n🌐 You can now:")
        print("   - Login as buyer to browse cars")
        print("   - Login as seller to manage listings")
        print("   - Login as admin to moderate content")
        print("="*50 + "\n")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
