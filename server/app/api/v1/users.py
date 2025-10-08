from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.auth import UserProfile, UserUpdate, IdentityVerificationRequest
from app.schemas.car import CarResponse
from app.schemas.inquiry import FavoriteResponse, NotificationResponse, NotificationUpdate
from app.schemas.common import MessageResponse, PaginatedResponse, IDResponse
from app.core.dependencies import get_current_user, get_current_verified_user, PaginationParams
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
        result = await FileService.upload_image(file, folder=f"users/{current_user.id}")
        current_user.profile_image = result["file_url"]
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
    current_user.id_type = verification_data.id_type
    current_user.id_number = verification_data.id_number
    
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
    query = db.query(Car).filter(Car.seller_id == current_user.id)
    
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
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).all()
    
    car_ids = [f.car_id for f in favorites]
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
    
    # Update car favorite count
    car.favorite_count += 1
    
    db.commit()
    db.refresh(favorite)
    
    return IDResponse(id=favorite.id, message="Added to favorites")


@router.delete("/favorites/{car_id}", response_model=MessageResponse)
async def remove_from_favorites(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove car from favorites"""
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.car_id == car_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    
    # Update car favorite count
    car = db.query(Car).filter(Car.id == car_id).first()
    if car:
        car.favorite_count = max(0, car.favorite_count - 1)
    
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
    notifications = NotificationService.get_user_notifications(
        db, current_user.id, unread_only, limit
    )
    
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.get("/notifications/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = NotificationService.get_unread_count(db, current_user.id)
    return {"unread_count": count}


@router.put("/notifications/{notification_id}", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    success = NotificationService.mark_as_read(db, notification_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    return MessageResponse(message="Notification marked as read")


@router.post("/notifications/mark-all-read", response_model=MessageResponse)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return MessageResponse(message=f"{count} notifications marked as read")


@router.delete("/notifications/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete notification"""
    success = NotificationService.delete_notification(db, notification_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    return MessageResponse(message="Notification deleted")


@router.get("/statistics")
async def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    return {
        "total_listings": current_user.total_listings,
        "active_listings": current_user.active_listings,
        "sold_listings": current_user.sold_listings,
        "total_views": current_user.total_views,
        "average_rating": float(current_user.average_rating),
        "total_ratings": current_user.total_ratings,
        "positive_feedback": current_user.positive_feedback,
        "negative_feedback": current_user.negative_feedback,
        "response_rate": float(current_user.response_rate),
        "total_sales": current_user.total_sales,
        "total_purchases": current_user.total_purchases
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
    
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "profile_image": user.profile_image,
        "bio": user.bio,
        "role": user.role.value,
        "average_rating": float(user.average_rating),
        "total_ratings": user.total_ratings,
        "total_listings": user.total_listings,
        "email_verified": user.email_verified,
        "phone_verified": user.phone_verified,
        "identity_verified": user.identity_verified,
        "business_verified": user.business_verified,
        "business_name": user.business_name if user.role == "dealer" else None,
        "response_rate": float(user.response_rate),
        "member_since": user.created_at
    }


@router.delete("/account", response_model=MessageResponse)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account (soft delete)"""
    # Mark as inactive
    current_user.is_active = False
    current_user.deleted_at = datetime.utcnow()
    
    # Deactivate all listings
    db.query(Car).filter(Car.seller_id == current_user.id).update({
        "is_active": False,
        "status": "removed"
    })
    
    db.commit()
    
    return MessageResponse(message="Account deleted successfully")