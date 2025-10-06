from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.auth import UserProfile, UserUpdate, IdentityVerificationRequest
from app.schemas.car import CarResponse
from app.schemas.inquiry import FavoriteResponse, NotificationResponse, NotificationUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.core.dependencies import get_current_user, get_current_verified_user
from app.models.user import User
from app.models.car import Car
from app.models.inquiry import Favorite
from app.models.analytics import Notification
from app.services.file_service import FileService

router = APIRouter()


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile
    """
    return UserProfile.model_validate(current_user)


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile
    """
    # Update fields
    update_data = profile_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if hasattr(current_user, key):
            setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserProfile.model_validate(current_user)


@router.post("/profile/photo", response_model=MessageResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload profile photo
    """
    try:
        result = await FileService.upload_image(file, folder=f"users/{current_user.id}")
        current_user.profile_image = result["file_url"]
        db.commit()
        
        return MessageResponse(
            message="Profile photo uploaded successfully",
            data={"profile_image": result["file_url"]}
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/listings", response_model=PaginatedResponse)
async def get_my_listings(
    status: str = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's car listings
    """
    query = db.query(Car).filter(Car.seller_id == current_user.id)
    
    if status:
        query = query.filter(Car.status == status)
    
    total = query.count()
    offset = (page - 1) * limit
    cars = query.order_by(Car.created_at.desc()).offset(offset).limit(limit).all()
    
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


@router.get("/favorites", response_model=List[FavoriteResponse])
async def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's favorite cars
    """
    from sqlalchemy.orm import joinedload
    
    favorites = db.query(Favorite).options(
        joinedload(Favorite.car)
    ).filter(
        Favorite.user_id == current_user.id
    ).order_by(Favorite.created_at.desc()).all()
    
    return [FavoriteResponse.model_validate(f) for f in favorites]


@router.post("/favorites/{car_id}", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add car to favorites
    """
    # Check if car exists
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.car_id == car_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Car already in favorites"
        )
    
    # Create favorite
    favorite = Favorite(user_id=current_user.id, car_id=car_id)
    db.add(favorite)
    
    # Update car favorite count
    car.favorite_count += 1
    
    db.commit()
    db.refresh(favorite)
    
    return FavoriteResponse.model_validate(favorite)


@router.delete("/favorites/{car_id}", response_model=MessageResponse)
async def remove_favorite(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove car from favorites
    """
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.car_id == car_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    
    # Update car favorite count
    car = db.query(Car).filter(Car.id == car_id).first()
    if car and car.favorite_count > 0:
        car.favorite_count -= 1
    
    db.delete(favorite)
    db.commit()
    
    return MessageResponse(message="Removed from favorites")


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user notifications
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.put("/notifications/{notification_id}", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: int,
    update_data: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark notification as read/unread
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notification.is_read = update_data.is_read
    if update_data.is_read:
        from datetime import datetime
        notification.read_at = datetime.utcnow()
    
    db.commit()
    
    return MessageResponse(message="Notification updated")


@router.post("/notifications/mark-all-read", response_model=MessageResponse)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read
    """
    from datetime import datetime
    
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    
    db.commit()
    
    return MessageResponse(message="All notifications marked as read")


@router.post("/verify-identity", response_model=MessageResponse)
async def request_identity_verification(
    verification_data: IdentityVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Request identity verification
    
    Upload valid ID and selfie for manual review
    """
    # TODO: Implement identity verification workflow
    # This would typically involve:
    # 1. Uploading ID documents
    # 2. Creating verification request
    # 3. Admin review
    # 4. Approval/rejection
    
    return MessageResponse(
        message="Identity verification request submitted. Please upload required documents."
    )


@router.get("/{user_id}/public", response_model=UserProfile)
async def get_public_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get public user profile (limited information)
    """
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Return limited public information
    profile = UserProfile.model_validate(user)
    
    # Hide sensitive information
    profile.email = None if not user.email_verified else user.email
    profile.phone = None
    profile.address = None
    
    return profile