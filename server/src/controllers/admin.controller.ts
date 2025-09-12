import { Response } from 'express';
import { Repository, MoreThan, Between } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Car, CarStatus, ApprovalStatus } from '../entities/Car';
import { User, UserRole } from '../entities/User';
import { UserSubscription } from '../entities/UserSubscription';
import { Notification } from '../entities/Notification';
import { UserAction } from '../entities/UserAction';
import { SubscriptionService } from '../services/SubscriptionService';
import { NotificationService } from '../services/NotificationService';
import { AuthRequest } from '../middleware/auth.middleware';
import { validationResult } from 'express-validator';

export class AdminController {
    private carRepository: Repository<Car>;
    private userRepository: Repository<User>;
    private subscriptionRepository: Repository<UserSubscription>;
    private notificationRepository: Repository<Notification>;
    private userActionRepository: Repository<UserAction>;
    private subscriptionService: SubscriptionService;
    private notificationService: NotificationService;

    constructor() {
        this.carRepository = AppDataSource.getRepository(Car);
        this.userRepository = AppDataSource.getRepository(User);
        this.subscriptionRepository = AppDataSource.getRepository(UserSubscription);
        this.notificationRepository = AppDataSource.getRepository(Notification);
        this.userActionRepository = AppDataSource.getRepository(UserAction);
        this.subscriptionService = new SubscriptionService();
        this.notificationService = new NotificationService();
    }

