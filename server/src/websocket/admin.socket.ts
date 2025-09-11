import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Car, CarStatus, ApprovalStatus } from '../entities/Car';
import { User, UserRole } from '../entities/User';
import { UserSubscription } from '../entities/UserSubscription';
import { Notification } from '../entities/Notification';

interface AdminSocket extends Socket {
    data: {
        user: {
            userId: number;
            email: string;
            role: UserRole;
        };
    };
}

interface AnalyticsData {
    totalCars: number;
    pendingApproval: number;
    totalUsers: number;
    activeSubscriptions: number;
    todaySignups: number;
    monthlyRevenue: number;
    totalRevenue: number;
    averageRating: number;
}

export class AdminSocket {
    private io: SocketIOServer;
    private connectedAdmins: Map<string, AdminSocket> = new Map();

    constructor(server: Server) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.ADMIN_URL || "http://localhost:3001",
                methods: ["GET", "POST"],
                credentials: true
            },
            path: '/admin-socket',
            transports: ['websocket', 'polling']
        });

        this.setupMiddleware();
        this.setupEventHandlers();
        this.setupPeriodicUpdates();
    }

    private setupMiddleware(): void {
        this.io.use((socket: Socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
                
                if (![UserRole.ADMIN, UserRole.MODERATOR].includes(decoded.role)) {
                    return next(new Error('Insufficient permissions'));
                }

                (socket as AdminSocket).data = {
                    user: {
                        userId: decoded.userId,
                        email: decoded.email,
                        role: decoded.role
                    }
                };

                next();
            } catch (err) {
                next(new Error('Authentication failed'));
            }
        });
    }

    private setupEventHandlers(): void {
        this.io.on('connection', (socket: AdminSocket) => {
            console.log(`Admin connected: ${socket.data.user.email} (${socket.data.user.role})`);
            
            // Store connected admin
            this.connectedAdmins.set(socket.id, socket);

            // Join admin room
            socket.join('admin');
            socket.join(`role:${socket.data.user.role}`);

            // Send initial data
            this.sendInitialData(socket);

            // Handle car approval
            socket.on('approve_car', async (data: { carId: number; notes?: string }) => {
                try {
                    await this.approveCar(data.carId, socket.data.user.userId, data.notes);
                    
                    this.io.to('admin').emit('car_approved', {
                        carId: data.carId,
                        approvedBy: socket.data.user.email,
                        timestamp: new Date(),
                        notes: data.notes
                    });

                    // Send updated analytics
                    this.broadcastAnalyticsUpdate();
                } catch (error) {
                    socket.emit('error', { 
                        type: 'car_approval_failed',
                        message: error.message 
                    });
                }
            });

            // Handle car rejection
            socket.on('reject_car', async (data: { carId: number; reason: string; notes?: string }) => {
                try {
                    await this.rejectCar(data.carId, data.reason, socket.data.user.userId, data.notes);
                    
                    this.io.to('admin').emit('car_rejected', {
                        carId: data.carId,
                        reason: data.reason,
                        rejectedBy: socket.data.user.email,
                        timestamp: new Date(),
                        notes: data.notes
                    });

                    this.broadcastAnalyticsUpdate();
                } catch (error) {
                    socket.emit('error', { 
                        type: 'car_rejection_failed',
                        message: error.message 
                    });
                }
            });

            // Handle user ban
            socket.on('ban_user', async (data: { userId: number; reason: string; duration?: number }) => {
                try {
                    await this.banUser(data.userId, data.reason, socket.data.user.userId, data.duration);
                    
                    this.io.to('admin').emit('user_banned', {
                        userId: data.userId,
                        reason: data.reason,
                        bannedBy: socket.data.user.email,
                        duration: data.duration,
                        timestamp: new Date()
                    });
                } catch (error) {
                    socket.emit('error', { 
                        type: 'user_ban_failed',
                        message: error.message 
                    });
                }
            });

            // Handle user unban
            socket.on('unban_user', async (data: { userId: number }) => {
                try {
                    await this.unbanUser(data.userId, socket.data.user.userId);
                    
                    this.io.to('admin').emit('user_unbanned', {
                        userId: data.userId,
                        unbannedBy: socket.data.user.email,
                        timestamp: new Date()
                    });
                } catch (error) {
                    socket.emit('error', { 
                        type: 'user_unban_failed',
                        message: error.message 
                    });
                }
            });

            // Handle analytics request
            socket.on('get_analytics', async (data?: { timeframe?: string }) => {
                try {
                    const analytics = await this.getRealtimeAnalytics(data?.timeframe);
                    socket.emit('analytics_update', analytics);
                } catch (error) {
                    socket.emit('error', { 
                        type: 'analytics_failed',
                        message: error.message 
                    });
                }
            });

            // Handle pending cars request
            socket.on('get_pending_cars', async (data?: { page?: number; limit?: number }) => {
                try {
                    const pendingCars = await this.getPendingCars(data?.page, data?.limit);
                    socket.emit('pending_cars_update', pendingCars);
                } catch (error) {
                    socket.emit('error', { 
                        type: 'pending_cars_failed',
                        message: error.message 
                    });
                }
            });

            // Handle recent activity request
            socket.on('get_recent_activity', async () => {
                try {
                    const activity = await this.getRecentActivity();
                    socket.emit('recent_activity_update', activity);
                } catch (error) {
                    socket.emit('error', { 
                        type: 'recent_activity_failed',
                        message: error.message 
                    });
                }
            });

            // Handle system stats request
            socket.on('get_system_stats', async () => {
                try {
                    const stats = await this.getSystemStats();
                    socket.emit('system_stats_update', stats);
                } catch (error) {
                    socket.emit('error', { 
                        type: 'system_stats_failed',
                        message: error.message 
                    });
                }
            });

            // Handle disconnect
            socket.on('disconnect', (reason) => {
                console.log(`Admin disconnected: ${socket.data.user.email} - Reason: ${reason}`);
                this.connectedAdmins.delete(socket.id);
            });

            // Handle ping/pong for connection health
            socket.on('ping', () => {
                socket.emit('pong', { timestamp: Date.now() });
            });
        });
    }

    private async sendInitialData(socket: AdminSocket): Promise<void> {
        try {
            const [analytics, pendingCars, recentActivity] = await Promise.all([
                this.getRealtimeAnalytics(),
                this.getPendingCars(1, 10),
                this.getRecentActivity()
            ]);

            socket.emit('initial_data', {
                analytics,
                pendingCars,
                recentActivity,
                connectedAt: new Date()
            });
        } catch (error) {
            socket.emit('error', { 
                type: 'initial_data_failed',
                message: 'Failed to load initial data' 
            });
        }
    }

    private setupPeriodicUpdates(): void {
        // Send analytics updates every 30 seconds
        setInterval(async () => {
            if (this.connectedAdmins.size > 0) {
                this.broadcastAnalyticsUpdate();
            }
        }, 30000);

        // Send system health updates every 60 seconds
        setInterval(async () => {
            if (this.connectedAdmins.size > 0) {
                this.broadcastSystemHealthUpdate();
            }
        }, 60000);
    }

    // Public methods for external services to call
    public notifyNewCarSubmission(car: any): void {
        this.io.to('admin').emit('new_car_submission', {
            car: {
                id: car.id,
                title: car.title,
                brand: car.brand?.name,
                model: car.model?.name,
                price: car.price,
                seller: {
                    id: car.seller_id,
                    name: `${car.seller?.first_name} ${car.seller?.last_name}`,
                    email: car.seller?.email
                }
            },
            timestamp: new Date()
        });
    }

    public notifyNewSubscription(subscription: any): void {
        this.io.to('admin').emit('new_subscription', {
            subscription: {
                id: subscription.id,
                planName: subscription.plan?.name,
                amount: subscription.current_price,
                user: {
                    id: subscription.user_id,
                    email: subscription.user?.email
                }
            },
            timestamp: new Date()
        });
    }

    public notifyPaymentReceived(payment: any): void {
        this.io.to('admin').emit('payment_received', {
            payment,
            timestamp: new Date()
        });
    }

    public notifyNewUser(user: any): void {
        this.io.to('admin').emit('new_user_registration', {
            user: {
                id: user.id,
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                role: user.role
            },
            timestamp: new Date()
        });
    }

    public notifySystemAlert(alert: { type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }): void {
        this.io.to('admin').emit('system_alert', {
            ...alert,
            timestamp: new Date()
        });
    }

    // Private methods
    private async approveCar(carId: number, approvedBy: number, notes?: string): Promise<void> {
        const carRepository = AppDataSource.getRepository(Car);
        
        await carRepository.update(carId, {
            status: CarStatus.APPROVED,
            approval_status: ApprovalStatus.APPROVED,
            approved_by: approvedBy,
            approved_at: new Date(),
            revision_notes: notes
        });
    }

    private async rejectCar(carId: number, reason: string, rejectedBy: number, notes?: string): Promise<void> {
        const carRepository = AppDataSource.getRepository(Car);
        
        await carRepository.update(carId, {
            status: CarStatus.REJECTED,
            approval_status: ApprovalStatus.REJECTED,
            rejection_reason: reason,
            approved_by: rejectedBy,
            approved_at: new Date(),
            revision_notes: notes
        });
    }

    private async banUser(userId: number, reason: string, bannedBy: number, duration?: number): Promise<void> {
        const userRepository = AppDataSource.getRepository(User);
        
        const banExpiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
        
        await userRepository.update(userId, {
            is_banned: true,
            ban_reason: reason,
            ban_expires_at: banExpiresAt
        });
    }

    private async unbanUser(userId: number, unbannedBy: number): Promise<void> {
        const userRepository = AppDataSource.getRepository(User);
        
        await userRepository.update(userId, {
            is_banned: false,
            ban_reason: null,
            ban_expires_at: null
        });
    }

    private async getRealtimeAnalytics(timeframe: string = '30d'): Promise<AnalyticsData> {
        const carRepository = AppDataSource.getRepository(Car);
        const userRepository = AppDataSource.getRepository(User);
        const subscriptionRepository = AppDataSource.getRepository(UserSubscription);

        const startDate = this.getStartDateForTimeframe(timeframe);

        const [
            totalCars,
            pendingApproval,
            totalUsers,
            activeSubscriptions,
            todaySignups
        ] = await Promise.all([
            carRepository.count(),
            carRepository.count({ where: { approval_status: ApprovalStatus.PENDING } }),
            userRepository.count(),
            subscriptionRepository.count({ where: { status: 'active' } }),
            userRepository.count({
                where: {
                    created_at: this.getTodayStartDate()
                }
            })
        ]);

        const monthlyRevenue = await this.calculateRevenue('monthly');
        const totalRevenue = await this.calculateRevenue('total');
        const averageRating = await this.calculateAverageRating();

        return {
            totalCars,
            pendingApproval,
            totalUsers,
            activeSubscriptions,
            todaySignups,
            monthlyRevenue,
            totalRevenue,
            averageRating
        };
    }

    private async getPendingCars(page: number = 1, limit: number = 10): Promise<any> {
        const carRepository = AppDataSource.getRepository(Car);
        const offset = (page - 1) * limit;

        const [cars, total] = await carRepository.findAndCount({
            where: { approval_status: ApprovalStatus.PENDING },
            relations: ['seller', 'brand', 'model', 'images'],
            order: { created_at: 'ASC' },
            take: limit,
            skip: offset
        });

        return {
            cars: cars.map(car => ({
                id: car.id,
                title: car.title,
                price: car.price,
                brand: car.brand.name,
                model: car.model.name,
                seller: {
                    id: car.seller.id,
                    name: `${car.seller.first_name} ${car.seller.last_name}`,
                    email: car.seller.email
                },
                createdAt: car.created_at,
                primaryImage: car.images?.find(img => img.is_primary)?.image_url
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    private async getRecentActivity(): Promise<any[]> {
        // This would typically query an activity/audit log table
        // For now, return recent cars and users
        const carRepository = AppDataSource.getRepository(Car);
        const userRepository = AppDataSource.getRepository(User);

        const [recentCars, recentUsers] = await Promise.all([
            carRepository.find({
                relations: ['seller'],
                order: { created_at: 'DESC' },
                take: 5
            }),
            userRepository.find({
                order: { created_at: 'DESC' },
                take: 5
            })
        ]);

        const activities = [
            ...recentCars.map(car => ({
                type: 'car_submission',
                message: `New car listing: ${car.title}`,
                user: `${car.seller.first_name} ${car.seller.last_name}`,
                timestamp: car.created_at
            })),
            ...recentUsers.map(user => ({
                type: 'user_registration',
                message: `New user registered: ${user.email}`,
                user: `${user.first_name} ${user.last_name}`,
                timestamp: user.created_at
            }))
        ];

        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }

    private async getSystemStats(): Promise<any> {
        return {
            serverUptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV,
            connectedAdmins: this.connectedAdmins.size,
            timestamp: new Date()
        };
    }

    private async broadcastAnalyticsUpdate(): Promise<void> {
        try {
            const analytics = await this.getRealtimeAnalytics();
            this.io.to('admin').emit('analytics_update', analytics);
        } catch (error) {
            console.error('Failed to broadcast analytics update:', error);
        }
    }

    private async broadcastSystemHealthUpdate(): Promise<void> {
        try {
            const stats = await this.getSystemStats();
            this.io.to('admin').emit('system_health_update', stats);
        } catch (error) {
            console.error('Failed to broadcast system health update:', error);
        }
    }

    private getStartDateForTimeframe(timeframe: string): Date {
        const now = new Date();
        switch (timeframe) {
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case '90d':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case '1y':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }

    private getTodayStartDate(): Date {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    private async calculateRevenue(period: 'monthly' | 'total'): Promise<number> {
        const subscriptionRepository = AppDataSource.getRepository(UserSubscription);
        
        if (period === 'total') {
            const subscriptions = await subscriptionRepository.find({
                where: { status: 'active' }
            });
            return subscriptions.reduce((total, sub) => total + sub.current_price, 0);
        } else {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const subscriptions = await subscriptionRepository
                .createQueryBuilder('subscription')
                .where('subscription.created_at >= :startOfMonth', { startOfMonth })
                .getMany();

            return subscriptions.reduce((total, sub) => total + sub.current_price, 0);
        }
    }

    private async calculateAverageRating(): Promise<number> {
        const userRepository = AppDataSource.getRepository(User);
        
        const result = await userRepository
            .createQueryBuilder('user')
            .select('AVG(user.average_rating)', 'avg')
            .where('user.total_ratings > 0')
            .getRawOne();

        return parseFloat(result.avg) || 0;
    }
}