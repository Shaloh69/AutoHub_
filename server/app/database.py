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


def init_redis() -> tuple[Optional[redis.Redis], bool]:
    """
    Initialize Redis connection with proper error handling and health checks

    Returns:
        tuple: (redis_client, redis_available)
    """
    try:
        client = redis.from_url(
            settings.REDIS_URL,
            password=settings.REDIS_PASSWORD,
            decode_responses=True,  # This ensures strings are returned, not bytes
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30,  # Health check every 30 seconds
        )

        # Test the connection with ping
        client.ping()
        print("✅ Redis connection established successfully")
        return client, True

    except redis.ConnectionError as e:
        print(f"⚠️  Redis connection failed: {e}")
        print("📝 Application will run without caching. Set REDIS_URL in .env to enable caching.")
        return None, False
    except redis.AuthenticationError as e:
        print(f"⚠️  Redis authentication failed: {e}")
        print("📝 Check REDIS_PASSWORD in .env file.")
        return None, False
    except Exception as e:
        print(f"⚠️  Redis initialization error: {e}")
        print("📝 Application will continue without Redis caching.")
        return None, False


# Initialize Redis on startup
redis_client, redis_available = init_redis()


def check_redis_health() -> bool:
    """
    Check if Redis connection is healthy and attempt reconnection if needed

    Returns:
        bool: True if Redis is available and responding
    """
    global redis_client, redis_available

    if not redis_available or redis_client is None:
        return False

    try:
        redis_client.ping()
        return True
    except Exception as e:
        print(f"⚠️  Redis health check failed: {e}")
        print("📝 Attempting to reconnect...")

        # Try to reconnect
        redis_client, redis_available = init_redis()
        return redis_available


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
    """
    Get Redis client instance with health check

    Raises:
        Exception: If Redis is not available
    """
    global redis_client, redis_available

    # Check health before returning client
    if not check_redis_health():
        raise Exception("Redis is not available")

    if redis_client is None:
        raise Exception("Redis client is None")

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
    """Redis cache manager with graceful failure handling - IMPROVED VERSION v3"""

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis = redis_client
        self.enabled = redis_available and self.redis is not None

    def _check_connection(self) -> bool:
        """Check if Redis connection is healthy"""
        global redis_client, redis_available

        if not redis_available or self.redis is None:
            return False

        # Update our reference if it was reconnected
        if redis_client is not None and self.redis != redis_client:
            self.redis = redis_client
            self.enabled = True

        return check_redis_health()

    def get(self, key: str) -> Optional[str]:
        """Get value from cache with graceful failure handling"""
        if not self._check_connection():
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
                
        except redis.ConnectionError as e:
            print(f"⚠️  Redis connection error for GET '{key}': {e}")
            print("📝 Attempting reconnection...")
            self._check_connection()
            return None
        except Exception as e:
            print(f"❌ Redis GET error for key '{key}': {e}")
            return None

    def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Set value in cache with graceful failure handling"""
        if not self._check_connection():
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

        except redis.ConnectionError as e:
            print(f"⚠️  Redis connection error for SET '{key}': {e}")
            print("📝 Attempting reconnection...")
            self._check_connection()
            return False
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