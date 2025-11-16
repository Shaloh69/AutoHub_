from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.database import get_db
from app.schemas.review import (
    ReviewCreate, ReviewUpdate, ReviewResponse, ReviewDetailResponse,
    ReviewStatsResponse, ReviewHelpful
)
from app.schemas.common import MessageResponse, IDResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.car import Car
from app.models.review import Review, ReviewStatus
from app.models.transaction import Transaction
from app.services.notification_service import NotificationService
from app.services.fraud_detection_service import FraudDetectionService

router = APIRouter()


@router.post("", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new review"""
    buyer_id = int(getattr(current_user, 'id', 0))

    # Check if seller exists
    seller = db.query(User).filter(User.id == review_data.seller_id).first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )

    # Cannot review yourself
    if review_data.seller_id == buyer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot review yourself"
        )

    # Check if car exists (if car_id provided)
    if review_data.car_id:
        car = db.query(Car).filter(Car.id == review_data.car_id).first()
        if not car:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Car not found"
            )

        # Check if user already reviewed this car
        existing_review = db.query(Review).filter(
            Review.car_id == review_data.car_id,
            Review.buyer_id == buyer_id
        ).first()
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this car"
            )

    # Check if verified purchase (if transaction_id provided)
    verified_purchase = False
    if review_data.transaction_id:
        transaction = db.query(Transaction).filter(
            Transaction.id == review_data.transaction_id,
            Transaction.buyer_id == buyer_id,
            Transaction.seller_id == review_data.seller_id
        ).first()
        if transaction:
            verified_purchase = True

    # Run fraud detection on review
    review_dict = review_data.model_dump()
    fraud_indicators = FraudDetectionService.check_review_fraud(db, review_dict, buyer_id)

    if fraud_indicators:
        # Flag review for manual review if fraud detected
        pass

    # Create review
    review = Review(
        car_id=review_data.car_id,
        seller_id=review_data.seller_id,
        buyer_id=buyer_id,
        transaction_id=review_data.transaction_id,
        rating=review_data.rating,
        title=review_data.title,
        comment=review_data.comment,
        pros=review_data.pros,
        cons=review_data.cons,
        would_recommend=review_data.would_recommend,
        verified_purchase=verified_purchase,
        status=ReviewStatus.PENDING,
        created_at=datetime.utcnow()
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    # Update seller's average rating
    update_seller_rating(db, review_data.seller_id)

    # Update car's average rating (if car_id provided)
    if review_data.car_id:
        update_car_rating(db, review_data.car_id)

    # Notify seller
    NotificationService.notify_new_review(
        db,
        seller_id=review_data.seller_id,
        buyer_id=buyer_id,
        rating=float(review_data.rating)
    )

    review_id = int(getattr(review, 'id', 0))
    return IDResponse(id=review_id, message="Review submitted successfully and is pending moderation")


@router.get("", response_model=List[ReviewResponse])
async def get_reviews(
    car_id: Optional[int] = None,
    seller_id: Optional[int] = None,
    buyer_id: Optional[int] = None,
    status: Optional[str] = Query(None, pattern="^(pending|approved|rejected|hidden)$"),
    min_rating: Optional[int] = Query(None, ge=1, le=5),
    verified_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get reviews with filters"""
    query = db.query(Review)

    if car_id:
        query = query.filter(Review.car_id == car_id)
    if seller_id:
        query = query.filter(Review.seller_id == seller_id)
    if buyer_id:
        query = query.filter(Review.buyer_id == buyer_id)
    if status:
        query = query.filter(Review.status == status)
    else:
        # By default, only show approved reviews to public
        query = query.filter(Review.status == ReviewStatus.APPROVED)
    if min_rating:
        query = query.filter(Review.rating >= min_rating)
    if verified_only:
        query = query.filter(Review.verified_purchase == True)

    reviews = query.order_by(desc(Review.created_at)).limit(limit).offset(offset).all()
    return [ReviewResponse.model_validate(review) for review in reviews]


@router.get("/{review_id}", response_model=ReviewDetailResponse)
async def get_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get a single review by ID"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Load relationships
    buyer = db.query(User).filter(User.id == review.buyer_id).first()
    seller = db.query(User).filter(User.id == review.seller_id).first()
    car = db.query(Car).filter(Car.id == review.car_id).first() if review.car_id else None

    review_dict = ReviewResponse.model_validate(review).model_dump()
    review_dict['buyer'] = {
        'id': int(getattr(buyer, 'id', 0)),
        'first_name': str(getattr(buyer, 'first_name', '')),
        'last_name': str(getattr(buyer, 'last_name', '')),
        'profile_image': getattr(buyer, 'profile_image', None)
    } if buyer else None
    review_dict['seller'] = {
        'id': int(getattr(seller, 'id', 0)),
        'first_name': str(getattr(seller, 'first_name', '')),
        'last_name': str(getattr(seller, 'last_name', '')),
        'average_rating': float(getattr(seller, 'average_rating', 0))
    } if seller else None
    review_dict['car'] = {
        'id': int(getattr(car, 'id', 0)),
        'title': str(getattr(car, 'title', '')),
        'year': int(getattr(car, 'year', 0))
    } if car else None

    return ReviewDetailResponse(**review_dict)


@router.put("/{review_id}", response_model=MessageResponse)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update own review"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Only the buyer who created the review can update it
    buyer_id = int(getattr(current_user, 'id', 0))
    if int(getattr(review, 'buyer_id', 0)) != buyer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own reviews"
        )

    # Update fields
    if review_data.rating is not None:
        setattr(review, 'rating', review_data.rating)
    if review_data.title is not None:
        setattr(review, 'title', review_data.title)
    if review_data.comment is not None:
        setattr(review, 'comment', review_data.comment)
    if review_data.pros is not None:
        setattr(review, 'pros', review_data.pros)
    if review_data.cons is not None:
        setattr(review, 'cons', review_data.cons)
    if review_data.would_recommend is not None:
        setattr(review, 'would_recommend', review_data.would_recommend)

    setattr(review, 'updated_at', datetime.utcnow())
    # Reset to pending after update
    setattr(review, 'status', ReviewStatus.PENDING)

    db.commit()

    # Update ratings
    seller_id = int(getattr(review, 'seller_id', 0))
    car_id = getattr(review, 'car_id', None)

    update_seller_rating(db, seller_id)
    if car_id:
        update_car_rating(db, car_id)

    return MessageResponse(message="Review updated successfully", success=True)


