from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.schemas.inquiry import (
    InquiryCreate, InquiryResponse, InquiryDetailResponse,
    InquiryResponseCreate, InquiryResponseResponse,
    InquiryUpdate, InquiryRating
)
from app.schemas.common import MessageResponse, PaginatedResponse, IDResponse
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.car import Car
from app.models.inquiry import Inquiry, InquiryResponse as InquiryResponseModel
from app.services.notification_service import NotificationService

router = APIRouter()


@router.post("", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    inquiry_data: InquiryCreate,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Create new inquiry for a car (authenticated or guest)"""
    # Get car
    car = db.query(Car).filter(Car.id == inquiry_data.car_id).first()
    if not car:  # type: ignore
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # Cannot inquire about own car
    if current_user and car.seller_id == current_user.id:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot inquire about your own listing"
        )
    
    # Create inquiry
    inquiry = Inquiry(
        car_id=inquiry_data.car_id,
        buyer_id=int(current_user.id) if current_user else None,  # type: ignore
        seller_id=car.seller_id,  # type: ignore
        subject=inquiry_data.subject,
        message=inquiry_data.message,
        buyer_name=inquiry_data.buyer_name or (current_user.full_name if current_user else None),  # type: ignore
        buyer_email=inquiry_data.buyer_email or (current_user.email if current_user else None),  # type: ignore
        buyer_phone=inquiry_data.buyer_phone or (current_user.phone if current_user else None),  # type: ignore
        inquiry_type=inquiry_data.inquiry_type,
        offered_price=inquiry_data.offered_price,
        test_drive_requested=inquiry_data.test_drive_requested,
        inspection_requested=inquiry_data.inspection_requested,
        financing_needed=inquiry_data.financing_needed,
        trade_in_vehicle=inquiry_data.trade_in_vehicle,
        status="new",
        created_at=datetime.utcnow()
    )
    
    db.add(inquiry)
    
    # Update car contact count
    car.contact_count += 1  # type: ignore
    
    db.commit()
    db.refresh(inquiry)
    
    # Send notification to seller
    NotificationService.notify_new_inquiry(
        db,
        seller_id=car.seller_id,  # type: ignore
        car_id=car.id,  # type: ignore
        buyer_name=inquiry.buyer_name or "A buyer"  # type: ignore
    )
    
    return IDResponse(id=inquiry.id, message="Inquiry sent successfully")  # type: ignore


@router.get("", response_model=List[InquiryResponse])
async def get_inquiries(
    role: str = Query("received", pattern="^(sent|received)$"),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's inquiries (sent or received)"""
    if role == "sent":
        query = db.query(Inquiry).filter(Inquiry.buyer_id == current_user.id)  # type: ignore
    else:
        query = db.query(Inquiry).filter(Inquiry.seller_id == current_user.id)  # type: ignore
    
    if status:
        query = query.filter(Inquiry.status == status)  # type: ignore
    
    inquiries = query.order_by(Inquiry.created_at.desc()).all()
    
    return [InquiryResponse.model_validate(i) for i in inquiries]


@router.get("/{inquiry_id}", response_model=InquiryDetailResponse)
async def get_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inquiry details with responses"""
    inquiry = db.query(Inquiry).options(
        joinedload(Inquiry.responses),
        joinedload(Inquiry.car),
        joinedload(Inquiry.buyer)
    ).filter(
        Inquiry.id == inquiry_id,
        or_(
            Inquiry.buyer_id == current_user.id,  # type: ignore
            Inquiry.seller_id == current_user.id  # type: ignore
        )
    ).first()
    
    if not inquiry:  # type: ignore
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Mark as read if seller is viewing
    if inquiry.seller_id == current_user.id and not inquiry.is_read:  # type: ignore
        inquiry.is_read = True  # type: ignore
        db.commit()
    
    return InquiryDetailResponse.model_validate(inquiry)


@router.post("/{inquiry_id}/respond", response_model=InquiryResponseResponse, status_code=status.HTTP_201_CREATED)
async def respond_to_inquiry(
    inquiry_id: int,
    response_data: InquiryResponseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Respond to an inquiry"""
    # Get inquiry
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:  # type: ignore
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Verify user can respond
    if inquiry.buyer_id != current_user.id and inquiry.seller_id != current_user.id:  # type: ignore
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    
    # Create response
    response = InquiryResponseModel(
        inquiry_id=inquiry_id,
        user_id=int(current_user.id),  # type: ignore
        message=response_data.message,
        response_type=response_data.response_type,
        counter_offer_price=response_data.counter_offer_price,
        created_at=datetime.utcnow()
    )
    
    db.add(response)
    
    # Update inquiry
    inquiry.response_count += 1  # type: ignore
    inquiry.last_response_at = datetime.utcnow()  # type: ignore
    inquiry.last_response_by = int(current_user.id)  # type: ignore
    inquiry.status = "replied"  # type: ignore
    
    db.commit()
    db.refresh(response)
    
    # Send notification
    if inquiry.seller_id == current_user.id and inquiry.buyer_id:  # type: ignore
        NotificationService.notify_inquiry_response(db, inquiry.buyer_id, inquiry.car_id)  # type: ignore
    
    return InquiryResponseResponse.model_validate(response)


@router.put("/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry(
    inquiry_id: int,
    update_data: InquiryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update inquiry status"""
    inquiry = db.query(Inquiry).filter(
        Inquiry.id == inquiry_id,
        Inquiry.seller_id == current_user.id  # type: ignore
    ).first()
    
    if not inquiry:  # type: ignore
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(inquiry, key, value)  # type: ignore
    
    inquiry.updated_at = datetime.utcnow()  # type: ignore
    
    if update_data.status == "closed":
        inquiry.closed_at = datetime.utcnow()  # type: ignore
    
    db.commit()
    db.refresh(inquiry)
    
    return InquiryResponse.model_validate(inquiry)


@router.post("/{inquiry_id}/rate", response_model=MessageResponse)
async def rate_inquiry(
    inquiry_id: int,
    rating_data: InquiryRating,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate inquiry interaction"""
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    
    if not inquiry:  # type: ignore
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Buyer rates seller, seller rates buyer
    if inquiry.buyer_id == current_user.id:  # type: ignore
        inquiry.seller_rating = rating_data.rating  # type: ignore
    elif inquiry.seller_id == current_user.id:  # type: ignore
        inquiry.buyer_rating = rating_data.rating  # type: ignore
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    
    db.commit()
    
    return MessageResponse(message="Rating submitted successfully")


@router.delete("/{inquiry_id}", response_model=MessageResponse)
async def delete_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete inquiry (soft delete)"""
    inquiry = db.query(Inquiry).filter(
        Inquiry.id == inquiry_id,
        or_(
            Inquiry.buyer_id == current_user.id,  # type: ignore
            Inquiry.seller_id == current_user.id  # type: ignore
        )
    ).first()
    
    if not inquiry:  # type: ignore
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    inquiry.status = "closed"  # type: ignore
    inquiry.closed_at = datetime.utcnow()  # type: ignore
    
    db.commit()
    
    return MessageResponse(message="Inquiry deleted successfully")