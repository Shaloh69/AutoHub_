from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.car import (
    CarCreate, CarUpdate, CarResponse, CarDetailResponse, CarSearchParams,
    CarImageUpload, CarBoost, BrandResponse, ModelResponse, FeatureResponse,
    PriceHistoryResponse
)
from app.schemas.common import PaginatedResponse, MessageResponse, IDResponse
from app.services.car_service import CarService
from app.services.file_service import FileService
from app.core.dependencies import get_current_user, get_current_seller, get_optional_user, get_pagination
from app.models.user import User
from app.models.car import CarImage

router = APIRouter()


@router.post("", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def create_car(
    car_data: CarCreate,
    current_user: User = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    """
    Create new car listing
    
    Requires seller/dealer role and verified account
    """
    try:
        car = CarService.create_car(db, current_user.id, car_data.model_dump())
        return IDResponse(id=car.id, message="Car listing created successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=PaginatedResponse)
async def search_cars(
    q: Optional[str] = None,
    brand_id: Optional[int] = None,
    model_id: Optional[int] = None,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None,
    min_mileage: Optional[int] = None,
    max_mileage: Optional[int] = None,
    condition_rating: Optional[str] = None,
    city_id: Optional[int] = None,
    province_id: Optional[int] = None,
    region_id: Optional[int] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[int] = None,
    is_featured: Optional[bool] = None,
    negotiable: Optional[bool] = None,
    financing_available: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Search and filter car listings
    
    Supports various filters including location-based search
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
    
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None}
    
    cars, total = CarService.search_cars(db, filters, page, limit)
    
    total_pages = (total + limit - 1) // limit
    
    return PaginatedResponse(
        data=[CarResponse.model_validate(car) for car in cars],
        total=total,
        page=page,
        limit=limit,
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
    
    Records view for analytics
    """
    car = CarService.get_car(db, car_id, current_user.id if current_user else None)
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
    
    Only car owner can update
    """
    try:
        car = CarService.update_car(
            db, car_id, current_user.id, car_data.model_dump(exclude_unset=True)
        )
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
    """
    try:
        CarService.delete_car(db, car_id, current_user.id)
        return MessageResponse(message="Car listing deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{car_id}/images", response_model=CarImageUpload, status_code=status.HTTP_201_CREATED)
async def upload_car_image(
    car_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    image_type: str = "exterior",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload image for car listing
    
    Maximum images per listing depends on subscription plan
    """
    # Verify car ownership
    car = CarService.get_car(db, car_id, current_user.id)
    if not car or car.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Check image count limit
    current_images = db.query(CarImage).filter(CarImage.car_id == car_id).count()
    max_images = 20  # TODO: Get from subscription plan
    
    if current_images >= max_images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {max_images} images allowed"
        )
    
    try:
        # Upload file
        result = await FileService.upload_image(file, folder=f"cars/{car_id}")
        
        # Create image record
        car_image = CarImage(
            car_id=car_id,
            image_url=result["file_url"],
            thumbnail_url=result.get("thumbnail_url"),
            medium_url=result.get("medium_url"),
            large_url=result.get("large_url"),
            is_primary=is_primary,
            file_size=result.get("file_size"),
            width=result.get("width"),
            height=result.get("height"),
            image_type=image_type,
            processing_status="ready"
        )
        
        # If this is primary, unset other primary images
        if is_primary:
            db.query(CarImage).filter(
                CarImage.car_id == car_id,
                CarImage.is_primary == True
            ).update({"is_primary": False})
        
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
    """
    # Verify ownership
    car = CarService.get_car(db, car_id, current_user.id)
    if not car or car.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    image = db.query(CarImage).filter(
        CarImage.id == image_id,
        CarImage.car_id == car_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    
    # Delete file
    FileService.delete_image(image.image_url)
    
    # Delete record
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
    
    Requires active subscription with boost credits
    """
    try:
        car = CarService.boost_car(db, car_id, current_user.id, boost_data.duration_hours)
        return CarResponse.model_validate(car)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{car_id}/price-history", response_model=List[PriceHistoryResponse])
async def get_price_history(
    car_id: int,
    db: Session = Depends(get_db)
):
    """
    Get price history for a car
    """
    from app.models.transaction import PriceHistory
    
    history = db.query(PriceHistory).filter(
        PriceHistory.car_id == car_id
    ).order_by(PriceHistory.created_at.desc()).all()
    
    return [PriceHistoryResponse.model_validate(h) for h in history]


# Brands, Models, Features endpoints
@router.get("/meta/brands", response_model=List[BrandResponse])
async def get_brands(
    popular_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all car brands
    """
    brands = CarService.get_brands(db, popular_only)
    return [BrandResponse.model_validate(b) for b in brands]


@router.get("/meta/models", response_model=List[ModelResponse])
async def get_models(
    brand_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get car models, optionally filtered by brand
    """
    models = CarService.get_models(db, brand_id)
    return [ModelResponse.model_validate(m) for m in models]


@router.get("/meta/features", response_model=List[FeatureResponse])
async def get_features(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get car features, optionally filtered by category
    """
    features = CarService.get_features(db, category)
    return [FeatureResponse.model_validate(f) for f in features]