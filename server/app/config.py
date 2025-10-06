from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


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
    
    # Security
    SECRET_KEY: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    JWT_REFRESH_EXPIRATION_DAYS: int = 30
    
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
    COORDINATE_PRECISION_METERS: int = 100
    
    # Subscription
    FREE_TRIAL_DAYS: int = 7
    SUBSCRIPTION_GRACE_PERIOD_DAYS: int = 3
    BOOST_LISTING_DURATION_HOURS: int = 168
    FEATURED_LISTING_DURATION_HOURS: int = 720
    
    # Fraud Detection
    ENABLE_FRAUD_DETECTION: bool = True
    FRAUD_THRESHOLD_SCORE: float = 0.75
    MAX_PRICE_DEVIATION_PERCENT: int = 50
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Admin
    ADMIN_EMAIL: str = "admin@carmarketplace.ph"
    SUPPORT_EMAIL: str = "support@carmarketplace.ph"
    
    # Feature Flags
    ENABLE_SUBSCRIPTIONS: bool = True
    ENABLE_SMS_NOTIFICATIONS: bool = True
    ENABLE_EMAIL_NOTIFICATIONS: bool = True
    MAINTENANCE_MODE: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Create settings instance
settings = get_settings()