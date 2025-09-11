import { Router } from 'express';
import { CarController } from '../controllers/car.controller';
import { authenticateToken, optionalAuth, requireRole, validateSubscription, rateLimiter } from '../middleware/auth.middleware';
import { validateCarCreation, validateCarUpdate } from '../middleware/validation.middleware';
import { UserRole } from '../entities/User';

const router = Router();
const carController = new CarController();

// Apply rate limiting to car operations
const carRateLimit = rateLimiter(30, 60 * 1000); // 30 requests per minute

// Public routes (no authentication required)
router.get('/', optionalAuth, carController.searchCars);
router.get('/featured', optionalAuth, carController.getFeaturedCars);
router.get('/:id', optionalAuth, carController.getCarById);
router.get('/:id/similar', optionalAuth, carController.getSimilarCars);

// Protected routes (authentication required)
router.use(authenticateToken);

// Car management routes
router.post('/', carRateLimit, validateSubscription, validateCarCreation, carController.createCar);
router.put('/:id', validateCarUpdate, carController.updateCar);
router.delete('/:id', carController.deleteCar);

// User-specific routes
router.get('/user/:userId', carController.getUserCars);
router.get('/my/listings', carController.getMyListings);

// Car actions
router.post('/:id/mark-sold', carController.markAsSold);
router.post('/:id/boost', validateSubscription, carController.boostListing);
router.get('/:id/statistics', carController.getCarStatistics);

// Admin only routes
router.post('/:id/approve', requireRole([UserRole.ADMIN, UserRole.MODERATOR]), carController.approveCar);
router.post('/:id/reject', requireRole([UserRole.ADMIN, UserRole.MODERATOR]), carController.rejectCar);

export default router;





