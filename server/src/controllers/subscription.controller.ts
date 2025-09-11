import { Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { PaymentService } from '../services/PaymentService';
import { BillingCycle } from '../entities/SubscriptionPlan';
import { AuthRequest } from '../middleware/auth.middleware';
import { validationResult } from 'express-validator';

export class SubscriptionController {
    private subscriptionService: SubscriptionService;
    private paymentService: PaymentService;

    constructor() {
        this.subscriptionService = new SubscriptionService();
        this.paymentService = new PaymentService();
    }

    getAllPlans = async (req: AuthRequest, res: Response) => {
        try {
            const plans = await this.subscriptionService.getAllPlans();

            res.json({
                message: 'Subscription plans retrieved successfully',
                data: { plans }
            });
        } catch (error) {
            console.error('Get plans error:', error);
            res.status(500).json({
                error: 'Failed to retrieve subscription plans'
            });
        }
    };

    getPlan = async (req: AuthRequest, res: Response) => {
        try {
            const planId = parseInt(req.params.id);
            
            if (isNaN(planId)) {
                return res.status(400).json({
                    error: 'Invalid plan ID'
                });
            }

            const plan = await this.subscriptionService.getPlanById(planId);

            if (!plan) {
                return res.status(404).json({
                    error: 'Subscription plan not found'
                });
            }

            res.json({
                message: 'Subscription plan retrieved successfully',
                data: { plan }
            });
        } catch (error) {
            console.error('Get plan error:', error);
            res.status(500).json({
                error: 'Failed to retrieve subscription plan'
            });
        }
    };

    subscribe = async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { plan_id, billing_cycle, payment_method_id } = req.body;

            if (!plan_id || !billing_cycle || !payment_method_id) {
                return res.status(400).json({
                    error: 'Plan ID, billing cycle, and payment method are required'
                });
            }

            if (!Object.values(BillingCycle).includes(billing_cycle)) {
                return res.status(400).json({
                    error: 'Invalid billing cycle'
                });
            }

            const subscription = await this.subscriptionService.subscribeToPlan(
                req.userId!,
                plan_id,
                billing_cycle,
                payment_method_id
            );

            res.status(201).json({
                message: 'Subscription created successfully',
                data: { subscription }
            });
        } catch (error) {
            console.error('Subscribe error:', error);
            res.status(400).json({
                error: error.message || 'Failed to create subscription'
            });
        }
    };

    getCurrentSubscription = async (req: AuthRequest, res: Response) => {
        try {
            const subscription = await this.subscriptionService.getUserActiveSubscription(req.userId!);
            const limits = await this.subscriptionService.getUserLimits(subscription);

            res.json({
                message: 'Current subscription retrieved successfully',
                data: { 
                    subscription,
                    limits,
                    has_active_subscription: !!subscription
                }
            });
        } catch (error) {
            console.error('Get current subscription error:', error);
            res.status(500).json({
                error: 'Failed to retrieve current subscription'
            });
        }
    };

    getSubscriptionHistory = async (req: AuthRequest, res: Response) => {
        try {
            const history = await this.subscriptionService.getUserSubscriptionHistory(req.userId!);

            res.json({
                message: 'Subscription history retrieved successfully',
                data: { history }
            });
        } catch (error) {
            console.error('Get subscription history error:', error);
            res.status(500).json({
                error: 'Failed to retrieve subscription history'
            });
        }
    };

    cancelSubscription = async (req: AuthRequest, res: Response) => {
        try {
            const { reason } = req.body;

            await this.subscriptionService.cancelSubscription(req.userId!, reason);

            res.json({
                message: 'Subscription cancelled successfully'
            });
        } catch (error) {
            console.error('Cancel subscription error:', error);
            res.status(400).json({
                error: error.message || 'Failed to cancel subscription'
            });
        }
    };

    upgradeSubscription = async (req: AuthRequest, res: Response) => {
        try {
            const { new_plan_id, payment_method_id } = req.body;

            if (!new_plan_id) {
                return res.status(400).json({
                    error: 'New plan ID is required'
                });
            }

            const subscription = await this.subscriptionService.upgradeSubscription(
                req.userId!,
                new_plan_id,
                payment_method_id
            );

            res.json({
                message: 'Subscription upgraded successfully',
                data: { subscription }
            });
        } catch (error) {
            console.error('Upgrade subscription error:', error);
            res.status(400).json({
                error: error.message || 'Failed to upgrade subscription'
            });
        }
    };

    createPaymentIntent = async (req: AuthRequest, res: Response) => {
        try {
            const { amount, currency = 'php', metadata } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    error: 'Valid amount is required'
                });
            }

            const paymentIntent = await this.paymentService.createPaymentIntent(
                amount,
                currency,
                { user_id: req.userId!.toString(), ...metadata }
            );

            res.json({
                message: 'Payment intent created successfully',
                data: { payment_intent: paymentIntent }
            });
        } catch (error) {
            console.error('Create payment intent error:', error);
            res.status(400).json({
                error: 'Failed to create payment intent'
            });
        }
    };

    createSetupIntent = async (req: AuthRequest, res: Response) => {
        try {
            // Create or get customer
            const customer = await this.paymentService.createCustomer(req.userId!);
            
            const setupIntent = await this.paymentService.createSetupIntent(customer.id);

            res.json({
                message: 'Setup intent created successfully',
                data: { 
                    setup_intent: setupIntent,
                    customer_id: customer.id
                }
            });
        } catch (error) {
            console.error('Create setup intent error:', error);
            res.status(400).json({
                error: 'Failed to create setup intent'
            });
        }
    };

    getPaymentMethods = async (req: AuthRequest, res: Response) => {
        try {
            const customer = await this.paymentService.createCustomer(req.userId!);
            const paymentMethods = await this.paymentService.getCustomerPaymentMethods(customer.id);

            res.json({
                message: 'Payment methods retrieved successfully',
                data: { 
                    payment_methods: paymentMethods,
                    customer_id: customer.id
                }
            });
        } catch (error) {
            console.error('Get payment methods error:', error);
            res.status(500).json({
                error: 'Failed to retrieve payment methods'
            });
        }
    };

    getInvoices = async (req: AuthRequest, res: Response) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            
            const customer = await this.paymentService.createCustomer(req.userId!);
            const invoices = await this.paymentService.getInvoices(customer.id, limit);

            res.json({
                message: 'Invoices retrieved successfully',
                data: { invoices }
            });
        } catch (error) {
            console.error('Get invoices error:', error);
            res.status(500).json({
                error: 'Failed to retrieve invoices'
            });
        }
    };

    handleWebhook = async (req: AuthRequest, res: Response) => {
        try {
            const signature = req.headers['stripe-signature'] as string;
            const payload = req.body;

            if (!signature) {
                return res.status(400).json({
                    error: 'Stripe signature required'
                });
            }

            await this.paymentService.handleWebhook(signature, payload);

            res.json({ received: true });
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(400).json({
                error: 'Webhook validation failed'
            });
        }
    };

    getUserLimits = async (req: AuthRequest, res: Response) => {
        try {
            const subscription = await this.subscriptionService.getUserActiveSubscription(req.userId!);
            const limits = await this.subscriptionService.getUserLimits(subscription);
            const canCreateListing = await this.subscriptionService.canUserCreateListing(req.userId!);

            res.json({
                message: 'User limits retrieved successfully',
                data: { 
                    limits,
                    can_create_listing: canCreateListing,
                    has_subscription: !!subscription
                }
            });
        } catch (error) {
            console.error('Get user limits error:', error);
            res.status(500).json({
                error: 'Failed to retrieve user limits'
            });
        }
    };

    checkSubscriptionStatus = async (req: AuthRequest, res: Response) => {
        try {
            const subscription = await this.subscriptionService.getUserActiveSubscription(req.userId!);
            
            if (!subscription) {
                return res.json({
                    message: 'No active subscription',
                    data: { 
                        has_subscription: false,
                        status: 'none',
                        expires_at: null
                    }
                });
            }

            const isExpired = subscription.current_period_end < new Date();
            const daysUntilExpiry = subscription.days_until_expiry;

            res.json({
                message: 'Subscription status retrieved successfully',
                data: { 
                    has_subscription: true,
                    status: subscription.status,
                    expires_at: subscription.current_period_end,
                    is_expired: isExpired,
                    days_until_expiry: daysUntilExpiry,
                    auto_renew: subscription.auto_renew,
                    plan_name: subscription.plan?.name
                }
            });
        } catch (error) {
            console.error('Check subscription status error:', error);
            res.status(500).json({
                error: 'Failed to check subscription status'
            });
        }
    };

    validatePromoCode = async (req: AuthRequest, res: Response) => {
        try {
            const { promo_code } = req.body;

            if (!promo_code) {
                return res.status(400).json({
                    error: 'Promo code is required'
                });
            }

            // This would be implemented with a promo codes service
            // For now, return a simple validation
            
            const isValid = promo_code === 'WELCOME2024'; // Example promo code
            const discount = isValid ? 20 : 0; // 20% discount

            res.json({
                message: 'Promo code validated',
                data: { 
                    is_valid: isValid,
                    discount_percentage: discount,
                    promo_code
                }
            });
        } catch (error) {
            console.error('Validate promo code error:', error);
            res.status(500).json({
                error: 'Failed to validate promo code'
            });
        }
    };

    getSubscriptionAnalytics = async (req: AuthRequest, res: Response) => {
        try {
            // Only allow access for admins
            if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
                return res.status(403).json({
                    error: 'Admin access required'
                });
            }

            const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
            const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

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
}