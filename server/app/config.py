from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "CarMarket Philippines"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/car_marketplace_ph"
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DB_POOL_RECYCLE: int = 3600
    
    # Security - MUST be set in production via environment variables!
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_" + secrets.token_urlsafe(32)
    JWT_SECRET: str = "CHANGE_THIS_IN_PRODUCTION_" + secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    JWT_REFRESH_EXPIRATION_DAYS: int = 30
    PASSWORD_MIN_LENGTH: int = 8
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None
    CACHE_TTL_SECONDS: int = 300
    
    # Payment Providers
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    GCASH_API_KEY: Optional[str] = None
    GCASH_API_SECRET: Optional[str] = None
    GCASH_MERCHANT_ID: Optional[str] = None
    GCASH_BASE_URL: str = "https://api-sandbox.gcash.com"
    
    PAYMAYA_PUBLIC_KEY: Optional[str] = None
    PAYMAYA_SECRET_KEY: Optional[str] = None
    PAYMAYA_BASE_URL: str = "https://pg-sandbox.paymaya.com"
    
    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "ap-southeast-1"
    S3_BASE_URL: Optional[str] = None
    
    # Local Storage
    USE_LOCAL_STORAGE: bool = True
    LOCAL_UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@carmarketplace.ph"
    SMTP_FROM_NAME: str = "CarMarket Philippines"
    SMTP_USE_TLS: bool = True
    
    # SMS
    SMS_PROVIDER: str = "twilio"
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    SEMAPHORE_API_KEY: Optional[str] = None
    MOVIDER_API_KEY: Optional[str] = None
    
    # File Upload
    MAX_CAR_IMAGES: int = 20
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    MAX_IMAGE_SIZE_MB: int = 5
    
    # Location
    DEFAULT_SEARCH_RADIUS_KM: int = 25
    MAX_SEARCH_RADIUS_KM: int = 500
    COORDINATES_PRECISION: int = 6
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Session
    SESSION_COOKIE_NAME: str = "car_marketplace_session"
    SESSION_MAX_AGE: int = 86400
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    # Subscription Plans
    FREE_MAX_LISTINGS: int = 3
    BASIC_MAX_LISTINGS: int = 10
    PREMIUM_MAX_LISTINGS: int = 25
    PRO_MAX_LISTINGS: int = 100
    ENTERPRISE_MAX_LISTINGS: int = 999999
    
    # Image Processing
    THUMBNAIL_SIZE: tuple = (150, 150)
    MEDIUM_SIZE: tuple = (800, 600)
    LARGE_SIZE: tuple = (1920, 1440)
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        """Initialize settings and validate security keys"""
        super().__init__(**kwargs)
        
        # Warn if using default security keys
        if not self.DEBUG:
            if "CHANGE_THIS_IN_PRODUCTION" in self.SECRET_KEY:
                import warnings
                warnings.warn(
                    "⚠️  WARNING: Using default SECRET_KEY in production! "
                    "Set SECRET_KEY environment variable immediately!",
                    RuntimeWarning
                )
            
            if "CHANGE_THIS_IN_PRODUCTION" in self.JWT_SECRET:
                import warnings
                warnings.warn(
                    "⚠️  WARNING: Using default JWT_SECRET in production! "
                    "Set JWT_SECRET environment variable immediately!",
                    RuntimeWarning
                )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()