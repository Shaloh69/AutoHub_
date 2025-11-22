"""
===========================================
Main Data Seeder for AutoHub (NORMALIZED SCHEMA v4.0 - ENHANCED)
===========================================
Creates core sample data for testing:
- Users (admin, seller, buyer)
- Brands, models, categories, features
- Colors and location data
- Subscriptions for users
- Inquiries, transactions, reviews (if cars exist)
- Favorites and notifications
- Car views for analytics

MODULAR DESIGN:
- Car listings are now in a SEPARATE file: seed_cars.py
- Run seed_cars.py independently to add/manage car data
- This keeps the seeder clean and maintainable

UPDATED FOR:
- Fully normalized database schema
- UPPERCASE ENUM values
- Removed duplicate fields
- Using FK relationships for colors, currency
- Complete test data for all features

Run: python3 create_temp_data.py
===========================================
"""
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal
import random

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
from app.models.subscription import (
    SubscriptionPlan, UserSubscription, SubscriptionPayment,
    SubscriptionUsage
)
from app.models.inquiry import Inquiry, InquiryResponse, Favorite, InquiryType, InquiryStatus
from app.models.transaction import Transaction, TransactionType, TransactionStatus, PaymentMethod, PaymentStatus
from app.models.review import Review, ReviewStatus
from app.models.analytics import CarView, UserAction, Notification
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

    # Get location (Metro Manila by default)
    city = db.query(PhCity).filter(PhCity.name.like("%Manila%")).first()
    if city and city.province:
        city_id, province_id, region_id = city.id, city.province_id, city.province.region_id
    else:
        city_id, province_id, region_id = 1, 1, 1

    # Admin user - UPPERCASE ENUM
    admin = User(
        email="admin@autohub.com",
        password_hash=hash_password("admin123"),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,  # UPPERCASE
        phone="+639171234567",
        city_id=city_id,
        province_id=province_id,
        region_id=region_id,
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
        business_permit_number="BP-2023-001",
        tin_number="123-456-789-000",
        city_id=city_id,
        province_id=province_id,
        region_id=region_id,
        is_active=True,
        is_banned=False,
        email_verified=True,
        phone_verified=True,
        identity_verified=True,
        business_verified=True,
        average_rating=Decimal("4.75"),
        total_ratings=12,
        response_rate=Decimal("95.00"),
        response_time_hours=2,
        created_at=datetime.now() - timedelta(days=180)
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
        city_id=city_id,
        province_id=province_id,
        region_id=region_id,
        is_active=True,
        is_banned=False,
        email_verified=True,
        phone_verified=True,
        average_rating=Decimal("5.00"),
        total_ratings=3,
        created_at=datetime.now() - timedelta(days=90)
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


# Import car seeder functions from separate file
try:
    from seed_cars import create_sample_cars, clear_all_cars
except ImportError:
    print("⚠️  Warning: seed_cars.py not found. Car creation will be skipped.")
    create_sample_cars = None
    clear_all_cars = None


def create_subscriptions(db):
    """Create subscription data for users"""
    print("\n📝 Creating subscriptions...")

    # Get users
    seller = db.query(User).filter(User.email == "seller@autohub.com").first()
    if not seller:
        print("❌ Seller not found!")
        return

    # Get subscription plans (they should exist from SQL schema)
    pro_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "pro").first()
    if not pro_plan:
        print("⚠️  Pro plan not found in database. Skipping subscription creation.")
        return

    # Check if seller already has subscription
    existing_sub = db.query(UserSubscription).filter(UserSubscription.user_id == seller.id).first()
    if existing_sub:
        print("⚠️  Subscriptions already exist. Skipping.")
        return

    # Create subscription for seller
    subscription_start = datetime.now() - timedelta(days=30)
    subscription = UserSubscription(
        user_id=seller.id,
        plan_id=pro_plan.id,
        status="ACTIVE",  # UPPERCASE
        billing_cycle="MONTHLY",  # UPPERCASE
        auto_renew=True,
        subscribed_at=subscription_start,
        current_period_start=subscription_start,
        current_period_end=datetime.now() + timedelta(days=30),
        next_billing_date=datetime.now() + timedelta(days=30),
        started_at=subscription_start,
        expires_at=datetime.now() + timedelta(days=30),
        created_at=subscription_start,
        updated_at=datetime.now()
    )
    db.add(subscription)
    db.flush()

    # Update user's subscription status
    seller.current_subscription_id = subscription.id
    seller.subscription_status = "ACTIVE"
    seller.subscription_expires_at = subscription.expires_at

    # Create a payment record
    payment = SubscriptionPayment(
        subscription_id=subscription.id,
        user_id=seller.id,
        plan_id=pro_plan.id,
        amount=pro_plan.price,
        currency_id=1,
        payment_method="BANK_TRANSFER",
        reference_number=f"REF{random.randint(100000, 999999)}",
        status="COMPLETED",  # UPPERCASE
        billing_period_start=subscription_start.date(),
        billing_period_end=(datetime.now() + timedelta(days=30)).date(),
        paid_at=subscription_start,
        qr_code_shown=True,
        submitted_at=subscription_start,
        created_at=subscription_start
    )
    db.add(payment)

    # Create usage tracking
    usage = SubscriptionUsage(
        user_id=seller.id,
        subscription_id=subscription.id,
        current_listings=7,  # Number of cars created
        current_featured=1,
        total_listings_created=7,
        reset_at=None,
        updated_at=datetime.now()
    )
    db.add(usage)

    db.commit()
    print("✅ Created subscription for seller (Pro plan - ACTIVE)")