@router.delete("/{review_id}", response_model=MessageResponse)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete own review"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Only the buyer who created the review can delete it
    buyer_id = int(getattr(current_user, 'id', 0))
    if int(getattr(review, 'buyer_id', 0)) != buyer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews"
        )

    seller_id = int(getattr(review, 'seller_id', 0))
    car_id = getattr(review, 'car_id', None)

    db.delete(review)
    db.commit()

    # Update ratings after deletion
    update_seller_rating(db, seller_id)
    if car_id:
        update_car_rating(db, car_id)

    return MessageResponse(message="Review deleted successfully", success=True)


@router.post("/{review_id}/helpful", response_model=MessageResponse)
async def mark_review_helpful(
    review_id: int,
    helpful_data: ReviewHelpful,
    db: Session = Depends(get_db)
):
    """Mark review as helpful"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    if helpful_data.helpful:
        helpful_count = int(getattr(review, 'helpful_count', 0))
        setattr(review, 'helpful_count', helpful_count + 1)

    db.commit()
    return MessageResponse(message="Thank you for your feedback", success=True)


# ==================== HELPER FUNCTIONS ====================

def update_seller_rating(db: Session, seller_id: int):
    """Update seller's average rating based on all approved reviews"""
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.seller_id == seller_id,
        Review.status == ReviewStatus.APPROVED
    ).scalar()

    total_reviews = db.query(func.count(Review.id)).filter(
        Review.seller_id == seller_id,
        Review.status == ReviewStatus.APPROVED
    ).scalar()

    seller = db.query(User).filter(User.id == seller_id).first()
    if seller:
        setattr(seller, 'average_rating', avg_rating or Decimal("0.00"))
        setattr(seller, 'total_ratings', total_reviews or 0)
        db.commit()


def update_car_rating(db: Session, car_id: int):
    """Update car's average rating based on all approved reviews"""
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.car_id == car_id,
        Review.status == ReviewStatus.APPROVED
    ).scalar()

    car = db.query(Car).filter(Car.id == car_id).first()
    if car:
        setattr(car, 'average_rating', avg_rating or Decimal("0.00"))
        db.commit()
