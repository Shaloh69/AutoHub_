"""
===========================================
Car Data Seeder for AutoHub
===========================================
Separate seeder specifically for creating sample car listings.
This can be run independently to add more cars to the database.

Features:
- Creates sample car listings with realistic data
- Adds multiple images per car (EXTERIOR, INTERIOR, ENGINE)
- Assigns features to cars
- Supports various brands and models
- UPPERCASE enum values for schema compliance

Run: python3 seed_cars.py
Or import: from seed_cars import create_sample_cars, clear_all_cars
===========================================
"""
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
from app.models.user import User
from app.models.car import (
    Car, Brand, Model, CarImage, CarFeature, Feature,
    FuelType, TransmissionType, ConditionRating, CarStatus, ApprovalStatus,
    BodyType, MileageUnit, Visibility, DrivetrainType
)
from app.models.location import StandardColor
from app.models.review import Review
from app.models.inquiry import Inquiry, InquiryResponse, Favorite
from app.models.transaction import Transaction
from app.models.analytics import CarView


def get_location(db):
    """Get a default location (Metro Manila)"""
    from app.models.location import PhCity
    city = db.query(PhCity).filter(PhCity.name.like("%Manila%")).first()
    if city and city.province:
        return city.id, city.province_id, city.province.region_id
    # Fallback to IDs if name search fails
    return 1, 1, 1


def get_color_id(db, color_name):
    """Get color ID by name"""
    color = db.query(StandardColor).filter(StandardColor.name == color_name).first()
    return color.id if color else 1  # Default to first color if not found


def clear_all_cars(db):
    """Clear ALL car data and related records - USE WITH CAUTION"""
    print("\n🗑️  Clearing ALL car data and related records...")
    print("⚠️  WARNING: This will delete all cars, inquiries, transactions, reviews, etc.")

    confirm = input("Are you sure you want to continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled.")
        return False

    try:
        # Delete in order due to foreign key constraints
        deleted_reviews = db.query(Review).delete()
        deleted_favorites = db.query(Favorite).delete()
        deleted_views = db.query(CarView).delete()
        deleted_inquiry_responses = db.query(InquiryResponse).delete()
        deleted_inquiries = db.query(Inquiry).delete()
        deleted_transactions = db.query(Transaction).delete()
        deleted_features = db.query(CarFeature).delete()
        deleted_images = db.query(CarImage).delete()
        deleted_cars = db.query(Car).delete()

        db.commit()
        print(f"   ✓ Deleted {deleted_cars} cars")
        print(f"   ✓ Deleted {deleted_images} images")
        print(f"   ✓ Deleted {deleted_features} car-feature links")
        print(f"   ✓ Deleted {deleted_inquiries} inquiries")
        print(f"   ✓ Deleted {deleted_transactions} transactions")
        print(f"   ✓ Deleted {deleted_reviews} reviews")
        print(f"   ✓ Deleted {deleted_favorites} favorites")
        print(f"   ✓ Deleted {deleted_views} car views")
        return True
    except Exception as e:
        print(f"   ⚠️  Error clearing data: {e}")
        db.rollback()
        return False