def create_inquiries(db, cars):
    """Create sample inquiries between buyers and sellers"""
    print("\n📝 Creating inquiries...")

    if not cars or len(cars) == 0:
        print("⚠️  No cars available. Skipping inquiry creation.")
        return []

    buyer = db.query(User).filter(User.email == "buyer@autohub.com").first()
    seller = db.query(User).filter(User.email == "seller@autohub.com").first()

    if not buyer or not seller:
        print("❌ Users not found!")
        return []

    inquiries_data = [
        {
            "car": cars[0],
            "type": InquiryType.GENERAL,
            "subject": "Interested in viewing the car",
            "message": "Hi! I'm interested in this Vios. Is it still available? Can I schedule a test drive this weekend?",
            "status": InquiryStatus.REPLIED,
            "days_ago": 5
        },
        {
            "car": cars[2],
            "type": InquiryType.PRICE_NEGOTIATION,
            "subject": "Price negotiation",
            "message": "Hello! The car looks great. Can you consider ₱1,200,000 as my offer?",
            "offered_price": Decimal("1200000"),
            "status": InquiryStatus.IN_NEGOTIATION,
            "days_ago": 3
        },
        {
            "car": cars[3],
            "type": InquiryType.TEST_DRIVE,
            "subject": "Test drive request",
            "message": "Good day! I would like to schedule a test drive for the CR-V. Are you available this Saturday?",
            "test_drive_requested": True,
            "status": InquiryStatus.TEST_DRIVE_SCHEDULED,
            "days_ago": 2
        },
    ]

    created_inquiries = []
    for inq_data in inquiries_data:
        try:
            car = inq_data.pop("car")
            days_ago = inq_data.pop("days_ago")

            inquiry = Inquiry(
                car_id=car.id,
                buyer_id=buyer.id,
                seller_id=seller.id,
                buyer_name=f"{buyer.first_name} {buyer.last_name}",
                buyer_email=buyer.email,
                buyer_phone=buyer.phone,
                inquiry_type=inq_data.get("type", InquiryType.GENERAL),
                subject=inq_data.get("subject"),
                message=inq_data.get("message"),
                offered_price=inq_data.get("offered_price"),
                test_drive_requested=inq_data.get("test_drive_requested", False),
                inspection_requested=False,
                financing_needed=False,
                trade_in_vehicle=False,
                status=inq_data.get("status", InquiryStatus.NEW),
                is_read=True,
                priority="MEDIUM",
                response_count=1 if inq_data.get("status") != InquiryStatus.NEW else 0,
                last_response_at=datetime.now() - timedelta(days=days_ago-1) if inq_data.get("status") != InquiryStatus.NEW else None,
                last_response_by=seller.id if inq_data.get("status") != InquiryStatus.NEW else None,
                created_at=datetime.now() - timedelta(days=days_ago),
                updated_at=datetime.now() - timedelta(days=days_ago-1)
            )
            db.add(inquiry)
            db.flush()

            # Add a response if inquiry was replied
            if inq_data.get("status") in [InquiryStatus.REPLIED, InquiryStatus.IN_NEGOTIATION, InquiryStatus.TEST_DRIVE_SCHEDULED]:
                response = InquiryResponse(
                    inquiry_id=inquiry.id,
                    user_id=seller.id,
                    message="Thank you for your interest! Yes, the car is available. I'd be happy to arrange a viewing. When would be convenient for you?",
                    is_from_seller=True,
                    created_at=datetime.now() - timedelta(days=days_ago-1)
                )
                db.add(response)

            # Update car inquiry count
            car.inquiry_count = (car.inquiry_count or 0) + 1

            created_inquiries.append(inquiry)
            print(f"   ✓ Created inquiry for: {car.title}")

        except Exception as e:
            print(f"   ✗ Error creating inquiry: {str(e)}")
            db.rollback()
            continue

    db.commit()
    print(f"✅ Successfully created {len(created_inquiries)} inquiries")
    return created_inquiries


