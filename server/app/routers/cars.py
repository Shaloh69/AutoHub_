from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, text
from database import get_db, CacheManager
from auth import get_current_user, get_current_user_id, require_verification
from models import Car, CarImage, User, Brand, Model, PHCity, Favorite
from schemas import (
    CarCreate, CarUpdate, CarResponse, CarListResponse, CarSearchParams,
    NearbySearchParams, SuccessResponse, FavoriteCreate, FavoriteResponse
)
from utils import FileHandler, ValidationHelper, GeolocationHelper, ScoreCalculator, SlugGenerator, PaginationHelper
from typing import List, Optional
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/cars", tags=["Cars"])


@router.post("", response_model=CarResponse, status_code=status.HTTP_201_CREATED)
async def create_car_listing(
    car_data: CarCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_verification('email'))
):
    """Create a new car listing"""
    
    # Check subscription limits
    active_count = db.query(func.count(Car.id)).filter(
        Car.seller_id == user.id,
        Car.status.in_(['approved', 'pending']),
        Car.is_active == True
    ).scalar()
    
    # Basic limit check (should integrate with subscription system)
    max_listings = 3 if user.subscription_status == 'none' else 100
    
    if active_count >= max_listings:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Maximum listing limit reached ({max_listings}). Upgrade your subscription for more listings."
        )
    
    # Validate brand and model
    brand = db.query(Brand).filter(Brand.id == car_data.brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid brand ID"
        )
    
    model = db.query(Model).filter(
        Model.id == car_data.model_id,
        Model.brand_id == car_data.brand_id
    ).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid model ID or model doesn't belong to selected brand"
        )
    
    # Validate location
    city = db.query(PHCity).filter(PHCity.id == car_data.city_id).first()
    if not city:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid city ID"
        )
    
    # Validate coordinates
    if not ValidationHelper.validate_philippines_coordinates(
        float(car_data.latitude), float(car_data.longitude)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordinates must be within Philippines bounds"
        )
    
    # Validate VIN if provided
    if car_data.vin and not ValidationHelper.validate_vin(car_data.vin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid VIN format"
        )
    
    # Validate plate number if provided
    if car_data.plate_number and not ValidationHelper.validate_plate_number(car_data.plate_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plate number format"
        )
    
    # Generate SEO slug
    slug_base = SlugGenerator.generate_slug(f"{brand.name} {model.name} {car_data.year}")
    seo_slug = SlugGenerator.generate_unique_slug(slug_base, Car, db)
    
    # Create car
    new_car = Car(
        seller_id=user.id,
        brand_id=car_data.brand_id,
        model_id=car_data.model_id,
        category_id=car_data.category_id,
        title=car_data.title,
        description=car_data.description,
        year=car_data.year,
        price=car_data.price,
        original_price=car_data.price,
        mileage=car_data.mileage,
        fuel_type=car_data.fuel_type,
        transmission=car_data.transmission,
        city_id=car_data.city_id,
        province_id=city.province_id,
        region_id=city.province.region_id,
        condition_rating=car_data.condition_rating,
        negotiable=car_data.negotiable,
        financing_available=car_data.financing_available,
        trade_in_accepted=car_data.trade_in_accepted,
        engine_size=car_data.engine_size,
        horsepower=car_data.horsepower,
        drivetrain=car_data.drivetrain,
        exterior_color_id=car_data.exterior_color_id,
        interior_color_id=car_data.interior_color_id,
        custom_exterior_color=car_data.custom_exterior_color,
        custom_interior_color=car_data.custom_interior_color,
        accident_history=car_data.accident_history,
        accident_details=car_data.accident_details,
        flood_history=car_data.flood_history,
        service_history=car_data.service_history,
        service_records_available=car_data.service_records_available,
        number_of_owners=car_data.number_of_owners,
        warranty_remaining=car_data.warranty_remaining,
        warranty_details=car_data.warranty_details,
        vin=car_data.vin,
        engine_number=car_data.engine_number,
        chassis_number=car_data.chassis_number,
        plate_number=car_data.plate_number,
        registration_expiry=car_data.registration_expiry,
        or_cr_available=car_data.or_cr_available,
        lto_registered=car_data.lto_registered,
        casa_maintained=car_data.casa_maintained,
        comprehensive_insurance=car_data.comprehensive_insurance,
        insurance_company=car_data.insurance_company,
        insurance_expiry=car_data.insurance_expiry,
        barangay=car_data.barangay,
        detailed_address=car_data.detailed_address,
        latitude=car_data.latitude,
        longitude=car_data.longitude,
        status='pending',
        approval_status='pending',
        seo_slug=seo_slug,
        expires_at=datetime.utcnow() + timedelta(days=60),
        is_active=True
    )
    
    db.add(new_car)
    db.commit()
    db.refresh(new_car)
    
    # Calculate scores
    new_car.completeness_score = ScoreCalculator.calculate_completeness_score(new_car)
    new_car.quality_score = ScoreCalculator.calculate_quality_score(new_car, db)
    db.commit()
    
    return new_car


