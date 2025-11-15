"""
Car Marketplace Philippines - Main Application Entry Point
Path: car_marketplace_ph/main.py
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import logging
import os
from typing import List, Any

# Import settings
from app.config import settings
from app.database import engine, Base, close_db_connections
from app.api.v1 import auth, cars, users, subscriptions, inquiries, transactions, analytics, admin, locations  

# Create required directories BEFORE configuring logging
os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)

# Configure logging - Only log to file in production to avoid reload loop
# Use List[Any] to avoid type checking issues with handler types
handlers: List[Any] = [logging.StreamHandler()]

# Only add file handler in production or when explicitly needed
if not settings.DEBUG or os.environ.get("ENABLE_FILE_LOGGING") == "true":
    handlers.append(logging.FileHandler(settings.LOG_FILE))

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=handlers
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("=" * 70)
    logger.info("Starting up Car Marketplace Philippines API...")
    logger.info(f"Environment: {'DEBUG' if settings.DEBUG else 'PRODUCTION'}")
    logger.info(f"Version: {settings.APP_VERSION}")
    
    # Create required directories (double-check)
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database tables created successfully")
    except Exception as e:
        logger.error(f"✗ Error creating database tables: {e}")
        raise
    
    logger.info("✓ Application startup complete")
    logger.info("=" * 70)
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    close_db_connections()
    logger.info("✓ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Complete Car Marketplace Platform for Philippines - Multi-tier subscriptions, location-based search, fraud detection",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-Request-ID"]
)


# Request timing and logging middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses"""
    start_time = time.time()
    
    # Generate request ID
    request_id = f"{int(time.time())}-{id(request)}"
    request.state.request_id = request_id
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    response.headers["X-Request-ID"] = request_id
    
    # Log request (but not every single one in debug to reduce noise)
    if not settings.DEBUG or request.url.path not in ["/health", "/favicon.ico"]:
        logger.info(
            f"Request: {request.method} {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Time: {process_time:.4f}s | "
            f"ID: {request_id}"
        )
    
    return response


# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle ValueError exceptions"""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"success": False, "error": str(exc)}
    )


@app.exception_handler(PermissionError)
async def permission_error_handler(request: Request, exc: PermissionError):
    """Handle PermissionError exceptions"""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"success": False, "error": str(exc)}
    )


@app.exception_handler(FileNotFoundError)
async def not_found_error_handler(request: Request, exc: FileNotFoundError):
    """Handle FileNotFoundError exceptions"""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"success": False, "error": str(exc)}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error" if not settings.DEBUG else str(exc)
        }
    )


# Mount static files directory
if settings.USE_LOCAL_STORAGE:
    if os.path.exists(settings.LOCAL_UPLOAD_DIR):
        app.mount(
            "/uploads",
            StaticFiles(directory=settings.LOCAL_UPLOAD_DIR),
            name="uploads"
        )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "development" if settings.DEBUG else "production"
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API root endpoint"""
    return {
        "message": "Welcome to Car Marketplace Philippines API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs" if settings.DEBUG else "Not available in production",
        "health": "/health"
    }


# Include routers with prefixes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(cars.router, prefix="/api/v1/cars", tags=["Cars"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["Subscriptions"])
app.include_router(inquiries.router, prefix="/api/v1/inquiries", tags=["Inquiries"])
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["Transactions"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Locations"])


if __name__ == "__main__":
    import uvicorn
    
    # Simple approach: just run without file watching on logs
    # Uvicorn will automatically exclude common patterns
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )