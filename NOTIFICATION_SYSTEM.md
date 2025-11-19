# AutoHub Notification System - Complete Implementation Guide

## 🎉 Overview

The AutoHub notification system is now **fully functional** with integrated email delivery! Users receive both in-app notifications and email alerts for important events.

---

## ✅ What's Implemented

### Backend Features
- ✅ **Database notifications** - All notifications stored in database
- ✅ **Email delivery** - Automatic email sending for all notification types
- ✅ **Read/Unread tracking** - Mark notifications as read/unread
- ✅ **Delete functionality** - Users can delete notifications
- ✅ **Notification templates** - Pre-built templates for all event types
- ✅ **Async email sending** - Non-blocking email delivery
- ✅ **Error handling** - Graceful fallback if email fails
- ✅ **SMTP configuration check** - Skips email if SMTP not configured

### Frontend Features
- ✅ **Notification dropdown** - Bell icon with unread count badge
- ✅ **Notifications page** - Full page view with tabs (Unread/All)
- ✅ **Real-time updates** - Fetches notifications on mount
- ✅ **Mark as read** - Single and bulk marking
- ✅ **Delete notifications** - Remove unwanted notifications
- ✅ **Beautiful UI** - Modern, responsive design with gradients
- ✅ **Type safety** - Full TypeScript support with camelCase conversion

---

## 📋 Notification Types

The system supports the following notification types:

| Type | Email Sent | Trigger |
|------|-----------|---------|
| **car_approved** | ✅ Yes | Admin approves car listing |
| **car_rejected** | ✅ Yes | Admin rejects car listing |
| **new_inquiry** | ✅ Yes | Buyer sends inquiry to seller |
| **inquiry_response** | ✅ Yes | Seller responds to buyer inquiry |
| **price_drop_alert** | ✅ Yes | Favorited car price drops |
| **subscription_expiring** | ✅ Yes | Subscription nearing expiration |
| **new_review** | ✅ Yes | Seller receives new review |
| **review_approved** | ✅ Yes | User's review is approved |
| **review_rejected** | ✅ Yes | User's review is rejected |
| **payment_verified** | ✅ Yes | Payment confirmed, subscription active |
| **payment_pending** | ✅ Yes | Payment received, awaiting verification |

---

## 🔧 Configuration

### 1. Backend Setup (REQUIRED for Email)

Create `/server/.env` file with SMTP credentials:

```env
# Email/SMTP Configuration (REQUIRED for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM_EMAIL=noreply@autohub.ph
SMTP_FROM_NAME=AutoHub
SMTP_START_TLS=True
SMTP_USE_TLS=True

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### 2. Frontend Setup (Optional)

Create `/client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 🚀 Usage

### Backend - Creating Notifications

```python
from app.services.notification_service import NotificationService

# Car approved notification (sends email automatically)
NotificationService.notify_car_approved(
    db=db,
    user_id=seller_id,
    car_id=car_id,
    car_title="2020 Toyota Fortuner"
)

# Custom notification with email
NotificationService.create_notification(
    db=db,
    user_id=user_id,
    title="Custom Notification",
    message="This is a custom message",
    notification_type="custom",
    send_email=True  # Set to False to skip email
)

# Custom notification without email
NotificationService.create_notification(
    db=db,
    user_id=user_id,
    title="Silent Notification",
    message="This won't send an email",
    notification_type="info",
    send_email=False
)
```

### Frontend - Using Notifications

```tsx
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { apiService } from '@/services/api';

// In your navigation/header
<NotificationDropdown />

// Fetch notifications programmatically
const notifications = await apiService.getNotifications();
const unreadOnly = await apiService.getUnreadNotifications();

// Mark as read
await apiService.markNotificationAsRead(notificationId);

// Mark all as read
await apiService.markAllNotificationsAsRead();

// Delete notification
await apiService.deleteNotification(notificationId);

// Get unread count
const { data } = await apiService.getUnreadCount();
console.log(data.unread_count);
```

---

## 📡 API Endpoints

### GET /api/v1/users/notifications
Get user notifications with optional filtering

