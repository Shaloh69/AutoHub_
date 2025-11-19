from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.car import (
    CarCreate, CarUpdate, CarResponse, CarDetailResponse,
    CarImageUpload, CarBoost, BrandResponse, ModelResponse, CategoryResponse, FeatureResponse,
    PriceHistoryResponse
)
from app.schemas.common import PaginatedResponse, MessageResponse, IDResponse
from app.services.car_service import CarService
from app.services.file_service import FileService
from app.core.dependencies import get_current_user, get_current_seller, get_optional_user
from app.models.user import User
from app.models.car import CarImage, Car, Brand, Model, Category, Feature
from app.models.transaction import PriceHistory
from app.utils.enum_normalizer import normalize_car_data, normalize_enum_value

router = APIRouter()


@router.post("", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def create_car(
    car_data: CarCreate,
    current_user: User = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    """
    Create new car listing

    Requires seller/dealer role and verified account.
    Checks subscription limits before creating.
    """
    try:
        # FIX: Use getattr for user.id
        user_id = int(getattr(current_user, 'id', 0))

        # Normalize enum values before saving
        car_dict = car_data.model_dump()
        normalized_data = normalize_car_data(car_dict)

        # Check premium feature permissions
        if car_data.video_url or car_data.virtual_tour_url:
            from app.services.subscription_service import SubscriptionService
            subscription = SubscriptionService.get_user_subscription(db, user_id)

            if subscription:
                plan = getattr(subscription, 'plan', None)
                if plan:
                    # Check video permission
                    if car_data.video_url and not getattr(plan, 'can_add_video', False):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Video upload is not available in your current plan. Please upgrade to Premium or higher."
                        )

                    # Check virtual tour permission
                    if car_data.virtual_tour_url and not getattr(plan, 'can_add_virtual_tour', False):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Virtual tour is not available in your current plan. Please upgrade to Premium or higher."
                        )
            else:
                # No subscription - block premium features
                if car_data.video_url or car_data.virtual_tour_url:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Premium features require an active subscription. Please subscribe to a plan."
                    )

        car = CarService.create_car(db, user_id, normalized_data)
        # FIX: Use getattr for car.id
        car_id = int(getattr(car, 'id', 0))
        return IDResponse(id=car_id, message="Car listing created successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=PaginatedResponse)
async def search_cars(
    # Search query
    q: Optional[str] = None,
    
    # Brand & Model
    brand_id: Optional[int] = None,
    model_id: Optional[int] = None,
    category_id: Optional[int] = None,

    # Seller filter
    seller_id: Optional[int] = None,

    # Price range
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    
    # Year range
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    
    # Technical specs
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None,
    min_mileage: Optional[int] = None,
    max_mileage: Optional[int] = None,
    
    # Condition
    car_condition: Optional[str] = None,

    # Approval status
    approval_status: Optional[str] = None,

    # Location
    city_id: Optional[int] = None,
    province_id: Optional[int] = None,
    region_id: Optional[int] = None,

    # Location-based search
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[int] = Query(25, ge=1, le=500),

    # Features
    is_featured: Optional[bool] = None,
    price_negotiable: Optional[bool] = None,
    financing_available: Optional[bool] = None,
    
    # Sorting - Support both legacy (sort_by/sort_order) and new (sort) formats
    sort: Optional[str] = None,  # Frontend sends: "-created_at", "price", etc.
    sort_by: Optional[str] = Query(None, pattern="^(created_at|price|year|mileage|views_count)$"),
    sort_order: Optional[str] = Query(None, pattern="^(asc|desc)$"),

    # Pagination
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),

    # Dependencies
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Search cars with advanced filters

    Supports:
    - Full-text search
    - Price/year/mileage range filtering
    - Location-based search with radius
    - Multiple filter combinations
    - Sorting options (sort="-created_at" or sort_by/sort_order)
    - Pagination
    """
    # Parse sort parameter if provided (e.g., "-created_at" -> sort_by="created_at", sort_order="desc")
    if sort:
        if sort.startswith('-'):
            sort_by = sort[1:]  # Remove the '-' prefix
            sort_order = "desc"
        else:
            sort_by = sort
            sort_order = "asc"

    # Set defaults if still not set
    if not sort_by:
        sort_by = "created_at"
    if not sort_order:
        sort_order = "desc"

    # Normalize enum filter values before search
    normalized_fuel_type = normalize_enum_value('fuel_type', fuel_type) if fuel_type else None
    normalized_transmission = normalize_enum_value('transmission', transmission) if transmission else None
    normalized_condition = normalize_enum_value('car_condition', car_condition) if car_condition else None
    normalized_approval_status = normalize_enum_value('approval_status', approval_status) if approval_status else None

    filters = {
        "q": q,
        "brand_id": brand_id,
        "model_id": model_id,
        "category_id": category_id,
        "seller_id": seller_id,
        "min_price": min_price,
        "max_price": max_price,
        "min_year": min_year,
        "max_year": max_year,
        "fuel_type": normalized_fuel_type,
        "transmission": normalized_transmission,
        "min_mileage": min_mileage,
        "max_mileage": max_mileage,
        "car_condition": normalized_condition,
        "approval_status": normalized_approval_status,
        "city_id": city_id,
        "province_id": province_id,
        "region_id": region_id,
        "latitude": latitude,
        "longitude": longitude,
        "radius_km": radius_km,
        "is_featured": is_featured,
        "price_negotiable": price_negotiable,
        "financing_available": financing_available,
        "sort_by": sort_by,
        "sort_order": sort_order
    }

    # Search cars with detailed logging
    import logging
    logger = logging.getLogger(__name__)
    logger.info("=" * 80)
    logger.info("🔍 SEARCH_CARS DEBUG")
    logger.info(f"  Filters: {filters}")
    logger.info(f"  Page: {page}, Page Size: {page_size}")

    try:
        cars, total = CarService.search_cars(db, filters, page, page_size)
        logger.info(f"  ✅ Found {total} total cars, {len(cars)} on this page")

        if cars:
            sample = cars[0]
            logger.info(f"  📊 Sample car: ID={sample.id}, Status={sample.status}, Approval={sample.approval_status}")
    except Exception as e:
        logger.error(f"  ❌ Error in CarService.search_cars: {type(e).__name__}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        logger.error("=" * 80)
        raise

    # Normalize enum values for each car before validation
    for car in cars:
        if hasattr(car, 'status') and car.status:
            car.status = normalize_enum_value('status', car.status)
        if hasattr(car, 'approval_status') and car.approval_status:
            car.approval_status = normalize_enum_value('approval_status', car.approval_status)
        if hasattr(car, 'fuel_type') and car.fuel_type:
            car.fuel_type = normalize_enum_value('fuel_type', car.fuel_type)
        if hasattr(car, 'transmission') and car.transmission:
            car.transmission = normalize_enum_value('transmission', car.transmission)
        if hasattr(car, 'car_condition') and car.car_condition:
            car.car_condition = normalize_enum_value('car_condition', car.car_condition)

    # Convert to response models - WORKING: This function works correctly
    try:
        logger.info(f"  🔄 Converting {len(cars)} cars to CarResponse models...")
        items = []
        for car in cars:
            # Convert to dict to avoid SQLAlchemy ORM serialization issues
            car_dict = {
                "id": car.id,
                "seller_id": car.seller_id,
                "brand_id": car.brand_id,
                "model_id": car.model_id,
                "category_id": car.category_id,
                "color_id": car.color_id,
                "interior_color_id": car.interior_color_id,
                "title": car.title,
                "description": car.description,
                "year": car.year,
                "price": car.price,
                "currency_id": car.currency_id,
                "mileage": car.mileage,
                "fuel_type": car.fuel_type if isinstance(car.fuel_type, str) else car.fuel_type.value,
                "transmission": car.transmission if isinstance(car.transmission, str) else car.transmission.value,
                "car_condition": car.car_condition if isinstance(car.car_condition, str) else car.car_condition.value,
                "city_id": car.city_id,
                "province_id": car.province_id,
                "region_id": car.region_id,
                "status": car.status if isinstance(car.status, str) else car.status.value,
                "approval_status": car.approval_status if isinstance(car.approval_status, str) else car.approval_status.value,
                "is_featured": car.is_featured,
                "is_premium": car.is_premium,
                "is_active": car.is_active,
                "views_count": car.views_count,
                "contact_count": car.contact_count,
                "favorite_count": car.favorite_count,
                "average_rating": car.average_rating,
                "created_at": car.created_at,
                "updated_at": car.updated_at,
                # Media - Include main_image for frontend display
                "main_image": car.main_image,  # FIX: Include main_image for car cards
                # Convert related objects to simple dicts/lists to avoid ORM serialization issues
                "images": [],  # Empty for list view to improve performance
                "brand_rel": None,
                "model_rel": None,
                "city": None,
            }
            items.append(CarResponse.model_validate(car_dict))

        logger.info(f"  ✅ Successfully validated {len(items)} cars")
        logger.info("=" * 80)
    except Exception as e:
        # Debug: Log validation errors
        logger.error("=" * 80)
        logger.error("❌ VALIDATION ERROR in search_cars")
        logger.error(f"Error: {e}")
        logger.error(f"Error type: {type(e)}")
        if cars:
            logger.error(f"Sample car attributes: {dir(cars[0])}")
            logger.error(f"Sample car __dict__: {cars[0].__dict__ if hasattr(cars[0], '__dict__') else 'No __dict__'}")
        logger.error("=" * 80)
        raise

    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size

    logger.info(f"  📦 Creating PaginatedResponse with {len(items)} items, total={total}, page={page}")

    try:
        response = PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
        logger.info(f"  ✅ PaginatedResponse created successfully")
        return response
    except Exception as e:
        logger.error(f"  ❌ Error creating PaginatedResponse: {type(e).__name__}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise


@router.get("/brands", response_model=List[BrandResponse])
def get_brands(
    is_popular: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all car brands

    Optionally filter by popular brands in Philippines.
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info("=" * 80)
        logger.info("🔍 GET /api/v1/cars/brands")
        logger.info(f"  📥 Parameters: is_popular={is_popular} (type: {type(is_popular)})")

        query = db.query(Brand)
        logger.info(f"  🔍 Initial query created")

        if is_popular is not None:
            logger.info(f"  🔍 Filtering by is_popular={is_popular}")
            query = query.filter(Brand.is_popular == is_popular)

        brands = query.order_by(Brand.name).all()
        logger.info(f"  ✅ Found {len(brands)} brands from database")

        if brands:
            sample = brands[0]
            logger.info(f"  📊 Sample brand: id={sample.id}, name={sample.name}, is_popular={sample.is_popular}, is_active={sample.is_active}")

        # Validate and convert to response models
        logger.info(f"  🔄 Converting to response models...")
        result = []
        for i, brand in enumerate(brands):
            try:
                validated = BrandResponse.model_validate(brand)
                result.append(validated)
            except Exception as e:
                logger.error(f"  ❌ Validation error for brand {brand.id} ({brand.name}): {e}")
                raise

        logger.info(f"  ✅ Successfully validated {len(result)} brands")
        logger.info("=" * 80)
        return result

    except Exception as e:
        logger.error(f"  ❌ ERROR in get_brands: {type(e).__name__}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise


@router.get("/models", response_model=List[ModelResponse])
def get_models(
    brand_id: Optional[int] = Query(None),
    is_popular: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get car models

    Optionally filter by brand_id or popular models in Philippines.
    """
    query = db.query(Model)

    if brand_id is not None:
        query = query.filter(Model.brand_id == brand_id)

    # Note: is_popular filter removed as Model table doesn't have is_popular field
    # if is_popular is not None:
    #     query = query.filter(Model.is_popular == is_popular)

    models = query.order_by(Model.name).all()

    return [ModelResponse.model_validate(model) for model in models]


@router.get("/brands/{brand_id}/models", response_model=List[ModelResponse])
def get_models_by_brand(
    brand_id: int,
    is_popular: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all models for a specific brand (alternative endpoint)

    Optionally filter by popular models in Philippines.
    """
    query = db.query(Model).filter(Model.brand_id == brand_id)

    # Note: is_popular filter removed as Model table doesn't have is_popular field
    # if is_popular is not None:
    #     query = query.filter(Model.is_popular == is_popular)

    models = query.order_by(Model.name).all()

    return [ModelResponse.model_validate(model) for model in models]


@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    is_active: bool = Query(True),
    db: Session = Depends(get_db)
):
    """
    Get all car categories

    Optionally filter by active categories (default: True).
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info("=" * 80)
        logger.info("🔍 GET /api/v1/cars/categories")
        logger.info(f"  📥 Parameters: is_active={is_active} (type: {type(is_active)})")

        query = db.query(Category)
        logger.info(f"  🔍 Initial query created")

        if is_active is not None:
            logger.info(f"  🔍 Filtering by is_active={is_active}")
            query = query.filter(Category.is_active == is_active)

        categories = query.order_by(Category.display_order, Category.name).all()
        logger.info(f"  ✅ Found {len(categories)} categories from database")

        if categories:
            sample = categories[0]
            logger.info(f"  📊 Sample category: id={sample.id}, name={sample.name}, is_active={sample.is_active}, display_order={sample.display_order}")

        # Validate and convert to response models
        logger.info(f"  🔄 Converting to response models...")
        result = []
        for i, category in enumerate(categories):
            try:
                validated = CategoryResponse.model_validate(category)
                result.append(validated)
            except Exception as e:
                logger.error(f"  ❌ Validation error for category {category.id} ({category.name}): {e}")
                raise

        logger.info(f"  ✅ Successfully validated {len(result)} categories")
        logger.info("=" * 80)
        return result

    except Exception as e:
        logger.error(f"  ❌ ERROR in get_categories: {type(e).__name__}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise


@router.get("/features", response_model=List[FeatureResponse])
def get_features(
    category: Optional[str] = Query(None),
    is_popular: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all car features

    Optionally filter by category or popular features.
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info("=" * 80)
        logger.info("🔍 GET /api/v1/cars/features")
        logger.info(f"  📥 Parameters: category={category}, is_popular={is_popular}")

        query = db.query(Feature)
        logger.info(f"  🔍 Initial query created")

        if category:
            logger.info(f"  🔍 Filtering by category={category}")
            query = query.filter(Feature.category == category)

        # Note: is_popular filter removed as Feature table doesn't have is_popular field
        # if is_popular is not None:
        #     query = query.filter(Feature.is_popular == is_popular)

        features = query.order_by(Feature.name).all()
        logger.info(f"  ✅ Found {len(features)} features from database")

        if features:
            sample = features[0]
            logger.info(f"  📊 Sample feature: id={sample.id}, name={sample.name}, category={sample.category}, is_premium={sample.is_premium}")

        # Validate and convert to response models
        logger.info(f"  🔄 Converting to response models...")
        result = []
        for i, feature in enumerate(features):
            try:
                validated = FeatureResponse.model_validate(feature)
                result.append(validated)
            except Exception as e:
                logger.error(f"  ❌ Validation error for feature {feature.id} ({feature.name}): {e}")
                raise

        logger.info(f"  ✅ Successfully validated {len(result)} features")
        logger.info("=" * 80)
        return result

    except Exception as e:
        logger.error(f"  ❌ ERROR in get_features: {type(e).__name__}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise


@router.get("/{car_id}", response_model=CarDetailResponse)
async def get_car(
    car_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get car details by ID
    
    Records view and returns complete car information including:
    - All images
    - Features
    - Seller information
    - Location details
    """
    # FIX: Use getattr for user_id
    user_id: Optional[int] = int(getattr(current_user, 'id', 0)) if current_user else None
    car = CarService.get_car(db, car_id, user_id)

    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    try:
        # ============================================
        # DEBUG: Comprehensive logging for debugging
        # ============================================
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"\n{'='*60}")
        logger.info(f"🔍 DEBUG: GET /api/v1/cars/{car_id}")
        logger.info(f"{'='*60}")
        logger.info(f"  Car title: {car.title}")
        logger.info(f"  Car IDs: brand_id={car.brand_id}, model_id={car.model_id}, seller_id={car.seller_id}")

        # Log raw enum values from database
        logger.info(f"\n  📊 RAW DATABASE VALUES:")
        logger.info(f"    status: {repr(car.status)} (type: {type(car.status).__name__})")
        logger.info(f"    approval_status: {repr(car.approval_status)} (type: {type(car.approval_status).__name__})")
        logger.info(f"    fuel_type: {repr(car.fuel_type)} (type: {type(car.fuel_type).__name__})")
        logger.info(f"    transmission: {repr(car.transmission)} (type: {type(car.transmission).__name__})")
        logger.info(f"    car_condition: {repr(getattr(car, 'car_condition', 'MISSING'))}")
        logger.info(f"    body_type: {repr(getattr(car, 'body_type', 'MISSING'))}")
        logger.info(f"    engine_type: {repr(getattr(car, 'engine_type', 'MISSING'))}")
        logger.info(f"    visibility: {repr(getattr(car, 'visibility', 'MISSING'))}")
        logger.info(f"    mileage_unit: {repr(getattr(car, 'mileage_unit', 'MISSING'))}")

        # Log relationships
        logger.info(f"\n  🔗 RELATIONSHIPS:")
        logger.info(f"    brand_rel: {car.brand_rel}")
        logger.info(f"    model_rel: {car.model_rel}")
        logger.info(f"    city: {car.city}")
        logger.info(f"    seller: {car.seller}")
        logger.info(f"    images: {len(car.images) if car.images else 0} items")
        logger.info(f"    features: {len(car.features) if car.features else 0} items")

        # Normalize all enum fields directly on the car object attributes
        logger.info(f"\n  🔄 NORMALIZING ENUMS:")
        if hasattr(car, 'status') and car.status:
            old = repr(car.status)
            car.status = normalize_enum_value('status', car.status)
            logger.info(f"    status: {old} → {repr(car.status)}")

        if hasattr(car, 'approval_status') and car.approval_status:
            old = repr(car.approval_status)
            car.approval_status = normalize_enum_value('approval_status', car.approval_status)
            logger.info(f"    approval_status: {old} → {repr(car.approval_status)}")

        if hasattr(car, 'fuel_type') and car.fuel_type:
            old = repr(car.fuel_type)
            car.fuel_type = normalize_enum_value('fuel_type', car.fuel_type)
            logger.info(f"    fuel_type: {old} → {repr(car.fuel_type)}")

        if hasattr(car, 'transmission') and car.transmission:
            old = repr(car.transmission)
            car.transmission = normalize_enum_value('transmission', car.transmission)
            logger.info(f"    transmission: {old} → {repr(car.transmission)}")

        if hasattr(car, 'drivetrain') and car.drivetrain:
            old = repr(car.drivetrain)
            car.drivetrain = normalize_enum_value('drivetrain', car.drivetrain)
            logger.info(f"    drivetrain: {old} → {repr(car.drivetrain)}")

        if hasattr(car, 'car_condition') and car.car_condition:
            old = repr(car.car_condition)
            car.car_condition = normalize_enum_value('car_condition', car.car_condition)
            logger.info(f"    car_condition: {old} → {repr(car.car_condition)}")

        if hasattr(car, 'body_type') and car.body_type:
            old = repr(car.body_type)
            car.body_type = normalize_enum_value('body_type', car.body_type)
            logger.info(f"    body_type: {old} → {repr(car.body_type)}")

        if hasattr(car, 'visibility') and car.visibility:
            old = repr(car.visibility)
            car.visibility = normalize_enum_value('visibility', car.visibility)
            logger.info(f"    visibility: {old} → {repr(car.visibility)}")

        # Build response dict with proper relationship mappings
        logger.info(f"\n  🔨 Building response dictionary...")

        # Convert relationship objects to dicts for JSON serialization
        # CarDetailResponse expects these as objects, but they need to be serializable
        brand_dict = None
        if car.brand_rel:
            brand_dict = {
                'id': car.brand_rel.id,
                'name': car.brand_rel.name,
                'slug': car.brand_rel.slug,
                'logo_url': car.brand_rel.logo_url,
                'country_of_origin': car.brand_rel.country_of_origin,
            }
            logger.info(f"    Converted brand_rel: {brand_dict['name']}")

        model_dict = None
        if car.model_rel:
            model_dict = {
                'id': car.model_rel.id,
                'name': car.model_rel.name,
                'slug': car.model_rel.slug,
                'model_type': car.model_rel.model_type,
            }
            logger.info(f"    Converted model_rel: {model_dict['name']}")

        city_dict = None
        if car.city:
            city_dict = {
                'id': car.city.id,
                'name': car.city.name,
                'province_id': car.city.province_id,
            }
            logger.info(f"    Converted city: {city_dict['name']}")

        seller_dict = None
        if car.seller:
            seller_dict = {
                'id': car.seller.id,
                'email': car.seller.email,
                'first_name': car.seller.first_name,
                'last_name': car.seller.last_name,
                'business_name': car.seller.business_name,
                'phone': car.seller.phone,
            }
            logger.info(f"    Converted seller: {seller_dict['email']}")

        # Convert images to dicts
        images_list = []
        if car.images:
            for img in car.images:
                images_list.append({
                    'id': img.id,
                    'car_id': img.car_id,
                    'image_url': img.image_url,
                    'image_type': img.image_type,
                    'is_main': img.is_main,
                    'display_order': img.display_order,
                })
            logger.info(f"    Converted {len(images_list)} images")

        # Convert features to dicts
        features_list = []
        if car.features:
            for cf in car.features:
                if cf.feature:
                    features_list.append({
                        'id': cf.feature.id,
                        'name': cf.feature.name,
                        'slug': cf.feature.slug,
                        'category': cf.feature.category,
                    })
            logger.info(f"    Converted {len(features_list)} features")

        # Manually build dict with only scalar fields (no ORM objects)
        # This prevents "Unable to serialize unknown type" errors
        car_dict = {
            # Base fields from CarResponse
            'id': car.id,
            'seller_id': car.seller_id,
            'brand_id': car.brand_id,
            'model_id': car.model_id,
            'category_id': car.category_id,
            'color_id': car.color_id,
            'interior_color_id': car.interior_color_id,
            'title': car.title,
            'description': car.description,
            'year': car.year,
            'price': car.price,
            'currency_id': car.currency_id,
            'mileage': car.mileage,
            'fuel_type': car.fuel_type if isinstance(car.fuel_type, str) else car.fuel_type.value,
            'transmission': car.transmission if isinstance(car.transmission, str) else car.transmission.value,
            'car_condition': car.car_condition if isinstance(car.car_condition, str) else car.car_condition.value,
            'city_id': car.city_id,
            'province_id': car.province_id,
            'region_id': car.region_id,
            'status': car.status if isinstance(car.status, str) else car.status.value,
            'approval_status': car.approval_status if isinstance(car.approval_status, str) else car.approval_status.value,
            'is_featured': car.is_featured,
            'is_premium': car.is_premium,
            'is_active': car.is_active,
            'views_count': car.views_count,
            'contact_count': car.contact_count,
            'favorite_count': car.favorite_count,
            'average_rating': car.average_rating,
            'created_at': car.created_at,
            'updated_at': car.updated_at,

            # Additional fields for CarDetailResponse
            'vin_number': car.vin_number,
            'plate_number': car.plate_number,
            'trim': car.trim,
            'body_type': car.body_type.value if car.body_type and not isinstance(car.body_type, str) else car.body_type,
            'engine_size': car.engine_size,
            'cylinders': car.cylinders,
            'horsepower': car.horsepower,
            'torque': car.torque,
            'fuel_economy_city': car.fuel_economy_city,
            'fuel_economy_highway': car.fuel_economy_highway,
            'drivetrain': car.drivetrain.value if car.drivetrain and not isinstance(car.drivetrain, str) else car.drivetrain,
            'seats': car.seats,
            'doors': car.doors,
            'mileage_unit': car.mileage_unit.value if car.mileage_unit and not isinstance(car.mileage_unit, str) else car.mileage_unit,
            'accident_history': car.accident_history,
            'accident_details': car.accident_details,
            'flood_history': car.flood_history,
            'number_of_owners': car.number_of_owners,
            'service_history_available': car.service_history_available,
            'registration_status': car.registration_status.value if car.registration_status and not isinstance(car.registration_status, str) else car.registration_status,
            'registration_expiry': car.registration_expiry,
            'or_cr_status': car.or_cr_status.value if car.or_cr_status and not isinstance(car.or_cr_status, str) else car.or_cr_status,
            'lto_registered': car.lto_registered,
            'deed_of_sale_available': car.deed_of_sale_available,
            'has_emission_test': car.has_emission_test,
            'casa_maintained': car.casa_maintained,
            'insurance_status': car.insurance_status.value if car.insurance_status and not isinstance(car.insurance_status, str) else car.insurance_status,
            'insurance_expiry': car.insurance_expiry,
            'warranty_remaining': car.warranty_remaining,
            'warranty_details': car.warranty_details,
            'warranty_expiry': car.warranty_expiry,
            'price_negotiable': car.price_negotiable,
            'financing_available': car.financing_available,
            'trade_in_accepted': car.trade_in_accepted,
            'installment_available': car.installment_available,
            'detailed_address': car.detailed_address,
            'barangay': car.barangay,
            'latitude': car.latitude,
            'longitude': car.longitude,
            'main_image': car.main_image,
            'video_url': car.video_url,
            'virtual_tour_url': car.virtual_tour_url,

            # Serialized relationship objects
            'brand_rel': brand_dict,
            'model_rel': model_dict,
            'city': city_dict,
            'seller': seller_dict,
            'images': images_list,
            'features': features_list,
        }

        logger.info(f"  📦 Response dict has {len(car_dict)} keys")
        logger.info(f"  ✅ Attempting Pydantic validation...")

        result = CarDetailResponse.model_validate(car_dict)
        logger.info(f"  ✅ Pydantic validation successful!")
        logger.info(f"  🚀 Returning CarDetailResponse (should be 200 OK)")
        logger.info(f"{'='*60}\n")
        return result

    except Exception as e:
        # Log validation error details for debugging
        import logging
        import traceback
        logger = logging.getLogger(__name__)

        logger.error(f"\n{'='*60}")
        logger.error(f"❌ VALIDATION ERROR for car {car_id}")
        logger.error(f"{'='*60}")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")

        # Log current state of car object
        logger.error(f"\n  Current car state:")
        logger.error(f"    status: {getattr(car, 'status', 'N/A')}")
        logger.error(f"    approval_status: {getattr(car, 'approval_status', 'N/A')}")
        logger.error(f"    fuel_type: {getattr(car, 'fuel_type', 'N/A')}")
        logger.error(f"    transmission: {getattr(car, 'transmission', 'N/A')}")
        logger.error(f"    car_condition: {getattr(car, 'car_condition', 'N/A')}")
        logger.error(f"    body_type: {getattr(car, 'body_type', 'N/A')}")
        logger.error(f"    engine_type: {getattr(car, 'engine_type', 'N/A')}")
        logger.error(f"    visibility: {getattr(car, 'visibility', 'N/A')}")

        # Full traceback
        logger.error(f"\n  Full traceback:")
        logger.error(traceback.format_exc())
        logger.error(f"{'='*60}\n")

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Car data validation failed: {str(e)}"
        )


@router.put("/{car_id}", response_model=CarResponse)
async def update_car(
    car_id: int,
    car_data: CarUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update car listing

    Only the car owner can update the listing.
    Tracks price changes in price history.
    """
    try:
        # FIX: Use getattr
        user_id = int(getattr(current_user, 'id', 0))

        # Normalize enum values before updating
        update_dict = car_data.model_dump(exclude_unset=True)
        normalized_update = normalize_car_data(update_dict)

        car = CarService.update_car(db, car_id, user_id, normalized_update)

        # CRITICAL FIX: Convert to dict to avoid ORM serialization issues
        # Prevents: "Unable to serialize unknown type: <class 'app.models.car.CarImage'>"
        # See also: /api/v1/users/listings for same pattern
        car_dict = {
            "id": car.id,
            "seller_id": car.seller_id,
            "brand_id": car.brand_id,
            "model_id": car.model_id,
            "category_id": car.category_id,
            "color_id": car.color_id,
            "interior_color_id": car.interior_color_id,
            "title": car.title,
            "description": car.description,
            "year": car.year,
            "price": car.price,
            "currency_id": car.currency_id,
            "mileage": car.mileage,
            "fuel_type": car.fuel_type if isinstance(car.fuel_type, str) else car.fuel_type.value,
            "transmission": car.transmission if isinstance(car.transmission, str) else car.transmission.value,
            "car_condition": car.car_condition if isinstance(car.car_condition, str) else car.car_condition.value,
            "city_id": car.city_id,
            "province_id": car.province_id,
            "region_id": car.region_id,
            "status": car.status if isinstance(car.status, str) else car.status.value,
            "approval_status": car.approval_status if isinstance(car.approval_status, str) else car.approval_status.value,
            "is_featured": car.is_featured,
            "is_premium": car.is_premium,
            "is_active": car.is_active,
            "views_count": car.views_count,
            "contact_count": car.contact_count,
            "favorite_count": car.favorite_count,
            "average_rating": car.average_rating,
            "created_at": car.created_at,
            "updated_at": car.updated_at,
            # Media - Include main_image for frontend display
            "main_image": car.main_image,  # FIX: Include main_image
            "images": [],
            "brand_rel": None,
            "model_rel": None,
            "city": None,
        }

        return CarResponse.model_validate(car_dict)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{car_id}", response_model=MessageResponse)
async def delete_car(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete car listing (soft delete)
    
    Sets status to 'removed' and is_active to False.
    Only the car owner can delete their listing.
    """
    try:
        # FIX: Use getattr
        user_id = int(getattr(current_user, 'id', 0))
        CarService.delete_car(db, car_id, user_id)
        return MessageResponse(message="Car listing deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{car_id}/images", response_model=CarImageUpload, status_code=status.HTTP_201_CREATED)
async def upload_car_image(
    car_id: int,
    file: UploadFile = File(...),
    image_type: str = Query("exterior", pattern="^(exterior|interior|engine|damage|document|other)$"),
    is_main: bool = Query(False, description="Set as main/primary image"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload car image
    
    Automatically creates thumbnail and medium-sized versions.
    Validates file type and size.
    """
    # Verify car ownership - FIX: use getattr
    user_id = int(getattr(current_user, 'id', 0))
    car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # Check image limit based on subscription
    image_count = db.query(CarImage).filter(CarImage.car_id == car_id).count()

    # Get subscription from database (Fixed: don't rely on current_user.current_subscription)
    from app.services.subscription_service import SubscriptionService
    subscription = SubscriptionService.get_user_subscription(db, user_id)
    if subscription:
        plan = getattr(subscription, 'plan', None)
        max_images = int(getattr(plan, 'max_photos_per_listing', 5)) if plan else 5  # Fixed: was max_images_per_listing
    else:
        max_images = 5  # Free tier limit

    if image_count >= max_images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {max_images} images allowed for your subscription"
        )
    
    try:
        # Upload image
        result = await FileService.upload_image(file, folder=f"cars/{car_id}")

        # If this is set as main, unset other main images
        if is_main:
            db.query(CarImage).filter(CarImage.car_id == car_id).update({"is_main": False})

        # Determine if this image should be main
        should_be_main = is_main or image_count == 0  # First image is always main

        # Create image record - Only use fields that exist in database
        car_image = CarImage(
            car_id=car_id,
            image_url=result["file_url"],
            image_type=image_type,
            is_main=should_be_main,
            display_order=image_count
        )

        db.add(car_image)

        # FIX: Update car.main_image field for frontend display
        if should_be_main:
            setattr(car, 'main_image', result["file_url"])
            setattr(car, 'total_images', image_count + 1)

        db.commit()
        db.refresh(car_image)
        
        return CarImageUpload.model_validate(car_image)
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{car_id}/images/{image_id}", response_model=MessageResponse)
async def delete_car_image(
    car_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete car image
    
    Removes image file from storage and database record.
    """
    # Verify car ownership - FIX: use getattr
    user_id = int(getattr(current_user, 'id', 0))
    car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # Get image
    image = db.query(CarImage).filter(
        CarImage.id == image_id,
        CarImage.car_id == car_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    
    # Check if this is the main image
    was_main = getattr(image, 'is_main', False)

    # Delete file from storage - FIX: Use getattr
    image_url_value = getattr(image, 'image_url', None)
    if image_url_value is not None:
        FileService.delete_image(str(image_url_value))

    # Delete from database
    db.delete(image)

    # FIX: If deleted image was main, update car.main_image to next available image
    if was_main:
        # Get the first remaining image
        next_main_image = db.query(CarImage).filter(
            CarImage.car_id == car_id
        ).order_by(CarImage.display_order).first()

        if next_main_image:
            # Set new main image
            setattr(next_main_image, 'is_main', True)
            setattr(car, 'main_image', getattr(next_main_image, 'image_url', None))
        else:
            # No images left, clear main_image
            setattr(car, 'main_image', None)

    # Update total images count
    remaining_count = db.query(CarImage).filter(CarImage.car_id == car_id).count() - 1
    setattr(car, 'total_images', max(0, remaining_count))

    db.commit()

    return MessageResponse(message="Image deleted successfully")


@router.post("/{car_id}/boost", response_model=CarResponse)
async def boost_car(
    car_id: int,
    boost_data: CarBoost,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Boost car listing for increased visibility

    Requires active subscription with available boost credits.
    Increases ranking score and priority in search results.
    """
    try:
        # FIX: Use getattr
        user_id = int(getattr(current_user, 'id', 0))
        car = CarService.boost_car(db, car_id, user_id, boost_data.duration_hours)

        # CRITICAL FIX: Convert to dict to avoid ORM serialization issues
        # Prevents: "Unable to serialize unknown type: <class 'app.models.car.CarImage'>"
        car_dict = {
            "id": car.id,
            "seller_id": car.seller_id,
            "brand_id": car.brand_id,
            "model_id": car.model_id,
            "category_id": car.category_id,
            "color_id": car.color_id,
            "interior_color_id": car.interior_color_id,
            "title": car.title,
            "description": car.description,
            "year": car.year,
            "price": car.price,
            "currency_id": car.currency_id,
            "mileage": car.mileage,
            "fuel_type": car.fuel_type if isinstance(car.fuel_type, str) else car.fuel_type.value,
            "transmission": car.transmission if isinstance(car.transmission, str) else car.transmission.value,
            "car_condition": car.car_condition if isinstance(car.car_condition, str) else car.car_condition.value,
            "city_id": car.city_id,
            "province_id": car.province_id,
            "region_id": car.region_id,
            "status": car.status if isinstance(car.status, str) else car.status.value,
            "approval_status": car.approval_status if isinstance(car.approval_status, str) else car.approval_status.value,
            "is_featured": car.is_featured,
            "is_premium": car.is_premium,
            "is_active": car.is_active,
            "views_count": car.views_count,
            "contact_count": car.contact_count,
            "favorite_count": car.favorite_count,
            "average_rating": car.average_rating,
            "created_at": car.created_at,
            "updated_at": car.updated_at,
            # Media - Include main_image for frontend display
            "main_image": car.main_image,  # FIX: Include main_image
            "images": [],
            "brand_rel": None,
            "model_rel": None,
            "city": None,
        }

        return CarResponse.model_validate(car_dict)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{car_id}/feature", response_model=CarResponse)
async def feature_car(
    car_id: int,
    duration_days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Make car listing featured
    
    Featured listings appear at the top of search results.
    Requires subscription with featured listing slots.
    """
    # Verify car ownership - FIX: use getattr
    user_id = int(getattr(current_user, 'id', 0))
    car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # Check subscription and featured listing limits
    from app.services.subscription_service import SubscriptionService
    subscription = SubscriptionService.get_user_subscription(db, user_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Featured listings require an active subscription"
        )

    # Check featured listing limit
    plan = getattr(subscription, 'plan', None)
    if plan:
        max_featured = int(getattr(plan, 'max_featured_listings', 0))
        if max_featured == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your subscription plan does not include featured listings. Please upgrade."
            )

        # Count current featured listings
        current_featured = db.query(Car).filter(
            Car.seller_id == user_id,
            Car.is_featured == True,
            Car.featured_until > datetime.utcnow()
        ).count()

        if current_featured >= max_featured:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Featured listing limit reached ({current_featured}/{max_featured}). Please upgrade your plan or wait for existing featured listings to expire."
            )

    # Set as featured - use setattr
    setattr(car, 'is_featured', True)
    setattr(car, 'featured_until', datetime.utcnow() + timedelta(days=duration_days))
    
    # Update ranking score - FIX: use getattr
    current_ranking = int(getattr(car, 'ranking_score', 0))
    setattr(car, 'ranking_score', current_ranking + 50)

    db.commit()
    db.refresh(car)

    # CRITICAL FIX: Convert to dict to avoid ORM serialization issues
    # Prevents: "Unable to serialize unknown type: <class 'app.models.car.CarImage'>"
    car_dict = {
        "id": car.id,
        "seller_id": car.seller_id,
        "brand_id": car.brand_id,
        "model_id": car.model_id,
        "category_id": car.category_id,
        "color_id": car.color_id,
        "interior_color_id": car.interior_color_id,
        "title": car.title,
        "description": car.description,
        "year": car.year,
        "price": car.price,
        "currency_id": car.currency_id,
        "mileage": car.mileage,
        "fuel_type": car.fuel_type if isinstance(car.fuel_type, str) else car.fuel_type.value,
        "transmission": car.transmission if isinstance(car.transmission, str) else car.transmission.value,
        "car_condition": car.car_condition if isinstance(car.car_condition, str) else car.car_condition.value,
        "city_id": car.city_id,
        "province_id": car.province_id,
        "region_id": car.region_id,
        "status": car.status if isinstance(car.status, str) else car.status.value,
        "approval_status": car.approval_status if isinstance(car.approval_status, str) else car.approval_status.value,
        "is_featured": car.is_featured,
        "is_premium": car.is_premium,
        "is_active": car.is_active,
        "views_count": car.views_count,
        "contact_count": car.contact_count,
        "favorite_count": car.favorite_count,
        "average_rating": car.average_rating,
        "created_at": car.created_at,
        "updated_at": car.updated_at,
        # Media - Include main_image for frontend display
        "main_image": car.main_image,  # FIX: Include main_image
        "images": [],
        "brand_rel": None,
        "model_rel": None,
        "city": None,
    }

    return CarResponse.model_validate(car_dict)


@router.get("/{car_id}/price-history", response_model=List[PriceHistoryResponse])
async def get_price_history(
    car_id: int,
    db: Session = Depends(get_db)
):
    """
    Get price history for a car
    
    Shows all price changes with dates and reasons.
    """
    price_history = db.query(PriceHistory).filter(
        PriceHistory.car_id == car_id
    ).order_by(PriceHistory.created_at.desc()).all()
    
    return [PriceHistoryResponse.model_validate(ph) for ph in price_history]


