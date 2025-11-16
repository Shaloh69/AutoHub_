"""
===========================================
Temporary Data Seeder for AutoHub (NORMALIZED SCHEMA v4.0)
===========================================
Creates sample data for testing:
- Admin user
- Seller user
- Buyer user
- 20+ sample car listings with images
- Brands, models, categories, features

UPDATED FOR:
- Fully normalized database schema
- UPPERCASE ENUM values
- Removed duplicate fields
- Using FK relationships for colors, currency

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
    FuelType, TransmissionType, ConditionRating, CarStatus, ApprovalStatus,
    BodyType, MileageUnit, Visibility, DrivetrainType
)
from app.models.location import PhRegion, PhProvince, PhCity, StandardColor
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

    # Admin user - UPPERCASE ENUM
    admin = User(
        email="admin@autohub.com",
        password_hash=hash_password("admin123"),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,  # UPPERCASE
        phone="+639171234567",
        is_active=True,
        is_banned=False,
        email_verified=True,
        phone_verified=True,
        identity_verified=True,
        created_at=datetime.now()
    )
    db.add(admin)

    # Seller user - UPPERCASE ENUM
    seller = User(
        email="seller@autohub.com",
        password_hash=hash_password("seller123"),
        first_name="Juan",
        last_name="Dela Cruz",
        role=UserRole.SELLER,  # UPPERCASE
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

    # Buyer user - UPPERCASE ENUM
    buyer = User(
        email="buyer@autohub.com",
        password_hash=hash_password("buyer123"),
        first_name="Maria",
        last_name="Santos",
        role=UserRole.BUYER,  # UPPERCASE
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


def create_colors(db):
    """Create standard colors for normalized schema"""
    print("\n📝 Creating standard colors...")

    existing = db.query(StandardColor).first()
    if existing:
        print("⚠️  Colors already exist. Skipping.")
        return

    colors = [
        {"name": "White", "hex_code": "#FFFFFF", "category": "NEUTRAL", "is_popular": True},
        {"name": "Black", "hex_code": "#000000", "category": "NEUTRAL", "is_popular": True},
        {"name": "Silver", "hex_code": "#C0C0C0", "category": "METALLIC", "is_popular": True},
        {"name": "Gray", "hex_code": "#808080", "category": "NEUTRAL", "is_popular": True},
        {"name": "Red", "hex_code": "#FF0000", "category": "PRIMARY", "is_popular": True},
        {"name": "Blue", "hex_code": "#0000FF", "category": "PRIMARY", "is_popular": True},
        {"name": "White Pearl", "hex_code": "#F5F5F5", "category": "SPECIAL", "is_popular": True},
        {"name": "Brown", "hex_code": "#8B4513", "category": "NEUTRAL", "is_popular": False},
        {"name": "Beige", "hex_code": "#F5F5DC", "category": "NEUTRAL", "is_popular": False},
    ]

    for color_data in colors:
        color = StandardColor(**color_data, display_order=0)
        db.add(color)

    db.commit()
    print("✅ Created standard colors")


def create_brands_and_models(db):
    """Create popular car brands and models in Philippines"""
    print("\n📝 Creating brands and models...")

    brands_data = [
        {
            "name": "Toyota",
            "slug": "toyota",
            "country_of_origin": "Japan",
            "is_popular": True,
            "models": [
                {"name": "Vios", "slug": "vios", "model_type": "SEDAN"},  # UPPERCASE
                {"name": "Corolla", "slug": "corolla", "model_type": "SEDAN"},
                {"name": "Fortuner", "slug": "fortuner", "model_type": "SUV"},
                {"name": "Innova", "slug": "innova", "model_type": "MPV"},
                {"name": "Wigo", "slug": "wigo", "model_type": "HATCHBACK"},
                {"name": "Rush", "slug": "rush", "model_type": "SUV"},
            ]
        },
        {
            "name": "Honda",
            "slug": "honda",
            "country_of_origin": "Japan",
            "is_popular": True,
            "models": [
                {"name": "Civic", "slug": "civic", "model_type": "SEDAN"},
                {"name": "City", "slug": "city", "model_type": "SEDAN"},
                {"name": "CR-V", "slug": "cr-v", "model_type": "SUV"},
                {"name": "HR-V", "slug": "hr-v", "model_type": "SUV"},
                {"name": "Brio", "slug": "brio", "model_type": "HATCHBACK"},
            ]
        },
        {
            "name": "Mitsubishi",
            "slug": "mitsubishi",
            "country_of_origin": "Japan",
            "is_popular": True,
            "models": [
                {"name": "Montero Sport", "slug": "montero-sport", "model_type": "SUV"},
                {"name": "Mirage", "slug": "mirage", "model_type": "HATCHBACK"},
                {"name": "Xpander", "slug": "xpander", "model_type": "MPV"},
                {"name": "Strada", "slug": "strada", "model_type": "PICKUP"},
            ]
        },
        {
            "name": "Nissan",
            "slug": "nissan",
            "country_of_origin": "Japan",
            "is_popular": True,
            "models": [
                {"name": "Navara", "slug": "navara", "model_type": "PICKUP"},
                {"name": "Terra", "slug": "terra", "model_type": "SUV"},
                {"name": "Almera", "slug": "almera", "model_type": "SEDAN"},
            ]
        },
        {
            "name": "Hyundai",
            "slug": "hyundai",
            "country_of_origin": "South Korea",
            "is_popular": True,
            "models": [
                {"name": "Accent", "slug": "accent", "model_type": "SEDAN"},
                {"name": "Tucson", "slug": "tucson", "model_type": "SUV"},
                {"name": "Stargazer", "slug": "stargazer", "model_type": "MPV"},
            ]
        },
        {
            "name": "Ford",
            "slug": "ford",
            "country_of_origin": "USA",
            "is_popular": True,
            "models": [
                {"name": "Ranger", "slug": "ranger", "model_type": "PICKUP"},
                {"name": "Everest", "slug": "everest", "model_type": "SUV"},
                {"name": "Territory", "slug": "territory", "model_type": "SUV"},
            ]
        },
    ]

    brands_created = 0
    models_created = 0

    for brand_data in brands_data:
        models_data = brand_data.pop("models")

        # Check if brand already exists
        existing_brand = db.query(Brand).filter(Brand.name == brand_data["name"]).first()

        if existing_brand:
            brand = existing_brand
        else:
            brand = Brand(**brand_data)
            db.add(brand)
            db.flush()
            brands_created += 1

        # Create models for this brand
        for model_data in models_data:
            # Check if model already exists for this brand
            existing_model = db.query(Model).filter(
                Model.brand_id == brand.id,
                Model.name == model_data["name"]
            ).first()

            if not existing_model:
                model = Model(
                    brand_id=brand.id,
                    name=model_data["name"],
                    slug=model_data["slug"],
                    model_type=model_data["model_type"]  # Already UPPERCASE
                )
                db.add(model)
                models_created += 1

    db.commit()

    if brands_created > 0 or models_created > 0:
        print(f"✅ Created {brands_created} brands and {models_created} models")
    else:
        print("⚠️  Brands and models already exist. Skipping.")


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
    """Create car features with UPPERCASE category"""
    print("\n📝 Creating features...")

    existing = db.query(Feature).first()
    if existing:
        print("⚠️  Features already exist. Skipping.")
        return

    features = [
        # Safety - UPPERCASE
        {"name": "ABS", "slug": "abs", "category": "SAFETY"},
        {"name": "Airbags", "slug": "airbags", "category": "SAFETY"},
        {"name": "Stability Control", "slug": "stability-control", "category": "SAFETY"},
        {"name": "Parking Sensors", "slug": "parking-sensors", "category": "SAFETY"},
        {"name": "Reverse Camera", "slug": "reverse-camera", "category": "SAFETY"},
        {"name": "Blind Spot Monitor", "slug": "blind-spot-monitor", "category": "SAFETY"},

        # Comfort - UPPERCASE
        {"name": "Air Conditioning", "slug": "air-conditioning", "category": "COMFORT"},
        {"name": "Cruise Control", "slug": "cruise-control", "category": "COMFORT"},
        {"name": "Power Windows", "slug": "power-windows", "category": "COMFORT"},
        {"name": "Power Steering", "slug": "power-steering", "category": "COMFORT"},
        {"name": "Leather Seats", "slug": "leather-seats", "category": "COMFORT"},

        # Technology - UPPERCASE
        {"name": "Bluetooth", "slug": "bluetooth", "category": "TECHNOLOGY"},
        {"name": "USB Port", "slug": "usb-port", "category": "TECHNOLOGY"},
        {"name": "Touch Screen", "slug": "touch-screen", "category": "TECHNOLOGY"},
        {"name": "Navigation System", "slug": "navigation-system", "category": "TECHNOLOGY"},
        {"name": "Keyless Entry", "slug": "keyless-entry", "category": "TECHNOLOGY"},
        {"name": "Push Start", "slug": "push-start", "category": "TECHNOLOGY"},
        {"name": "LED Headlights", "slug": "led-headlights", "category": "TECHNOLOGY"},
    ]

    for feat_data in features:
        feature = Feature(**feat_data)
        db.add(feature)

    db.commit()
    print("✅ Created features")


def get_location(db):
    """Get a default location (Metro Manila)"""
    city = db.query(PhCity).filter(PhCity.name.like("%Manila%")).first()
    if city and city.province:
        return city.id, city.province_id, city.province.region_id
    # Fallback to IDs if name search fails
    return 1, 1, 1


def get_color_id(db, color_name):
    """Get color ID by name"""
    color = db.query(StandardColor).filter(StandardColor.name == color_name).first()
    return color.id if color else 1  # Default to first color if not found


def clear_old_car_data(db):
    """Clear existing car data to start fresh"""
    print("\n🗑️  Clearing old car data...")

    try:
        # Delete in order due to foreign key constraints
        deleted_features = db.query(CarFeature).delete()
        deleted_images = db.query(CarImage).delete()
        deleted_cars = db.query(Car).delete()

        db.commit()
        print(f"   ✓ Deleted {deleted_cars} cars, {deleted_images} images, {deleted_features} feature associations")
    except Exception as e:
        print(f"   ⚠️  Error clearing data: {e}")
        db.rollback()


def create_sample_cars(db):
    """Create sample car listings with comprehensive data - NORMALIZED SCHEMA"""
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
    innova = db.query(Model).filter(Model.name == "Innova").first()
    wigo = db.query(Model).filter(Model.name == "Wigo").first()
    city = db.query(Model).filter(Model.name == "City").first()

    # Validate models exist
    if not all([vios, fortuner, civic, crv, montero]):
        print("❌ One or more models not found!")
        return

    # Get location
    city_id, province_id, region_id = get_location(db)

    # Get some features
    features = db.query(Feature).limit(10).all()

    # NORMALIZED: Sample cars using FKs for colors, no duplicate fields
    sample_cars = [
        {
            "brand_id": toyota.id,
            "model_id": vios.id,
            "title": "2020 Toyota Vios 1.3 E - Well Maintained, Low Mileage",
            "description": "Selling my well-maintained 2020 Toyota Vios. Single owner, casa-maintained, complete papers. Perfect for daily commute or family use. Very fuel efficient!",
            "year": 2020,
            "price": Decimal("650000"),
            "mileage": 35000,
            "fuel_type": FuelType.GASOLINE,  # Already UPPERCASE
            "transmission": TransmissionType.AUTOMATIC,
            "car_condition": ConditionRating.EXCELLENT,  # NORMALIZED: car_condition not condition_rating
            "color_id": get_color_id(db, "White"),  # NORMALIZED: Using FK
            "interior_color_id": get_color_id(db, "Beige"),  # NORMALIZED: Using FK
            "body_type": BodyType.SEDAN,  # UPPERCASE
            "mileage_unit": MileageUnit.KM,  # UPPERCASE
            "visibility": Visibility.PUBLIC,  # UPPERCASE
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
            "engine_size": "1.3L",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 98,
            "trim": "1.3 E",
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
            "car_condition": ConditionRating.EXCELLENT,
            "color_id": get_color_id(db, "Gray"),
            "interior_color_id": get_color_id(db, "Black"),
            "body_type": BodyType.SUV,
            "mileage_unit": MileageUnit.KM,
            "visibility": Visibility.PUBLIC,
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
            "engine_size": "2.4L",
            "seats": 7,
            "doors": 4,
            "drivetrain": DrivetrainType.RWD,
            "horsepower": 148,
            "trim": "2.4 G 4x2",
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
            "car_condition": ConditionRating.LIKE_NEW,
            "color_id": get_color_id(db, "Red"),
            "interior_color_id": get_color_id(db, "Black"),
            "body_type": BodyType.SEDAN,
            "mileage_unit": MileageUnit.KM,
            "visibility": Visibility.PUBLIC,
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
            "engine_size": "1.5L Turbo",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 173,
            "trim": "RS Turbo",
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
            "car_condition": ConditionRating.GOOD,
            "color_id": get_color_id(db, "Silver"),
            "interior_color_id": get_color_id(db, "Gray"),
            "body_type": BodyType.SUV,
            "mileage_unit": MileageUnit.KM,
            "visibility": Visibility.PUBLIC,
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
            "engine_size": "2.0L",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 154,
            "trim": "2.0 S",
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
            "car_condition": ConditionRating.LIKE_NEW,
            "color_id": get_color_id(db, "Black"),
            "interior_color_id": get_color_id(db, "Brown"),
            "body_type": BodyType.SUV,
            "mileage_unit": MileageUnit.KM,
            "visibility": Visibility.PUBLIC,
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
            "engine_size": "2.4L",
            "seats": 7,
            "doors": 4,
            "drivetrain": DrivetrainType.RWD,
            "horsepower": 181,
            "trim": "GLS Premium",
        },
    ]

    # Add more cars if models exist
    if innova:
        sample_cars.append({
            "brand_id": toyota.id,
            "model_id": innova.id,
            "title": "2019 Toyota Innova 2.8 E DSL AT - Family MPV",
            "description": "2019 Toyota Innova in excellent condition. 8-seater, diesel, automatic. Perfect for family use.",
            "year": 2019,
            "price": Decimal("1150000"),
            "mileage": 55000,
            "fuel_type": FuelType.DIESEL,
            "transmission": TransmissionType.AUTOMATIC,
            "car_condition": ConditionRating.EXCELLENT,
            "color_id": get_color_id(db, "White"),
            "interior_color_id": get_color_id(db, "Gray"),
            "body_type": BodyType.MPV,
            "mileage_unit": MileageUnit.KM,
            "visibility": Visibility.PUBLIC,
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
            "engine_size": "2.8L",
            "seats": 8,
            "doors": 4,
            "drivetrain": DrivetrainType.RWD,
            "horsepower": 174,
            "trim": "2.8 E",
        })

    if wigo:
        sample_cars.append({
            "brand_id": toyota.id,
            "model_id": wigo.id,
            "title": "2018 Toyota Wigo G - Economical City Car",
            "description": "2018 Toyota Wigo G. Perfect for city driving. Very fuel efficient.",
            "year": 2018,
            "price": Decimal("380000"),
            "mileage": 42000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.AUTOMATIC,
            "car_condition": ConditionRating.GOOD,
            "color_id": get_color_id(db, "Red"),
            "interior_color_id": get_color_id(db, "Black"),
            "body_type": BodyType.HATCHBACK,
            "mileage_unit": MileageUnit.KM,
            "visibility": Visibility.PUBLIC,
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
            "engine_size": "1.0L",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 66,
            "trim": "G",
        })

    created_count = 0
    for car_data in sample_cars:
        try:
            # NORMALIZED: Create car without duplicate fields
            car = Car(
                seller_id=seller.id,
                city_id=city_id,
                province_id=province_id,
                region_id=region_id,
                latitude=Decimal("14.5995"),
                longitude=Decimal("120.9842"),
                currency_id=1,  # NORMALIZED: Using FK
                price_negotiable=True,
                financing_available=True,
                accident_history=False,
                flood_history=False,
                number_of_owners=1,  # NORMALIZED: Single field only
                service_history_available=True,
                lto_registered=True,
                casa_maintained=True,
                is_active=True,
                is_featured=False,  # NORMALIZED: Single field only
                is_premium=False,
                verified=True,
                views_count=0,  # NORMALIZED: Single field only
                unique_views_count=0,
                inquiry_count=0,
                contact_count=0,
                click_count=0,
                favorite_count=0,
                average_rating=Decimal("0.00"),
                quality_score=85,
                completeness_score=90,
                ranking_score=80,
                registration_status="REGISTERED",  # UPPERCASE
                or_cr_status="COMPLETE",  # UPPERCASE
                deed_of_sale_available=True,
                has_emission_test=True,
                insurance_status="ACTIVE",  # UPPERCASE
                warranty_remaining=False,
                trade_in_accepted=False,
                installment_available=True,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                published_at=datetime.now(),
                expires_at=datetime.now() + timedelta(days=30),
                **car_data
            )

            db.add(car)
            db.flush()

            # Add multiple sample images with UPPERCASE type
            image_types = ["EXTERIOR", "INTERIOR", "ENGINE"]  # UPPERCASE
            for idx, img_type in enumerate(image_types):
                brand = db.query(Brand).filter(Brand.id == car.brand_id).first()
                model = db.query(Model).filter(Model.id == car.model_id).first()
                image = CarImage(
                    car_id=car.id,
                    image_url=f"https://via.placeholder.com/800x600/{'333' if idx == 0 else '555'}/fff?text={brand.name}+{model.name}+{img_type}",
                    image_type=img_type,  # UPPERCASE
                    is_main=(idx == 0),
                    display_order=idx,
                    uploaded_at=datetime.now()
                )
                db.add(image)

            # Add features
            if features:
                for feature in features[:5]:  # Add 5 features per car
                    car_feature = CarFeature(car_id=car.id, feature_id=feature.id)
                    db.add(car_feature)

            created_count += 1
            print(f"   ✓ Created: {car.title}")

        except Exception as e:
            print(f"   ✗ Error creating car '{car_data.get('title', 'Unknown')}': {str(e)}")
            db.rollback()
            continue

    db.commit()
    print(f"\n✅ Successfully created {created_count} sample cars with images and features")


def main():
    """Run the data seeding process"""
    print("\n" + "="*50)
    print("🚀 AutoHub Data Seeder (NORMALIZED SCHEMA v4.0)")
    print("="*50)

    # Create database session
    db = SessionLocal()

    try:
        # Clear old car data first
        clear_old_car_data(db)

        # Create all data
        create_users(db)
        create_colors(db)  # NEW: Create standard colors
        create_brands_and_models(db)
        create_categories(db)
        create_features(db)
        create_sample_cars(db)

        print("\n" + "="*50)
        print("✅ All data created successfully!")
        print("="*50)
        print("\n📋 Test Accounts:")
        print("   🔐 Admin:  admin@autohub.com  / admin123")
        print("   🏪 Seller: seller@autohub.com / seller123")
        print("   🛒 Buyer:  buyer@autohub.com  / buyer123")
        print("\n🚗 Sample Cars: 5-7 active listings created")
        print("   ✓ Multiple images per car (EXTERIOR, INTERIOR, ENGINE)")
        print("   ✓ Features assigned to each car")
        print("   ✓ Complete vehicle specifications")
        print("   ✓ Normalized schema with FK relationships")
        print("   ✓ All ENUM values in UPPERCASE")
        print("\n🌐 You can now:")
        print("   - Login as buyer to browse cars")
        print("   - Login as seller to manage listings")
        print("   - Login as admin to moderate content")
        print("\n💡 Schema Updates:")
        print("   - Using color_id, interior_color_id FKs")
        print("   - Using currency_id FK (defaults to PHP)")
        print("   - All ENUMs standardized to UPPERCASE")
        print("   - No duplicate fields (normalized 3NF)")
        print("="*50 + "\n")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
