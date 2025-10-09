from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, cast
from decimal import Decimal
from app.models.subscription import (
    SubscriptionPlan, UserSubscription, SubscriptionUsage,
    SubscriptionPayment, PromotionCode, PromotionCodeUsage
)
from app.models.user import User


class SubscriptionService:
    """Subscription management service"""
    
    @staticmethod
    def get_all_plans(db: Session) -> List[SubscriptionPlan]:
        """Get all active subscription plans"""
        return db.query(SubscriptionPlan).filter(
            SubscriptionPlan.is_active == True  # noqa: E712
        ).order_by(SubscriptionPlan.monthly_price).all()
    
    @staticmethod
    def get_user_subscription(db: Session, user_id: int) -> Optional[UserSubscription]:
        """Get user's current subscription"""
        return db.query(UserSubscription).filter(
            UserSubscription.user_id == user_id,
            UserSubscription.status == "active"
        ).first()
    
    @staticmethod
    def subscribe(
        db: Session,
        user_id: int,
        plan_id: int,
        billing_cycle: str,
        payment_method: str,
        promo_code: Optional[str] = None
    ) -> UserSubscription:
        """Subscribe user to a plan"""
        # Get plan
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
        if not plan:
            raise ValueError("Plan not found")
        
        # Check for existing subscription
        existing = db.query(UserSubscription).filter(
            UserSubscription.user_id == user_id,
            UserSubscription.status == "active"
        ).first()
        
        if existing:
            raise ValueError("User already has an active subscription")
        
        # Calculate price - FIX: Safely handle yearly_price Column type
        if billing_cycle == "yearly":
            # Get yearly_price value, checking if it exists
            yearly_price_value = getattr(plan, 'yearly_price', None)
            if yearly_price_value is not None:
                amount = Decimal(str(yearly_price_value))
            else:
                # Fallback to monthly price * 10 if yearly price not set
                monthly_price_value = getattr(plan, 'monthly_price', 0)
                amount = Decimal(str(monthly_price_value)) * Decimal('10')
        else:
            monthly_price_value = getattr(plan, 'monthly_price', 0)
            amount = Decimal(str(monthly_price_value))
        
        # Apply promo code - FIX: Convert discount to Decimal
        if promo_code:
            discount_percent = SubscriptionService.validate_promo_code(db, promo_code, user_id)
            if discount_percent:
                # Convert float to Decimal for calculation
                discount_decimal = Decimal(str(discount_percent))
                amount = amount * (Decimal('1') - discount_decimal / Decimal('100'))
        
        # Create subscription
        subscription = UserSubscription(
            user_id=user_id,
            plan_id=plan_id,
            status="active",
            billing_cycle=billing_cycle,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30 if billing_cycle == "monthly" else 365),
            next_billing_date=datetime.utcnow() + timedelta(days=30 if billing_cycle == "monthly" else 365),
            subscribed_at=datetime.utcnow()
        )
        
        db.add(subscription)
        db.flush()
        
        # Create payment record - FIX: Cast subscription.id to int
        subscription_id = cast(int, subscription.id)
        payment = SubscriptionPayment(
            subscription_id=subscription_id,
            user_id=user_id,
            amount=amount,
            payment_method=payment_method,
            status="completed"
        )
        db.add(payment)
        
        # Update user - FIX: Use setattr for SQLAlchemy model attributes
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            setattr(user, 'current_subscription_id', subscription_id)
            setattr(user, 'subscription_status', "active")
            setattr(user, 'subscription_expires_at', subscription.current_period_end)
        
        # Record promo code usage - FIX: Cast subscription.id to int
        if promo_code:
            SubscriptionService.record_promo_usage(db, promo_code, user_id, subscription_id)
        
        db.commit()
        db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    def cancel_subscription(db: Session, user_id: int) -> bool:
        """Cancel user's subscription"""
        subscription = db.query(UserSubscription).filter(
            UserSubscription.user_id == user_id,
            UserSubscription.status == "active"
        ).first()
        
        if not subscription:
            raise ValueError("No active subscription found")
        
        # FIX: Use setattr for SQLAlchemy model attributes
        setattr(subscription, 'status', "cancelled")
        setattr(subscription, 'cancelled_at', datetime.utcnow())
        setattr(subscription, 'auto_renew', False)
        
        db.commit()
        
        return True
    
    @staticmethod
    def get_usage(db: Session, user_id: int) -> Dict:
        """Get subscription usage for user"""
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        if not subscription:
            return {
                "active_listings": 0,
                "max_active_listings": 3,
                "featured_listings": 0,
                "max_featured_listings": 0,
                "premium_listings": 0,
                "max_premium_listings": 0,
                "boost_credits_used": 0,
                "boost_credits_monthly": 0,
                "storage_used_mb": 0,
                "storage_mb": 100,
                "period_start": datetime.utcnow(),
                "period_end": datetime.utcnow() + timedelta(days=30)
            }
        
        # Cast subscription.id for type checking
        subscription_id = cast(int, subscription.id)
        
        usage = db.query(SubscriptionUsage).filter(
            SubscriptionUsage.subscription_id == subscription_id
        ).first()
        
        if not usage:
            # Create initial usage record
            usage = SubscriptionUsage(
                user_id=user_id,
                subscription_id=subscription_id,
                period_start=subscription.current_period_start,
                period_end=subscription.current_period_end
            )
            db.add(usage)
            db.commit()
            db.refresh(usage)
        
        return {
            "active_listings": usage.active_listings,  # type: ignore
            "max_active_listings": subscription.plan.max_active_listings,  # type: ignore
            "featured_listings": usage.featured_listings,  # type: ignore
            "max_featured_listings": subscription.plan.max_featured_listings,  # type: ignore
            "premium_listings": usage.premium_listings,  # type: ignore
            "max_premium_listings": subscription.plan.max_premium_listings,  # type: ignore
            "boost_credits_used": usage.boost_credits_used,  # type: ignore
            "boost_credits_monthly": subscription.plan.boost_credits_monthly,  # type: ignore
            "storage_used_mb": usage.storage_used_mb,  # type: ignore
            "storage_mb": subscription.plan.storage_mb,  # type: ignore
            "period_start": usage.period_start,  # type: ignore
            "period_end": usage.period_end  # type: ignore
        }
    
    @staticmethod
    def validate_promo_code(db: Session, code: str, user_id: int) -> Optional[float]:
        """Validate promo code and return discount percentage"""
        promo = db.query(PromotionCode).filter(
            PromotionCode.code == code,
            PromotionCode.is_active == True  # noqa: E712
        ).first()
        
        if not promo:
            return None
        
        # Check validity period - FIX: Use getattr to safely access Column values
        now = datetime.utcnow()
        valid_from = getattr(promo, 'valid_from', None)
        valid_until = getattr(promo, 'valid_until', None)
        
        if valid_from is not None and now < valid_from:
            return None
        if valid_until is not None and now > valid_until:
            return None
        
        # Check usage limits - FIX: Use getattr to safely access Column values
        max_uses = getattr(promo, 'max_uses', None)
        times_used = getattr(promo, 'times_used', 0)
        
        if max_uses is not None and times_used >= max_uses:
            return None
        
        # Check if user already used this code - FIX: Cast promo.id to int
        promo_id = cast(int, promo.id)
        existing = db.query(PromotionCodeUsage).filter(
            PromotionCodeUsage.code_id == promo_id,
            PromotionCodeUsage.user_id == user_id
        ).first()
        
        if existing:
            return None
        
        # FIX: Safely get discount_value
        discount_value = getattr(promo, 'discount_value', 0)
        return float(discount_value)
    
    @staticmethod
    def record_promo_usage(db: Session, code: str, user_id: int, subscription_id: int):
        """Record promo code usage"""
        promo = db.query(PromotionCode).filter(PromotionCode.code == code).first()
        if not promo:
            return
        
        # Cast promo.id to int for type checking
        promo_id = cast(int, promo.id)
        
        usage = PromotionCodeUsage(
            code_id=promo_id,
            user_id=user_id,
            subscription_id=subscription_id
        )
        db.add(usage)
        
        # FIX: Use setattr to increment times_used
        current_times_used = getattr(promo, 'times_used', 0)
        setattr(promo, 'times_used', current_times_used + 1)
        
        db.commit()