import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UserSubscription } from '../entities/UserSubscription';
import { BillingCycle } from '../entities/SubscriptionPlan';

export interface PaymentIntent {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
}

export interface SubscriptionData {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    customer: string;
}

export class PaymentService {
    private stripe: Stripe;
    private userRepository: Repository<User>;
    private subscriptionRepository: Repository<UserSubscription>;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2023-10-16',
        });
        this.userRepository = AppDataSource.getRepository(User);
        this.subscriptionRepository = AppDataSource.getRepository(UserSubscription);
    }

    async createCustomer(userId: number): Promise<Stripe.Customer> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if customer already exists
        const existingCustomers = await this.stripe.customers.list({
            email: user.email,
            limit: 1
        });

        if (existingCustomers.data.length > 0) {
            return existingCustomers.data[0];
        }

        // Create new customer
        const customer = await this.stripe.customers.create({
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            metadata: {
                user_id: userId.toString(),
                platform: 'car_marketplace_ph'
            }
        });

        return customer;
    }

    async createSubscription(
        userId: number,
        amount: number,
        paymentMethodId: string,
        billingCycle: BillingCycle
    ): Promise<SubscriptionData> {
        const customer = await this.createCustomer(userId);

        // Attach payment method to customer
        await this.stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id
        });

        // Set as default payment method
        await this.stripe.customers.update(customer.id, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        // Create price object
        const price = await this.stripe.prices.create({
            currency: 'php',
            unit_amount: Math.round(amount * 100), // Convert to centavos
            recurring: {
                interval: billingCycle === BillingCycle.YEARLY ? 'year' : 'month'
            },
            product_data: {
                name: 'Car Marketplace Subscription',
                description: `${billingCycle} subscription to Car Marketplace Philippines`
            }
        });

        // Create subscription
        const subscription = await this.stripe.subscriptions.create({
            customer: customer.id,
            items: [{
                price: price.id
            }],
            default_payment_method: paymentMethodId,
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                user_id: userId.toString(),
                billing_cycle: billingCycle
            }
        });

        return {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            customer: customer.id
        };
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        await this.stripe.subscriptions.cancel(subscriptionId);
    }

    async createPaymentIntent(
        amount: number,
        currency: string = 'php',
        metadata?: Record<string, string>
    ): Promise<PaymentIntent> {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to centavos
            currency: currency.toLowerCase(),
            metadata: metadata || {},
            automatic_payment_methods: {
                enabled: true
            }
        });

        return {
            id: paymentIntent.id,
            client_secret: paymentIntent.client_secret!,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status
        };
    }

    async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
        return await this.stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
            usage: 'off_session'
        });
    }

    async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
        const paymentMethods = await this.stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
        });

        return paymentMethods.data;
    }

    async updateSubscription(
        subscriptionId: string,
        priceId: string
    ): Promise<Stripe.Subscription> {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        
        return await this.stripe.subscriptions.update(subscriptionId, {
            items: [{
                id: subscription.items.data[0].id,
                price: priceId
            }],
            proration_behavior: 'create_prorations'
        });
    }

    async handleWebhook(signature: string, payload: Buffer): Promise<void> {
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            throw new Error('Webhook signature verification failed');
        }

        console.log('Received webhook event:', event.type);

        switch (event.type) {
            case 'invoice.payment_succeeded':
                await this.handleSuccessfulPayment(event.data.object as Stripe.Invoice);
                break;
            
            case 'invoice.payment_failed':
                await this.handleFailedPayment(event.data.object as Stripe.Invoice);
                break;
            
            case 'customer.subscription.created':
                await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;
            
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            
            case 'payment_method.attached':
                await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
                break;
            
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    }

    private async handleSuccessfulPayment(invoice: Stripe.Invoice): Promise<void> {
        try {
            const subscriptionId = invoice.subscription as string;
            
            if (subscriptionId) {
                const subscription = await this.subscriptionRepository.findOne({
                    where: { external_subscription_id: subscriptionId }
                });

                if (subscription) {
                    // Update subscription status and period
                    await this.subscriptionRepository.update(subscription.id, {
                        status: 'active',
                        current_period_start: new Date(invoice.period_start * 1000),
                        current_period_end: new Date(invoice.period_end * 1000),
                        last_payment_at: new Date()
                    });

                    // Update user subscription status
                    await this.userRepository.update(subscription.user_id, {
                        subscription_status: 'active',
                        subscription_expires_at: new Date(invoice.period_end * 1000)
                    });

                    console.log(`Payment successful for subscription ${subscriptionId}`);
                }
            }
        } catch (error) {
            console.error('Error handling successful payment:', error);
        }
    }

    private async handleFailedPayment(invoice: Stripe.Invoice): Promise<void> {
        try {
            const subscriptionId = invoice.subscription as string;
            
            if (subscriptionId) {
                const subscription = await this.subscriptionRepository.findOne({
                    where: { external_subscription_id: subscriptionId }
                });

                if (subscription) {
                    // Update subscription status
                    await this.subscriptionRepository.update(subscription.id, {
                        status: 'past_due'
                    });

                    // Update user subscription status
                    await this.userRepository.update(subscription.user_id, {
                        subscription_status: 'past_due'
                    });

                    console.log(`Payment failed for subscription ${subscriptionId}`);
                    
                    // Here you would typically send a notification to the user
                    // about the failed payment
                }
            }
        } catch (error) {
            console.error('Error handling failed payment:', error);
        }
    }

    private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
        try {
            console.log(`Subscription created: ${subscription.id}`);
            
            // Additional logic when subscription is created
            // This might include sending welcome emails, etc.
        } catch (error) {
            console.error('Error handling subscription created:', error);
        }
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
        try {
            const localSubscription = await this.subscriptionRepository.findOne({
                where: { external_subscription_id: subscription.id }
            });

            if (localSubscription) {
                const statusMap: Record<string, string> = {
                    'active': 'active',
                    'past_due': 'past_due',
                    'canceled': 'cancelled',
                    'incomplete': 'incomplete',
                    'incomplete_expired': 'cancelled',
                    'trialing': 'trialing',
                    'unpaid': 'past_due'
                };

                const newStatus = statusMap[subscription.status] || subscription.status;

                await this.subscriptionRepository.update(localSubscription.id, {
                    status: newStatus,
                    current_period_start: new Date(subscription.current_period_start * 1000),
                    current_period_end: new Date(subscription.current_period_end * 1000)
                });

                // Update user status
                await this.userRepository.update(localSubscription.user_id, {
                    subscription_status: newStatus,
                    subscription_expires_at: new Date(subscription.current_period_end * 1000)
                });

                console.log(`Subscription updated: ${subscription.id} -> ${newStatus}`);
            }
        } catch (error) {
            console.error('Error handling subscription updated:', error);
        }
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
        try {
            const localSubscription = await this.subscriptionRepository.findOne({
                where: { external_subscription_id: subscription.id }
            });

            if (localSubscription) {
                await this.subscriptionRepository.update(localSubscription.id, {
                    status: 'cancelled',
                    cancelled_at: new Date()
                });

                // Update user status
                await this.userRepository.update(localSubscription.user_id, {
                    subscription_status: 'cancelled'
                });

                console.log(`Subscription deleted: ${subscription.id}`);
            }
        } catch (error) {
            console.error('Error handling subscription deleted:', error);
        }
    }

    private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
        try {
            console.log(`Payment method attached: ${paymentMethod.id} to customer: ${paymentMethod.customer}`);
            
            // Additional logic for when payment methods are attached
        } catch (error) {
            console.error('Error handling payment method attached:', error);
        }
    }

    async getInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
        const invoices = await this.stripe.invoices.list({
            customer: customerId,
            limit
        });

        return invoices.data;
    }

    async createRefund(
        paymentIntentId: string,
        amount?: number,
        reason?: string
    ): Promise<Stripe.Refund> {
        const refundData: Stripe.RefundCreateParams = {
            payment_intent: paymentIntentId
        };

        if (amount) {
            refundData.amount = Math.round(amount * 100); // Convert to centavos
        }

        if (reason) {
            refundData.reason = reason as any;
        }

        return await this.stripe.refunds.create(refundData);
    }

    async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    }

    async confirmPaymentIntent(
        paymentIntentId: string,
        paymentMethodId: string
    ): Promise<Stripe.PaymentIntent> {
        return await this.stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId
        });
    }

    // Helper method to convert Stripe amounts (centavos) to PHP
    centavosToPhp(centavos: number): number {
        return centavos / 100;
    }

    // Helper method to convert PHP to Stripe amounts (centavos)
    phpToCentavos(php: number): number {
        return Math.round(php * 100);
    }
}