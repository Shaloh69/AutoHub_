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
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # FIX: Use getattr for seller_id
    seller_id_value = int(getattr(car, 'seller_id', 0))
    
    # Cannot inquire about own car
    if current_user:
        user_id_value = int(getattr(current_user, 'id', 0))
        if seller_id_value == user_id_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot inquire about your own listing"
            )
    
    # FIX: Use getattr for buyer info
    buyer_id = int(getattr(current_user, 'id', 0)) if current_user else None
    buyer_full_name = getattr(current_user, 'full_name', None) if current_user else None
    buyer_email = getattr(current_user, 'email', None) if current_user else None
    buyer_phone = getattr(current_user, 'phone', None) if current_user else None
    
    # Create inquiry
    inquiry = Inquiry(
        car_id=inquiry_data.car_id,
        buyer_id=buyer_id,
        seller_id=seller_id_value,
        subject=inquiry_data.subject,
        message=inquiry_data.message,
        buyer_name=inquiry_data.buyer_name or buyer_full_name,
        buyer_email=inquiry_data.buyer_email or buyer_email,
        buyer_phone=inquiry_data.buyer_phone or buyer_phone,
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
    
    # Update car contact count - FIX: Use getattr and setattr
    contact_count = int(getattr(car, 'contact_count', 0))
    setattr(car, 'contact_count', contact_count + 1)
    
    db.commit()
    db.refresh(inquiry)
    
    # Send notification to seller - FIX: Use getattr
    car_id_value = int(getattr(car, 'id', 0))
    buyer_name_value = str(getattr(inquiry, 'buyer_name', 'A buyer'))
    
    NotificationService.notify_new_inquiry(
        db,
        seller_id=seller_id_value,
        car_id=car_id_value,
        buyer_name=buyer_name_value
    )
    
    # FIX: Use getattr for inquiry.id
    inquiry_id = int(getattr(inquiry, 'id', 0))
    return IDResponse(id=inquiry_id, message="Inquiry sent successfully")


@router.get("", response_model=List[InquiryResponse])
async def get_inquiries(
    role: str = Query("received", pattern="^(sent|received)$"),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's inquiries (sent or received)"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    if role == "sent":
        query = db.query(Inquiry).filter(Inquiry.buyer_id == user_id)
    else:
        query = db.query(Inquiry).filter(Inquiry.seller_id == user_id)
    
    if status:
        query = query.filter(Inquiry.status == status)
    
    inquiries = query.order_by(Inquiry.created_at.desc()).all()
    
    return [InquiryResponse.model_validate(i) for i in inquiries]


@router.get("/{inquiry_id}", response_model=InquiryDetailResponse)
async def get_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inquiry details with responses"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    inquiry = db.query(Inquiry).options(
        joinedload(Inquiry.responses),
        joinedload(Inquiry.car),
        joinedload(Inquiry.buyer)
    ).filter(
        Inquiry.id == inquiry_id,
        or_(
            Inquiry.buyer_id == user_id,
            Inquiry.seller_id == user_id
        )
    ).first()
    
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Mark as read if seller is viewing - FIX: Use getattr and setattr
    seller_id = int(getattr(inquiry, 'seller_id', 0))
    is_read = getattr(inquiry, 'is_read', False)
    
    if seller_id == user_id and not is_read:
        setattr(inquiry, 'is_read', True)
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
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Verify user can respond - FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    buyer_id = getattr(inquiry, 'buyer_id', None)
    seller_id = int(getattr(inquiry, 'seller_id', 0))
    
    if buyer_id != user_id and seller_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    
    # Create response
    response = InquiryResponseModel(
        inquiry_id=inquiry_id,
        user_id=user_id,
        message=response_data.message,
        response_type=response_data.response_type,
        counter_offer_price=response_data.counter_offer_price,
        created_at=datetime.utcnow()
    )
    
    db.add(response)
    
    # Update inquiry - FIX: Use getattr and setattr
    response_count = int(getattr(inquiry, 'response_count', 0))
    setattr(inquiry, 'response_count', response_count + 1)
    setattr(inquiry, 'last_response_at', datetime.utcnow())
    setattr(inquiry, 'last_response_by', user_id)
    setattr(inquiry, 'status', 'replied')
    
    db.commit()
    db.refresh(response)
    
    # Send notification - FIX: Use getattr
    car_id = int(getattr(inquiry, 'car_id', 0))
    if seller_id == user_id and buyer_id:
        NotificationService.notify_inquiry_response(db, buyer_id, car_id)
    
    return InquiryResponseResponse.model_validate(response)


@router.put("/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry(
    inquiry_id: int,
    update_data: InquiryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update inquiry status"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    inquiry = db.query(Inquiry).filter(
        Inquiry.id == inquiry_id,
        Inquiry.seller_id == user_id
    ).first()
    
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(inquiry, key, value)
    
    setattr(inquiry, 'updated_at', datetime.utcnow())
    
    if update_data.status == "closed":
        setattr(inquiry, 'closed_at', datetime.utcnow())
    
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
    
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    buyer_id = getattr(inquiry, 'buyer_id', None)
    seller_id = int(getattr(inquiry, 'seller_id', 0))
    
    # Buyer rates seller, seller rates buyer
    if buyer_id == user_id:
        setattr(inquiry, 'seller_rating', rating_data.rating)
    elif seller_id == user_id:
        setattr(inquiry, 'buyer_rating', rating_data.rating)
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
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    inquiry = db.query(Inquiry).filter(
        Inquiry.id == inquiry_id,
        or_(
            Inquiry.buyer_id == user_id,
            Inquiry.seller_id == user_id
        )
    ).first()
    
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    setattr(inquiry, 'status', 'closed')
    setattr(inquiry, 'closed_at', datetime.utcnow())
    
    db.commit()
    
    return MessageResponse(message="Inquiry deleted successfully")