import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { ValidationError } from 'class-validator';

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}

export class AppError extends Error implements ApiError {
    public statusCode: number;
    public code: string;
    public details?: any;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || 'INTERNAL_ERROR';
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}

export class PaymentError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 402, 'PAYMENT_ERROR', details);
    }
}

export class SubscriptionError extends AppError {
    constructor(message: string) {
        super(message, 403, 'SUBSCRIPTION_ERROR');
    }
}

export const errorHandler = (
    error: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    // Handle different error types
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        details = error.details;
    } else if (error instanceof QueryFailedError) {
        // Database errors
        statusCode = 500;
        code = 'DATABASE_ERROR';
        
        // Handle specific database errors
        if (error.message.includes('Duplicate entry')) {
            statusCode = 409;
            code = 'DUPLICATE_ENTRY';
            message = 'Resource already exists';
            
            // Extract field name from MySQL error
            const duplicateMatch = error.message.match(/Duplicate entry '.*' for key '.*\.(.*)'/);
            if (duplicateMatch) {
                details = { field: duplicateMatch[1] };
                message = `${duplicateMatch[1]} already exists`;
            }
        } else if (error.message.includes('foreign key constraint')) {
            statusCode = 400;
            code = 'FOREIGN_KEY_CONSTRAINT';
            message = 'Invalid reference to related resource';
        } else if (error.message.includes('Data too long')) {
            statusCode = 400;
            code = 'DATA_TOO_LONG';
            message = 'Data exceeds maximum length';
        } else {
            message = process.env.NODE_ENV === 'development' 
                ? error.message 
                : 'Database operation failed';
        }
    } else if (error.name === 'ValidationError') {
        // Class-validator errors
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Validation failed';
        
        if (error instanceof Error && 'errors' in error) {
            details = (error as any).errors.map((err: ValidationError) => ({
                field: err.property,
                constraints: err.constraints
            }));
        }
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Authentication token has expired';
    } else if (error.name === 'SyntaxError' && 'body' in error) {
        statusCode = 400;
        code = 'INVALID_JSON';
        message = 'Invalid JSON in request body';
    } else if (error.name === 'MulterError') {
        statusCode = 400;
        code = 'FILE_UPLOAD_ERROR';
        
        const multerError = error as any;
        switch (multerError.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File size too large';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field';
                break;
            default:
                message = 'File upload failed';
        }
    }

    // Log error details
    const errorLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).userId || null,
        statusCode,
        code,
        message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    console.error('API Error:', errorLog);

    // Send error response
    const response: any = {
        error: message,
        code,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    };

    if (details) {
        response.details = details;
    }

    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    });
};

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Create error instances for common scenarios
export const createError = {
    validation: (message: string, details?: any) => new ValidationError(message, details),
    authentication: (message?: string) => new AuthenticationError(message),
    authorization: (message?: string) => new AuthorizationError(message),
    notFound: (resource?: string) => new NotFoundError(resource),
    conflict: (message: string) => new ConflictError(message),
    rateLimit: (message?: string) => new RateLimitError(message),
    payment: (message: string, details?: any) => new PaymentError(message, details),
    subscription: (message: string) => new SubscriptionError(message)
};

// Error handling utilities
export const handleDatabaseError = (error: QueryFailedError): AppError => {
    if (error.message.includes('Duplicate entry')) {
        return new ConflictError('Resource already exists');
    }
    
    if (error.message.includes('foreign key constraint')) {
        return new ValidationError('Invalid reference to related resource');
    }
    
    return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

export const handleValidationErrors = (errors: ValidationError[]): AppError => {
    const details = errors.map(error => ({
        field: error.property,
        constraints: error.constraints
    }));
    
    return new ValidationError('Validation failed', details);
};

// Development error handler with more details
export const developmentErrorHandler = (
    error: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Development Error Details:');
    console.error('Error:', error);
    console.error('Request:', {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Call the main error handler
    errorHandler(error, req, res, next);
};

// Production error handler (sanitized)
export const productionErrorHandler = (
    error: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Only log essential information in production
    console.error('Production Error:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: (req as any).userId || null,
        message: error.message,
        stack: error.stack
    });

    // Call the main error handler
    errorHandler(error, req, res, next);
};

// Choose error handler based on environment
export const getErrorHandler = () => {
    return process.env.NODE_ENV === 'development' 
        ? developmentErrorHandler 
        : productionErrorHandler;
};