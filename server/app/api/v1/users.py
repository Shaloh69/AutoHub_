"""
===========================================
FILE: app/api/v1/users.py
Path: car_marketplace_ph/app/api/v1/users.py
COMPLETE FIXED VERSION - Identity verification fields corrected to match DB schema
===========================================
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.schemas.auth import UserProfile, UserUpdate, IdentityVerificationRequest
from app.schemas.car import CarResponse
from app.schemas.inquiry import FavoriteResponse, NotificationResponse
from app.schemas.common import MessageResponse, IDResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.car import Car
from app.models.inquiry import Favorite
from app.models.analytics import Notification
from app.services.file_service import FileService
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile.model_validate(current_user)


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
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
    """Upload profile photo"""
    try:
        # FIX: Use getattr
        user_id = int(getattr(current_user, 'id', 0))
        result = await FileService.upload_image(file, folder=f"users/{user_id}")
        setattr(current_user, 'profile_image', result["file_url"])
        db.commit()
        
        return MessageResponse(
            message="Profile photo uploaded successfully",
            success=True
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/verify-identity", response_model=MessageResponse)
async def request_identity_verification(
    verification_data: IdentityVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Request identity verification
    
    CRITICAL FIX: Now uses correct database column names:
    - id_type (not id_card_type)
    - id_number (not id_card_number)
    - id_front_image (not id_card_image_front)
    - id_back_image (not id_card_image_back)
    
    Note: selfie_verification_image column does not exist in database
    """
    # CRITICAL FIX: Use correct column names matching database schema
    setattr(current_user, 'id_type', verification_data.id_type)
    setattr(current_user, 'id_number', verification_data.id_number)
    
    # Optional image fields
    if verification_data.id_front_image:
        setattr(current_user, 'id_front_image', verification_data.id_front_image)
    
    if verification_data.id_back_image:
        setattr(current_user, 'id_back_image', verification_data.id_back_image)
    
    # Note: selfie_image field from request is ignored as column doesn't exist in DB
    # If you want to store selfie, you need to add selfie_verification_image column to database first
    
    db.commit()
    
    return MessageResponse(
        message="Identity verification request submitted. We'll review it within 24-48 hours.",
        success=True
    )


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify email with token
    
    Token should be sent via email after registration.
    """
    # Implement email verification logic here
    # This is a placeholder - you'll need to implement token validation
    return MessageResponse(
        message="Email verified successfully",
        success=True
    )


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification_email(
    current_user: User = Depends(get_current_user)
):
    """
    Resend verification email
    
    Only if email not yet verified.
    """
    # Fix Pylance: Use getattr to avoid Column[bool] type error
    if getattr(current_user, 'email_verified', False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Implement resend logic here
    return MessageResponse(
        message="Verification email sent",
        success=True
    )


@router.get("/listings", response_model=List[CarResponse])
async def get_my_listings(
    status: Optional[str] = Query(None, pattern="^(active|sold|pending|draft)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's car listings
    
    Filter by status if provided.
    """
    query = db.query(Car).filter(Car.seller_id == current_user.id)
    
    if status:
        query = query.filter(Car.status == status)
    
    cars = query.offset(skip).limit(limit).all()
    return [CarResponse.model_validate(car) for car in cars]


@router.get("/favorites", response_model=List[FavoriteResponse])
async def get_favorites(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's favorite cars
    
    Returns list of favorites with car details.
    """
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return [FavoriteResponse.model_validate(fav) for fav in favorites]


@router.post("/favorites/{car_id}", response_model=MessageResponse)
async def add_favorite(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add car to favorites
    
    Prevents duplicates.
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
    
    # Add to favorites
    favorite = Favorite(
        user_id=current_user.id,
        car_id=car_id
    )
    db.add(favorite)
    db.commit()
    
    return MessageResponse(
        message="Car added to favorites",
        success=True
    )


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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    return MessageResponse(
        message="Car removed from favorites",
        success=True
    )


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user notifications
    
    Can filter for unread only.
    """
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [NotificationResponse.model_validate(notif) for notif in notifications]


@router.put("/notifications/{notification_id}/read", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark notification as read
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Fix Pylance: Use setattr to avoid Column type errors
    setattr(notification, 'is_read', True)
    setattr(notification, 'read_at', datetime.utcnow())
    db.commit()
    
    return MessageResponse(
        message="Notification marked as read",
        success=True
    )


@router.put("/notifications/read-all", response_model=MessageResponse)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read
    """
    # Fix Pylance: Use SQLAlchemy update method instead of direct assignment
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False  # noqa: E712
    ).update({
        'is_read': True,
        'read_at': datetime.utcnow()
    }, synchronize_session=False)
    db.commit()
    
    return MessageResponse(
        message="All notifications marked as read",
        success=True
    )


@router.delete("/account", response_model=MessageResponse)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user account (soft delete)
    
    Sets deleted_at timestamp and deactivates account.
    """
    # Fix Pylance: Use setattr to avoid Column type errors
    setattr(current_user, 'is_active', False)
    setattr(current_user, 'deleted_at', datetime.utcnow())
    db.commit()
    
    return MessageResponse(
        message="Account deleted successfully",
        success=True
    )