def get_sample_car_data(db):
    """
    Returns a list of sample car configurations.
    Separated from create logic for easier customization.
    """
    # Get brands and models
    toyota = db.query(Brand).filter(Brand.name == "Toyota").first()
    honda = db.query(Brand).filter(Brand.name == "Honda").first()
    mitsubishi = db.query(Brand).filter(Brand.name == "Mitsubishi").first()
    nissan = db.query(Brand).filter(Brand.name == "Nissan").first()
    hyundai = db.query(Brand).filter(Brand.name == "Hyundai").first()
    ford = db.query(Brand).filter(Brand.name == "Ford").first()

    if not all([toyota, honda, mitsubishi]):
        print("❌ Required brands not found! Please run main seeder first.")
        return []

    # Get models - handle missing models gracefully
    vios = db.query(Model).filter(Model.name == "Vios", Model.brand_id == toyota.id).first()
    fortuner = db.query(Model).filter(Model.name == "Fortuner", Model.brand_id == toyota.id).first()
    innova = db.query(Model).filter(Model.name == "Innova", Model.brand_id == toyota.id).first()
    wigo = db.query(Model).filter(Model.name == "Wigo", Model.brand_id == toyota.id).first()
    corolla = db.query(Model).filter(Model.name == "Corolla", Model.brand_id == toyota.id).first()
    rush = db.query(Model).filter(Model.name == "Rush", Model.brand_id == toyota.id).first()

    civic = db.query(Model).filter(Model.name == "Civic", Model.brand_id == honda.id).first()
    crv = db.query(Model).filter(Model.name == "CR-V", Model.brand_id == honda.id).first()
    city = db.query(Model).filter(Model.name == "City", Model.brand_id == honda.id).first()
    hrv = db.query(Model).filter(Model.name == "HR-V", Model.brand_id == honda.id).first()
    brio = db.query(Model).filter(Model.name == "Brio", Model.brand_id == honda.id).first()

    montero = db.query(Model).filter(Model.name == "Montero Sport", Model.brand_id == mitsubishi.id).first()
    mirage = db.query(Model).filter(Model.name == "Mirage", Model.brand_id == mitsubishi.id).first()
    xpander = db.query(Model).filter(Model.name == "Xpander", Model.brand_id == mitsubishi.id).first()
    strada = db.query(Model).filter(Model.name == "Strada", Model.brand_id == mitsubishi.id).first()

    sample_cars = []

    # Toyota Vios
    if vios:
        sample_cars.append({
            "brand_id": toyota.id,
            "model_id": vios.id,
            "title": "2020 Toyota Vios 1.3 E - Well Maintained, Low Mileage",
            "description": "Selling my well-maintained 2020 Toyota Vios. Single owner, casa-maintained, complete papers. Perfect for daily commute or family use. Very fuel efficient!",
            "year": 2020,
            "price": Decimal("650000"),
            "mileage": 35000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.AUTOMATIC,
            "car_condition": ConditionRating.EXCELLENT,
            "color_id": get_color_id(db, "White"),
            "interior_color_id": get_color_id(db, "Beige"),
            "body_type": BodyType.SEDAN,
            "engine_size": "1.3L",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 98,
            "trim": "1.3 E",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Toyota Fortuner
    if fortuner:
        sample_cars.append({
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
            "engine_size": "2.4L",
            "seats": 7,
            "doors": 4,
            "drivetrain": DrivetrainType.RWD,
            "horsepower": 148,
            "trim": "2.4 G 4x2",
            "status": CarStatus.SOLD,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Honda Civic
    if civic:
        sample_cars.append({
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
            "engine_size": "1.5L Turbo",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 173,
            "trim": "RS Turbo",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Honda CR-V
    if crv:
        sample_cars.append({
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
            "engine_size": "2.0L",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 154,
            "trim": "2.0 S",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Mitsubishi Montero Sport
    if montero:
        sample_cars.append({
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
            "engine_size": "2.4L",
            "seats": 7,
            "doors": 4,
            "drivetrain": DrivetrainType.RWD,
            "horsepower": 181,
            "trim": "GLS Premium",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Toyota Innova
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
            "engine_size": "2.8L",
            "seats": 8,
            "doors": 4,
            "drivetrain": DrivetrainType.RWD,
            "horsepower": 174,
            "trim": "2.8 E",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Toyota Wigo
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
            "engine_size": "1.0L",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 66,
            "trim": "G",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Honda City
    if city:
        sample_cars.append({
            "brand_id": honda.id,
            "model_id": city.id,
            "title": "2020 Honda City 1.5 V CVT - Fuel Efficient Sedan",
            "description": "2020 Honda City in excellent condition. Low mileage, well maintained. Perfect for city driving with great fuel economy.",
            "year": 2020,
            "price": Decimal("850000"),
            "mileage": 32000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.CVT,
            "car_condition": ConditionRating.EXCELLENT,
            "color_id": get_color_id(db, "White Pearl"),
            "interior_color_id": get_color_id(db, "Black"),
            "body_type": BodyType.SEDAN,
            "engine_size": "1.5L",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 120,
            "trim": "1.5 V CVT",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Mitsubishi Xpander
    if xpander:
        sample_cars.append({
            "brand_id": mitsubishi.id,
            "model_id": xpander.id,
            "title": "2021 Mitsubishi Xpander GLS Sport - Modern MPV",
            "description": "2021 Mitsubishi Xpander GLS Sport. Modern 7-seater MPV with sporty design. Low mileage, like new condition.",
            "year": 2021,
            "price": Decimal("1100000"),
            "mileage": 18000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.AUTOMATIC,
            "car_condition": ConditionRating.LIKE_NEW,
            "color_id": get_color_id(db, "Gray"),
            "interior_color_id": get_color_id(db, "Black"),
            "body_type": BodyType.MPV,
            "engine_size": "1.5L",
            "seats": 7,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 105,
            "trim": "GLS Sport",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    # Toyota Corolla
    if corolla:
        sample_cars.append({
            "brand_id": toyota.id,
            "model_id": corolla.id,
            "title": "2019 Toyota Corolla Altis 1.6 V - Premium Sedan",
            "description": "2019 Toyota Corolla Altis in pristine condition. Premium features, comfortable ride. Single owner, casa maintained.",
            "year": 2019,
            "price": Decimal("950000"),
            "mileage": 45000,
            "fuel_type": FuelType.GASOLINE,
            "transmission": TransmissionType.CVT,
            "car_condition": ConditionRating.EXCELLENT,
            "color_id": get_color_id(db, "Silver"),
            "interior_color_id": get_color_id(db, "Beige"),
            "body_type": BodyType.SEDAN,
            "engine_size": "1.6L",
            "seats": 5,
            "doors": 4,
            "drivetrain": DrivetrainType.FWD,
            "horsepower": 122,
            "trim": "1.6 V",
            "status": CarStatus.ACTIVE,
            "approval_status": ApprovalStatus.APPROVED,
        })

    return sample_cars


def create_sample_cars(db, seller_email="seller@autohub.com", count=None):
    """
    Create sample car listings with comprehensive data.

    Args:
        db: Database session
        seller_email: Email of seller user (default: seller@autohub.com)
        count: Number of cars to create (None = all available)

    Returns:
        List of created Car objects
    """
    print("\n📝 Creating sample cars...")

    # Get seller user
    seller = db.query(User).filter(User.email == seller_email).first()
    if not seller:
        print(f"❌ Seller '{seller_email}' not found!")
        print("   💡 Make sure you run the main seeder first to create users.")
        return []

    # Get location
    city_id, province_id, region_id = get_location(db)

    # Get features to assign
    features = db.query(Feature).limit(12).all()
    if not features:
        print("⚠️  No features found. Cars will be created without features.")

    # Get sample car configurations
    sample_cars = get_sample_car_data(db)

    if not sample_cars:
        print("❌ No car configurations available!")
        return []

    # Limit count if specified
    if count:
        sample_cars = sample_cars[:count]

    created_cars = []
    created_count = 0

    for idx, car_data in enumerate(sample_cars):
        try:
            # Create car with common fields
            car = Car(
                seller_id=seller.id,
                city_id=city_id,
                province_id=province_id,
                region_id=region_id,
                latitude=Decimal("14.5995"),
                longitude=Decimal("120.9842"),
                currency_id=1,
                mileage_unit=MileageUnit.KM,
                visibility=Visibility.PUBLIC,
                price_negotiable=True,
                financing_available=True,
                accident_history=False,
                flood_history=False,
                number_of_owners=1,
                service_history_available=True,
                lto_registered=True,
                casa_maintained=True,
                is_active=True,
                is_featured=(idx == 0),  # First car is featured
                is_premium=False,
                verified=True,
                views_count=random.randint(10, 150),
                unique_views_count=random.randint(5, 75),
                inquiry_count=0,
                contact_count=0,
                click_count=0,
                favorite_count=0,
                average_rating=Decimal("0.00"),
                quality_score=random.randint(75, 95),
                completeness_score=random.randint(80, 100),
                ranking_score=random.randint(70, 90),
                registration_status="REGISTERED",
                or_cr_status="COMPLETE",
                deed_of_sale_available=True,
                has_emission_test=True,
                insurance_status="ACTIVE",
                warranty_remaining=car_data.get("year", 2020) >= 2022,
                trade_in_accepted=False,
                installment_available=True,
                created_at=datetime.now() - timedelta(days=random.randint(10, 60)),
                updated_at=datetime.now(),
                published_at=datetime.now() - timedelta(days=random.randint(5, 30)),
                expires_at=datetime.now() + timedelta(days=30),
                sold_at=datetime.now() - timedelta(days=5) if car_data.get("status") == CarStatus.SOLD else None,
                **car_data
            )

            db.add(car)
            db.flush()

            # Add multiple sample images with UPPERCASE type
            image_types = ["EXTERIOR", "INTERIOR", "ENGINE", "EXTERIOR"]  # 4 images per car
            brand = db.query(Brand).filter(Brand.id == car.brand_id).first()
            model = db.query(Model).filter(Model.id == car.model_id).first()

            for img_idx, img_type in enumerate(image_types):
                image = CarImage(
                    car_id=car.id,
                    image_url=f"https://via.placeholder.com/800x600/{'333' if img_idx == 0 else '555'}/fff?text={brand.name}+{model.name}+{img_type}",
                    image_type=img_type,
                    is_main=(img_idx == 0),
                    display_order=img_idx,
                    uploaded_at=datetime.now()
                )
                db.add(image)

            # Set main_image for the car
            if brand and model:
                car.main_image = f"https://via.placeholder.com/800x600/333/fff?text={brand.name}+{model.name}+EXTERIOR"

            # Add features (5-8 random features per car)
            if features:
                num_features = random.randint(5, min(8, len(features)))
                selected_features = random.sample(features, num_features)
                for feature in selected_features:
                    car_feature = CarFeature(car_id=car.id, feature_id=feature.id)
                    db.add(car_feature)

            created_cars.append(car)
            created_count += 1
            print(f"   ✓ Created: {car.title}")

        except Exception as e:
            print(f"   ✗ Error creating car '{car_data.get('title', 'Unknown')}': {str(e)}")
            import traceback
            traceback.print_exc()
            db.rollback()
            continue

    db.commit()
    print(f"\n✅ Successfully created {created_count} sample cars with images and features")
    return created_cars


def main():
    """Run the car seeder independently"""
    print("\n" + "="*60)
    print("🚗 AutoHub Car Data Seeder")
    print("="*60)

    db = SessionLocal()

    try:
        # Ask user what they want to do
        print("\nWhat would you like to do?")
        print("  1. Add sample cars (default seller)")
        print("  2. Clear ALL cars and add new sample cars")
        print("  3. Clear ALL cars only (no new cars)")

        choice = input("\nEnter choice (1-3): ").strip()

        if choice == "3":
            clear_all_cars(db)
        elif choice == "2":
            if clear_all_cars(db):
                print("\nAdding new sample cars...")
                cars = create_sample_cars(db)
                if cars:
                    print(f"\n✅ Created {len(cars)} new cars successfully!")
        else:  # Default is choice 1
            cars = create_sample_cars(db)
            if cars:
                print(f"\n✅ Created {len(cars)} new cars successfully!")

        print("\n" + "="*60)
        print("✅ Car seeder completed!")
        print("="*60 + "\n")

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
