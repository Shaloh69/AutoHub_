from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
import redis
from config import get_settings

settings = get_settings()

# Create database engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=True,
    echo=settings.DB_ECHO,
)

# Set MySQL specific settings
@event.listens_for(engine, "connect")
def set_mysql_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("SET time_zone = '+08:00'")
    cursor.execute("SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'")
    cursor.close()

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Redis connection
redis_client = redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)


def get_db() -> Generator[Session, None, None]:
    """
    Database dependency for FastAPI endpoints.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis():
    """
    Redis dependency for FastAPI endpoints.
    Returns the Redis client.
    """
    return redis_client


class DatabaseManager:
    """Utility class for database operations"""
    
    @staticmethod
    def create_all_tables():
        """Create all tables in the database"""
        Base.metadata.create_all(bind=engine)
    
    @staticmethod
    def drop_all_tables():
        """Drop all tables from the database"""
        Base.metadata.drop_all(bind=engine)
    
    @staticmethod
    def get_session() -> Session:
        """Get a new database session"""
        return SessionLocal()
    
    @staticmethod
    def close_session(db: Session):
        """Close a database session"""
        db.close()


class CacheManager:
    """Utility class for Redis cache operations"""
    
    @staticmethod
    def get(key: str):
        """Get value from cache"""
        try:
            return redis_client.get(key)
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    @staticmethod
    def set(key: str, value: str, ttl: int = None):
        """Set value in cache with optional TTL"""
        try:
            if ttl:
                redis_client.setex(key, ttl, value)
            else:
                redis_client.set(key, value)
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    @staticmethod
    def delete(key: str):
        """Delete key from cache"""
        try:
            redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    @staticmethod
    def exists(key: str) -> bool:
        """Check if key exists in cache"""
        try:
            return redis_client.exists(key) > 0
        except Exception as e:
            print(f"Cache exists error: {e}")
            return False
    
    @staticmethod
    def flush_pattern(pattern: str):
        """Delete all keys matching pattern"""
        try:
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
            return True
        except Exception as e:
            print(f"Cache flush error: {e}")
            return False
    
    @staticmethod
    def increment(key: str, amount: int = 1) -> int:
        """Increment counter"""
        try:
            return redis_client.incrby(key, amount)
        except Exception as e:
            print(f"Cache increment error: {e}")
            return 0
    
    @staticmethod
    def set_hash(name: str, mapping: dict, ttl: int = None):
        """Set hash with optional TTL"""
        try:
            redis_client.hset(name, mapping=mapping)
            if ttl:
                redis_client.expire(name, ttl)
            return True
        except Exception as e:
            print(f"Cache set hash error: {e}")
            return False
    
    @staticmethod
    def get_hash(name: str, key: str = None):
        """Get hash value or entire hash"""
        try:
            if key:
                return redis_client.hget(name, key)
            return redis_client.hgetall(name)
        except Exception as e:
            print(f"Cache get hash error: {e}")
            return None


def test_database_connection():
    """Test database connection"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False


def test_redis_connection():
    """Test Redis connection"""
    try:
        redis_client.ping()
        return True
    except Exception as e:
        print(f"Redis connection error: {e}")
        return False