import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';

export interface AuthRequest extends Request {
    user?: any;
    userId?: number;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Access token required',
                code: 'TOKEN_REQUIRED'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        if (decoded.type !== 'access') {
            return res.status(403).json({ 
                error: 'Invalid token type',
                code: 'INVALID_TOKEN_TYPE'
            });
        }

        // Verify user still exists and is active
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId }
        });

        if (!user || !user.is_active || user.is_banned) {
            return res.status(403).json({ 
                error: 'User account is inactive or banned',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = decoded;
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ 
            error: 'Invalid or expired token',
            code: 'TOKEN_INVALID'
        });
    }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next(); // Continue without authentication
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        if (decoded.type === 'access') {
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: decoded.userId }
            });

            if (user && user.is_active && !user.is_banned) {
                req.user = decoded;
                req.userId = decoded.userId;
            }
        }
    } catch (error) {
        // Ignore token errors for optional auth
    }
    
    next();
};

export const requireRole = (roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
                required_roles: roles,
                user_role: req.user.role
            });
        }

        next();
    };
};

export const requireOwnership = (resourceIdParam: string = 'id') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const resourceId = parseInt(req.params[resourceIdParam]);
        
        // Admin users can access any resource
        if ([UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
            return next();
        }

        // For car resources, check if user is the seller
        if (req.baseUrl.includes('/cars')) {
            const carRepository = AppDataSource.getRepository('Car');
            const car = await carRepository.findOne({
                where: { id: resourceId }
            });

            if (!car) {
                return res.status(404).json({ 
                    error: 'Resource not found',
                    code: 'RESOURCE_NOT_FOUND'
                });
            }

            if (car.seller_id !== req.user.userId) {
                return res.status(403).json({ 
                    error: 'You can only access your own resources',
                    code: 'OWNERSHIP_REQUIRED'
                });
            }
        }

        next();
    };
};

export const rateLimiter = (maxRequests: number, windowMs: number) => {
    const requests = new Map();

    return (req: Request, res: Response, next: NextFunction) => {
        const identifier = req.ip + (req.user ? `:${req.user.userId}` : '');
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        if (requests.has(identifier)) {
            const userRequests = requests.get(identifier).filter(
                (timestamp: number) => timestamp > windowStart
            );
            requests.set(identifier, userRequests);
        } else {
            requests.set(identifier, []);
        }

        const userRequests = requests.get(identifier);

        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retry_after: windowMs / 1000
            });
        }

        userRequests.push(now);
        next();
    };
};

export const validateSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }

    // Skip subscription check for admins
    if ([UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
        return next();
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
        where: { id: req.user.userId }
    });

    if (!user) {
        return res.status(404).json({ 
            error: 'User not found',
            code: 'USER_NOT_FOUND'
        });
    }

    // Check if subscription is expired
    if (user.subscription_expires_at && user.subscription_expires_at < new Date()) {
        return res.status(403).json({
            error: 'Subscription expired',
            code: 'SUBSCRIPTION_EXPIRED',
            expires_at: user.subscription_expires_at
        });
    }

    next();
};

export const checkMaintenanceMode = (req: Request, res: Response, next: NextFunction) => {
    const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    if (maintenanceMode) {
        // Allow admin access during maintenance
        if (req.user && [UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
            return next();
        }

        return res.status(503).json({
            error: 'System is under maintenance',
            code: 'MAINTENANCE_MODE',
            message: 'The system is temporarily unavailable for maintenance. Please try again later.'
        });
    }

    next();
};

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'API key required',
            code: 'API_KEY_REQUIRED'
        });
    }

    if (apiKey !== process.env.API_KEY) {
        return res.status(403).json({
            error: 'Invalid API key',
            code: 'INVALID_API_KEY'
        });
    }

    next();
};

export const logRequest = (req: AuthRequest, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.userId || null,
            timestamp: new Date().toISOString()
        };

        // Log to console in development, to proper logging service in production
        if (process.env.NODE_ENV === 'development') {
            console.log('Request:', logData);
        }
        
        // In production, you would send this to a logging service like Winston, DataDog, etc.
    });

    next();
};