

// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import carRoutes from './cars.routes';
import { subscriptionRouter } from './subscriptions.routes';
import { adminRouter } from './admin.routes';
import notificationRoutes from './notifications.routes';
import uploadRoutes from './upload.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Car Marketplace API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/cars', carRoutes);
router.use('/subscriptions', subscriptionRouter);
router.use('/admin', adminRouter);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

export default router;