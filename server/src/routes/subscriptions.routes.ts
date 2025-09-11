// src/routes/subscriptions.routes.ts
import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticateToken, requireRole, rateLimiter } from '../middleware/auth.middleware';
import { validateSubscription as validateSubscriptionData } from '../middleware/validation.middleware';
import { UserRole } from '../entities/User';

const subscriptionRouter = Router();
const subscriptionController = new SubscriptionController();

// Apply rate limiting
const subscriptionRateLimit = rateLimiter(10, 60 * 1000); // 10 requests per minute

// Public routes
subscriptionRouter.get('/plans', subscriptionController.getAllPlans);
subscriptionRouter.get('/plans/:id', subscriptionController.getPlan);

// Protected routes
subscriptionRouter.use(authenticateToken);

// Subscription management
subscriptionRouter.post('/', subscriptionRateLimit, validateSubscriptionData, subscriptionController.subscribe);
subscriptionRouter.get('/current', subscriptionController.getCurrentSubscription);
subscriptionRouter.get('/history', subscriptionController.getSubscriptionHistory);
subscriptionRouter.post('/cancel', subscriptionController.cancelSubscription);
subscriptionRouter.post('/upgrade', subscriptionController.upgradeSubscription);

// User limits and status
subscriptionRouter.get('/limits', subscriptionController.getUserLimits);
subscriptionRouter.get('/status', subscriptionController.checkSubscriptionStatus);

// Payment methods
subscriptionRouter.post('/payment/intent', subscriptionController.createPaymentIntent);
subscriptionRouter.post('/payment/setup-intent', subscriptionController.createSetupIntent);
subscriptionRouter.get('/payment/methods', subscriptionController.getPaymentMethods);
subscriptionRouter.get('/payment/invoices', subscriptionController.getInvoices);

// Promo codes
subscriptionRouter.post('/promo/validate', subscriptionController.validatePromoCode);

// Admin analytics
subscriptionRouter.get('/analytics', requireRole([UserRole.ADMIN, UserRole.MODERATOR]), subscriptionController.getSubscriptionAnalytics);

// Webhook (no auth required)
subscriptionRouter.post('/webhook', subscriptionController.handleWebhook);

export { subscriptionRouter };