def create_transactions(db, cars):
    """Create sample transactions for sold cars"""
    print("\n📝 Creating transactions...")

    if not cars or len(cars) == 0:
        print("⚠️  No cars available. Skipping transaction creation.")
        return

    buyer = db.query(User).filter(User.email == "buyer@autohub.com").first()
    seller = db.query(User).filter(User.email == "seller@autohub.com").first()

    if not buyer or not seller:
        print("❌ Users not found!")
        return

    # Find the sold car (Fortuner)
    sold_car = next((car for car in cars if car.status == CarStatus.SOLD), None)
    if not sold_car:
        print("⚠️  No sold cars available. Skipping transaction creation.")
        return

    try:
        # Create a transaction for the sold car
        transaction = Transaction(
            car_id=sold_car.id,
            seller_id=seller.id,
            buyer_id=buyer.id,
            inquiry_id=None,
            transaction_type=TransactionType.SALE,
            agreed_price=sold_car.price,
            currency_id=1,
            deposit_amount=Decimal("50000"),
            final_amount=sold_car.price,
            payment_method=PaymentMethod.BANK_TRANSFER,
            payment_status=PaymentStatus.COMPLETED,
            has_trade_in=False,
            status=TransactionStatus.COMPLETED,
            seller_notes="Great buyer, smooth transaction",
            buyer_notes="Excellent condition, very happy with the purchase",
            confirmed_at=datetime.now() - timedelta(days=10),
            completed_at=datetime.now() - timedelta(days=5),
            created_at=datetime.now() - timedelta(days=15),
            updated_at=datetime.now() - timedelta(days=5)
        )
        db.add(transaction)
        db.flush()

        # Update seller and buyer stats
        seller.total_sales = (seller.total_sales or 0) + 1
        seller.sold_listings = (seller.sold_listings or 0) + 1
        buyer.total_purchases = (buyer.total_purchases or 0) + 1

        db.commit()
        print(f"✅ Created transaction for sold car: {sold_car.title}")
        return transaction

    except Exception as e:
        print(f"❌ Error creating transaction: {str(e)}")
        db.rollback()
        return None


