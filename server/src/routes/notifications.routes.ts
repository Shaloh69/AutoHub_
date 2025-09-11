

// src/routes/notifications.routes.ts
import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateToken, rateLimiter } from '../middleware/auth.middleware';

const notificationRouter = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
notificationRouter.use(authenticateToken);

// Apply rate limiting
const notificationRateLimit = rateLimiter(50, 60 * 1000); // 50 requests per minute

// Notification management
notificationRouter.get('/', notificationController.getUserNotifications);
notificationRouter.get('/unread', notificationController.getUnreadNotifications);
notificationRouter.post('/:id/read', notificationController.markAsRead);
notificationRouter.post('/read-all', notificationController.markAllAsRead);
notificationRouter.delete('/:id', notificationController.deleteNotification);
notificationRouter.get('/stats', notificationController.getNotificationStats);

export default notificationRouter;