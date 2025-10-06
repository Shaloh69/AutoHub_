from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
import redis
from app.config import settings

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Redis connection for caching
redis_client = redis.from_url(
    settings.REDIS_URL,
    password=settings.REDIS_PASSWORD,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)


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
    cursor.execute("SET time_zone = '+08:00'")
    cursor.close()


# Cache utilities
class CacheManager:
    """Redis cache manager with common operations"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def get(self, key: str):
        """Get value from cache"""
        try:
            return self.redis.get(key)
        except Exception as e:
            print(f"Redis GET error: {e}")
            return None
    
    def set(self, key: str, value: str, ttl: int = None):
        """Set value in cache with optional TTL"""
        try:
            if ttl:
                self.redis.setex(key, ttl, value)
            else:
                self.redis.set(key, value)
            return True
        except Exception as e:
            print(f"Redis SET error: {e}")
            return False
    
    def delete(self, key: str):
        """Delete key from cache"""
        try:
            self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Redis DELETE error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            return bool(self.redis.exists(key))
        except Exception as e:
            print(f"Redis EXISTS error: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter"""
        try:
            return self.redis.incrby(key, amount)
        except Exception as e:
            print(f"Redis INCREMENT error: {e}")
            return 0
    
    def expire(self, key: str, seconds: int):
        """Set expiration on key"""
        try:
            self.redis.expire(key, seconds)
            return True
        except Exception as e:
            print(f"Redis EXPIRE error: {e}")
            return False
    
    def keys(self, pattern: str) -> list:
        """Get all keys matching pattern"""
        try:
            return self.redis.keys(pattern)
        except Exception as e:
            print(f"Redis KEYS error: {e}")
            return []
    
    def flush_pattern(self, pattern: str):
        """Delete all keys matching pattern"""
        try:
            keys = self.keys(pattern)
            if keys:
                self.redis.delete(*keys)
            return True
        except Exception as e:
            print(f"Redis FLUSH error: {e}")
            return False


# Create cache manager instance
cache = CacheManager(redis_client)