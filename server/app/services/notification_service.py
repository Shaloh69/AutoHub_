from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.analytics import Notification
from app.models.user import User
from datetime import datetime
import asyncio
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Notification service with email delivery integration"""

    @staticmethod
    async def send_email_notification(user: User, title: str, message: str, notification_type: str):
        """Send email notification based on type"""
        try:
            from app.services.email_service import EmailService
            from app.config import settings

            # Check if SMTP is configured
            if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
                logger.warning("SMTP not configured - skipping email notification")
                return

            user_email = getattr(user, 'email', None)
            user_name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()

            if not user_email:
                logger.warning(f"No email found for user {getattr(user, 'id', 'unknown')}")
                return

            # Prepare email content based on notification type
            subject = f"AutoHub: {title}"

            # Plain text version
            text_body = f"""
Hello {user_name},

{message}

View your notifications: {settings.FRONTEND_URL}/notifications

Best regards,
AutoHub Team

---
Need help? Contact us at support@autohub.ph
            """.strip()

            # HTML version with modern design
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - AutoHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #EFF6FF 0%, #F3E8FF 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #EFF6FF 0%, #F3E8FF 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid rgba(147, 197, 253, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 48px 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 12px 28px; border-radius: 50px; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                    AutoHub
                                </h1>
                            </div>
                            <p style="margin: 8px 0 0 0; color: #E0E7FF; font-size: 15px; font-weight: 500;">
                                Your Trusted Car Marketplace
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; text-align: center; line-height: 80px; font-size: 40px;">
                                    🔔
                                </div>
                            </div>

                            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700; text-align: center;">
                                {title}
                            </h2>

                            <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.7; text-align: center;">
                                {message}
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 32px 0;">
                                        <a href="{settings.FRONTEND_URL}/notifications"
                                           style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
                                                  color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px;
                                                  font-size: 17px; font-weight: 600; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);">
                                            View All Notifications
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                                Need assistance? We're here to help!
                            </p>
                            <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
                                Contact us at
                                <a href="mailto:support@autohub.ph"
                                   style="color: #3B82F6; text-decoration: none; font-weight: 600;">
                                    support@autohub.ph
                                </a>
                            </p>

                            <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 16px;">
                                <p style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 12px; font-weight: 500;">
                                    © 2024 AutoHub Philippines. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #D1D5DB; font-size: 11px;">
                                    This is an automated message. Please do not reply to this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            """.strip()

            # Send email asynchronously
            await EmailService.send_email(user_email, subject, text_body, html_body)
            logger.info(f"Email notification sent to {user_email} for notification type: {notification_type}")

        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            # Don't fail notification creation if email fails

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        related_id: Optional[int] = None,
        related_type: Optional[str] = None,
        send_email: bool = True
    ) -> Notification:
        """Create notification and send email"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_id=related_id,
            related_type=related_type,
            created_at=datetime.utcnow()
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Send email notification if enabled
        if send_email:
            try:
                # Get user for email
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    # Run async email sending in a separate thread to avoid blocking
                    try:
                        # Try to use existing event loop
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            # If loop is running, create a task
                            asyncio.create_task(
                                NotificationService.send_email_notification(
                                    user, title, message, notification_type
                                )
                            )
                        else:
                            # If no loop running, run it
                            loop.run_until_complete(
                                NotificationService.send_email_notification(
                                    user, title, message, notification_type
                                )
                            )
                    except RuntimeError:
                        # If there's an issue with event loop, use new loop
                        asyncio.run(
                            NotificationService.send_email_notification(
                                user, title, message, notification_type
                            )
                        )
            except Exception as e:
                logger.error(f"Failed to send email for notification: {e}")
                # Continue even if email fails

        return notification

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Notification]:
        """Get user notifications"""
        query = db.query(Notification).filter(Notification.user_id == user_id)

        if unread_only:
            query = query.filter(Notification.is_read == False)  # type: ignore

        return query.order_by(Notification.created_at.desc()).limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> bool:
        """Mark notification as read"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()

        if not notification:  # type: ignore
            return False

        notification.is_read = True  # type: ignore
        notification.read_at = datetime.utcnow()  # type: ignore

        db.commit()

        return True

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """Mark all notifications as read"""
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False  # type: ignore
        ).update({"is_read": True, "read_at": datetime.utcnow()})

        db.commit()

        return count

    @staticmethod
    def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
        """Delete notification"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()

        if not notification:  # type: ignore
            return False

        db.delete(notification)
        db.commit()

        return True

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications"""
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False  # type: ignore
        ).count()

    # Notification templates

    @staticmethod
    def notify_car_approved(db: Session, user_id: int, car_id: int, car_title: str):
        """Notify user that car was approved"""
        return NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Car Listing Approved",
            message=f"Your car listing '{car_title}' has been approved and is now live!",
            notification_type="car_approved",
            related_id=car_id,
            related_type="car",
            send_email=True
        )

    @staticmethod
    def notify_car_rejected(db: Session, user_id: int, car_id: int, car_title: str, reason: str):
        """Notify user that car was rejected"""
        return NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Car Listing Rejected",
            message=f"Your car listing '{car_title}' was rejected. Reason: {reason}",
            notification_type="car_rejected",
            related_id=car_id,
            related_type="car",
            send_email=True
        )

    @staticmethod
    def notify_new_inquiry(db: Session, seller_id: int, car_id: int, buyer_name: str):
        """Notify seller of new inquiry"""
        return NotificationService.create_notification(
            db,
            user_id=seller_id,
            title="New Inquiry",
            message=f"{buyer_name} sent you an inquiry about your car listing",
            notification_type="new_inquiry",
            related_id=car_id,
            related_type="inquiry",
            send_email=True
        )

    @staticmethod
    def notify_inquiry_response(db: Session, buyer_id: int, car_id: int):
        """Notify buyer of inquiry response"""
        return NotificationService.create_notification(
            db,
            user_id=buyer_id,
            title="Inquiry Response",
            message="The seller has responded to your inquiry",
            notification_type="inquiry_response",
            related_id=car_id,
            related_type="inquiry",
            send_email=True
        )

    @staticmethod
    def notify_price_drop(db: Session, user_id: int, car_id: int, car_title: str, old_price: float, new_price: float):
        """Notify user of price drop on favorited car"""
        discount = ((old_price - new_price) / old_price) * 100
        return NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Price Drop Alert",
            message=f"'{car_title}' price dropped by {discount:.0f}%! Now ₱{new_price:,.2f}",
            notification_type="price_drop_alert",
            related_id=car_id,
            related_type="car",
            send_email=True
        )

    @staticmethod
    def notify_subscription_expiring(db: Session, user_id: int, days_left: int):
        """Notify user of expiring subscription"""
        return NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Subscription Expiring Soon",
            message=f"Your subscription will expire in {days_left} days. Renew now to keep your benefits!",
            notification_type="subscription_expiring",
            related_id=user_id,
            related_type="subscription",
            send_email=True
        )

    @staticmethod
    def notify_new_review(db: Session, seller_id: int, buyer_id: int, rating: float):
        """Notify seller of new review"""
        stars = "⭐" * int(rating)
        return NotificationService.create_notification(
            db,
            user_id=seller_id,
            title="New Review Received",
            message=f"You received a new {rating:.1f} star review {stars}. Review is pending admin approval.",
            notification_type="new_review",
            related_id=buyer_id,
            related_type="review",
            send_email=True
        )

    @staticmethod
    def notify_review_approved(db: Session, buyer_id: int, review_id: int):
        """Notify buyer that review was approved"""
        return NotificationService.create_notification(
            db,
            user_id=buyer_id,
            title="Review Approved",
            message="Your review has been approved and is now visible to everyone!",
            notification_type="review_approved",
            related_id=review_id,
            related_type="review",
            send_email=True
        )

    @staticmethod
    def notify_review_rejected(db: Session, buyer_id: int, review_id: int, reason: Optional[str] = None):
        """Notify buyer that review was rejected"""
        message = "Your review was rejected by our moderation team."
        if reason:
            message += f" Reason: {reason}"

        return NotificationService.create_notification(
            db,
            user_id=buyer_id,
            title="Review Rejected",
            message=message,
            notification_type="review_rejected",
            related_id=review_id,
            related_type="review",
            send_email=True
        )

    @staticmethod
    def notify_payment_verified(db: Session, user_id: int, subscription_plan: str, amount: float):
        """Notify user that payment was verified and subscription is active"""
        return NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Payment Verified - Subscription Active",
            message=f"Your payment of ₱{amount:,.2f} for the {subscription_plan} plan has been verified. Your subscription is now active!",
            notification_type="payment_verified",
            related_id=user_id,
            related_type="subscription",
            send_email=True
        )

    @staticmethod
    def notify_payment_pending(db: Session, user_id: int, subscription_plan: str, amount: float):
        """Notify user that payment is pending verification"""
        return NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Payment Pending Verification",
            message=f"We received your payment of ₱{amount:,.2f} for the {subscription_plan} plan. It's currently being verified and will be processed within 24 hours.",
            notification_type="payment_pending",
            related_id=user_id,
            related_type="subscription",
            send_email=True
        )