    // Dashboard Analytics
    getAnalytics = async (req: AuthRequest, res: Response) => {
        try {
            const timeframe = req.query.timeframe as string || '30d';
            const startDate = this.getStartDateForTimeframe(timeframe);

            const [
                totalCars,
                pendingApproval,
                approvedCars,
                rejectedCars,
                totalUsers,
                activeUsers,
                newUsers,
                activeSubscriptions,
                totalRevenue,
                monthlyRevenue
            ] = await Promise.all([
                this.carRepository.count(),
                this.carRepository.count({ where: { approval_status: ApprovalStatus.PENDING } }),
                this.carRepository.count({ where: { approval_status: ApprovalStatus.APPROVED } }),
                this.carRepository.count({ where: { approval_status: ApprovalStatus.REJECTED } }),
                this.userRepository.count(),
                this.userRepository.count({ where: { is_active: true, is_banned: false } }),
                this.userRepository.count({ where: { created_at: MoreThan(startDate) } }),
                this.subscriptionRepository.count({ where: { status: 'active' } }),
                this.calculateTotalRevenue(),
                this.calculateMonthlyRevenue()
            ]);

            const averageRating = await this.calculateAverageRating();
            const topBrands = await this.getTopBrands();
            const recentActivity = await this.getRecentActivity();

            res.json({
                message: 'Analytics retrieved successfully',
                data: {
                    overview: {
                        totalCars,
                        pendingApproval,
                        approvedCars,
                        rejectedCars,
                        totalUsers,
                        activeUsers,
                        newUsers,
                        activeSubscriptions,
                        averageRating,
                        totalRevenue,
                        monthlyRevenue
                    },
                    topBrands,
                    recentActivity,
                    timeframe,
                    generatedAt: new Date()
                }
            });
        } catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({
                error: 'Failed to retrieve analytics'
            });
        }
    };

    getRealtimeAnalytics = async (req: AuthRequest, res: Response) => {
        try {
            const [
                totalCars,
                pendingApproval,
                totalUsers,
                activeSubscriptions,
                todaySignups
            ] = await Promise.all([
                this.carRepository.count(),
                this.carRepository.count({ where: { approval_status: ApprovalStatus.PENDING } }),
                this.userRepository.count(),
                this.subscriptionRepository.count({ where: { status: 'active' } }),
                this.getTodaySignups()
            ]);

            res.json({
                message: 'Real-time analytics retrieved successfully',
                data: {
                    totalCars,
                    pendingApproval,
                    totalUsers,
                    activeSubscriptions,
                    todaySignups,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            console.error('Get realtime analytics error:', error);
            res.status(500).json({
                error: 'Failed to retrieve real-time analytics'
            });
        }
    };

    // Car Management
    getPendingCars = async (req: AuthRequest, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const [cars, total] = await this.carRepository.findAndCount({
                where: { approval_status: ApprovalStatus.PENDING },
                relations: ['seller', 'brand', 'model', 'city', 'province', 'images'],
                order: { created_at: 'ASC' },
                take: limit,
                skip: offset
            });

            res.json({
                message: 'Pending cars retrieved successfully',
                data: {
                    cars,
                    total,
                    page,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get pending cars error:', error);
            res.status(500).json({
                error: 'Failed to retrieve pending cars'
            });
        }
    };

    approveCar = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            const { notes } = req.body;

            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            const car = await this.carRepository.findOne({
                where: { id: carId },
                relations: ['seller']
            });

            if (!car) {
                return res.status(404).json({
                    error: 'Car not found'
                });
            }

            await this.carRepository.update(carId, {
                status: CarStatus.APPROVED,
                approval_status: ApprovalStatus.APPROVED,
                approved_by: req.userId,
                approved_at: new Date(),
                revision_notes: notes
            });

            // Send notification to seller
            await this.notificationService.notifyCarApproved(car.seller_id, carId);

            const updatedCar = await this.carRepository.findOne({
                where: { id: carId },
                relations: ['seller', 'brand', 'model']
            });

            res.json({
                message: 'Car approved successfully',
                data: { car: updatedCar }
            });
        } catch (error) {
            console.error('Approve car error:', error);
            res.status(500).json({
                error: 'Failed to approve car'
            });
        }
    };

    rejectCar = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            const { reason, notes } = req.body;

            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            if (!reason) {
                return res.status(400).json({
                    error: 'Rejection reason is required'
                });
            }

            const car = await this.carRepository.findOne({
                where: { id: carId },
                relations: ['seller']
            });

            if (!car) {
                return res.status(404).json({
                    error: 'Car not found'
                });
            }

            await this.carRepository.update(carId, {
                status: CarStatus.REJECTED,
                approval_status: ApprovalStatus.REJECTED,
                rejection_reason: reason,
                approved_by: req.userId,
                approved_at: new Date(),
                revision_notes: notes
            });

            // Send notification to seller
            await this.notificationService.notifyCarRejected(car.seller_id, carId, reason);

            const updatedCar = await this.carRepository.findOne({
                where: { id: carId },
                relations: ['seller', 'brand', 'model']
            });

            res.json({
                message: 'Car rejected successfully',
                data: { car: updatedCar }
            });
        } catch (error) {
            console.error('Reject car error:', error);
            res.status(500).json({
                error: 'Failed to reject car'
            });
        }
    };

    // User Management
    getUsers = async (req: AuthRequest, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string;
            const role = req.query.role as UserRole;
            const status = req.query.status as string;
            const offset = (page - 1) * limit;

            let queryBuilder = this.userRepository
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.city', 'city')
                .leftJoinAndSelect('user.province', 'province')
                .select([
                    'user.id', 'user.email', 'user.first_name', 'user.last_name',
                    'user.role', 'user.is_active', 'user.is_banned', 'user.email_verified',
                    'user.phone_verified', 'user.created_at', 'user.last_login_at',
                    'user.total_sales', 'user.total_purchases', 'user.average_rating',
                    'city.name', 'province.name'
                ]);

            if (search) {
                queryBuilder = queryBuilder.where(
                    '(user.email LIKE :search OR user.first_name LIKE :search OR user.last_name LIKE :search)',
                    { search: `%${search}%` }
                );
            }

            if (role) {
                queryBuilder = queryBuilder.andWhere('user.role = :role', { role });
            }

            if (status) {
                if (status === 'active') {
                    queryBuilder = queryBuilder.andWhere('user.is_active = true AND user.is_banned = false');
                } else if (status === 'banned') {
                    queryBuilder = queryBuilder.andWhere('user.is_banned = true');
                } else if (status === 'inactive') {
                    queryBuilder = queryBuilder.andWhere('user.is_active = false');
                }
            }

            const [users, total] = await queryBuilder
                .orderBy('user.created_at', 'DESC')
                .limit(limit)
                .offset(offset)
                .getManyAndCount();

            res.json({
                message: 'Users retrieved successfully',
                data: {
                    users,
                    total,
                    page,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                error: 'Failed to retrieve users'
            });
        }
    };

    banUser = async (req: AuthRequest, res: Response) => {
        try {
            const userId = parseInt(req.params.id);
            const { reason, duration } = req.body;

            if (isNaN(userId)) {
                return res.status(400).json({
                    error: 'Invalid user ID'
                });
            }

            if (!reason) {
                return res.status(400).json({
                    error: 'Ban reason is required'
                });
            }

            const user = await this.userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            // Don't allow banning other admins
            if ([UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
                return res.status(403).json({
                    error: 'Cannot ban admin users'
                });
            }

            const banExpiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : "";

            await this.userRepository.update(userId, {
                is_banned: true,
                ban_reason: reason,
                ban_expires_at: banExpiresAt
            });

            // Deactivate user's active car listings
            await this.carRepository.update(
                { seller_id: userId, status: CarStatus.APPROVED },
                { status: CarStatus.SUSPENDED }
            );

            res.json({
                message: 'User banned successfully',
                data: {
                    user_id: userId,
                    ban_expires_at: banExpiresAt
                }
            });
        } catch (error) {
            console.error('Ban user error:', error);
            res.status(500).json({
                error: 'Failed to ban user'
            });
        }
    };

    unbanUser = async (req: AuthRequest, res: Response) => {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                return res.status(400).json({
                    error: 'Invalid user ID'
                });
            }

            const user = await this.userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }
            
            await this.userRepository.update(userId, {
                is_banned: false,
                ban_reason: "",
                ban_expires_at: ""
            });

            res.json({
                message: 'User unbanned successfully',
                data: { user_id: userId }
            });
        } catch (error) {
            console.error('Unban user error:', error);
            res.status(500).json({
                error: 'Failed to unban user'
            });
        }
    };

    // Subscription Management
    getSubscriptions = async (req: AuthRequest, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const status = req.query.status as string;
            const offset = (page - 1) * limit;

            let queryBuilder = this.subscriptionRepository
                .createQueryBuilder('subscription')
                .leftJoinAndSelect('subscription.user', 'user')
                .leftJoinAndSelect('subscription.plan', 'plan')
                .select([
                    'subscription.id', 'subscription.status', 'subscription.billing_cycle',
                    'subscription.current_price', 'subscription.started_at', 'subscription.current_period_end',
                    'subscription.cancelled_at', 'subscription.auto_renew',
                    'user.id', 'user.email', 'user.first_name', 'user.last_name',
                    'plan.id', 'plan.name'
                ]);

            if (status) {
                queryBuilder = queryBuilder.where('subscription.status = :status', { status });
            }

            const [subscriptions, total] = await queryBuilder
                .orderBy('subscription.created_at', 'DESC')
                .limit(limit)
                .offset(offset)
                .getManyAndCount();

            res.json({
                message: 'Subscriptions retrieved successfully',
                data: {
                    subscriptions,
                    total,
                    page,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get subscriptions error:', error);
            res.status(500).json({
                error: 'Failed to retrieve subscriptions'
            });
        }
    };

    getSubscriptionAnalytics = async (req: AuthRequest, res: Response) => {
        try {
            const startDate = req.query.start_date ? new Date(req.query.start_date as string) : 
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();

            const analytics = await this.subscriptionService.getSubscriptionAnalytics(startDate, endDate);

            res.json({
                message: 'Subscription analytics retrieved successfully',
                data: analytics
            });
        } catch (error) {
            console.error('Get subscription analytics error:', error);
            res.status(500).json({
                error: 'Failed to retrieve subscription analytics'
            });
        }
    };

    // System Management
    getSystemStats = async (req: AuthRequest, res: Response) => {
        try {
            const stats = {
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    version: process.version,
                    environment: process.env.NODE_ENV
                },
                database: await this.getDatabaseStats(),
                storage: await this.getStorageStats(),
                performance: await this.getPerformanceStats()
            };

            res.json({
                message: 'System stats retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Get system stats error:', error);
            res.status(500).json({
                error: 'Failed to retrieve system stats'
            });
        }
    };

    // Helper methods
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

    private async calculateTotalRevenue(): Promise<number> {
        const subscriptions = await this.subscriptionRepository.find({
            where: { status: 'active' }
        });
        return subscriptions.reduce((total, sub) => total + sub.current_price, 0);
    }

    private async calculateMonthlyRevenue(): Promise<number> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const subscriptions = await this.subscriptionRepository.find({
            where: {
                created_at: MoreThan(startOfMonth),
                status: 'active'
            }
        });
        return subscriptions.reduce((total, sub) => total + sub.current_price, 0);
    }

    private async calculateAverageRating(): Promise<number> {
        const result = await this.userRepository
            .createQueryBuilder('user')
            .select('AVG(user.average_rating)', 'avg')
            .where('user.total_ratings > 0')
            .getRawOne();

        return parseFloat(result.avg) || 0;
    }

    private async getTodaySignups(): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await this.userRepository.count({
            where: { created_at: MoreThan(today) }
        });
    }

    private async getTopBrands(): Promise<any[]> {
        const brandRepository = AppDataSource.getRepository('Brand');
        return await brandRepository
            .createQueryBuilder('brand')
            .leftJoin('brand.cars', 'car')
            .select(['brand.name', 'COUNT(car.id) as car_count'])
            .groupBy('brand.id')
            .orderBy('car_count', 'DESC')
            .limit(5)
            .getRawMany();
    }

    private async getRecentActivity(): Promise<any[]> {
        const recentCars = await this.carRepository.find({
            relations: ['seller', 'brand'],
            order: { created_at: 'DESC' },
            take: 5
        });

        const recentUsers = await this.userRepository.find({
            order: { created_at: 'DESC' },
            take: 5
        });

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

    private async getDatabaseStats(): Promise<any> {
        // This would typically query database-specific stats
        return {
            connections: 0,
            query_time: 0,
            tables: 0
        };
    }

    private async getStorageStats(): Promise<any> {
        // This would typically query storage usage
        return {
            total_images: 0,
            storage_used: 0,
            bandwidth_used: 0
        };
    }

    private async getPerformanceStats(): Promise<any> {
        return {
            response_time: 0,
            requests_per_minute: 0,
            error_rate: 0
        };
    }
}