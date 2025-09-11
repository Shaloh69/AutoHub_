import { Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { AuthRequest } from '../middleware/auth.middleware';

export class NotificationController {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    getUserNotifications = async (req: AuthRequest, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const unreadOnly = req.query.unread_only === 'true';

            const result = await this.notificationService.getUserNotifications(
                req.userId!,
                page,
                limit,
                unreadOnly
            );

            res.json({
                message: 'Notifications retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                error: 'Failed to retrieve notifications'
            });
        }
    };

    getUnreadNotifications = async (req: AuthRequest, res: Response) => {
        try {
            const result = await this.notificationService.getUserNotifications(
                req.userId!,
                1,
                50,
                true
            );

            res.json({
                message: 'Unread notifications retrieved successfully',
                data: {
                    notifications: result.notifications,
                    count: result.unreadCount
                }
            });
        } catch (error) {
            console.error('Get unread notifications error:', error);
            res.status(500).json({
                error: 'Failed to retrieve unread notifications'
            });
        }
    };

    markAsRead = async (req: AuthRequest, res: Response) => {
        try {
            const notificationId = parseInt(req.params.id);

            if (isNaN(notificationId)) {
                return res.status(400).json({
                    error: 'Invalid notification ID'
                });
            }

            await this.notificationService.markAsRead(notificationId, req.userId!);

            res.json({
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            if (error.message === 'Notification not found') {
                res.status(404).json({
                    error: 'Notification not found'
                });
            } else {
                res.status(500).json({
                    error: 'Failed to mark notification as read'
                });
            }
        }
    };

    markAllAsRead = async (req: AuthRequest, res: Response) => {
        try {
            await this.notificationService.markAllAsRead(req.userId!);

            res.json({
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({
                error: 'Failed to mark all notifications as read'
            });
        }
    };

    deleteNotification = async (req: AuthRequest, res: Response) => {
        try {
            const notificationId = parseInt(req.params.id);

            if (isNaN(notificationId)) {
                return res.status(400).json({
                    error: 'Invalid notification ID'
                });
            }

            await this.notificationService.deleteNotification(notificationId, req.userId!);

            res.json({
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            console.error('Delete notification error:', error);
            if (error.message === 'Notification not found') {
                res.status(404).json({
                    error: 'Notification not found'
                });
            } else {
                res.status(500).json({
                    error: 'Failed to delete notification'
                });
            }
        }
    };

    getNotificationStats = async (req: AuthRequest, res: Response) => {
        try {
            const stats = await this.notificationService.getNotificationStats(req.userId!);

            res.json({
                message: 'Notification stats retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Get notification stats error:', error);
            res.status(500).json({
                error: 'Failed to retrieve notification stats'
            });
        }
    };
}



