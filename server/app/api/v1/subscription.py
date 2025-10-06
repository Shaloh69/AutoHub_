from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.subscription import (
    SubscriptionPlanResponse, SubscriptionCreate, SubscriptionResponse,
    SubscriptionDetailResponse, SubscriptionCancel, SubscriptionUpgrade,
    SubscriptionUsageResponse, PromotionCodeValidate, PromotionCodeResponse,
    SubscriptionPaymentResponse
)
from app.schemas.common import MessageResponse
from app.core.dependencies import get_current_user, get_current_verified_user
from app.models.user import User
from app.models.subscription import (
    SubscriptionPlan, UserSubscription, SubscriptionUsage,
    SubscriptionPayment, PromotionCode, PromotionCodeUsage
)
from decimal import Decimal

router = APIRouter()


@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get all available subscription plans
    """
    query = db.query(SubscriptionPlan)
    
    if active_only:
        query = query.filter(SubscriptionPlan.is_active == True)
    
    plans = query.order_by(SubscriptionPlan.display_order).all()
    return [SubscriptionPlanResponse.model_validate(p) for p in plans]


@router.get("/current", response_model=SubscriptionDetailResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's active subscription
    """
    from sqlalchemy.orm import joinedload
    
    subscription = db.query(UserSubscription).options(
        joinedload(UserSubscription.plan)
    ).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(["active", "trial"])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Get usage data
    usage = db.query(SubscriptionUsage).filter(
        SubscriptionUsage.subscription_id == subscription.id,
        SubscriptionUsage.period_start <= datetime.utcnow(),
        SubscriptionUsage.period_end >= datetime.utcnow()
    ).first()
    
    response = SubscriptionDetailResponse.model_validate(subscription)
    if usage:
        response.usage = SubscriptionUsageResponse.model_validate(usage).model_dump()
    
    return response


@router.post("/subscribe", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    Subscribe to a plan
    
    Requires verified account
    """
    # Check if user already has active subscription
    existing = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(["active", "trial"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription. Please cancel or upgrade instead."
        )
    
    # Get plan
    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == subscription_data.plan_id,
        SubscriptionPlan.is_active == True
    ).first()
    
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    
    # Calculate pricing
    if subscription_data.billing_cycle == "monthly":
        price = plan.monthly_price
    elif subscription_data.billing_cycle == "yearly":
        price = plan.yearly_price
    else:
        price = 0
    
    # Apply promotion code if provided
    discount_percent = Decimal("0")
    discount_amount = Decimal("0")
    
    if subscription_data.promotion_code:
        promo = db.query(PromotionCode).filter(
            PromotionCode.code == subscription_data.promotion_code,
            PromotionCode.is_active == True,
            PromotionCode.starts_at <= datetime.utcnow(),
            PromotionCode.expires_at >= datetime.utcnow()
        ).first()
        
        if promo:
            # Check usage limits
            if promo.max_uses and promo.current_uses >= promo.max_uses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Promotion code usage limit reached"
                )
            
            # Check user usage
            user_usage = db.query(PromotionCodeUsage).filter(
                PromotionCodeUsage.promotion_code_id == promo.id,
                PromotionCodeUsage.user_id == current_user.id
            ).count()
            
            if user_usage >= promo.max_uses_per_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already used this promotion code"
                )
            
            # Apply discount
            if promo.discount_type == "percentage":
                discount_percent = promo.discount_value
                discount_amount = price * (discount_percent / 100)
            elif promo.discount_type == "fixed_amount":
                discount_amount = promo.discount_value
    
    # Calculate dates
    now = datetime.utcnow()
    trial_ends_at = now + timedelta(days=plan.trial_days) if plan.trial_days > 0 else None
    
    if subscription_data.billing_cycle == "monthly":
        period_end = now + timedelta(days=30)
    elif subscription_data.billing_cycle == "yearly":
        period_end = now + timedelta(days=365)
    else:
        period_end = now + timedelta(days=365 * 100)  # Lifetime
    
    # Create subscription
    subscription = UserSubscription(
        user_id=current_user.id,
        plan_id=plan.id,
        status="trial" if trial_ends_at else "pending",
        billing_cycle=subscription_data.billing_cycle,
        monthly_price=plan.monthly_price,
        yearly_price=plan.yearly_price,
        currency="PHP",
        started_at=now,
        trial_ends_at=trial_ends_at,
        current_period_start=now,
        current_period_end=period_end,
        next_billing_date=trial_ends_at if trial_ends_at else period_end,
        payment_method=subscription_data.payment_method,
        auto_renew=subscription_data.auto_renew,
        discount_percent=discount_percent,
        discount_amount=discount_amount,
        promotion_code=subscription_data.promotion_code
    )
    
    db.add(subscription)
    db.flush()
    
    # Update user subscription
    current_user.current_subscription_id = subscription.id
    current_user.subscription_status = subscription.status
    current_user.subscription_expires_at = period_end
    current_user.subscription_started_at = now
    
    # Create usage tracking record
    usage = SubscriptionUsage(
        subscription_id=subscription.id,
        user_id=current_user.id,
        period_start=now,
        period_end=period_end
    )
    db.add(usage)
    
    # Record promotion code usage
    if subscription_data.promotion_code and discount_amount > 0:
        promo_usage = PromotionCodeUsage(
            promotion_code_id=promo.id,
            user_id=current_user.id,
            subscription_id=subscription.id,
            discount_applied=discount_amount,
            original_amount=price,
            final_amount=price - discount_amount,
            currency="PHP"
        )
        db.add(promo_usage)
        
        # Increment promotion code usage
        promo.current_uses += 1
    
    db.commit()
    db.refresh(subscription)
    
    # TODO: Create payment record and process payment
    
    return SubscriptionResponse.model_validate(subscription)


@router.post("/cancel", response_model=MessageResponse)
async def cancel_subscription(
    cancel_data: SubscriptionCancel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel current subscription
    
    Subscription remains active until end of billing period
    """
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(["active", "trial"])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription to cancel"
        )
    
    subscription.status = "cancelled"
    subscription.cancelled_at = datetime.utcnow()
    subscription.cancelled_by = current_user.id
    subscription.cancel_reason = cancel_data.cancel_reason
    subscription.cancel_notes = cancel_data.cancel_notes
    subscription.auto_renew = False
    
    # Update user status
    current_user.subscription_status = "cancelled"
    
    db.commit()
    
    return MessageResponse(
        message="Subscription cancelled successfully. Access will remain until end of billing period."
    )


