// src/routes/admin.routes.ts
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';

const adminRouter = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin/moderator role
adminRouter.use(authenticateToken);
adminRouter.use(requireRole([UserRole.ADMIN, UserRole.MODERATOR]));

// Dashboard analytics
adminRouter.get('/analytics', adminController.getAnalytics);
adminRouter.get('/analytics/realtime', adminController.getRealtimeAnalytics);

// Car management
adminRouter.get('/cars/pending', adminController.getPendingCars);
adminRouter.post('/cars/:id/approve', adminController.approveCar);
adminRouter.post('/cars/:id/reject', adminController.rejectCar);

// User management
adminRouter.get('/users', adminController.getUsers);
adminRouter.post('/users/:id/ban', adminController.banUser);
adminRouter.post('/users/:id/unban', adminController.unbanUser);

// Subscription management
adminRouter.get('/subscriptions', adminController.getSubscriptions);
adminRouter.get('/subscriptions/analytics', adminController.getSubscriptionAnalytics);

// System management
adminRouter.get('/system/stats', adminController.getSystemStats);

export { adminRouter };