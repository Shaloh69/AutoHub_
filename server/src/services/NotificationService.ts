import { Repository, MoreThan, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Notification, NotificationType, NotificationPriority } from '../entities/Notification';
import { User } from '../entities/User';
import { Car } from '../entities/Car';
import { UserSubscription } from '../entities/UserSubscription';

export interface CreateNotificationDto {
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    action_text?: string;
    action_url?: string;
    priority?: NotificationPriority;
    related_car_id?: number;
    related_inquiry_id?: number;
    related_transaction_id?: number;
    related_user_id?: number;
    send_at?: Date;
    expires_at?: Date;
    notification_group?: string;
    metadata?: Record<string, any>;
}

export interface NotificationPreferences {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
}

export class NotificationService {
    private notificationRepository: Repository<Notification>;
    private userRepository: Repository<User>;

    constructor() {
        this.notificationRepository = AppDataSource.getRepository(Notification);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async createNotification(data: CreateNotificationDto): Promise<Notification> {
        // Check if user wants to receive this type of notification
        const user = await this.userRepository.findOne({
            where: { id: data.user_id }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const notification = this.notificationRepository.create({
            ...data,
            priority: data.priority || NotificationPriority.MEDIUM
        });

        const savedNotification = await this.notificationRepository.save(notification);

        // Send appropriate notifications based on user preferences
        if (this.shouldSendNotification(user, data.type)) {
            await this.processNotificationDelivery(savedNotification, user);
        }

        return savedNotification;
    }

    async getUserNotifications(
        userId: number, 
        page: number = 1, 
        limit: number = 20,
        unreadOnly: boolean = false
    ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
        const offset = (page - 1) * limit;

        let queryBuilder = this.notificationRepository
            .createQueryBuilder('notification')
            .where('notification.user_id = :userId', { userId })
            .andWhere('(notification.expires_at IS NULL OR notification.expires_at > :now)', { now: new Date() });

        if (unreadOnly) {
            queryBuilder = queryBuilder.andWhere('notification.is_read = false');
        }

        const [notifications, total] = await queryBuilder
            .orderBy('notification.created_at', 'DESC')
            .limit(limit)
            .offset(offset)
            .getManyAndCount();

        const unreadCount = await this.notificationRepository.count({
            where: {
                user_id: userId,
                is_read: false,
                expires_at: MoreThan(new Date())
            }
        });

        return { notifications, total, unreadCount };
    }

    async markAsRead(notificationId: number, userId: number): Promise<void> {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, user_id: userId }
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        await this.notificationRepository.update(notificationId, {
            is_read: true,
            read_at: new Date()
        });
    }

    async markAllAsRead(userId: number): Promise<void> {
        await this.notificationRepository.update(
            { user_id: userId, is_read: false },
            { is_read: true, read_at: new Date() }
        );
    }

    async deleteNotification(notificationId: number, userId: number): Promise<void> {
        const result = await this.notificationRepository.delete({
            id: notificationId,
            user_id: userId
        });

        if (result.affected === 0) {
            throw new Error('Notification not found');
        }
    }

    // Car-related notifications
    async notifyCarApproved(userId: number, carId: number): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.CAR_APPROVED,
            title: 'Car Listing Approved',
            message: 'Your car listing has been approved and is now live on the platform.',
            action_text: 'View Listing',
            action_url: `/cars/${carId}`,
            priority: NotificationPriority.HIGH,
            related_car_id: carId
        });
    }

    async notifyCarRejected(userId: number, carId: number, reason: string): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.CAR_REJECTED,
            title: 'Car Listing Rejected',
            message: `Your car listing was rejected. Reason: ${reason}`,
            action_text: 'Edit Listing',
            action_url: `/cars/${carId}/edit`,
            priority: NotificationPriority.HIGH,
            related_car_id: carId,
            metadata: { rejection_reason: reason }
        });
    }

    async notifyNewInquiry(sellerId: number, carId: number, inquiryId: number, buyerName: string): Promise<void> {
        await this.createNotification({
            user_id: sellerId,
            type: NotificationType.NEW_INQUIRY,
            title: 'New Inquiry Received',
            message: `${buyerName} is interested in your car listing.`,
            action_text: 'View Inquiry',
            action_url: `/inquiries/${inquiryId}`,
            priority: NotificationPriority.MEDIUM,
            related_car_id: carId,
            related_inquiry_id: inquiryId
        });
    }

    async notifyInquiryResponse(buyerId: number, carId: number, inquiryId: number): Promise<void> {
        await this.createNotification({
            user_id: buyerId,
            type: NotificationType.INQUIRY_RESPONSE,
            title: 'Inquiry Response Received',
            message: 'The seller has responded to your inquiry.',
            action_text: 'View Response',
            action_url: `/inquiries/${inquiryId}`,
            priority: NotificationPriority.MEDIUM,
            related_car_id: carId,
            related_inquiry_id: inquiryId
        });
    }

    async notifyCarSold(userId: number, carId: number): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.CAR_SOLD,
            title: 'Car Sold Successfully',
            message: 'Congratulations! Your car has been sold.',
            action_text: 'View Details',
            action_url: `/cars/${carId}`,
            priority: NotificationPriority.HIGH,
            related_car_id: carId
        });
    }

    // Subscription-related notifications
    async notifySubscriptionCreated(userId: number, subscription: UserSubscription): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.PAYMENT_RECEIVED,
            title: 'Subscription Activated',
            message: `Your ${subscription.plan?.name || 'subscription'} plan is now active.`,
            action_text: 'View Dashboard',
            action_url: '/dashboard',
            priority: NotificationPriority.HIGH
        });
    }

    async notifySubscriptionExpiring(userId: number, subscription: UserSubscription): Promise<void> {
        const daysLeft = Math.ceil((subscription.current_period_end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        await this.createNotification({
            user_id: userId,
            type: NotificationType.SUBSCRIPTION_EXPIRING,
            title: 'Subscription Expiring Soon',
            message: `Your subscription will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
            action_text: 'Renew Now',
            action_url: '/subscription/renew',
            priority: NotificationPriority.HIGH,
            metadata: { days_left: daysLeft }
        });
    }

    async notifySubscriptionExpired(userId: number, subscription: UserSubscription): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.SUBSCRIPTION_EXPIRED,
            title: 'Subscription Expired',
            message: 'Your subscription has expired. Some features may be limited.',
            action_text: 'Renew Subscription',
            action_url: '/subscription',
            priority: NotificationPriority.URGENT
        });
    }

    async notifySubscriptionCancelled(userId: number, subscription: UserSubscription): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.SUBSCRIPTION_EXPIRED,
            title: 'Subscription Cancelled',
            message: 'Your subscription has been cancelled. You can reactivate it anytime.',
            action_text: 'Reactivate',
            action_url: '/subscription',
            priority: NotificationPriority.MEDIUM
        });
    }

    async notifySubscriptionUpgraded(userId: number, subscription: UserSubscription): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.PAYMENT_RECEIVED,
            title: 'Subscription Upgraded',
            message: `Your subscription has been upgraded to ${subscription.plan?.name || 'new plan'}.`,
            action_text: 'View Features',
            action_url: '/dashboard',
            priority: NotificationPriority.HIGH
        });
    }

    async notifyPaymentFailed(userId: number, subscription: UserSubscription): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.PAYMENT_FAILED,
            title: 'Payment Failed',
            message: 'We were unable to process your subscription payment. Please update your payment method.',
            action_text: 'Update Payment',
            action_url: '/subscription/payment',
            priority: NotificationPriority.URGENT
        });
    }

    // Admin notifications
    async notifyAdminNewCarSubmission(car: Car): Promise<void> {
        const admins = await this.userRepository.find({
            where: [
                { role: 'admin' as any },
                { role: 'moderator' as any }
            ]
        });

        for (const admin of admins) {
            await this.createNotification({
                user_id: admin.id,
                type: NotificationType.CAR_NEEDS_REVISION,
                title: 'New Car Submission',
                message: `A new car listing "${car.title}" needs approval.`,
                action_text: 'Review',
                action_url: `/admin/cars/pending`,
                priority: NotificationPriority.MEDIUM,
                related_car_id: car.id
            });
        }
    }

    async notifyListingSuspended(userId: number, carId: number): Promise<void> {
        await this.createNotification({
            user_id: userId,
            type: NotificationType.CAR_EXPIRING,
            title: 'Listing Suspended',
            message: 'Your car listing has been suspended due to subscription expiry.',
            action_text: 'Renew Subscription',
            action_url: '/subscription',
            priority: NotificationPriority.HIGH,
            related_car_id: carId
        });
    }

    // System notifications
    async notifySystemMaintenance(message: string, scheduledFor: Date): Promise<void> {
        const users = await this.userRepository.find({
            where: { is_active: true }
        });

        for (const user of users) {
            await this.createNotification({
                user_id: user.id,
                type: NotificationType.SYSTEM_MAINTENANCE,
                title: 'Scheduled Maintenance',
                message: message,
                priority: NotificationPriority.MEDIUM,
                send_at: new Date(scheduledFor.getTime() - 24 * 60 * 60 * 1000) // 24 hours before
            });
        }
    }

    // Bulk notifications
    async sendBulkNotification(
        userIds: number[], 
        notification: Omit<CreateNotificationDto, 'user_id'>
    ): Promise<void> {
        const notifications = userIds.map(userId => ({
            ...notification,
            user_id: userId
        }));

        await this.notificationRepository.save(notifications);
    }

    // Cleanup expired notifications
    async cleanupExpiredNotifications(): Promise<number> {
        const result = await this.notificationRepository.delete({
            expires_at: LessThan(new Date())
        });

        return result.affected || 0;
    }

    // Helper methods
    private shouldSendNotification(user: User, type: NotificationType): boolean {
        // Check user preferences
        switch (type) {
            case NotificationType.CAR_APPROVED:
            case NotificationType.CAR_REJECTED:
            case NotificationType.NEW_INQUIRY:
            case NotificationType.INQUIRY_RESPONSE:
                return user.email_notifications;
            
            case NotificationType.PAYMENT_RECEIVED:
            case NotificationType.PAYMENT_FAILED:
            case NotificationType.SUBSCRIPTION_EXPIRING:
            case NotificationType.SUBSCRIPTION_EXPIRED:
                return true; // Always send payment/subscription notifications
            
            default:
                return user.email_notifications;
        }
    }

    private async processNotificationDelivery(notification: Notification, user: User): Promise<void> {
        try {
            // Send push notification
            if (user.push_notifications && notification.should_send_push) {
                await this.sendPushNotification(notification, user);
            }

            // Send email notification for high priority items
            if (user.email_notifications && 
                [NotificationPriority.HIGH, NotificationPriority.URGENT].includes(notification.priority)) {
                await this.sendEmailNotification(notification, user);
            }

            // Send SMS for urgent notifications
            if (user.sms_notifications && 
                notification.priority === NotificationPriority.URGENT && 
                user.phone) {
                await this.sendSMSNotification(notification, user);
            }
        } catch (error) {
            console.error('Error processing notification delivery:', error);
        }
    }

    private async sendPushNotification(notification: Notification, user: User): Promise<void> {
        // Implement push notification logic (Firebase, etc.)
        console.log(`Push notification sent to ${user.email}: ${notification.title}`);
        
        await this.notificationRepository.update(notification.id, {
            is_push_sent: true
        });
    }

    private async sendEmailNotification(notification: Notification, user: User): Promise<void> {
        // Implement email notification logic (SendGrid, AWS SES, etc.)
        console.log(`Email notification sent to ${user.email}: ${notification.title}`);
        
        await this.notificationRepository.update(notification.id, {
            is_email_sent: true
        });
    }

    private async sendSMSNotification(notification: Notification, user: User): Promise<void> {
        // Implement SMS notification logic (Twilio, etc.)
        console.log(`SMS notification sent to ${user.phone}: ${notification.title}`);
        
        await this.notificationRepository.update(notification.id, {
            is_sms_sent: true
        });
    }

    async getNotificationStats(userId: number): Promise<any> {
        const total = await this.notificationRepository.count({
            where: { user_id: userId }
        });

        const unread = await this.notificationRepository.count({
            where: { user_id: userId, is_read: false }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCount = await this.notificationRepository.count({
            where: {
                user_id: userId,
                created_at: MoreThan(today)
            }
        });

        return {
            total,
            unread,
            today: todayCount,
            read_percentage: total > 0 ? Math.round(((total - unread) / total) * 100) : 0
        };
    }
}