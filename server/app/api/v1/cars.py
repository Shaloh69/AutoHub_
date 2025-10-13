from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.car import (
    CarCreate, CarUpdate, CarResponse, CarDetailResponse,
    CarImageUpload, CarBoost, BrandResponse, ModelResponse, FeatureResponse,
    PriceHistoryResponse
)
from app.schemas.common import PaginatedResponse, MessageResponse, IDResponse
from app.services.car_service import CarService
from app.services.file_service import FileService
from app.core.dependencies import get_current_user, get_current_seller, get_optional_user
from app.models.user import User
from app.models.car import CarImage, Car, Brand, Model, Feature
from app.models.transaction import PriceHistory

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
        car = CarService.create_car(db, user_id, car_data.model_dump())
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
    condition_rating: Optional[str] = None,
    
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
    negotiable: Optional[bool] = None,
    financing_available: Optional[bool] = None,
    
    # Sorting
    sort_by: str = Query("created_at", pattern="^(created_at|price|year|mileage|views_count)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    
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
    - Sorting options
    - Pagination
    """
    filters = {
        "q": q,
        "brand_id": brand_id,
        "model_id": model_id,
        "category_id": category_id,
        "min_price": min_price,
        "max_price": max_price,
        "min_year": min_year,
        "max_year": max_year,
        "fuel_type": fuel_type,
        "transmission": transmission,
        "min_mileage": min_mileage,
        "max_mileage": max_mileage,
        "condition_rating": condition_rating,
        "city_id": city_id,
        "province_id": province_id,
        "region_id": region_id,
        "latitude": latitude,
        "longitude": longitude,
        "radius_km": radius_km,
        "is_featured": is_featured,
        "negotiable": negotiable,
        "financing_available": financing_available,
        "sort_by": sort_by,
        "sort_order": sort_order
    }
    
    # Search cars
    cars, total = CarService.search_cars(db, filters, page, page_size)
    
    # Convert to response models
    items = [CarResponse.model_validate(car) for car in cars]
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


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
    
    return CarDetailResponse.model_validate(car)


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
        update_dict = car_data.model_dump(exclude_unset=True)
        car = CarService.update_car(db, car_id, user_id, update_dict)
        return CarResponse.model_validate(car)
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
    image_type: str = Query("exterior", pattern="^(exterior|interior|engine|dashboard|wheels|damage|documents|other)$"),
    is_primary: bool = False,
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
    
    # Check image limit
    image_count = db.query(CarImage).filter(CarImage.car_id == car_id).count()
    
    # FIX: Use getattr for subscription
    subscription = getattr(current_user, 'current_subscription', None)
    if subscription:
        plan = getattr(subscription, 'plan', None)
        max_images = int(getattr(plan, 'max_images_per_listing', 5)) if plan else 5
    else:
        max_images = 5
    
    if image_count >= max_images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {max_images} images allowed for your subscription"
        )
    
    try:
        # Upload image
        result = await FileService.upload_image(file, folder=f"cars/{car_id}")
        
        # If this is set as primary, unset other primary images
        if is_primary:
            db.query(CarImage).filter(CarImage.car_id == car_id).update({"is_primary": False})
        
        # Create image record
        car_image = CarImage(
            car_id=car_id,
            image_url=result["file_url"],
            thumbnail_url=result.get("thumbnail_url"),
            medium_url=result.get("medium_url"),
            file_name=result["file_name"],
            file_size=int(result["file_size"]),
            image_type=image_type,
            is_primary=is_primary or image_count == 0,
            display_order=image_count,
            width=int(result.get("width", 0)) if result.get("width") else None,
            height=int(result.get("height", 0)) if result.get("height") else None
        )
        
        db.add(car_image)
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
    
    # Delete file from storage - FIX: Use getattr
    image_url_value = getattr(image, 'image_url', None)
    if image_url_value is not None:
        FileService.delete_image(str(image_url_value))
    
    # Delete from database
    db.delete(image)
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
        return CarResponse.model_validate(car)
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
    
    # Check subscription - FIX: use getattr
    current_subscription = getattr(current_user, 'current_subscription', None)
    if not current_subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Featured listings require an active subscription"
        )
    
    # Set as featured - use setattr
    setattr(car, 'is_featured', True)
    setattr(car, 'featured_until', datetime.utcnow() + timedelta(days=duration_days))
    
    # Update ranking score - FIX: use getattr
    current_ranking = int(getattr(car, 'ranking_score', 0))
    setattr(car, 'ranking_score', current_ranking + 50)
    
    db.commit()
    db.refresh(car)
    
    return CarResponse.model_validate(car)


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


@router.get("/brands/all", response_model=List[BrandResponse])
async def get_brands(
    is_popular: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get all car brands
    
    Optionally filter by popular brands in Philippines.
    """
    query = db.query(Brand)
    
    if is_popular is not None:
        query = query.filter(Brand.is_popular_in_ph == is_popular)
    
    brands = query.order_by(Brand.name).all()
    
    return [BrandResponse.model_validate(brand) for brand in brands]


@router.get("/brands/{brand_id}/models", response_model=List[ModelResponse])
async def get_models_by_brand(
    brand_id: int,
    is_popular: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get all models for a specific brand
    
    Optionally filter by popular models in Philippines.
    """
    query = db.query(Model).filter(Model.brand_id == brand_id)
    
    if is_popular is not None:
        query = query.filter(Model.is_popular_in_ph == is_popular)
    
    models = query.order_by(Model.name).all()
    
    return [ModelResponse.model_validate(model) for model in models]


@router.get("/features/all", response_model=List[FeatureResponse])
async def get_features(
    category: Optional[str] = None,
    is_popular: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get all car features
    
    Optionally filter by category or popular features.
    """
    query = db.query(Feature)
    
    if category:
        query = query.filter(Feature.category == category)
    
    if is_popular is not None:
        query = query.filter(Feature.is_popular == is_popular)
    
    features = query.order_by(Feature.name).all()
    
    return [FeatureResponse.model_validate(feature) for feature in features]