@router.get("", response_model=CarListResponse)
async def list_cars(
    params: CarSearchParams = Depends(),
    db: Session = Depends(get_db)
):
    """List cars with filters and pagination"""
    
    # Build query
    query = db.query(Car).filter(
        Car.status == 'approved',
        Car.is_active == True
    )
    
    # Apply filters
    if params.query:
        query = query.filter(
            or_(
                Car.title.contains(params.query),
                Car.description.contains(params.query)
            )
        )
    
    if params.brand_id:
        query = query.filter(Car.brand_id == params.brand_id)
    
    if params.model_id:
        query = query.filter(Car.model_id == params.model_id)
    
    if params.min_price:
        query = query.filter(Car.price >= params.min_price)
    
    if params.max_price:
        query = query.filter(Car.price <= params.max_price)
    
    if params.min_year:
        query = query.filter(Car.year >= params.min_year)
    
    if params.max_year:
        query = query.filter(Car.year <= params.max_year)
    
    if params.fuel_type:
        query = query.filter(Car.fuel_type == params.fuel_type)
    
    if params.transmission:
        query = query.filter(Car.transmission == params.transmission)
    
    if params.condition_rating:
        query = query.filter(Car.condition_rating == params.condition_rating)
    
    if params.min_mileage is not None:
        query = query.filter(Car.mileage >= params.min_mileage)
    
    if params.max_mileage is not None:
        query = query.filter(Car.mileage <= params.max_mileage)
    
    if params.city_id:
        query = query.filter(Car.city_id == params.city_id)
    
    if params.province_id:
        query = query.filter(Car.province_id == params.province_id)
    
    if params.region_id:
        query = query.filter(Car.region_id == params.region_id)
    
    if params.is_featured is not None:
        if params.is_featured:
            query = query.filter(
                Car.is_featured == True,
                Car.featured_until > datetime.utcnow()
            )
    
    # Sorting
    sort_map = {
        'price': Car.price,
        'year': Car.year,
        'mileage': Car.mileage,
        'created_at': Car.created_at,
        'views_count': Car.views_count,
        'rating': Car.average_rating
    }
    
    sort_column = sort_map.get(params.sort_by, Car.created_at)
    
    if params.sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
    
    # Apply pagination
    items, total, total_pages = PaginationHelper.paginate(
        query, params.page, params.page_size
    )
    
    return CarListResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages
    )


@router.get("/nearby", response_model=CarListResponse)
async def search_nearby_cars(
    params: NearbySearchParams = Depends(),
    db: Session = Depends(get_db)
):
    """Search cars near coordinates"""
    
    # Get bounding box for efficient query
    bbox = GeolocationHelper.get_bounding_box(
        float(params.latitude),
        float(params.longitude),
        params.radius_km
    )
    
    # Query with bounding box first (faster)
    query = db.query(Car).filter(
        Car.status == 'approved',
        Car.is_active == True,
        Car.latitude.between(bbox['min_lat'], bbox['max_lat']),
        Car.longitude.between(bbox['min_lon'], bbox['max_lon'])
    )
    
    # Get all results and calculate exact distance
    cars = query.all()
    
    # Filter by exact distance and sort
    cars_with_distance = []
    for car in cars:
        distance = GeolocationHelper.calculate_distance(
            float(params.latitude),
            float(params.longitude),
            float(car.latitude),
            float(car.longitude)
        )
        
        if distance <= params.radius_km:
            car.distance = distance
            cars_with_distance.append(car)
    
    # Sort by distance
    cars_with_distance.sort(key=lambda x: x.distance)
    
    # Paginate
    start = (params.page - 1) * params.page_size
    end = start + params.page_size
    items = cars_with_distance[start:end]
    total = len(cars_with_distance)
    total_pages = (total + params.page_size - 1) // params.page_size
    
    return CarListResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages
    )


