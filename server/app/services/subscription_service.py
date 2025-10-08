from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict
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
            SubscriptionPlan.is_active == True
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
        
        # Calculate price - FIX: Use Decimal for all price calculations
        if billing_cycle == "yearly":
            amount = plan.yearly_price if plan.yearly_price else plan.monthly_price * Decimal('10')
        else:
            amount = plan.monthly_price
        
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
        
        # Create payment record
        payment = SubscriptionPayment(
            subscription_id=subscription.id,
            user_id=user_id,
            amount=amount,
            payment_method=payment_method,
            status="completed"
        )
        db.add(payment)
        
        # Update user
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.current_subscription_id = subscription.id
            user.subscription_status = "active"
            user.subscription_expires_at = subscription.current_period_end
        
        # Record promo code usage
        if promo_code:
            SubscriptionService.record_promo_usage(db, promo_code, user_id, subscription.id)
        
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
        
        subscription.status = "cancelled"
        subscription.cancelled_at = datetime.utcnow()
        subscription.auto_renew = False
        
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
                "boost_credits_used": 0,
                "boost_credits_monthly": 0
            }
        
        usage = db.query(SubscriptionUsage).filter(
            SubscriptionUsage.subscription_id == subscription.id
        ).first()
        
        if not usage:
            # Create initial usage record
            usage = SubscriptionUsage(
                user_id=user_id,
                subscription_id=subscription.id,
                period_start=subscription.current_period_start,
                period_end=subscription.current_period_end
            )
            db.add(usage)
            db.commit()
        
        return {
            "active_listings": usage.active_listings,
            "max_active_listings": subscription.plan.max_active_listings,
            "featured_listings": usage.featured_listings,
            "max_featured_listings": subscription.plan.max_featured_listings,
            "boost_credits_used": usage.boost_credits_used,
            "boost_credits_monthly": subscription.plan.boost_credits_monthly,
            "storage_used_mb": usage.storage_used_mb,
            "storage_mb": subscription.plan.storage_mb,
            "period_start": usage.period_start,
            "period_end": usage.period_end
        }
    
    @staticmethod
    def validate_promo_code(db: Session, code: str, user_id: int) -> Optional[float]:
        """Validate promo code and return discount percentage"""
        promo = db.query(PromotionCode).filter(
            PromotionCode.code == code,
            PromotionCode.is_active == True
        ).first()
        
        if not promo:
            return None
        
        # Check validity period
        now = datetime.utcnow()
        if promo.valid_from and now < promo.valid_from:
            return None
        if promo.valid_until and now > promo.valid_until:
            return None
        
        # Check usage limits
        if promo.max_uses and promo.times_used >= promo.max_uses:
            return None
        
        # Check if user already used this code
        existing = db.query(PromotionCodeUsage).filter(
            PromotionCodeUsage.code_id == promo.id,
            PromotionCodeUsage.user_id == user_id
        ).first()
        
        if existing:
            return None
        
        return float(promo.discount_value)
    
    @staticmethod
    def record_promo_usage(db: Session, code: str, user_id: int, subscription_id: int):
        """Record promo code usage"""
        promo = db.query(PromotionCode).filter(PromotionCode.code == code).first()
        if not promo:
            return
        
        usage = PromotionCodeUsage(
            code_id=promo.id,
            user_id=user_id,
            subscription_id=subscription_id
        )
        db.add(usage)
        
        promo.times_used += 1
        
        db.commit()