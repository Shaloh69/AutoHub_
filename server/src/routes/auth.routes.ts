import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken, rateLimiter, checkMaintenanceMode } from '../middleware/auth.middleware';
import { validateRegistration, validateLogin, validatePasswordChange } from '../middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

// Apply maintenance mode check to all routes
router.use(checkMaintenanceMode);

// Apply rate limiting to auth routes
const authRateLimit = rateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes

// Public routes
router.post('/register', authRateLimit, validateRegistration, authController.register);
router.post('/login', authRateLimit, validateLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authRateLimit, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.use(authenticateToken);
router.get('/profile', authController.profile);
router.put('/profile', authController.updateProfile);
router.post('/change-password', validatePasswordChange, authController.changePassword);
router.post('/logout', authController.logout);
router.get('/validate-token', authController.validateToken);

export default router;