@router.get("/{car_id}", response_model=CarResponse)
async def get_car_details(
    car_id: int,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(lambda: None)
):
    """Get car details by ID"""
    
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Check if car is viewable
    if car.status != 'approved' and car.seller_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Increment view count
    car.views_count += 1
    db.commit()
    
    return car


@router.put("/{car_id}", response_model=CarResponse)
async def update_car_listing(
    car_id: int,
    car_update: CarUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update car listing"""
    
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Check ownership
    if car.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this listing"
        )
    
    # Update fields
    update_data = car_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(car, field, value)
    
    # Track price changes
    if 'price' in update_data and car.price != car.original_price:
        car.last_price_update = datetime.utcnow()
    
    # Recalculate scores
    car.completeness_score = ScoreCalculator.calculate_completeness_score(car)
    car.quality_score = ScoreCalculator.calculate_quality_score(car, db)
    
    db.commit()
    db.refresh(car)
    
    return car


@router.delete("/{car_id}", response_model=SuccessResponse)
async def delete_car_listing(
    car_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Delete car listing"""
    
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Check ownership
    if car.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this listing"
        )
    
    # Soft delete
    car.is_active = False
    car.status = 'removed'
    db.commit()
    
    return SuccessResponse(message="Car listing deleted successfully")


@router.post("/{car_id}/images", response_model=SuccessResponse)
async def upload_car_images(
    car_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Upload car images"""
    
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Check ownership
    if car.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload images for this listing"
        )
    
    # Check image limit
    current_images = db.query(func.count(CarImage.id)).filter(
        CarImage.car_id == car_id
    ).scalar()
    
    if current_images + len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum 20 images allowed per listing. Current: {current_images}"
        )
    
    uploaded_images = []
    
    for idx, file in enumerate(files):
        file_content = await file.read()
        
        # Validate
        is_valid, error = FileHandler.validate_image(file_content)
        if not is_valid:
            continue
        
        # Generate filename
        filename = FileHandler.generate_filename(file.filename, prefix=f"car_{car_id}_")
        
        # Create thumbnails
        paths = FileHandler.create_thumbnails(file_content, filename, "cars")
        
        # Create image record
        car_image = CarImage(
            car_id=car_id,
            image_url=paths['original'],
            thumbnail_url=paths['thumbnail'],
            medium_url=paths['medium'],
            large_url=paths['large'],
            is_primary=(current_images + idx == 0),
            display_order=current_images + idx,
            processing_status='ready'
        )
        
        db.add(car_image)
        uploaded_images.append(paths['medium'])
    
    db.commit()
    
    # Recalculate completeness score
    car.completeness_score = ScoreCalculator.calculate_completeness_score(car)
    db.commit()
    
    return SuccessResponse(
        message=f"{len(uploaded_images)} images uploaded successfully",
        data={"images": uploaded_images}
    )


@router.post("/{car_id}/favorite", response_model=SuccessResponse)
async def add_to_favorites(
    car_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Add car to favorites"""
    
    car = db.query(Car).filter(Car.id == car_id, Car.status == 'approved').first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.car_id == car_id
    ).first()
    
    if existing:
        return SuccessResponse(message="Car already in favorites")
    
    # Add to favorites
    favorite = Favorite(user_id=user_id, car_id=car_id)
    db.add(favorite)
    
    # Increment count
    car.favorite_count += 1
    
    db.commit()
    
    return SuccessResponse(message="Car added to favorites")


@router.delete("/{car_id}/favorite", response_model=SuccessResponse)
async def remove_from_favorites(
    car_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Remove car from favorites"""
    
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.car_id == car_id
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    # Decrement count
    car = db.query(Car).filter(Car.id == car_id).first()
    if car and car.favorite_count > 0:
        car.favorite_count -= 1
    
    db.delete(favorite)
    db.commit()
    
    return SuccessResponse(message="Car removed from favorites")


@router.get("/favorites/list", response_model=List[FavoriteResponse])
async def get_favorites(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get user's favorite cars"""
    
    favorites = db.query(Favorite).filter(
        Favorite.user_id == user_id
    ).all()
    
    return favorites


@router.post("/{car_id}/boost", response_model=SuccessResponse)
async def boost_listing(
    car_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Boost car listing (requires premium feature)"""
    
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Check ownership
    if car.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to boost this listing"
        )
    
    # Check if user has boost credits (should check subscription)
    # For now, just boost it
    car.boost_count += 1
    car.last_boosted_at = datetime.utcnow()
    car.search_score += 5.0
    
    db.commit()
    
    return SuccessResponse(message="Listing boosted successfully")