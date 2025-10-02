from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_user, get_current_user_id
from models import User, Car, Inquiry
from schemas import UserProfile, UserUpdate, SuccessResponse, DashboardStats
from utils import FileHandler, ValidationHelper
from typing import Optional

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(user: User = Depends(get_current_user)):
    """Get current user profile"""
    return user


@router.put("/me", response_model=UserProfile)
async def update_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update current user profile"""
    
    # Validate phone if provided
    if user_update.phone and not ValidationHelper.validate_phone_number(user_update.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Philippine phone number"
        )
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/me/avatar", response_model=SuccessResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Upload user avatar"""
    
    # Read file
    file_content = await file.read()
    
    # Validate image
    is_valid, error = FileHandler.validate_image(file_content)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Generate filename
    filename = FileHandler.generate_filename(file.filename, prefix="avatar_")
    
    # Create thumbnails
    paths = FileHandler.create_thumbnails(file_content, filename, "users")
    
    # Delete old avatar if exists
    if user.profile_image:
        FileHandler.delete_file(user.profile_image)
    
    # Update user
    user.profile_image = paths['medium']
    db.commit()
    
    return SuccessResponse(
        message="Avatar uploaded successfully",
        data={"image_url": paths['medium']}
    )


@router.post("/me/verify-identity", response_model=SuccessResponse)
async def upload_identity_documents(
    id_front: UploadFile = File(...),
    id_back: UploadFile = File(...),
    selfie: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Upload identity verification documents"""
    
    files = {
        'id_front': id_front,
        'id_back': id_back,
        'selfie': selfie
    }
    
    uploaded_paths = {}
    
    for key, file in files.items():
        file_content = await file.read()
        
        # Validate
        is_valid, error = FileHandler.validate_image(file_content)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{key}: {error}"
            )
        
        # Save
        filename = FileHandler.generate_filename(file.filename, prefix=f"{key}_")
        path = FileHandler.save_image(file_content, filename, "documents")
        uploaded_paths[key] = path
    
    # Update user
    user.valid_id_front_url = uploaded_paths['id_front']
    user.valid_id_back_url = uploaded_paths['id_back']
    user.selfie_with_id_url = uploaded_paths['selfie']
    
    # Mark as pending verification (admin will review)
    db.commit()
    
    return SuccessResponse(
        message="Identity documents uploaded successfully. Verification pending.",
        data=uploaded_paths
    )


@router.get("/me/dashboard", response_model=DashboardStats)
async def get_user_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get user dashboard statistics"""
    
    # Get car statistics
    total_listings = db.query(func.count(Car.id)).filter(
        Car.seller_id == user.id
    ).scalar()
    
    active_listings = db.query(func.count(Car.id)).filter(
        Car.seller_id == user.id,
        Car.status.in_(['approved', 'pending']),
        Car.is_active == True
    ).scalar()
    
    pending_listings = db.query(func.count(Car.id)).filter(
        Car.seller_id == user.id,
        Car.approval_status == 'pending'
    ).scalar()
    
    sold_listings = db.query(func.count(Car.id)).filter(
        Car.seller_id == user.id,
        Car.status == 'sold'
    ).scalar()
    
    # Get view statistics
    total_views = db.query(func.sum(Car.views_count)).filter(
        Car.seller_id == user.id
    ).scalar() or 0
    
    # Get inquiry statistics
    total_inquiries = db.query(func.count(Inquiry.id)).filter(
        Inquiry.seller_id == user.id
    ).scalar()
    
    # Get favorite statistics
    total_favorites = db.query(func.sum(Car.favorite_count)).filter(
        Car.seller_id == user.id
    ).scalar() or 0
    
    return DashboardStats(
        total_listings=total_listings,
        active_listings=active_listings,
        pending_listings=pending_listings,
        sold_listings=sold_listings,
        total_views=total_views,
        total_inquiries=total_inquiries,
        total_favorites=total_favorites,
        avg_rating=user.average_rating
    )


@router.get("/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get public user profile"""
    
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.delete("/me", response_model=SuccessResponse)
async def delete_account(
    password: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Delete user account (requires password confirmation)"""
    
    from auth import PasswordManager
    
    # Verify password
    if not PasswordManager.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Check for active listings
    active_listings = db.query(func.count(Car.id)).filter(
        Car.seller_id == user.id,
        Car.status.in_(['approved', 'pending']),
        Car.is_active == True
    ).scalar()
    
    if active_listings > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete account with {active_listings} active listings. Please remove or deactivate them first."
        )
    
    # Soft delete - deactivate account
    user.is_active = False
    user.email = f"deleted_{user.id}@deleted.com"
    db.commit()
    
    return SuccessResponse(message="Account deleted successfully")


@router.post("/me/preferences", response_model=SuccessResponse)
async def update_preferences(
    email_notifications: Optional[bool] = None,
    sms_notifications: Optional[bool] = None,
    push_notifications: Optional[bool] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update notification preferences"""
    
    if email_notifications is not None:
        user.email_notifications = email_notifications
    if sms_notifications is not None:
        user.sms_notifications = sms_notifications
    if push_notifications is not None:
        user.push_notifications = push_notifications
    
    db.commit()
    
    return SuccessResponse(message="Preferences updated successfully")