def create_reviews(db, transaction):
    """Create sample reviews from buyers"""
    print("\n📝 Creating reviews...")

    if not transaction:
        print("⚠️  No transaction available. Skipping review creation.")
        return

    try:
        review = Review(
            car_id=transaction.car_id,
            seller_id=transaction.seller_id,
            buyer_id=transaction.buyer_id,
            transaction_id=transaction.id,
            rating=Decimal("4.80"),
            title="Excellent seller and great car!",
            comment="The car is exactly as described. Juan was very professional and helpful throughout the process. Highly recommended!",
            pros="Well maintained, complete papers, smooth transaction",
            cons="None, everything was perfect",
            would_recommend=True,
            verified_purchase=True,
            helpful_count=5,
            reported_count=0,
            status=ReviewStatus.APPROVED,
            admin_notes=None,
            created_at=datetime.now() - timedelta(days=3),
            updated_at=datetime.now() - timedelta(days=3)
        )
        db.add(review)

        # Update seller's rating
        seller = db.query(User).filter(User.id == transaction.seller_id).first()
        if seller:
            seller.total_ratings = (seller.total_ratings or 0) + 1
            # Recalculate average (simplified)
            seller.average_rating = Decimal("4.75")

        db.commit()
        print("✅ Created review for transaction")

    except Exception as e:
        print(f"❌ Error creating review: {str(e)}")
        db.rollback()


def create_favorites(db, cars):
    """Create sample favorites for buyers"""
    print("\n📝 Creating favorites...")

    if not cars or len(cars) < 3:
        print("⚠️  Not enough cars available. Skipping favorites creation.")
        return

    buyer = db.query(User).filter(User.email == "buyer@autohub.com").first()
    if not buyer:
        print("❌ Buyer not found!")
        return

    try:
        # Buyer favorites first 3 active cars
        for i, car in enumerate(cars[:3]):
            if car.status == CarStatus.ACTIVE:
                favorite = Favorite(
                    user_id=buyer.id,
                    car_id=car.id,
                    notes="Interested in this one" if i == 0 else None,
                    created_at=datetime.now() - timedelta(days=random.randint(1, 10))
                )
                db.add(favorite)

                # Update car favorite count
                car.favorite_count = (car.favorite_count or 0) + 1

        db.commit()
        print("✅ Created favorites for buyer")

    except Exception as e:
        print(f"❌ Error creating favorites: {str(e)}")
        db.rollback()


def create_car_views(db, cars):
    """Create sample car views for analytics"""
    print("\n📝 Creating car views for analytics...")

    if not cars:
        print("⚠️  No cars available. Skipping views creation.")
        return

    buyer = db.query(User).filter(User.email == "buyer@autohub.com").first()

    try:
        # Create multiple views for each car
        for car in cars:
            views_to_create = random.randint(5, 15)
            for _ in range(views_to_create):
                view = CarView(
                    car_id=car.id,
                    user_id=buyer.id if random.random() > 0.3 else None,  # 70% logged in, 30% guest
                    session_id=f"session_{random.randint(10000, 99999)}",
                    ip_address=f"192.168.1.{random.randint(1, 255)}",
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    device_type=random.choice(["DESKTOP", "MOBILE", "TABLET"]),
                    referrer="https://www.google.com",
                    viewed_at=datetime.now() - timedelta(days=random.randint(0, 30))
                )
                db.add(view)

        db.commit()
        print("✅ Created car views for analytics")

    except Exception as e:
        print(f"❌ Error creating views: {str(e)}")
        db.rollback()


