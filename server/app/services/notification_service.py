from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.analytics import Notification
from app.models.user import User
from datetime import datetime


class NotificationService:
    """Notification service"""
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        related_id: Optional[int] = None,
        related_type: Optional[str] = None
    ) -> Notification:
        """Create notification"""
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
        
        # TODO: Send push notification, email, SMS based on user preferences
        
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
            query = query.filter(Notification.is_read == False)
        
        return query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> bool:
        """Mark notification as read"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            return False
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        
        db.commit()
        
        return True
    
    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """Mark all notifications as read"""
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
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
        
        if not notification:
            return False
        
        db.delete(notification)
        db.commit()
        
        return True
    
    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications"""
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
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
            related_type="car"
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
            related_type="car"
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
            related_type="inquiry"
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
            related_type="inquiry"
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
            related_type="car"
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
            related_type="subscription"
        )
