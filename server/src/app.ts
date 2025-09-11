import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import { connectDatabase } from './config/database';
import { AdminSocket } from './websocket/admin.socket';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logRequest } from './middleware/auth.middleware';
import routes from './routes';

class App {
    public app: express.Application;
    public server: any;
    public adminSocket: AdminSocket;

    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.adminSocket = new AdminSocket(this.server);
        
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security middleware
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
                : true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Logging middleware
        if (process.env.NODE_ENV === 'development') {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(morgan('combined'));
        }

        // Request logging
        this.app.use(logRequest);

        // Body parsing middleware
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req: any, res, buf) => {
                // Store raw body for webhook verification
                if (req.originalUrl?.includes('/webhook')) {
                    req.rawBody = buf;
                }
            }
        }));
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: '10mb' 
        }));

        // Static files
        this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

        // Health check endpoint (before other routes)
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                message: 'Car Marketplace API is running',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                version: process.env.APP_VERSION || '1.0.0',
                uptime: process.uptime()
            });
        });

        // Trust proxy (for rate limiting and IP detection)
        this.app.set('trust proxy', 1);
    }

    private initializeRoutes(): void {
        // API routes
        this.app.use('/api', routes);

        // Serve API documentation
        if (process.env.NODE_ENV === 'development') {
            this.app.get('/docs', (req, res) => {
                res.json({
                    message: 'Car Marketplace API Documentation',
                    version: '1.0.0',
                    endpoints: {
                        auth: '/api/auth/*',
                        cars: '/api/cars/*',
                        subscriptions: '/api/subscriptions/*',
                        admin: '/api/admin/*',
                        notifications: '/api/notifications/*',
                        upload: '/api/upload/*'
                    },
                    websocket: {
                        admin: '/admin-socket'
                    }
                });
            });
        }
    }

    private initializeErrorHandling(): void {
        // 404 handler
        this.app.use(notFoundHandler);

        // Global error handler
        this.app.use(errorHandler);

        // Graceful shutdown handlers
        process.on('SIGTERM', this.gracefulShutdown.bind(this));
        process.on('SIGINT', this.gracefulShutdown.bind(this));

        // Unhandled promise rejection
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            // In production, you might want to exit the process
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        });

        // Uncaught exception
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            process.exit(1);
        });
    }

    public async start(): Promise<void> {
        try {
            // Connect to database
            await connectDatabase();
            console.log('✅ Database connected successfully');

            // Start server
            const PORT = process.env.PORT || 3000;
            
            this.server.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
                console.log(`📊 Admin Socket.io available for real-time updates`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
                
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
                    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
                }
            });

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    private async gracefulShutdown(signal: string): Promise<void> {
        console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);

        // Stop accepting new connections
        this.server.close(async () => {
            console.log('🔒 HTTP server closed');

            try {
                // Close database connections
                if (require('../config/database').AppDataSource?.isInitialized) {
                    await require('../config/database').AppDataSource.destroy();
                    console.log('💾 Database connections closed');
                }

                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        });

        // Force close after timeout
        setTimeout(() => {
            console.error('⏰ Shutdown timeout reached, forcing exit');
            process.exit(1);
        }, 10000);
    }

    public getApp(): express.Application {
        return this.app;
    }

    public getAdminSocket(): AdminSocket {
        return this.adminSocket;
    }
}

// Create and export app instance
const appInstance = new App();

// Start the server if this file is run directly
if (require.main === module) {
    appInstance.start().catch((error) => {
        console.error('Failed to start application:', error);
        process.exit(1);
    });
}

export default appInstance;
export { App };