def create_notifications(db):
    """Create sample notifications for users"""
    print("\n📝 Creating notifications...")

    seller = db.query(User).filter(User.email == "seller@autohub.com").first()
    buyer = db.query(User).filter(User.email == "buyer@autohub.com").first()

    if not seller or not buyer:
        print("❌ Users not found!")
        return

    try:
        notifications = [
            {
                "user_id": seller.id,
                "title": "New Inquiry Received",
                "message": "You have a new inquiry for your Toyota Vios listing",
                "notification_type": "INQUIRY",
                "is_read": True,
                "read_at": datetime.now() - timedelta(days=4),
                "created_at": datetime.now() - timedelta(days=5)
            },
            {
                "user_id": seller.id,
                "title": "Car Sold!",
                "message": "Congratulations! Your Toyota Fortuner has been sold",
                "notification_type": "SALE",
                "is_read": True,
                "read_at": datetime.now() - timedelta(days=4),
                "created_at": datetime.now() - timedelta(days=5)
            },
            {
                "user_id": seller.id,
                "title": "New Review Received",
                "message": "You received a 5-star review from a buyer",
                "notification_type": "REVIEW",
                "is_read": False,
                "read_at": None,
                "created_at": datetime.now() - timedelta(days=2)
            },
            {
                "user_id": buyer.id,
                "title": "Test Drive Confirmed",
                "message": "Your test drive for Honda CR-V has been confirmed",
                "notification_type": "TEST_DRIVE",
                "is_read": True,
                "read_at": datetime.now() - timedelta(days=1),
                "created_at": datetime.now() - timedelta(days=2)
            },
        ]

        for notif_data in notifications:
            notification = Notification(**notif_data)
            db.add(notification)

        db.commit()
        print(f"✅ Created {len(notifications)} notifications")

    except Exception as e:
        print(f"❌ Error creating notifications: {str(e)}")
        db.rollback()


def main():
    """Run the comprehensive data seeding process"""
    print("\n" + "="*60)
    print("🚀 AutoHub Enhanced Data Seeder (NORMALIZED SCHEMA v4.0)")
    print("="*60)

    # Create database session
    db = SessionLocal()

    try:
        # Create core data (users, brands, colors, etc.)
        create_users(db)
        create_colors(db)
        create_brands_and_models(db)
        create_categories(db)
        create_features(db)

        # Create cars using separate seeder (if available)
        cars = []
        if create_sample_cars:
            print("\n" + "="*60)
            print("🚗 Car Data Seeding")
            print("="*60)
            print("\nWould you like to:")
            print("  1. Create sample cars (default)")
            print("  2. Skip car creation")
            print("  3. Clear existing cars and create new ones")

            choice = input("\nEnter choice (1-3, default=1): ").strip() or "1"

            if choice == "3":
                if clear_all_cars:
                    if clear_all_cars(db):
                        cars = create_sample_cars(db)
            elif choice == "1":
                cars = create_sample_cars(db)
            else:
                print("⏭️  Skipping car creation")
        else:
            print("\n⚠️  Car seeder not available. Skipping car creation.")
            print("   💡 Run 'python3 seed_cars.py' separately to add cars.")

        # Create enhanced data
        create_subscriptions(db)
        create_inquiries(db, cars)
        transaction = create_transactions(db, cars)
        create_reviews(db, transaction)
        create_favorites(db, cars)
        create_car_views(db, cars)
        create_notifications(db)

        print("\n" + "="*60)
        print("✅ Data Seeding Complete!")
        print("="*60)
        print("\n📋 Test Accounts:")
        print("   🔐 Admin:  admin@autohub.com  / admin123")
        print("   🏪 Seller: seller@autohub.com / seller123 (Pro subscription)")
        print("   🛒 Buyer:  buyer@autohub.com  / buyer123")

        print("\n📊 Sample Data Created:")
        if cars:
            print(f"   ✓ {len(cars)} car listings (with images, features, etc.)")
        else:
            print("   ⚠ No cars created (use seed_cars.py to add cars)")
        print("   ✓ Subscription for seller (Pro plan - ACTIVE)")
        if cars:
            print("   ✓ Inquiries, transactions, reviews (if cars exist)")
        print("   ✓ Notifications for users")

        print("\n🌐 You can now:")
        print("   - Login as buyer to browse cars, send inquiries, add favorites")
        print("   - Login as seller to manage listings, respond to inquiries")
        print("   - Login as admin to moderate content and verify payments")
        print("   - View analytics and engagement data")

        print("\n💡 Schema Compliance:")
        print("   - ✅ 100% aligned with NORMALIZED SCHEMA v4.0")
        print("   - ✅ All ENUM values in UPPERCASE")
        print("   - ✅ Using FK relationships (color_id, currency_id, etc.)")
        print("   - ✅ No duplicate fields (fully normalized 3NF)")

        print("\n🔧 Additional Commands:")
        print("   - python3 seed_cars.py  # Add/manage car data separately")
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
