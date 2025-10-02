from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Car Marketplace Philippines"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = False
    
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/car_marketplace_ph"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600
    DB_ECHO: bool = False
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars-long"
    JWT_SECRET_KEY: str = "jwt-secret-key-change-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_MIN_LENGTH: int = 8
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list = ["*"]
    CORS_HEADERS: list = ["*"]
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 300
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/webp"]
    MAX_IMAGES_PER_LISTING: int = 20
    
    # AWS S3
    USE_S3: bool = False
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "ap-southeast-1"
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@carmarketplace.ph"
    SMTP_FROM_NAME: str = "Car Marketplace Philippines"
    
    # Payment - Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Payment - GCash
    GCASH_API_KEY: Optional[str] = None
    GCASH_API_SECRET: Optional[str] = None
    GCASH_API_URL: str = "https://api.gcash.com"
    
    # Payment - PayMaya
    PAYMAYA_PUBLIC_KEY: Optional[str] = None
    PAYMAYA_SECRET_KEY: Optional[str] = None
    PAYMAYA_API_URL: str = "https://pg.paymaya.com"
    
    # Subscription
    FREE_TRIAL_DAYS: int = 7
    SUBSCRIPTION_GRACE_PERIOD_DAYS: int = 3
    SUBSCRIPTION_REMINDER_DAYS: list = [7, 3, 1]
    
    # Listing
    LISTING_EXPIRY_DAYS: int = 60
    MAX_FREE_LISTINGS_PER_MONTH: int = 3
    BOOST_LISTING_DURATION_HOURS: int = 168
    FEATURED_LISTING_DURATION_HOURS: int = 720
    
    # Location
    DEFAULT_SEARCH_RADIUS_KM: int = 25
    MAX_SEARCH_RADIUS_KM: int = 500
    COORDINATE_PRECISION_METERS: int = 100
    
    # Philippines Bounds
    PHILIPPINES_BOUNDS_NORTH: float = 21.0
    PHILIPPINES_BOUNDS_SOUTH: float = 4.0
    PHILIPPINES_BOUNDS_EAST: float = 127.0
    PHILIPPINES_BOUNDS_WEST: float = 116.0
    
    # Car Validation
    MAX_CAR_YEAR: int = 2026
    MIN_CAR_YEAR: int = 1900
    MIN_LISTING_PRICE: float = 50000.0
    MAX_LISTING_PRICE: float = 50000000.0
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Fraud Detection
    MAX_FRAUD_SCORE: float = 5.0
    AUTO_SUSPEND_FRAUD_SCORE: float = 8.0
    
    # Monitoring
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = True
    SENTRY_DSN: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Create uploads directory if it doesn't exist
def ensure_upload_dir():
    settings = get_settings()
    if not settings.USE_S3:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIR, "cars"), exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIR, "users"), exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIR, "documents"), exist_ok=True)