"""
Car Marketplace Philippines - Database Configuration - COMPLETE FIXED VERSION v2
Path: server/app/database.py
FIXED: Improved cache string handling + Pylance type errors resolved
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator, Optional, Union
import redis
import json
from app.config import settings

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    poolclass=QueuePool,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=settings.DB_POOL_RECYCLE,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Redis connection for caching
redis_client: Optional[redis.Redis] = None
redis_available = False

try:
    redis_client = redis.from_url(
        settings.REDIS_URL,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,  # This ensures strings are returned, not bytes
        socket_connect_timeout=5,
        socket_timeout=5,
    )
    redis_available = True
    print("✅ Redis connection established successfully")
except Exception as e:
    print(f"❌ Redis connection failed: {e}")
    redis_client = None
    redis_available = False


def get_db() -> Generator[Session, None, None]:
    """
    Database dependency for FastAPI endpoints
    Yields a database session and ensures it's closed after use
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis() -> redis.Redis:
    """Get Redis client instance"""
    if not redis_available or redis_client is None:
        raise Exception("Redis is not available")
    return redis_client


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def close_db_connections():
    """Close all database connections"""
    engine.dispose()


# Event listener to set timezone for MySQL connections
@event.listens_for(engine, "connect")
def set_timezone(dbapi_conn, connection_record):
    """Set timezone to Philippines time for each connection (MySQL only)"""
    # Only apply for MySQL connections
    if 'mysql' in settings.DATABASE_URL.lower():
        cursor = dbapi_conn.cursor()
        try:
            cursor.execute("SET time_zone = '+08:00'")
            cursor.execute("SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'")
        finally:
            cursor.close()


# Cache utilities
class CacheManager:
    """Redis cache manager with common operations - COMPLETE FIXED VERSION v2"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis = redis_client
        self.enabled = redis_available and self.redis is not None
    
    def get(self, key: str) -> Optional[str]:
        """Get value from cache - FIXED: Proper type handling for Pylance"""
        if not self.enabled or self.redis is None:
            print(f"DEBUG: Cache disabled, cannot get key: {key}")
            return None
        
        try:
            # Redis with decode_responses=True returns str | None
            value: Union[str, bytes, None] = self.redis.get(key)  # type: ignore
            
            if value is None:
                return None
            
            # FIX: Handle both string and bytes properly with type guards
            if isinstance(value, bytes):
                # Only decode if it's actually bytes
                decoded_value: str = value.decode('utf-8')
                return decoded_value.strip()
            elif isinstance(value, str):
                # Already a string, just strip
                return value.strip()
            else:
                # Fallback: convert to string
                return str(value).strip()
                
        except Exception as e:
            print(f"❌ Redis GET error for key '{key}': {e}")
            return None
    
    def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL - FIXED: Proper type handling"""
        if not self.enabled or self.redis is None:
            print(f"DEBUG: Cache disabled, cannot set key: {key}")
            return False
        
        try:
            # FIX: Ensure value is a clean string before storage
            clean_value: str = str(value).strip()
            
            # Set value with or without TTL
            if ttl:
                result = self.redis.setex(key, ttl, clean_value)  # type: ignore
            else:
                result = self.redis.set(key, clean_value)  # type: ignore
            
            # Verify the value was stored correctly
            if result:
                stored_value: Union[str, bytes, None] = self.redis.get(key)  # type: ignore
                
                if stored_value is not None:
                    # Normalize stored value to string
                    if isinstance(stored_value, bytes):
                        stored_str: str = stored_value.decode('utf-8')
                    else:
                        stored_str: str = str(stored_value)
                    
                    # Verify match
                    if stored_str.strip() == clean_value:
                        print(f"✅ Successfully stored key '{key}' (length: {len(clean_value)})")
                        return True
                    else:
                        print(f"⚠️ WARNING: Stored value differs from input for key '{key}'")
                        return False
            
            return bool(result)
            
        except Exception as e:
            print(f"❌ Redis SET error for key '{key}': {e}")
            return False
    
    def get_json(self, key: str) -> Optional[dict]:
        """Get JSON value from cache"""
        value = self.get(key)
        if value:
            try:
                return json.loads(value)
            except Exception as e:
                print(f"❌ JSON parse error for key '{key}': {e}")
                return None
        return None
    
    def set_json(self, key: str, value: dict, ttl: Optional[int] = None) -> bool:
        """Set JSON value in cache"""
        try:
            return self.set(key, json.dumps(value), ttl)
        except Exception as e:
            print(f"❌ JSON stringify error for key '{key}': {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.enabled or self.redis is None:
            return False
        
        try:
            self.redis.delete(key)  # type: ignore
            print(f"✅ Deleted key '{key}'")
            return True
        except Exception as e:
            print(f"❌ Redis DELETE error for key '{key}': {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.enabled or self.redis is None:
            return False
        
        try:
            result: int = self.redis.exists(key)  # type: ignore
            return result > 0
        except Exception as e:
            print(f"❌ Redis EXISTS error for key '{key}': {e}")
            return False
    
    def incr(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment value in cache"""
        if not self.enabled or self.redis is None:
            return None
        
        try:
            result: int = self.redis.incrby(key, amount)  # type: ignore
            return result
        except Exception as e:
            print(f"❌ Redis INCR error for key '{key}': {e}")
            return None
    
    def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on key"""
        if not self.enabled or self.redis is None:
            return False
        
        try:
            result: bool = self.redis.expire(key, seconds)  # type: ignore
            return result
        except Exception as e:
            print(f"❌ Redis EXPIRE error for key '{key}': {e}")
            return False


# Global cache instance
cache = CacheManager(redis_client)