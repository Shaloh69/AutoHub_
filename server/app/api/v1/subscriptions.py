"""
===========================================
FILE: app/api/v1/subscriptions.py - UPDATED WITH QR CODE PAYMENT
Path: server/app/api/v1/subscriptions.py
ADDED: QR code payment endpoints, reference number submission
PRESERVED: All original endpoints
===========================================
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime
from app.database import get_db
from app.schemas.subscription import (
    # Original schemas
    SubscriptionPlanResponse, SubscriptionCreate, UserSubscriptionResponse,
    SubscriptionUsageResponse, PromoCodeValidation, PromoCodeResponse,
    SubscriptionPaymentResponse,
    # New QR code schemas
    QRCodePaymentResponse, ReferenceNumberSubmit, ReferenceNumberSubmitResponse,
    SubscriptionPaymentDetailedResponse
)
from app.schemas.common import MessageResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subscription import SubscriptionPayment, PaymentSetting
from app.services.subscription_service import SubscriptionService
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ========================================
# ORIGINAL ENDPOINTS (PRESERVED)
# ========================================

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans"""
    plans = SubscriptionService.get_all_plans(db)
    return [SubscriptionPlanResponse.model_validate(p) for p in plans]


@router.get("/current", response_model=Optional[UserSubscriptionResponse])
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current subscription"""
    user_id = int(getattr(current_user, 'id', 0))
    subscription = SubscriptionService.get_user_subscription(db, user_id)

    if not subscription:
        return None

    return UserSubscriptionResponse.model_validate(subscription)


@router.post("/cancel", response_model=MessageResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    try:
        user_id = int(getattr(current_user, 'id', 0))
        SubscriptionService.cancel_subscription(db, user_id)
        
        return MessageResponse(
            message="Subscription cancelled successfully",
            success=True
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/validate-promo", response_model=PromoCodeResponse)
async def validate_promo_code(
    promo_data: PromoCodeValidation,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate promo code"""
    user_id = int(getattr(current_user, 'id', 0))
    discount = SubscriptionService.validate_promo_code(db, promo_data.code, user_id)
    
    if discount:
        return PromoCodeResponse(
            valid=True,
            code=promo_data.code,
            discount_type="percentage",
            discount_value=discount,
            message=f"Valid promo code! {discount}% discount applied"
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
    user_id = int(getattr(current_user, 'id', 0))
    
    payments = db.query(SubscriptionPayment).filter(
        SubscriptionPayment.user_id == user_id
    ).order_by(SubscriptionPayment.created_at.desc()).all()
    
    return [
        {
            "id": int(getattr(p, 'id', 0)),
            "amount": float(getattr(p, 'amount', 0)),
            "currency_id": int(getattr(p, 'currency_id', 1)),
            "payment_method": str(getattr(p, 'payment_method', '')),
            "status": str(getattr(p, 'status', '')),
            "reference_number": str(getattr(p, 'reference_number', '') or ''),
            "submitted_at": getattr(p, 'submitted_at', None),
            "admin_verified_at": getattr(p, 'admin_verified_at', None),
            "created_at": getattr(p, 'created_at', None)
        }
        for p in payments
    ]


@router.post("/upgrade")
async def upgrade_subscription(
    plan_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upgrade to a higher plan"""
    user_id = int(getattr(current_user, 'id', 0))

    # Cancel current subscription
    try:
        SubscriptionService.cancel_subscription(db, user_id)
    except:
        pass

    # Subscribe to new plan
    try:
        subscription, payment = SubscriptionService.subscribe(
            db,
            user_id=user_id,
            plan_id=plan_id,
            billing_cycle="monthly",
            payment_method="qr_code"
        )

        # Get QR code settings
        qr_settings = SubscriptionService.get_qr_code_settings(db)
        
        return {
            "message": "Subscription upgrade initiated. Please complete payment.",
            "subscription": UserSubscriptionResponse.model_validate(subscription),
            "payment": {
                "payment_id": int(getattr(payment, 'id', 0)),
                "subscription_id": int(getattr(subscription, 'id', 0)),
                "amount": float(getattr(payment, 'amount', 0)),
                "currency": 'PHP',
                "status": str(getattr(payment, 'status', 'pending')),
                "qr_code_url": qr_settings["qr_code_image_url"],
                "instructions": qr_settings["payment_instructions"],
                "created_at": getattr(payment, 'created_at', datetime.utcnow())
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ========================================
# NEW QR CODE PAYMENT ENDPOINTS
# ========================================

@router.post("/subscribe", response_model=QRCodePaymentResponse, status_code=status.HTTP_201_CREATED)
async def subscribe_to_plan(
    subscription_data: SubscriptionCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Subscribe to a plan with QR code payment

    UPDATED: Now returns QR code image and payment instructions for QR code payments
    """
    try:
        user_id = int(getattr(current_user, 'id', 0))

        # Create subscription and payment
        subscription, payment = SubscriptionService.subscribe(
            db,
            user_id=user_id,
            plan_id=subscription_data.plan_id,
            billing_cycle=subscription_data.billing_cycle,
            payment_method=subscription_data.payment_method,
            promo_code=subscription_data.promo_code
        )

        # For QR code payments, return QR code information
        if subscription_data.payment_method == "qr_code":
            qr_settings = SubscriptionService.get_qr_code_settings(db)
            
            # Send notification to user
            try:
                NotificationService.create_notification(
                    db,
                    user_id=user_id,
                    title="Subscription Payment Pending",
                    message="Please scan the QR code and submit your payment reference number to activate your subscription.",
                    notification_type="subscription_pending",
                    related_id=int(getattr(payment, 'id', 0)),
                    related_type="payment"
                )
            except Exception as e:
                logger.error(f"Failed to create notification: {e}")
            
            return QRCodePaymentResponse(
                payment_id=int(getattr(payment, 'id', 0)),
                subscription_id=int(getattr(subscription, 'id', 0)),
                amount=Decimal(str(getattr(payment, 'amount', 0))),
                currency='PHP',
                qr_code_url=qr_settings["qr_code_image_url"],
                instructions=qr_settings["payment_instructions"],
                status=str(getattr(payment, 'status', 'pending')),
                created_at=getattr(payment, 'created_at', datetime.utcnow())
            )
        else:
            # For other payment methods, return standard response
            return QRCodePaymentResponse(
                payment_id=int(getattr(payment, 'id', 0)),
                subscription_id=int(getattr(subscription, 'id', 0)),
                amount=Decimal(str(getattr(payment, 'amount', 0))),
                currency='PHP',
                qr_code_url="",
                instructions="Payment completed",
                status=str(getattr(payment, 'status', 'completed')),
                created_at=getattr(payment, 'created_at', datetime.utcnow())
            )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/submit-reference", response_model=ReferenceNumberSubmitResponse)
async def submit_payment_reference(
    reference_data: ReferenceNumberSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit payment reference number after making payment via QR code
    
    This endpoint is called after the user scans the QR code, makes payment, 
    and receives a reference number from their payment provider.
    """
    try:
        user_id = int(getattr(current_user, 'id', 0))
        user_email = str(getattr(current_user, 'email', ''))
        user_name = f"{getattr(current_user, 'first_name', '')} {getattr(current_user, 'last_name', '')}".strip()
        
        # Submit reference number
        payment = SubscriptionService.submit_reference_number(
            db,
            payment_id=reference_data.payment_id,
            user_id=user_id,
            reference_number=reference_data.reference_number
        )
        
        # Send email notification to user (confirmation)
        email_sent_user = False
        try:
            subject = "Payment Reference Number Received - Car Marketplace PH"
            text_body = f"""
Hello {user_name},

We have received your payment reference number: {reference_data.reference_number}

Your payment is currently being verified by our admin team. You will receive a confirmation email once the payment is verified.

Payment Details:
- Amount: ₱{getattr(payment, 'amount', 0):.2f}
- Reference Number: {reference_data.reference_number}
- Submitted: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Thank you for your patience!

Car Marketplace Philippines Team
"""
            email_sent_user = await EmailService.send_email(
                to_email=user_email,
                subject=subject,
                body=text_body
            )
        except Exception as e:
            logger.error(f"Failed to send user confirmation email: {e}")
        
        # Send email notification to admin
        try:
            admin_email_setting = db.query(PaymentSetting).filter(
                PaymentSetting.setting_key == "admin_payment_notification_email"
            ).first()
            admin_email = getattr(admin_email_setting, 'setting_value', 'admin@carmarketplace.ph') if admin_email_setting else 'admin@carmarketplace.ph'
            
            subject = f"New Payment Verification Required - Ref: {reference_data.reference_number}"
            text_body = f"""
New payment verification required:

User: {user_name} ({user_email})
Amount: ₱{getattr(payment, 'amount', 0):.2f}
Reference Number: {reference_data.reference_number}
Payment ID: {reference_data.payment_id}
Submitted: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Please log in to the admin panel to verify this payment.
"""
            await EmailService.send_email(
                to_email=admin_email,
                subject=subject,
                body=text_body
            )
        except Exception as e:
            logger.error(f"Failed to send admin notification email: {e}")
        
        # Create notification for user
        try:
            NotificationService.create_notification(
                db,
                user_id=user_id,
                title="Payment Reference Submitted",
                message=f"Your payment reference number {reference_data.reference_number} has been submitted for verification. You will be notified once verified.",
                notification_type="payment_submitted",
                related_id=reference_data.payment_id,
                related_type="payment"
            )
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
        
        return ReferenceNumberSubmitResponse(
            success=True,
            message="Reference number submitted successfully. Your payment will be verified by our admin team.",
            payment_id=reference_data.payment_id,
            status=str(getattr(payment, 'status', 'pending')),
            submitted_at=getattr(payment, 'submitted_at', datetime.utcnow()),
            email_sent=email_sent_user
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error submitting reference number: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit reference number"
        )


@router.get("/payment/{payment_id}", response_model=SubscriptionPaymentDetailedResponse)
async def get_payment_details(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed payment information"""
    user_id = int(getattr(current_user, 'id', 0))
    
    payment = db.query(SubscriptionPayment).filter(
        SubscriptionPayment.id == payment_id,
        SubscriptionPayment.user_id == user_id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return SubscriptionPaymentDetailedResponse(
        id=int(getattr(payment, 'id', 0)),
        subscription_id=int(getattr(payment, 'subscription_id', 0)),
        user_id=int(getattr(payment, 'user_id', 0)),
        plan_id=int(getattr(payment, 'plan_id', 0)),
        amount=Decimal(str(getattr(payment, 'amount', 0))),
        currency=str(getattr(payment, 'currency', 'PHP')),
        payment_method=str(getattr(payment, 'payment_method', '')),
        status=str(getattr(payment, 'status', '')),
        reference_number=str(getattr(payment, 'reference_number', '') or ''),
        qr_code_shown=bool(getattr(payment, 'qr_code_shown', False)),
        submitted_at=getattr(payment, 'submitted_at', None),
        admin_verified_by=getattr(payment, 'admin_verified_by', None),
        admin_verified_at=getattr(payment, 'admin_verified_at', None),
        admin_notes=str(getattr(payment, 'admin_notes', '') or ''),
        rejection_reason=str(getattr(payment, 'rejection_reason', '') or ''),
        created_at=getattr(payment, 'created_at', datetime.utcnow()),
        paid_at=getattr(payment, 'paid_at', None)
    )


@router.get("/qr-code", response_model=Dict)
async def get_qr_code_settings(request: Request, db: Session = Depends(get_db)):
    """
    Get QR code payment settings (GCash QR code image and instructions)

    Returns the raw QR code relative path and payment instructions for frontend URL handling
    """
    try:
        # Get raw settings from database (not constructed URLs)
        qr_image = db.query(PaymentSetting).filter(
            PaymentSetting.setting_key == "payment_qr_code_image"
        ).first()

        instructions = db.query(PaymentSetting).filter(
            PaymentSetting.setting_key == "payment_instructions"
        ).first()

        # Get the raw path value (return None if no QR code uploaded yet)
        qr_code_path = None
        if qr_image:
            setting_value = getattr(qr_image, 'setting_value', None)
            # Only set if we have a valid path
            if setting_value and setting_value.strip():
                qr_code_path = setting_value

        instructions_text = getattr(instructions, 'setting_value', 'Please scan the QR code and enter the reference number from your payment confirmation.') if instructions else 'Please scan the QR code and enter the reference number from your payment confirmation.'

        logger.info(f"QR Code settings - Path: {qr_code_path}, Instructions length: {len(instructions_text)}")

        return {
            "success": True,
            "data": {
                "qr_code_url": qr_code_path,  # Raw relative path or None
                "instructions": instructions_text
            }
        }
    except Exception as e:
        logger.error(f"Error getting QR code settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve QR code settings"
        )


# ========================================
# SUBSCRIPTION USAGE ENDPOINTS (NEW)
# ========================================

@router.get("/usage", response_model=SubscriptionUsageResponse)
async def get_subscription_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current subscription usage for the logged-in user

    Returns usage metrics for the current billing period.
    """
    user_id = int(getattr(current_user, 'id', 0))
    usage = SubscriptionService.get_current_usage(db, user_id)

    if not usage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No usage data found. You may not have an active subscription."
        )

    return SubscriptionUsageResponse.model_validate(usage)


@router.get("/usage/history", response_model=List[SubscriptionUsageResponse])
async def get_subscription_usage_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 12
):
    """
    Get subscription usage history

    Returns past usage records for analysis and tracking.
    """
    user_id = int(getattr(current_user, 'id', 0))
    usage_history = SubscriptionService.get_usage_history(db, user_id, limit)

    return [SubscriptionUsageResponse.model_validate(u) for u in usage_history]


@router.get("/features/usage")
async def get_feature_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed feature usage breakdown

    Shows usage stats for each subscription feature.
    """
    user_id = int(getattr(current_user, 'id', 0))
    feature_usage = SubscriptionService.get_feature_usage(db, user_id)

    return feature_usage