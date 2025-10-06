from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
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
from app.models.analytics import Notification

router = APIRouter()


@router.post("", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    inquiry_data: InquiryCreate,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Create new inquiry for a car
    
    Can be created by authenticated users or guests
    """
    # Get car
    car = db.query(Car).filter(Car.id == inquiry_data.car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # Cannot inquire about own car
    if current_user and car.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot inquire about your own listing"
        )
    
    # Create inquiry
    inquiry = Inquiry(
        car_id=inquiry_data.car_id,
        buyer_id=current_user.id if current_user else None,
        seller_id=car.seller_id,
        subject=inquiry_data.subject,
        message=inquiry_data.message,
        buyer_name=inquiry_data.buyer_name or (current_user.full_name if current_user else None),
        buyer_email=inquiry_data.buyer_email or (current_user.email if current_user else None),
        buyer_phone=inquiry_data.buyer_phone or (current_user.phone if current_user else None),
        inquiry_type=inquiry_data.inquiry_type,
        offered_price=inquiry_data.offered_price,
        test_drive_requested=inquiry_data.test_drive_requested,
        inspection_requested=inquiry_data.inspection_requested,
        financing_needed=inquiry_data.financing_needed,
        trade_in_vehicle=inquiry_data.trade_in_vehicle,
        status="new",
        priority="medium"
    )
    
    db.add(inquiry)
    db.flush()
    
    # Update car contact count
    car.contact_count += 1
    
    # Create notification for seller
    notification = Notification(
        user_id=car.seller_id,
        type="new_inquiry",
        title="New Inquiry",
        message=f"New inquiry for your listing: {car.title}",
        action_text="View Inquiry",
        action_url=f"/inquiries/{inquiry.id}",
        related_car_id=car.id,
        related_inquiry_id=inquiry.id,
        priority="high"
    )
    db.add(notification)
    
    db.commit()
    db.refresh(inquiry)
    
    return IDResponse(id=inquiry.id, message="Inquiry sent successfully")


@router.get("", response_model=PaginatedResponse)
async def get_inquiries(
    inbox: bool = False,  # False = sent by me, True = received by me
    status: str = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get inquiries (sent or received)
    """
    if inbox:
        # Inquiries received (I'm the seller)
        query = db.query(Inquiry).filter(Inquiry.seller_id == current_user.id)
    else:
        # Inquiries sent (I'm the buyer)
        query = db.query(Inquiry).filter(Inquiry.buyer_id == current_user.id)
    
    if status:
        query = query.filter(Inquiry.status == status)
    
    total = query.count()
    offset = (page - 1) * limit
    inquiries = query.order_by(Inquiry.created_at.desc()).offset(offset).limit(limit).all()
    
    total_pages = (total + limit - 1) // limit
    
    return PaginatedResponse(
        data=[InquiryResponse.model_validate(inq) for inq in inquiries],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/{inquiry_id}", response_model=InquiryDetailResponse)
async def get_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get inquiry details
    """
    inquiry = db.query(Inquiry).options(
        joinedload(Inquiry.car),
        joinedload(Inquiry.buyer),
        joinedload(Inquiry.seller),
        joinedload(Inquiry.responses)
    ).filter(Inquiry.id == inquiry_id).first()
    
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Check access
    if inquiry.buyer_id != current_user.id and inquiry.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Mark as read if seller is viewing
    if inquiry.seller_id == current_user.id and not inquiry.is_read:
        inquiry.is_read = True
        inquiry.status = "read"
        db.commit()
    
    return InquiryDetailResponse.model_validate(inquiry)


@router.post("/{inquiry_id}/respond", response_model=InquiryResponseResponse, status_code=status.HTTP_201_CREATED)
async def respond_to_inquiry(
    inquiry_id: int,
    response_data: InquiryResponseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Respond to an inquiry
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Check access (both buyer and seller can respond)
    if inquiry.buyer_id != current_user.id and inquiry.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Create response
    response = InquiryResponseModel(
        inquiry_id=inquiry_id,
        user_id=current_user.id,
        message=response_data.message,
        response_type=response_data.response_type,
        is_internal_note=response_data.is_internal_note,
        counter_offer_price=response_data.counter_offer_price,
        suggested_datetime=response_data.suggested_datetime,
        meeting_location=response_data.meeting_location
    )
    
    db.add(response)
    
    # Update inquiry
    inquiry.response_count += 1
    inquiry.last_response_at = datetime.utcnow()
    inquiry.last_response_by = current_user.id
    inquiry.status = "replied"
    
    # Create notification for the other party
    if current_user.id == inquiry.seller_id:
        # Seller responded, notify buyer
        if inquiry.buyer_id:
            notification = Notification(
                user_id=inquiry.buyer_id,
                type="inquiry_response",
                title="New Response",
                message=f"You have a new response to your inquiry",
                action_text="View Response",
                action_url=f"/inquiries/{inquiry_id}",
                related_inquiry_id=inquiry_id,
                priority="medium"
            )
            db.add(notification)
    else:
        # Buyer responded, notify seller
        notification = Notification(
            user_id=inquiry.seller_id,
            type="inquiry_response",
            title="New Response",
            message=f"You have a new response to your inquiry",
            action_text="View Response",
            action_url=f"/inquiries/{inquiry_id}",
            related_inquiry_id=inquiry_id,
            priority="medium"
        )
        db.add(notification)
    
    db.commit()
    db.refresh(response)
    
    return InquiryResponseResponse.model_validate(response)


@router.put("/{inquiry_id}", response_model=MessageResponse)
async def update_inquiry(
    inquiry_id: int,
    update_data: InquiryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update inquiry status
    
    Only seller can update inquiry
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    if inquiry.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if hasattr(inquiry, key):
            setattr(inquiry, key, value)
    
    db.commit()
    
    return MessageResponse(message="Inquiry updated successfully")


@router.post("/{inquiry_id}/rate", response_model=MessageResponse)
async def rate_inquiry(
    inquiry_id: int,
    rating_data: InquiryRating,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rate inquiry interaction
    
    Buyer rates seller, seller rates buyer
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    # Check access
    if inquiry.buyer_id != current_user.id and inquiry.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if current_user.id == inquiry.buyer_id:
        # Buyer rating seller
        inquiry.seller_rating = rating_data.rating
        
        # Update seller average rating
        seller = db.query(User).filter(User.id == inquiry.seller_id).first()
        if seller:
            total_rating = (seller.average_rating * seller.total_ratings) + float(rating_data.rating)
            seller.total_ratings += 1
            seller.average_rating = total_rating / seller.total_ratings
    else:
        # Seller rating buyer
        inquiry.buyer_rating = rating_data.rating
        
        # Update buyer average rating
        if inquiry.buyer_id:
            buyer = db.query(User).filter(User.id == inquiry.buyer_id).first()
            if buyer:
                total_rating = (buyer.average_rating * buyer.total_ratings) + float(rating_data.rating)
                buyer.total_ratings += 1
                buyer.average_rating = total_rating / buyer.total_ratings
    
    db.commit()
    
    return MessageResponse(message="Rating submitted successfully")


@router.delete("/{inquiry_id}", response_model=MessageResponse)
async def delete_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete inquiry
    
    Only buyer can delete their own inquiry
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    
    if inquiry.buyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db.delete(inquiry)
    db.commit()
    
    return MessageResponse(message="Inquiry deleted successfully")