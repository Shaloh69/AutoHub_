"""
Car Marketplace Philippines - Configuration Settings
Path: server/app/config.py
Fixed: Proper handling of empty environment variables for all field types
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator, model_validator
from typing import List, Optional, Any
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    """Application settings with environment variable support - FIXED VERSION"""
    
    # Application
    APP_NAME: str = "CarMarket Philippines"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"  # Legacy support
    
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/car_marketplace_ph"
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DB_POOL_RECYCLE: int = 3600
    
    # Security - MUST be set in production via environment variables!
    SECRET_KEY: str = Field(default_factory=lambda: "CHANGE_THIS_IN_PRODUCTION_" + secrets.token_urlsafe(32))
    JWT_SECRET_KEY: str = Field(default_factory=lambda: "CHANGE_THIS_IN_PRODUCTION_" + secrets.token_urlsafe(32))
    JWT_SECRET: str = Field(default_factory=lambda: "CHANGE_THIS_IN_PRODUCTION_" + secrets.token_urlsafe(32))  # Alias
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours (legacy support)
    JWT_REFRESH_EXPIRATION_DAYS: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # Legacy support
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
    UPLOAD_DIR: str = "uploads"  # Alias for compatibility
    MAX_UPLOAD_SIZE_MB: int = 10
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB in bytes (legacy support)
    
    # Email - FIXED: Proper handling of empty SMTP_PORT
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: Optional[int] = Field(default=587)
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
    
    # Location - Philippines bounds
    DEFAULT_SEARCH_RADIUS_KM: int = 25
    MAX_SEARCH_RADIUS_KM: int = 500
    COORDINATES_PRECISION: int = 6
    PHILIPPINES_BOUNDS_NORTH: float = 21.5
    PHILIPPINES_BOUNDS_SOUTH: float = 4.5
    PHILIPPINES_BOUNDS_EAST: float = 127.0
    PHILIPPINES_BOUNDS_WEST: float = 116.0
    
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
    
    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields instead of raising error
    )
    
    @field_validator(
        'SMTP_PORT', 
        'DB_POOL_SIZE', 
        'DB_MAX_OVERFLOW', 
        'DB_POOL_RECYCLE',
        'JWT_EXPIRATION_HOURS',
        'ACCESS_TOKEN_EXPIRE_MINUTES',
        'JWT_REFRESH_EXPIRATION_DAYS',
        'REFRESH_TOKEN_EXPIRE_DAYS',
        'PASSWORD_MIN_LENGTH',
        'CACHE_TTL_SECONDS',
        'MAX_UPLOAD_SIZE_MB',
        'MAX_UPLOAD_SIZE',
        'MAX_CAR_IMAGES',
        'MAX_IMAGE_SIZE_MB',
        'DEFAULT_SEARCH_RADIUS_KM',
        'MAX_SEARCH_RADIUS_KM',
        'COORDINATES_PRECISION',
        'DEFAULT_PAGE_SIZE',
        'MAX_PAGE_SIZE',
        'RATE_LIMIT_PER_MINUTE',
        'RATE_LIMIT_PER_HOUR',
        'SESSION_MAX_AGE',
        'FREE_MAX_LISTINGS',
        'BASIC_MAX_LISTINGS',
        'PREMIUM_MAX_LISTINGS',
        'PRO_MAX_LISTINGS',
        'ENTERPRISE_MAX_LISTINGS',
        mode='before'
    )
    @classmethod
    def validate_int_fields(cls, v: Any) -> Any:
        """Convert empty strings to None for optional int fields, or use default"""
        if v == '' or v is None:
            return None
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return None
        return v
    
    @field_validator(
        'PHILIPPINES_BOUNDS_NORTH',
        'PHILIPPINES_BOUNDS_SOUTH',
        'PHILIPPINES_BOUNDS_EAST',
        'PHILIPPINES_BOUNDS_WEST',
        mode='before'
    )
    @classmethod
    def validate_float_fields(cls, v: Any) -> Any:
        """Convert empty strings to None for optional float fields, or use default"""
        if v == '' or v is None:
            return None
        if isinstance(v, str):
            try:
                return float(v)
            except ValueError:
                return None
        return v
    
    @field_validator('DEBUG', mode='before')
    @classmethod
    def validate_bool_fields(cls, v: Any) -> bool:
        """Convert various string representations to boolean"""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ('true', '1', 'yes', 'on')
        return bool(v)
    
    @model_validator(mode='after')
    def validate_and_set_defaults(self) -> 'Settings':
        """Validate settings and set intelligent defaults after initialization"""
        
        # Ensure SMTP_PORT has a valid default
        if self.SMTP_PORT is None:
            self.SMTP_PORT = 587
        
        # Ensure JWT_SECRET is set (use JWT_SECRET_KEY if JWT_SECRET not provided)
        if "CHANGE_THIS_IN_PRODUCTION" in self.JWT_SECRET:
            if "CHANGE_THIS_IN_PRODUCTION" not in self.JWT_SECRET_KEY:
                self.JWT_SECRET = self.JWT_SECRET_KEY
        
        # Parse CORS_ORIGINS from ALLOWED_ORIGINS if it's a string
        if isinstance(self.ALLOWED_ORIGINS, str):
            origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
            if origins:
                self.CORS_ORIGINS = origins
        
        # Warn if using default security keys in production
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
        
        return self


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()