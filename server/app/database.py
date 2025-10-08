from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator, Optional
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
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
    )
    redis_available = True
except Exception as e:
    print(f"Redis connection failed: {e}")
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
    """Set timezone to Philippines time for each connection"""
    cursor = dbapi_conn.cursor()
    try:
        cursor.execute("SET time_zone = '+08:00'")
        cursor.execute("SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'")
    finally:
        cursor.close()


# Cache utilities
class CacheManager:
    """Redis cache manager with common operations"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis = redis_client
        self.enabled = redis_available and self.redis is not None
    
    def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        if not self.enabled:
            return None
        try:
            return self.redis.get(key)  # type: ignore
        except Exception as e:
            print(f"Redis GET error: {e}")
            return None
    
    def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        if not self.enabled:
            return False
        try:
            if ttl:
                self.redis.setex(key, ttl, value)  # type: ignore
            else:
                self.redis.set(key, value)  # type: ignore
            return True
        except Exception as e:
            print(f"Redis SET error: {e}")
            return False
    
    def get_json(self, key: str) -> Optional[dict]:
        """Get JSON value from cache"""
        value = self.get(key)
        if value:
            try:
                return json.loads(value)
            except:
                return None
        return None
    
    def set_json(self, key: str, value: dict, ttl: Optional[int] = None) -> bool:
        """Set JSON value in cache"""
        try:
            return self.set(key, json.dumps(value), ttl)
        except:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.enabled:
            return False
        try:
            self.redis.delete(key)  # type: ignore
            return True
        except Exception as e:
            print(f"Redis DELETE error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.enabled:
            return False
        try:
            return self.redis.exists(key) > 0  # type: ignore
        except Exception as e:
            print(f"Redis EXISTS error: {e}")
            return False
    
    def incr(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment value in cache"""
        if not self.enabled:
            return None
        try:
            return self.redis.incrby(key, amount)  # type: ignore
        except Exception as e:
            print(f"Redis INCR error: {e}")
            return None
    
    def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on key"""
        if not self.enabled:
            return False
        try:
            return self.redis.expire(key, seconds)  # type: ignore
        except Exception as e:
            print(f"Redis EXPIRE error: {e}")
            return False


# Global cache instance
cache = CacheManager(redis_client)