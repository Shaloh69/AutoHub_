// src/routes/upload.routes.ts
import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticateToken, rateLimiter } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const uploadRouter = Router();
const uploadController = new UploadController();

// All upload routes require authentication
uploadRouter.use(authenticateToken);

// Apply rate limiting
const uploadRateLimit = rateLimiter(20, 60 * 1000); // 20 uploads per minute

// File upload routes
uploadRouter.post('/car-images', uploadRateLimit, uploadMiddleware.array('images', 20), uploadController.uploadCarImages);
uploadRouter.post('/profile-image', uploadRateLimit, uploadMiddleware.single('image'), uploadController.uploadProfileImage);
uploadRouter.post('/documents', uploadRateLimit, uploadMiddleware.array('documents', 5), uploadController.uploadDocuments);

// Image management
uploadRouter.delete('/images/:id', uploadController.deleteImage);
uploadRouter.post('/images/:id/set-primary', uploadController.setPrimaryImage);

export default uploadRouter;