from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.database import get_db
from app.schemas.subscription import (
    SubscriptionPlanResponse, SubscriptionCreate, UserSubscriptionResponse,
    SubscriptionUsageResponse, PromoCodeValidation, PromoCodeResponse
)
from app.schemas.common import MessageResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subscription import SubscriptionPayment
from app.services.subscription_service import SubscriptionService

router = APIRouter()


@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans"""
    plans = SubscriptionService.get_all_plans(db)
    return [SubscriptionPlanResponse.model_validate(p) for p in plans]


@router.get("/current", response_model=UserSubscriptionResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current subscription"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    subscription = SubscriptionService.get_user_subscription(db, user_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    return UserSubscriptionResponse.model_validate(subscription)


@router.post("/subscribe", response_model=UserSubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def subscribe_to_plan(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe to a plan"""
    try:
        # FIX: Use getattr
        user_id = int(getattr(current_user, 'id', 0))
        subscription = SubscriptionService.subscribe(
            db,
            user_id=user_id,
            plan_id=subscription_data.plan_id,
            billing_cycle=subscription_data.billing_cycle,
            payment_method=subscription_data.payment_method,
            promo_code=subscription_data.promo_code
        )
        return UserSubscriptionResponse.model_validate(subscription)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/cancel", response_model=MessageResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    try:
        # FIX: Use getattr
        user_id = int(getattr(current_user, 'id', 0))
        SubscriptionService.cancel_subscription(db, user_id)
        return MessageResponse(message="Subscription cancelled successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/usage", response_model=SubscriptionUsageResponse)
async def get_subscription_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get subscription usage statistics"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    usage = SubscriptionService.get_usage(db, user_id)
    return SubscriptionUsageResponse(**usage)


@router.post("/validate-promo", response_model=PromoCodeResponse)
async def validate_promo_code(
    promo_data: PromoCodeValidation,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate promotion code"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    discount = SubscriptionService.validate_promo_code(db, promo_data.code, user_id)
    
    if discount:
        # Convert float to Decimal
        discount_decimal = Decimal(str(discount))
        
        return PromoCodeResponse(
            valid=True,
            code=promo_data.code,
            discount_type="percentage",
            discount_value=discount_decimal,
            message=f"Promo code valid! {discount}% discount applied"
        )
    else:
        return PromoCodeResponse(
            valid=False,
            code=promo_data.code,
            message="Invalid or expired promo code"
        )


@router.get("/payments")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment history"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    payments = db.query(SubscriptionPayment).filter(
        SubscriptionPayment.user_id == user_id
    ).order_by(SubscriptionPayment.created_at.desc()).all()
    
    return [
        {
            "id": int(getattr(p, 'id', 0)),
            "amount": float(getattr(p, 'amount', 0)),
            "currency": str(getattr(p, 'currency', 'PHP')),
            "payment_method": str(getattr(p, 'payment_method', '')),
            "status": str(getattr(p, 'status', '')),
            "created_at": getattr(p, 'created_at', None)
        }
        for p in payments
    ]


@router.post("/upgrade")
async def upgrade_subscription(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upgrade to a higher plan"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    # Cancel current subscription
    try:
        SubscriptionService.cancel_subscription(db, user_id)
    except:
        pass
    
    # Subscribe to new plan
    try:
        subscription = SubscriptionService.subscribe(
            db,
            user_id=user_id,
            plan_id=plan_id,
            billing_cycle="monthly",
            payment_method="credit_card"
        )
        return {
            "message": "Subscription upgraded successfully",
            "subscription": UserSubscriptionResponse.model_validate(subscription)
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))