"""
===========================================
FILE: app/api/v1/admin.py - PAYMENT VERIFICATION ENDPOINTS
Path: server/app/api/v1/admin.py
PURPOSE: Admin endpoints for QR code payment verification
NEW: Complete admin payment management system
===========================================
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.schemas.subscription import (
    AdminVerifyPaymentRequest, AdminVerifyPaymentResponse,
    PendingPaymentSummary, SubscriptionPaymentDetailedResponse,
    PaymentStatisticsResponse, PaymentSettingResponse, PaymentSettingUpdate,
    PaymentVerificationLogResponse
)
from app.schemas.common import MessageResponse
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.subscription import (
    SubscriptionPayment, PaymentSetting, PaymentVerificationLog,
    SubscriptionPlan
)
from app.services.subscription_service import SubscriptionService
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ========================================
# PAYMENT VERIFICATION ENDPOINTS
# ========================================

@router.get("/payments/pending", response_model=List[PendingPaymentSummary])
async def get_pending_payments(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get list of pending payments requiring verification
    
    Returns list of payments with user details, sorted by submission date
    """
    try:
        pending_payments = SubscriptionService.get_pending_payments(db, limit, offset)
        return [PendingPaymentSummary(**p) for p in pending_payments]
    except Exception as e:
        logger.error(f"Error fetching pending payments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending payments"
        )


