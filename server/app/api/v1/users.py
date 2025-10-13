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
    """Request identity verification"""
    setattr(current_user, 'id_type', verification_data.id_type)
    setattr(current_user, 'id_number', verification_data.id_number)
    
    db.commit()
    
    return MessageResponse(
        message="Identity verification request submitted. We'll review it within 24-48 hours.",
        success=True
    )


@router.get("/listings", response_model=List[CarResponse])
async def get_user_listings(
    status: Optional[str] = Query(None, pattern="^(draft|pending|active|sold|expired|removed)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's car listings"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    query = db.query(Car).filter(Car.seller_id == user_id)
    
    if status:
        query = query.filter(Car.status == status)
    
    cars = query.order_by(Car.created_at.desc()).all()
    
    return [CarResponse.model_validate(car) for car in cars]


@router.get("/favorites", response_model=List[CarResponse])
async def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's favorite cars"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    favorites = db.query(Favorite).filter(Favorite.user_id == user_id).all()
    
    # FIX: Use getattr for car_id
    car_ids = [int(getattr(f, 'car_id', 0)) for f in favorites]
    cars = db.query(Car).filter(Car.id.in_(car_ids)).all()
    
    return [CarResponse.model_validate(car) for car in cars]


@router.post("/favorites/{car_id}", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def add_to_favorites(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add car to favorites"""
    # Check if car exists
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.car_id == car_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Car already in favorites"
        )
    
    # Add to favorites
    favorite = Favorite(
        user_id=user_id,
        car_id=car_id
    )
    db.add(favorite)
    
    # Update car favorite count - FIX: Use getattr and setattr
    fav_count = int(getattr(car, 'favorite_count', 0))
    setattr(car, 'favorite_count', fav_count + 1)
    
    db.commit()
    db.refresh(favorite)
    
    # FIX: Use getattr
    favorite_id = int(getattr(favorite, 'id', 0))
    return IDResponse(id=favorite_id, message="Added to favorites")


@router.delete("/favorites/{car_id}", response_model=MessageResponse)
async def remove_from_favorites(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove car from favorites"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.car_id == car_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    
    # Update car favorite count - FIX: Use getattr and setattr
    car = db.query(Car).filter(Car.id == car_id).first()
    if car:
        fav_count = int(getattr(car, 'favorite_count', 0))
        setattr(car, 'favorite_count', max(0, fav_count - 1))
    
    db.delete(favorite)
    db.commit()
    
    return MessageResponse(message="Removed from favorites")


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    notifications = NotificationService.get_user_notifications(db, user_id, unread_only, limit)
    
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.get("/notifications/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    count = NotificationService.get_unread_count(db, user_id)
    return {"unread_count": count}


@router.put("/notifications/{notification_id}", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    success = NotificationService.mark_as_read(db, notification_id, user_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    return MessageResponse(message="Notification marked as read")


@router.post("/notifications/mark-all-read", response_model=MessageResponse)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    count = NotificationService.mark_all_as_read(db, user_id)
    return MessageResponse(message=f"{count} notifications marked as read")


@router.delete("/notifications/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete notification"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    success = NotificationService.delete_notification(db, notification_id, user_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    return MessageResponse(message="Notification deleted")


@router.get("/statistics")
async def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    # FIX: Use getattr for all attributes
    return {
        "total_listings": int(getattr(current_user, 'total_listings', 0)),
        "active_listings": int(getattr(current_user, 'active_listings', 0)),
        "sold_listings": int(getattr(current_user, 'sold_listings', 0)),
        "total_views": int(getattr(current_user, 'total_views', 0)),
        "average_rating": float(getattr(current_user, 'average_rating', 0.0)),
        "total_ratings": int(getattr(current_user, 'total_ratings', 0)),
        "positive_feedback": int(getattr(current_user, 'positive_feedback', 0)),
        "negative_feedback": int(getattr(current_user, 'negative_feedback', 0)),
        "response_rate": float(getattr(current_user, 'response_rate', 0.0)),
        "total_sales": int(getattr(current_user, 'total_sales', 0)),
        "total_purchases": int(getattr(current_user, 'total_purchases', 0))
    }


@router.get("/{user_id}/public-profile")
async def get_public_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get public user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # FIX: Use getattr for all attributes
    user_role_obj = getattr(user, 'role', None)
    user_role = user_role_obj.value if user_role_obj else 'buyer'
    
    return {
        "id": int(getattr(user, 'id', 0)),
        "first_name": str(getattr(user, 'first_name', '')),
        "last_name": str(getattr(user, 'last_name', '')),
        "profile_image": getattr(user, 'profile_image', None),
        "bio": getattr(user, 'bio', None),
        "role": user_role,
        "average_rating": float(getattr(user, 'average_rating', 0.0)),
        "total_ratings": int(getattr(user, 'total_ratings', 0)),
        "total_listings": int(getattr(user, 'total_listings', 0)),
        "email_verified": bool(getattr(user, 'email_verified', False)),
        "phone_verified": bool(getattr(user, 'phone_verified', False)),
        "identity_verified": bool(getattr(user, 'identity_verified', False)),
        "business_verified": bool(getattr(user, 'business_verified', False)),
        "business_name": getattr(user, 'business_name', None) if user_role == "dealer" else None,
        "response_rate": float(getattr(user, 'response_rate', 0.0)),
        "member_since": getattr(user, 'created_at', None)
    }


@router.delete("/account", response_model=MessageResponse)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account (soft delete)"""
    # Mark as inactive
    setattr(current_user, 'is_active', False)
    setattr(current_user, 'deleted_at', datetime.utcnow())
    
    # Deactivate all listings - FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    db.query(Car).filter(Car.seller_id == user_id).update({
        "is_active": False,
        "status": "removed"
    })
    
    db.commit()
    
    return MessageResponse(message="Account deleted successfully")