**Query Parameters:**
- `unread_only` (boolean): Filter unread only
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Items per page (default: 20, max: 100)

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 123,
    "title": "Car Listing Approved",
    "message": "Your car listing 'Toyota Fortuner' has been approved!",
    "notification_type": "car_approved",
    "related_id": 456,
    "related_type": "car",
    "is_read": false,
    "read_at": null,
    "created_at": "2024-01-15T10:30:00"
  }
]
```

### GET /api/v1/users/notifications/unread-count
Get count of unread notifications

**Response:**
```json
{
  "count": 5,
  "unread_count": 5
}
```

### PUT /api/v1/users/notifications/{notification_id}
Mark notification as read

**Response:**
```json
{
  "message": "Notification marked as read",
  "success": true
}
```

### POST /api/v1/users/notifications/mark-all-read
Mark all notifications as read

**Response:**
```json
{
  "message": "All notifications marked as read",
  "success": true
}
```

### DELETE /api/v1/users/notifications/{notification_id}
Delete notification

**Response:**
```json
{
  "message": "Notification deleted successfully",
  "success": true
}
```

---

## 🎨 Email Design

All notification emails feature:
- **Modern gradient design** - Beautiful blue-purple gradients
- **Responsive layout** - Works on all devices
- **Plain text fallback** - For email clients that don't support HTML
- **Call-to-action buttons** - Direct links to relevant pages
- **Branded header** - AutoHub logo and branding
- **Professional footer** - Contact info and legal text

### Email Template Example

```html
<!-- Beautiful gradient header with AutoHub branding -->
<header style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)">
  <h1>AutoHub</h1>
</header>

<!-- Content with icon -->
<main>
  <div class="icon">🔔</div>
  <h2>Notification Title</h2>
  <p>Your notification message here...</p>
  <button>View All Notifications</button>
</main>

<!-- Professional footer -->
<footer>
  <p>Need help? Contact support@autohub.ph</p>
  <p>© 2024 AutoHub Philippines</p>
</footer>
```

---

## 🔍 Technical Details

### Event Loop Handling

The notification system uses smart async handling:

```python
# Tries to use existing event loop
loop = asyncio.get_event_loop()
if loop.is_running():
    asyncio.create_task(send_email_notification(...))
else:
    loop.run_until_complete(send_email_notification(...))
```

### Error Handling

```python
try:
    # Send email
    await EmailService.send_email(...)
    logger.info(f"Email sent to {user_email}")
except Exception as e:
    logger.error(f"Failed to send email: {e}")
    # Notification still created in database
```

### Frontend Type Transformation

Backend returns snake_case, frontend uses camelCase:

```typescript
// Automatic transformation in API service
private transformNotification(notification: any): Notification {
  return {
    id: notification.id,
    userId: notification.user_id,
    isRead: notification.is_read,
    createdAt: notification.created_at,
    // ... etc
  };
}
```

---

## 🧪 Testing

### Test Email Sending

```python
# Test in Python shell or create a test endpoint
from app.services.notification_service import NotificationService
from app.database import SessionLocal

db = SessionLocal()

# Create test notification (will send email if SMTP configured)
NotificationService.notify_car_approved(
    db=db,
    user_id=1,  # Your test user ID
    car_id=1,
    car_title="Test Car"
)

db.close()
```

### Test Frontend Components

1. **Notification Dropdown**
   - Click bell icon in navigation
   - Should show unread count badge
   - Lists last 10 notifications
   - Click "Mark all read" button
   - Click "View All Notifications"

2. **Notifications Page** (`/notifications`)
   - View "Unread" tab
   - View "All" tab
   - Mark individual as read
   - Delete notifications

---

## 📊 Database Schema

```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    related_id INT,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_created (created_at)
);
```

---

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration**
   ```bash
   # In server directory
   cat .env | grep SMTP
   ```

2. **Check Logs**
   ```bash
   # Look for email errors
   tail -f logs/app.log | grep -i email
   ```

3. **Test SMTP Connection**
   ```python
   import aiosmtplib
   from app.config import settings

   # Test connection
   async def test_smtp():
       try:
           await aiosmtplib.send(
               message,
               hostname=settings.SMTP_HOST,
               port=settings.SMTP_PORT,
               username=settings.SMTP_USERNAME,
               password=settings.SMTP_PASSWORD,
           )
           print("✅ SMTP connection successful!")
       except Exception as e:
           print(f"❌ SMTP error: {e}")
   ```

### Frontend Issues

1. **Notifications Not Loading**
   - Check browser console for errors
   - Verify API_BASE_URL is correct
   - Check authentication token

2. **Type Errors**
   - Run `npm run build` to check for TypeScript errors
   - Ensure types match between frontend/backend

---

## 🎯 Best Practices

### Creating Notifications

```python
# ✅ DO: Use template methods
NotificationService.notify_car_approved(db, user_id, car_id, car_title)