@router.post("/upgrade", response_model=SubscriptionResponse)
async def upgrade_subscription(
    upgrade_data: SubscriptionUpgrade,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upgrade to a higher plan
    """
    current_sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(["active", "trial"])
    ).first()
    
    if not current_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    new_plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == upgrade_data.new_plan_id,
        SubscriptionPlan.is_active == True
    ).first()
    
    if not new_plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    
    # Validate upgrade
    current_plan = current_sub.plan
    if new_plan.monthly_price <= current_plan.monthly_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot downgrade. Please cancel and subscribe to new plan."
        )
    
    # Cancel current subscription
    current_sub.status = "cancelled"
    current_sub.cancelled_at = datetime.utcnow()
    current_sub.cancel_reason = "upgrade"
    
    # Create new subscription
    now = datetime.utcnow()
    billing_cycle = upgrade_data.billing_cycle or current_sub.billing_cycle
    
    if billing_cycle == "monthly":
        period_end = now + timedelta(days=30)
    else:
        period_end = now + timedelta(days=365)
    
    new_sub = UserSubscription(
        user_id=current_user.id,
        plan_id=new_plan.id,
        status="active",
        billing_cycle=billing_cycle,
        monthly_price=new_plan.monthly_price,
        yearly_price=new_plan.yearly_price,
        currency="PHP",
        started_at=now,
        current_period_start=now,
        current_period_end=period_end,
        next_billing_date=period_end,
        payment_method=current_sub.payment_method,
        auto_renew=current_sub.auto_renew
    )
    
    db.add(new_sub)
    db.flush()
    
    # Update user
    current_user.current_subscription_id = new_sub.id
    current_user.subscription_status = "active"
    current_user.subscription_expires_at = period_end
    
    db.commit()
    db.refresh(new_sub)
    
    return SubscriptionResponse.model_validate(new_sub)


@router.get("/usage", response_model=SubscriptionUsageResponse)
async def get_subscription_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current subscription usage statistics
    """
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(["active", "trial"])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    usage = db.query(SubscriptionUsage).filter(
        SubscriptionUsage.subscription_id == subscription.id,
        SubscriptionUsage.period_start <= datetime.utcnow(),
        SubscriptionUsage.period_end >= datetime.utcnow()
    ).first()
    
    if not usage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usage data not found"
        )
    
    return SubscriptionUsageResponse.model_validate(usage)


@router.post("/validate-promo", response_model=PromotionCodeResponse)
async def validate_promotion_code(
    promo_data: PromotionCodeValidate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validate promotion code
    """
    promo = db.query(PromotionCode).filter(
        PromotionCode.code == promo_data.code,
        PromotionCode.is_active == True,
        PromotionCode.starts_at <= datetime.utcnow(),
        PromotionCode.expires_at >= datetime.utcnow()
    ).first()
    
    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired promotion code"
        )
    
    # Check usage limits
    if promo.max_uses and promo.current_uses >= promo.max_uses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion code usage limit reached"
        )
    
    # Check user usage
    user_usage = db.query(PromotionCodeUsage).filter(
        PromotionCodeUsage.promotion_code_id == promo.id,
        PromotionCodeUsage.user_id == current_user.id
    ).count()
    
    if user_usage >= promo.max_uses_per_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already used this promotion code"
        )
    
    return PromotionCodeResponse.model_validate(promo)


@router.get("/payments", response_model=List[SubscriptionPaymentResponse])
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get subscription payment history
    """
    payments = db.query(SubscriptionPayment).filter(
        SubscriptionPayment.user_id == current_user.id
    ).order_by(SubscriptionPayment.created_at.desc()).all()
    
    return [SubscriptionPaymentResponse.model_validate(p) for p in payments]