@router.get("/payments/{payment_id}", response_model=SubscriptionPaymentDetailedResponse)
async def get_payment_details_admin(
    payment_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed payment information (admin view)"""
    payment = db.query(SubscriptionPayment, User, SubscriptionPlan).join(
        User, SubscriptionPayment.user_id == User.id
    ).join(
        SubscriptionPlan, SubscriptionPayment.plan_id == SubscriptionPlan.id
    ).filter(
        SubscriptionPayment.id == payment_id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    payment_obj, user_obj, plan_obj = payment

    amount = getattr(payment_obj, "amount", Decimal("0"))
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    
    return SubscriptionPaymentDetailedResponse(
        id=int(getattr(payment_obj, 'id', 0)),
        subscription_id=int(getattr(payment_obj, 'subscription_id', 0)),
        user_id=int(getattr(payment_obj, 'user_id', 0)),
        plan_id=int(getattr(payment_obj, 'plan_id', 0)),
        amount=amount,
        currency=str(getattr(payment_obj, 'currency', 'PHP')),
        payment_method=str(getattr(payment_obj, 'payment_method', '')),
        status=str(getattr(payment_obj, 'status', '')),
        reference_number=str(getattr(payment_obj, 'reference_number', '') or ''),
        qr_code_shown=bool(getattr(payment_obj, 'qr_code_shown', False)),
        submitted_at=getattr(payment_obj, 'submitted_at', None),
        admin_verified_by=getattr(payment_obj, 'admin_verified_by', None),
        admin_verified_at=getattr(payment_obj, 'admin_verified_at', None),
        admin_notes=str(getattr(payment_obj, 'admin_notes', '') or ''),
        rejection_reason=str(getattr(payment_obj, 'rejection_reason', '') or ''),
        created_at=getattr(payment_obj, 'created_at', datetime.utcnow()),
        paid_at=getattr(payment_obj, 'paid_at', None),
        user_email=str(getattr(user_obj, 'email', '')),
        user_name=f"{getattr(user_obj, 'first_name', '')} {getattr(user_obj, 'last_name', '')}".strip(),
        plan_name=str(getattr(plan_obj, 'name', ''))
    )


@router.post("/payments/verify", response_model=AdminVerifyPaymentResponse)
async def verify_payment(
    verify_request: AdminVerifyPaymentRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verify or reject a payment
    
    This is the main admin action for QR code payment verification
    """
    try:
        admin_id = int(getattr(current_admin, 'id', 0))
        
        # Get payment with user details before verification
        payment_query = db.query(SubscriptionPayment, User).join(
            User, SubscriptionPayment.user_id == User.id
        ).filter(
            SubscriptionPayment.id == verify_request.payment_id
        ).first()
        
        if not payment_query:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        payment_before, user = payment_query
        previous_status = str(getattr(payment_before, 'status', 'pending'))
        user_email = str(getattr(user, 'email', ''))
        user_name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
        user_id = int(getattr(user, 'id', 0))
        reference_number = str(getattr(payment_before, 'reference_number', ''))
        amount = getattr(payment_before, 'amount', 0)
        
        # Verify payment
        payment = SubscriptionService.verify_payment(
            db,
            payment_id=verify_request.payment_id,
            admin_id=admin_id,
            action=verify_request.action,
            admin_notes=verify_request.admin_notes,
            rejection_reason=verify_request.rejection_reason
        )
        
        new_status = str(getattr(payment, 'status', ''))
        
        # Send email notification to user
        email_sent = False
        try:
            if verify_request.action == "approve":
                # Approved email
                subject = "Payment Verified - Subscription Activated!"
                text_body = f"""
Hello {user_name},

Great news! Your payment has been verified and your subscription is now active.

Payment Details:
- Reference Number: {reference_number}
- Amount: ₱{amount:.2f}
- Status: Approved
- Verified: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

You can now enjoy all the benefits of your subscription plan!

Thank you for choosing Car Marketplace Philippines.

Best regards,
Car Marketplace Philippines Team
"""
                
                # Create notification
                NotificationService.create_notification(
                    db,
                    user_id=user_id,
                    title="Payment Verified - Subscription Active!",
                    message=f"Your payment (Ref: {reference_number}) has been verified. Your subscription is now active!",
                    notification_type="payment_verified",
                    related_id=verify_request.payment_id,
                    related_type="payment"
                )
            else:
                # Rejected email
                subject = "Payment Verification Failed"
                text_body = f"""
Hello {user_name},

Unfortunately, we were unable to verify your payment.

Payment Details:
- Reference Number: {reference_number}
- Amount: ₱{amount:.2f}
- Status: Rejected
- Reason: {verify_request.rejection_reason or 'No reason provided'}

{verify_request.admin_notes or ''}

If you believe this is an error, please contact our support team with your reference number.

Thank you,
Car Marketplace Philippines Team
"""
                
                # Create notification
                NotificationService.create_notification(
                    db,
                    user_id=user_id,
                    title="Payment Verification Failed",
                    message=f"Your payment (Ref: {reference_number}) could not be verified. Reason: {verify_request.rejection_reason}",
                    notification_type="payment_rejected",
                    related_id=verify_request.payment_id,
                    related_type="payment"
                )
            
            email_sent = await EmailService.send_email(
                to_email=user_email,
                subject=subject,
                body=text_body
            )
        except Exception as e:
            logger.error(f"Failed to send user notification email: {e}")
        
        return AdminVerifyPaymentResponse(
            success=True,
            message=f"Payment {verify_request.action}d successfully",
            payment_id=verify_request.payment_id,
            previous_status=previous_status,
            new_status=new_status,
            verified_by=admin_id,
            verified_at=datetime.utcnow(),
            user_email_sent=email_sent
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify payment"
        )


@router.get("/payments/statistics", response_model=PaymentStatisticsResponse)
async def get_payment_statistics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get payment statistics for admin dashboard"""
    try:
        stats = SubscriptionService.get_payment_statistics(db)
        return PaymentStatisticsResponse(**stats)
    except Exception as e:
        logger.error(f"Error fetching payment statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment statistics"
        )


@router.get("/payments/{payment_id}/logs", response_model=List[PaymentVerificationLogResponse])
async def get_payment_logs(
    payment_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get verification logs for a payment"""
    logs = db.query(PaymentVerificationLog, User).join(
        User, PaymentVerificationLog.admin_id == User.id
    ).filter(
        PaymentVerificationLog.payment_id == payment_id
    ).order_by(
        PaymentVerificationLog.created_at.desc()
    ).all()
    
    return [
        PaymentVerificationLogResponse(
            id=int(getattr(log, 'id', 0)),
            payment_id=int(getattr(log, 'payment_id', 0)),
            admin_id=int(getattr(log, 'admin_id', 0)),
            admin_name=f"{getattr(admin, 'first_name', '')} {getattr(admin, 'last_name', '')}".strip(),
            action=str(getattr(log, 'action', '')),
            previous_status=str(getattr(log, 'previous_status', '') or ''),
            new_status=str(getattr(log, 'new_status', '') or ''),
            notes=str(getattr(log, 'notes', '') or ''),
            created_at=getattr(log, 'created_at', datetime.utcnow())
        )
        for log, admin in logs
    ]


# ========================================
# PAYMENT SETTINGS ENDPOINTS
# ========================================

@router.get("/settings/payment", response_model=List[PaymentSettingResponse])
async def get_payment_settings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all payment settings"""
    settings = db.query(PaymentSetting).filter(
        PaymentSetting.is_active == True  # noqa: E712
    ).all()
    
    return [PaymentSettingResponse.model_validate(s) for s in settings]


@router.put("/settings/payment", response_model=PaymentSettingResponse)
async def update_payment_setting(
    setting_update: PaymentSettingUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a payment setting"""
    admin_id = int(getattr(current_admin, 'id', 0))
    
    setting = db.query(PaymentSetting).filter(
        PaymentSetting.setting_key == setting_update.setting_key
    ).first()
    
    if not setting:
        # Create new setting
        setting = PaymentSetting(
            setting_key=setting_update.setting_key,
            setting_value=setting_update.setting_value,
            description=setting_update.description,
            created_by=admin_id,
            updated_by=admin_id
        )
        db.add(setting)
    else:
        # Update existing
        setattr(setting, 'setting_value', setting_update.setting_value)
        if setting_update.description:
            setattr(setting, 'description', setting_update.description)
        setattr(setting, 'updated_by', admin_id)
    
    db.commit()
    db.refresh(setting)
    
    return PaymentSettingResponse.model_validate(setting)


@router.get("/settings/payment/qr-code")
async def get_qr_code_image(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get current QR code image URL"""
    qr_settings = SubscriptionService.get_qr_code_settings(db)
    return {
        "qr_code_image_url": qr_settings["qr_code_image_url"],
        "payment_instructions": qr_settings["payment_instructions"]
    }