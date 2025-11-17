"""
===========================================
FILE: app/services/subscription_service.py - UPDATED WITH QR CODE PAYMENT
Path: server/app/services/subscription_service.py
ADDED: QR code payment workflow, reference number handling, admin verification
PRESERVED: All original functionality
===========================================
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple
from decimal import Decimal
from app.models.subscription import (
    SubscriptionPlan, UserSubscription, SubscriptionUsage,
    SubscriptionPayment, PromotionCode, PromotionCodeUsage,
    PaymentSetting, PaymentVerificationLog
)
from app.models.user import User


class SubscriptionService:
    """Subscription management service - UPDATED WITH QR CODE PAYMENT"""
    
    # ========================================
    # ORIGINAL METHODS (PRESERVED)
    # ========================================
    
    @staticmethod
    def get_all_plans(db: Session) -> List[SubscriptionPlan]:
        """Get all active subscription plans"""
        return db.query(SubscriptionPlan).filter(
            SubscriptionPlan.is_active == True  # noqa: E712
        ).order_by(SubscriptionPlan.price).all()
    
    @staticmethod
    def get_user_subscription(db: Session, user_id: int) -> Optional[UserSubscription]:
        """Get user's current active subscription with plan details eager-loaded"""
        return db.query(UserSubscription).options(
            joinedload(UserSubscription.plan)
        ).filter(
            UserSubscription.user_id == user_id,
            UserSubscription.status == "ACTIVE"  # Fixed: Use UPPERCASE to match SQL schema
        ).first()
    
    @staticmethod


    def validate_promo_code(
        db: Session,
        code: str,
        user_id: int,
        plan_id: Optional[int] = None
    ) -> Optional[Decimal]:
        """Validate promo code and return discount (as Decimal).
        
        Returns:
          - For percentage discounts, returns the percentage as Decimal (e.g. Decimal('10') for 10%).
          - For fixed-amount discounts, returns the fixed amount as Decimal (e.g. Decimal('5.00')).
          - Returns None when promo is invalid / not applicable.
        """
        promo = (
            db.query(PromotionCode)
            .filter(
                PromotionCode.code == code,
                PromotionCode.is_active == True  # noqa: E712
            )
            .first()
        )
    
        if not promo:
            return None
    
        # Check validity period (safe with None)
        now = datetime.utcnow()
        valid_from = getattr(promo, "valid_from", None)
        valid_until = getattr(promo, "valid_until", None)
    
        if valid_from and valid_from > now:
            return None
        if valid_until and valid_until < now:
            return None
    
        # Check max uses (treat None as "no limit")
        max_uses = getattr(promo, "max_uses", None)
        current_uses = getattr(promo, "current_uses", 0) or 0  # guard against None
    
        if max_uses is not None and current_uses >= max_uses:
            return None
    
        # Check user usage (only if max_uses_per_user set)
        max_uses_per_user = getattr(promo, "max_uses_per_user", None)
        if max_uses_per_user is not None:
            user_usage = (
                db.query(PromotionCodeUsage)
                .filter(
                    PromotionCodeUsage.promo_code_id == promo.id,
                    PromotionCodeUsage.user_id == user_id
                )
                .count()
            )
            if user_usage >= max_uses_per_user:
                return None
    
        # Check applicable plans
        if plan_id is not None:
            ap_raw = getattr(promo, "applicable_plans", None)  # type: ignore[assignment]
            if ap_raw:
                plan_tokens = [p.strip() for p in str(ap_raw).split(",")]
                applicable_plan_ids = set()
                for tok in plan_tokens:
                    if not tok:
                        continue
                    try:
                        applicable_plan_ids.add(int(tok))
                    except ValueError:
                        # skip bad token
                        continue
                    
                # if there are no valid plan ids, treat as not applicable
                if not applicable_plan_ids:
                    return None
    
                if plan_id not in applicable_plan_ids:
                    return None
    
        # Return discount value
        # sanitize discount_value (could be Decimal, float, int, str)
        raw_value = getattr(promo, "discount_value", None)
        if raw_value is None:
            return None
    
        try:
            discount = Decimal(str(raw_value))
        except (ArithmeticError, ValueError):
            return None
    
        # If you want to enforce bounds (e.g., percentage <= 100), do it here:
        if getattr(promo, "discount_type", "").lower() == "percentage":
            # optional: ensure reasonable percentage
            if discount <= 0:
                return None
            # optional: cap at 100%
            # if discount > Decimal("100"):
            #     discount = Decimal("100")
            return discount
        else:
            # fixed amount
            if discount <= 0:
                return None
            return discount

    
    # ========================================
    # UPDATED SUBSCRIBE METHOD WITH QR CODE
    # ========================================
    
    @staticmethod
    def subscribe(
        db: Session,
        user_id: int,
        plan_id: int,
        billing_cycle: str,
        payment_method: str,
        promo_code: Optional[str] = None
    ) -> Tuple[UserSubscription, SubscriptionPayment]:
        """
        Subscribe user to a plan - UPDATED FOR QR CODE PAYMENT
        
        Returns: (UserSubscription, SubscriptionPayment)
        
        CHANGES:
        - Subscription status starts as "pending" for QR code payments
        - Payment status is "pending" until admin verifies
        - QR code shown flag is set
        """
        # Get plan
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
        if not plan:
            raise ValueError("Plan not found")
        
        # Check for existing active subscription
        existing = db.query(UserSubscription).filter(
            UserSubscription.user_id == user_id,
            UserSubscription.status.in_(["active", "pending"])
        ).first()
        
        if existing:
            raise ValueError("User already has an active or pending subscription")
        
        # Calculate price
        # Fixed: Use 'price' field directly from plan (not monthly_price/yearly_price)
        base_price = Decimal(str(getattr(plan, 'price', 0)))

        # Apply multiplier for yearly subscriptions (typically 10x monthly for annual discount)
        if billing_cycle == "yearly":
            amount = base_price * Decimal('10')  # 10 months worth (2 months free)
        else:
            amount = base_price
        
        # Apply promo code
        discount_applied = Decimal('0')
        if promo_code:
            discount_percent = SubscriptionService.validate_promo_code(db, promo_code, user_id, plan_id)
            if discount_percent:
                discount_applied = amount * (discount_percent / Decimal('100'))
                amount = amount - discount_applied
        
        # Determine subscription status based on payment method
        # Fixed: Use UPPERCASE for UserSubscription.status to match SQL schema
        subscription_status = "PENDING" if payment_method == "qr_code" else "ACTIVE"
        payment_status = "pending" if payment_method == "qr_code" else "completed"

        # Create subscription
        subscription = UserSubscription(
            user_id=user_id,
            plan_id=plan_id,
            status=subscription_status,
            billing_cycle=billing_cycle,
            current_period_start=datetime.utcnow() if subscription_status == "ACTIVE" else None,
            current_period_end=(datetime.utcnow() + timedelta(days=30 if billing_cycle == "monthly" else 365)) if subscription_status == "ACTIVE" else None,
            next_billing_date=(datetime.utcnow() + timedelta(days=30 if billing_cycle == "monthly" else 365)) if subscription_status == "ACTIVE" else None,
            subscribed_at=datetime.utcnow()
        )

        db.add(subscription)
        db.flush()

        subscription_id = int(getattr(subscription, 'id', 0))

        # Create payment record
        payment = SubscriptionPayment(
            subscription_id=subscription_id,
            user_id=user_id,
            plan_id=plan_id,
            amount=amount,
            payment_method=payment_method,
            status=payment_status,
            qr_code_shown=(payment_method == "qr_code"),
            created_at=datetime.utcnow()
        )

        # For non-QR payments, mark as paid immediately
        if payment_status == "completed":
            payment.paid_at = datetime.utcnow() # type: ignore[assignment]

        db.add(payment)

        # Update user subscription status (only if active)
        if subscription_status == "ACTIVE":
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                setattr(user, 'current_subscription_id', subscription_id)
                setattr(user, 'subscription_status', "active")
                setattr(user, 'subscription_tier', getattr(plan, 'plan_type', 'standard'))
        
        db.commit()
        db.refresh(subscription)
        db.refresh(payment)
        
        return subscription, payment
    
    # ========================================
    # NEW QR CODE PAYMENT METHODS
    # ========================================
    
    @staticmethod
    def get_qr_code_settings(db: Session) -> Dict[str, str]:
        """Get QR code payment settings"""
        qr_image = db.query(PaymentSetting).filter(
            PaymentSetting.setting_key == "payment_qr_code_image"
        ).first()
        
        instructions = db.query(PaymentSetting).filter(
            PaymentSetting.setting_key == "payment_instructions"
        ).first()
        
        return {
            "qr_code_image_url": getattr(qr_image, 'setting_value', '/uploads/qr/default_payment_qr.png') if qr_image else '/uploads/qr/default_payment_qr.png',
            "payment_instructions": getattr(instructions, 'setting_value', 'Please scan the QR code and enter the reference number from your payment confirmation.') if instructions else 'Please scan the QR code and enter the reference number from your payment confirmation.'
        }
    
    @staticmethod
    def submit_reference_number(
        db: Session,
        payment_id: int,
        user_id: int,
        reference_number: str
    ) -> SubscriptionPayment:
        """
        Submit payment reference number
        
        This updates the payment with the reference number and marks it for admin verification
        """
        # Get payment
        payment = db.query(SubscriptionPayment).filter(
            SubscriptionPayment.id == payment_id,
            SubscriptionPayment.user_id == user_id
        ).first()
        
        if not payment:
            raise ValueError("Payment not found")
        
        # Check if already submitted
        if getattr(payment, 'reference_number', None):
            raise ValueError("Reference number already submitted for this payment")
        
        # Check if payment is pending
        if getattr(payment, 'status', '') != "pending":
            raise ValueError(f"Cannot submit reference number for payment with status: {getattr(payment, 'status', '')}")
        
        # Update payment
        setattr(payment, 'reference_number', reference_number)
        setattr(payment, 'submitted_at', datetime.utcnow())
        
        db.commit()
        db.refresh(payment)
        
        return payment
    
    @staticmethod
    def get_pending_payments(
        db: Session,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict]:
        """Get pending payments for admin verification"""
        payments = db.query(
            SubscriptionPayment,
            User,
            SubscriptionPlan
        ).join(
            User, SubscriptionPayment.user_id == User.id
        ).join(
            SubscriptionPlan, SubscriptionPayment.plan_id == SubscriptionPlan.id
        ).filter(
            SubscriptionPayment.status == "pending",
            SubscriptionPayment.reference_number.isnot(None)
        ).order_by(
            SubscriptionPayment.submitted_at.desc()
        ).limit(limit).offset(offset).all()
        
        result = []
        for payment, user, plan in payments:
            created_at = getattr(payment, 'created_at', datetime.utcnow())
            days_pending = (datetime.utcnow() - created_at).days if created_at else 0
            
            result.append({
                "payment_id": int(getattr(payment, 'id', 0)),
                "user_id": int(getattr(user, 'id', 0)),
                "user_email": str(getattr(user, 'email', '')),
                "user_name": f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip(),
                "plan_name": str(getattr(plan, 'name', '')),
                "amount": Decimal(str(getattr(payment, 'amount', 0))),
                "currency": str(getattr(payment, 'currency', 'PHP')),
                "reference_number": str(getattr(payment, 'reference_number', '')),
                "submitted_at": getattr(payment, 'submitted_at', None),
                "created_at": created_at,
                "days_pending": days_pending
            })
        
        return result
    
    @staticmethod
    def verify_payment(
        db: Session,
        payment_id: int,
        admin_id: int,
        action: str,
        admin_notes: Optional[str] = None,
        rejection_reason: Optional[str] = None
    ) -> SubscriptionPayment:
        """
        Admin verify or reject payment
        
        Args:
            payment_id: Payment ID
            admin_id: Admin user ID
            action: "approve" or "reject"
            admin_notes: Optional admin notes
            rejection_reason: Required if action is "reject"
            
        Returns:
            Updated SubscriptionPayment
        """
        # Get payment
        payment = db.query(SubscriptionPayment).filter(
            SubscriptionPayment.id == payment_id
        ).first()
        
        if not payment:
            raise ValueError("Payment not found")
        
        previous_status = getattr(payment, 'status', 'pending')
        
        if previous_status != "pending":
            raise ValueError(f"Cannot verify payment with status: {previous_status}")
        
        # Update payment based on action
        if action == "approve":
            new_status = "completed"
            setattr(payment, 'status', new_status)
            setattr(payment, 'paid_at', datetime.utcnow())
            
            # Activate subscription
            subscription = db.query(UserSubscription).filter(
                UserSubscription.id == getattr(payment, 'subscription_id', 0)
            ).first()
            
            if subscription:
                setattr(subscription, 'status', 'active')
                setattr(subscription, 'current_period_start', datetime.utcnow())
                
                billing_cycle = getattr(subscription, 'billing_cycle', 'monthly')
                days = 30 if billing_cycle == "monthly" else 365
                setattr(subscription, 'current_period_end', datetime.utcnow() + timedelta(days=days))
                setattr(subscription, 'next_billing_date', datetime.utcnow() + timedelta(days=days))
                
                # Update user
                user = db.query(User).filter(User.id == getattr(payment, 'user_id', 0)).first()
                if user:
                    setattr(user, 'current_subscription_id', getattr(subscription, 'id', 0))
                    setattr(user, 'subscription_status', 'active')
        else:
            new_status = "failed"
            setattr(payment, 'status', new_status)
            setattr(payment, 'rejection_reason', rejection_reason)
            
            # Cancel subscription
            subscription = db.query(UserSubscription).filter(
                UserSubscription.id == getattr(payment, 'subscription_id', 0)
            ).first()
            
            if subscription:
                setattr(subscription, 'status', 'cancelled')
                setattr(subscription, 'cancelled_at', datetime.utcnow())
        
        # Update verification fields
        setattr(payment, 'admin_verified_by', admin_id)
        setattr(payment, 'admin_verified_at', datetime.utcnow())
        setattr(payment, 'admin_notes', admin_notes)
        
        # Create verification log
        log = PaymentVerificationLog(
            payment_id=payment_id,
            admin_id=admin_id,
            action="verified" if action == "approve" else "rejected",
            previous_status=previous_status,
            new_status=new_status,
            notes=admin_notes or rejection_reason
        )
        db.add(log)
        
        db.commit()
        db.refresh(payment)
        
        return payment
    
    @staticmethod
    def get_payment_statistics(db: Session) -> Dict:
        """Get payment statistics for admin dashboard"""
        today = datetime.utcnow().date()
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Count queries
        total_pending = db.query(func.count(SubscriptionPayment.id)).filter(
            SubscriptionPayment.status == "pending"
        ).scalar() or 0
        
        total_completed_today = db.query(func.count(SubscriptionPayment.id)).filter(
            SubscriptionPayment.status == "completed",
            func.date(SubscriptionPayment.paid_at) == today
        ).scalar() or 0
        
        total_completed_this_month = db.query(func.count(SubscriptionPayment.id)).filter(
            SubscriptionPayment.status == "completed",
            SubscriptionPayment.paid_at >= month_start
        ).scalar() or 0
        
        total_failed = db.query(func.count(SubscriptionPayment.id)).filter(
            SubscriptionPayment.status == "failed"
        ).scalar() or 0
        
        # Amount queries
        amount_pending = db.query(func.sum(SubscriptionPayment.amount)).filter(
            SubscriptionPayment.status == "pending"
        ).scalar() or Decimal('0')
        
        amount_completed_today = db.query(func.sum(SubscriptionPayment.amount)).filter(
            SubscriptionPayment.status == "completed",
            func.date(SubscriptionPayment.paid_at) == today
        ).scalar() or Decimal('0')
        
        amount_completed_this_month = db.query(func.sum(SubscriptionPayment.amount)).filter(
            SubscriptionPayment.status == "completed",
            SubscriptionPayment.paid_at >= month_start
        ).scalar() or Decimal('0')
        
        # Average verification time (hours)
        # Using TIMESTAMPDIFF for MySQL compatibility
        try:
            avg_time = db.query(
                func.avg(
                    func.timestampdiff(
                        'hour',
                        SubscriptionPayment.submitted_at,
                        SubscriptionPayment.admin_verified_at
                    )
                )
            ).filter(
                SubscriptionPayment.admin_verified_at.isnot(None),
                SubscriptionPayment.submitted_at.isnot(None)
            ).scalar() or 0.0
        except Exception:
            # Fallback if timestampdiff is not supported
            avg_time = 0.0
        
        return {
            "total_pending": total_pending,
            "total_completed_today": total_completed_today,
            "total_completed_this_month": total_completed_this_month,
            "total_failed": total_failed,
            "total_amount_pending": Decimal(str(amount_pending)),
            "total_amount_completed_today": Decimal(str(amount_completed_today)),
            "total_amount_completed_this_month": Decimal(str(amount_completed_this_month)),
            "average_verification_time_hours": float(avg_time)
        }
    
    # ========================================
    # ORIGINAL CANCEL METHOD (PRESERVED)
    # ========================================
    
    @staticmethod
    def cancel_subscription(db: Session, user_id: int) -> bool:
        """Cancel user's current subscription"""
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        
        if not subscription:
            raise ValueError("No active subscription found")
        
        setattr(subscription, 'status', 'cancelled')
        setattr(subscription, 'cancelled_at', datetime.utcnow())
        setattr(subscription, 'auto_renew', False)
        
        # Update user
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            setattr(user, 'subscription_status', 'cancelled')

        db.commit()

        return True

    # ========================================
    # SUBSCRIPTION USAGE TRACKING (NEW)
    # ========================================

    @staticmethod
    def get_current_usage(db: Session, user_id: int):
        """Get current subscription usage for user"""
        from app.models.subscription import SubscriptionUsage
        from sqlalchemy import desc

        # Get user's current subscription
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        if not subscription:
            return None

        subscription_id = int(getattr(subscription, 'id', 0))

        # Get current usage record (most recent)
        usage = db.query(SubscriptionUsage).filter(
            SubscriptionUsage.user_id == user_id,
            SubscriptionUsage.subscription_id == subscription_id
        ).order_by(desc(SubscriptionUsage.period_start)).first()

        return usage

    @staticmethod
    def get_usage_history(db: Session, user_id: int, limit: int = 12):
        """Get subscription usage history"""
        from app.models.subscription import SubscriptionUsage
        from sqlalchemy import desc

        usage_records = db.query(SubscriptionUsage).filter(
            SubscriptionUsage.user_id == user_id
        ).order_by(desc(SubscriptionUsage.period_start)).limit(limit).all()

        return usage_records

    @staticmethod
    def get_feature_usage(db: Session, user_id: int):
        """Get detailed feature usage breakdown"""
        from app.models.subscription import SubscriptionUsage, SubscriptionFeatureUsage
        from app.models.car import Car

        # Get current subscription
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        if not subscription:
            return {"error": "No active subscription"}

        subscription_id = int(getattr(subscription, 'id', 0))
        plan = getattr(subscription, 'plan', None)

        # Calculate real-time usage from cars table
        # Fixed: Use UPPERCASE for Car.status to match SQL schema
        active_listings = db.query(Car).filter(
            Car.seller_id == user_id,
            Car.status == "ACTIVE"
        ).count()

        featured_listings = db.query(Car).filter(
            Car.seller_id == user_id,
            Car.status == "ACTIVE",
            Car.is_featured == True
        ).count()

        premium_listings = db.query(Car).filter(
            Car.seller_id == user_id,
            Car.status == "ACTIVE",
            Car.is_premium == True
        ).count()

        # Get plan limits (Fixed: use correct attribute names)
        max_active = int(getattr(plan, 'max_listings', 0)) if plan else 0  # Fixed: was max_active_listings
        max_featured = int(getattr(plan, 'max_featured_listings', 0)) if plan else 0
        max_images = int(getattr(plan, 'max_photos_per_listing', 0)) if plan else 0  # Fixed: was max_images_per_listing
        boost_credits = int(getattr(plan, 'boost_credits_monthly', 0)) if plan else 0

        return {
            "active_listings": {
                "used": active_listings,
                "limit": max_active,
                "percentage": round((active_listings / max_active * 100) if max_active > 0 else 0, 1)
            },
            "featured_listings": {
                "used": featured_listings,
                "limit": max_featured,
                "percentage": round((featured_listings / max_featured * 100) if max_featured > 0 else 0, 1)
            },
            "featured_listings_extra": {  # Renamed from premium_listings (doesn't exist in DB)
                "used": premium_listings,
                "limit": 0,  # Not a real limit in the schema
                "percentage": 0
            },
            "images_per_listing": {
                "limit": max_images
            },
            "boost_credits": {
                "remaining": boost_credits,  # Would need boost usage tracking
                "total": boost_credits
            }
        }