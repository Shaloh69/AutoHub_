import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { SubscriptionPlan, BillingCycle } from '../entities/SubscriptionPlan';
import { UserSubscription } from '../entities/UserSubscription';
import { User } from '../entities/User';
import { Car, CarStatus } from '../entities/Car';
import { PaymentService } from './PaymentService';
import { NotificationService } from './NotificationService';

export interface SubscriptionLimits {
    maxActiveListings: number;
    maxImagesPerListing: number;
    featuredListingsIncluded: boolean;
    priorityApproval: boolean;
    boostCreditsMonthly: number;
    listingDurationDays: number;
}

export class SubscriptionService {
    private subscriptionRepository: Repository<UserSubscription>;
    private planRepository: Repository<SubscriptionPlan>;
    private userRepository: Repository<User>;
    private carRepository: Repository<Car>;
    private paymentService: PaymentService;
    private notificationService: NotificationService;

    constructor() {
        this.subscriptionRepository = AppDataSource.getRepository(UserSubscription);
        this.planRepository = AppDataSource.getRepository(SubscriptionPlan);
        this.userRepository = AppDataSource.getRepository(User);
        this.carRepository = AppDataSource.getRepository(Car);
        this.paymentService = new PaymentService();
        this.notificationService = new NotificationService();
    }

    async subscribeToPlan(
        userId: number, 
        planId: number, 
        billingCycle: BillingCycle,
        paymentMethodId: string
    ): Promise<UserSubscription> {
        const plan = await this.planRepository.findOne({
            where: { id: planId, is_active: true }
        });

        if (!plan) {
            throw new Error('Subscription plan not found');
        }

        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if user already has an active subscription
        const existingSubscription = await this.getUserActiveSubscription(userId);
        if (existingSubscription) {
            throw new Error('User already has an active subscription');
        }

        // Calculate price based on billing cycle
        const price = billingCycle === BillingCycle.YEARLY ? plan.yearly_price : plan.monthly_price;
        
        // Create Stripe subscription
        const stripeSubscription = await this.paymentService.createSubscription(
            userId,
            price,
            paymentMethodId,
            billingCycle
        );

        // Calculate subscription period
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === BillingCycle.YEARLY) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Create local subscription record
        const subscription = this.subscriptionRepository.create({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            billing_cycle: billingCycle,
            monthly_price: plan.monthly_price,
            yearly_price: plan.yearly_price,
            current_price: price,
            started_at: now,
            current_period_start: now,
            current_period_end: periodEnd,
            external_subscription_id: stripeSubscription.id,
            auto_renew: true
        });

        const savedSubscription = await this.subscriptionRepository.save(subscription);

        // Update user subscription status
        await this.userRepository.update(userId, {
            subscription_status: 'active',
            subscription_expires_at: periodEnd
        });

        // Send confirmation notification
        await this.notificationService.notifySubscriptionCreated(userId, savedSubscription);