# ✅ DO: Add context with related_id and related_type
NotificationService.create_notification(
    db,
    user_id=user_id,
    title="New Message",
    message="You have a new message",
    notification_type="message",
    related_id=message_id,
    related_type="message",
    send_email=True
)

# ❌ DON'T: Create bare notifications without context
NotificationService.create_notification(
    db,
    user_id=user_id,
    title="Something happened",
    message="Check the app",
    notification_type="generic"
)
```

### Frontend Implementation

```tsx
// ✅ DO: Use the NotificationDropdown component
import { NotificationDropdown } from '@/components/NotificationDropdown';
<NotificationDropdown />

// ✅ DO: Handle loading and error states
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

try {
  setLoading(true);
  const notifications = await apiService.getNotifications();
  setNotifications(notifications.data);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}

// ❌ DON'T: Fetch notifications on every render
useEffect(() => {
  fetchNotifications(); // Missing dependency array!
});
```

---

## 🔮 Future Enhancements

Potential improvements for the notification system:

1. **Real-time Notifications** - WebSocket integration for instant updates
2. **Push Notifications** - Browser push notifications
3. **SMS Notifications** - SMS delivery via Twilio/Semaphore
4. **Notification Preferences** - Let users choose notification types
5. **Email Digest** - Daily/weekly summary emails
6. **Rich Notifications** - Include images, action buttons
7. **Notification Analytics** - Track open rates, click-through rates
8. **Notification Scheduling** - Send at optimal times

---

## 📝 Summary of Changes

### Backend Changes
1. ✅ Fixed notification API endpoints to match frontend expectations
2. ✅ Added DELETE endpoint for notifications
3. ✅ Integrated EmailService into NotificationService
4. ✅ Added async email sending with proper event loop handling
5. ✅ Added logging for email delivery status
6. ✅ Added SMTP configuration check
7. ✅ Created notification templates for payment events

### Frontend Changes
1. ✅ Updated Notification type to support both snake_case and camelCase
2. ✅ Added transformNotification method in API service
3. ✅ Added getUnreadNotifications method
4. ✅ Fixed type mismatches between backend and frontend
5. ✅ Updated notification components to use correct types

---

## 🎓 Example Integration

### Admin Dashboard - Car Approval

```python
# server/app/api/v1/admin.py

@router.put("/cars/{car_id}/approve")
async def approve_car(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    car = db.query(Car).filter(Car.id == car_id).first()

    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    # Update car status
    car.status = "ACTIVE"
    db.commit()

    # Send notification with email
    NotificationService.notify_car_approved(
        db=db,
        user_id=car.seller_id,
        car_id=car.id,
        car_title=f"{car.year} {car.brand_name} {car.model_name}"
    )

    return {"message": "Car approved and seller notified"}
```

### Payment Verification

```python
# server/app/api/v1/admin.py

@router.post("/subscriptions/{transaction_id}/verify")
async def verify_payment(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    # Verify payment
    transaction.status = "VERIFIED"
    transaction.verified_at = datetime.utcnow()
    transaction.verified_by = current_user.id

    # Activate subscription
    user = transaction.user
    user.subscription_status = "ACTIVE"

    db.commit()

    # Send notification with email
    NotificationService.notify_payment_verified(
        db=db,
        user_id=user.id,
        subscription_plan=transaction.plan_name,
        amount=transaction.amount
    )

    return {"message": "Payment verified and user notified"}
```

---

## 📞 Support

For questions or issues with the notification system:

- **Developer**: Check logs in `logs/app.log`
- **SMTP Issues**: Verify credentials and test connection
- **Frontend Issues**: Check browser console for errors
- **Email**: support@autohub.ph

---

**Status**: ✅ **FULLY IMPLEMENTED AND TESTED**

Last Updated: 2024-01-19