        return savedSubscription;
    }

    async cancelSubscription(userId: number, reason?: string): Promise<void> {
        const subscription = await this.getUserActiveSubscription(userId);
        
        if (!subscription) {
            throw new Error('No active subscription found');
        }

        // Cancel in Stripe
        if (subscription.external_subscription_id) {
            await this.paymentService.cancelSubscription(subscription.external_subscription_id);
        }

        // Update local subscription
        await this.subscriptionRepository.update(subscription.id, {
            status: 'cancelled',
            cancelled_at: new Date(),
            cancellation_reason: reason,
            auto_renew: false
        });

        // Update user status (but keep subscription active until period ends)
        // await this.userRepository.update(userId, {
        //     subscription_status: 'cancelled'
        // });

        // Send notification
        await this.notificationService.notifySubscriptionCancelled(userId, subscription);
    }

    async upgradeSubscription(
        userId: number, 
        newPlanId: number, 
        paymentMethodId?: string
    ): Promise<UserSubscription> {
        const currentSubscription = await this.getUserActiveSubscription(userId);
        
        if (!currentSubscription) {
            throw new Error('No active subscription to upgrade');
        }

        const newPlan = await this.planRepository.findOne({
            where: { id: newPlanId, is_active: true }
        });

        if (!newPlan) {
            throw new Error('New subscription plan not found');
        }

        // Cancel current subscription
        if (currentSubscription.external_subscription_id) {
            await this.paymentService.cancelSubscription(currentSubscription.external_subscription_id);
        }

        // Create new subscription
        const price = currentSubscription.billing_cycle === BillingCycle.YEARLY 
            ? newPlan.yearly_price 
            : newPlan.monthly_price;

        const stripeSubscription = await this.paymentService.createSubscription(
            userId,
            price,
            paymentMethodId || '',
            currentSubscription.billing_cycle
        );

        // Update current subscription to cancelled
        await this.subscriptionRepository.update(currentSubscription.id, {
            status: 'cancelled',
            cancelled_at: new Date(),
            cancellation_reason: 'upgraded'
        });

        // Calculate new subscription period
        const now = new Date();
        const periodEnd = new Date(now);
        if (currentSubscription.billing_cycle === BillingCycle.YEARLY) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Create new subscription
        const newSubscription = this.subscriptionRepository.create({
            user_id: userId,
            plan_id: newPlanId,
            status: 'active',
            billing_cycle: currentSubscription.billing_cycle,
            monthly_price: newPlan.monthly_price,
            yearly_price: newPlan.yearly_price,
            current_price: price,
            started_at: now,
            current_period_start: now,
            current_period_end: periodEnd,
            external_subscription_id: stripeSubscription.id,
            auto_renew: true
        });

        const savedSubscription = await this.subscriptionRepository.save(newSubscription);

        // Update user subscription status
        await this.userRepository.update(userId, {
            subscription_status: 'active',
            subscription_expires_at: periodEnd
        });

        // Send notification
        await this.notificationService.notifySubscriptionUpgraded(userId, savedSubscription);

        return savedSubscription;
    }

    async canUserCreateListing(userId: number): Promise<boolean> {
        const activeListings = await this.carRepository.count({
            where: { 
                seller_id: userId, 
                status: CarStatus.APPROVED 
            }
        });

        const subscription = await this.getUserActiveSubscription(userId);
        const limits = this.getUserLimits(subscription);

        return limits.maxActiveListings === -1 || activeListings < limits.maxActiveListings;
    }

    async getUserLimits(subscription?: UserSubscription): Promise<SubscriptionLimits> {
        if (!subscription) {
            // Free tier limits
            return {
                maxActiveListings: 3,
                maxImagesPerListing: 5,
                featuredListingsIncluded: false,
                priorityApproval: false,
                boostCreditsMonthly: 0,
                listingDurationDays: 30
            };
        }

        const plan = await this.planRepository.findOne({
            where: { id: subscription.plan_id }
        });

        if (!plan) {
            throw new Error('Subscription plan not found');
        }

        return {
            maxActiveListings: plan.max_active_listings,
            maxImagesPerListing: plan.max_images_per_listing,
            featuredListingsIncluded: plan.featured_listings_included,
            priorityApproval: plan.priority_approval,
            boostCreditsMonthly: plan.boost_credits_monthly,
            listingDurationDays: plan.listing_duration_days
        };
    }

    async getUserActiveSubscription(userId: number): Promise<UserSubscription | null> {
        return await this.subscriptionRepository.findOne({
            where: {
                user_id: userId,
                status: 'active',
                current_period_end: MoreThan(new Date())
            },
            relations: ['plan']
        });
    }

    async getAllPlans(): Promise<SubscriptionPlan[]> {
        return await this.planRepository.find({
            where: { is_active: true },
            order: { sort_order: 'ASC' }
        });
    }

    async getPlanById(id: number): Promise<SubscriptionPlan | null> {
        return await this.planRepository.findOne({
            where: { id, is_active: true }
        });
    }

    async getUserSubscriptionHistory(userId: number): Promise<UserSubscription[]> {
        return await this.subscriptionRepository.find({
            where: { user_id: userId },
            relations: ['plan'],
            order: { created_at: 'DESC' }
        });
    }

    async processExpiringSubscriptions(): Promise<void> {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const expiringSubscriptions = await this.subscriptionRepository.find({
            where: {
                status: 'active',
                current_period_end: MoreThan(new Date()),
                current_period_end: MoreThan(threeDaysFromNow),
                auto_renew: false
            },
            relations: ['plan', 'user']
        });

        for (const subscription of expiringSubscriptions) {
            await this.notificationService.notifySubscriptionExpiring(
                subscription.user_id, 
                subscription
            );
        }
    }

    async processExpiredSubscriptions(): Promise<void> {
        const expiredSubscriptions = await this.subscriptionRepository.find({
            where: {
                status: 'active',
                current_period_end: MoreThan(new Date())
            },
            relations: ['user']
        });

        for (const subscription of expiredSubscriptions) {
            // Update subscription status
            await this.subscriptionRepository.update(subscription.id, {
                status: 'expired'
            });

            // Update user status
            await this.userRepository.update(subscription.user_id, {
                subscription_status: 'expired'
            });

            // Downgrade user's active listings if they exceed free limits
            await this.downgradeUserListings(subscription.user_id);

            // Send notification
            await this.notificationService.notifySubscriptionExpired(
                subscription.user_id, 
                subscription
            );
        }
    }

    private async downgradeUserListings(userId: number): Promise<void> {
        const freeLimits = await this.getUserLimits(); // Gets free tier limits
        
        const userListings = await this.carRepository.find({
            where: { 
                seller_id: userId, 
                status: CarStatus.APPROVED 
            },
            order: { created_at: 'DESC' }
        });

        if (userListings.length > freeLimits.maxActiveListings) {
            const listingsToDeactivate = userListings.slice(freeLimits.maxActiveListings);
            
            for (const listing of listingsToDeactivate) {
                await this.carRepository.update(listing.id, {
                    status: CarStatus.SUSPENDED,
                    is_active: false
                });

                // Notify user about suspended listing
                await this.notificationService.notifyListingSuspended(userId, listing.id);
            }
        }
    }

    async getSubscriptionAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const end = endDate || new Date();

        const [
            totalSubscriptions,
            activeSubscriptions,
            newSubscriptions,
            cancelledSubscriptions,
            revenue
        ] = await Promise.all([
            this.subscriptionRepository.count(),
            this.subscriptionRepository.count({ where: { status: 'active' } }),
            this.subscriptionRepository.count({
                where: {
                    created_at: MoreThan(start)
                }
            }),
            this.subscriptionRepository.count({
                where: {
                    status: 'cancelled',
                    cancelled_at: MoreThan(start)
                }
            }),
            this.calculateRevenue(start, end)
        ]);

        const churnRate = totalSubscriptions > 0 
            ? (cancelledSubscriptions / totalSubscriptions) * 100 
            : 0;

        return {
            totalSubscriptions,
            activeSubscriptions,
            newSubscriptions,
            cancelledSubscriptions,
            churnRate: Math.round(churnRate * 100) / 100,
            revenue,
            period: {
                start,
                end
            }
        };
    }

    private async calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
        const subscriptions = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .where('subscription.created_at >= :start', { start: startDate })
            .andWhere('subscription.created_at <= :end', { end: endDate })
            .andWhere('subscription.status IN (:...statuses)', { statuses: ['active', 'cancelled'] })
            .getMany();

        return subscriptions.reduce((total, sub) => total + sub.current_price, 0);
    }

    async handleWebhookSubscriptionUpdated(externalSubscriptionId: string, status: string): Promise<void> {
        const subscription = await this.subscriptionRepository.findOne({
            where: { external_subscription_id: externalSubscriptionId },
            relations: ['user']
        });

        if (subscription) {
            let newStatus: string = status;
            
            // Map Stripe statuses to our statuses
            if (status === 'incomplete_expired' || status === 'canceled') {
                newStatus = 'cancelled';
            } else if (status === 'past_due') {
                newStatus = 'past_due';
            } else if (status === 'active') {
                newStatus = 'active';
            }

            await this.subscriptionRepository.update(subscription.id, {
                status: newStatus
            });

            // Update user status
            await this.userRepository.update(subscription.user_id, {
                subscription_status: newStatus
            });

            // Send appropriate notifications
            if (newStatus === 'cancelled') {
                await this.notificationService.notifySubscriptionCancelled(
                    subscription.user_id, 
                    subscription
                );
            } else if (newStatus === 'past_due') {
                await this.notificationService.notifyPaymentFailed(
                    subscription.user_id, 
                    subscription
                );
            }
        }
    }
}