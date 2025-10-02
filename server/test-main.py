import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import os

# Test database URL
TEST_DATABASE_URL = "mysql+pymysql://root:password@localhost:3306/car_marketplace_test"

# Create test engine
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="function")
def test_db():
    """Create test database tables before each test and drop after"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# Health Check Tests
def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert data["name"] == "Car Marketplace Philippines"


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"


# Authentication Tests
def test_register_user(test_db):
    """Test user registration"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "TestPass123",
            "first_name": "Test",
            "last_name": "User",
            "city_id": 1,
            "role": "buyer"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate_email(test_db):
    """Test registration with duplicate email"""
    # Register first user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "TestPass123",
            "first_name": "Test",
            "last_name": "User",
            "city_id": 1,
            "role": "buyer"
        }
    )
    
    # Try to register with same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "TestPass456",
            "first_name": "Another",
            "last_name": "User",
            "city_id": 1,
            "role": "buyer"
        }
    )
    assert response.status_code == 400


def test_login_success(test_db):
    """Test successful login"""
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "LoginPass123",
            "first_name": "Login",
            "last_name": "Test",
            "city_id": 1,
            "role": "buyer"
        }
    )
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "LoginPass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_invalid_credentials(test_db):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "WrongPass123"
        }
    )
    assert response.status_code == 401


# Location Tests
def test_get_regions():
    """Test getting Philippines regions"""
    response = client.get("/api/v1/locations/regions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_provinces_by_region():
    """Test getting provinces by region"""
    response = client.get("/api/v1/locations/regions/1/provinces")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# Catalog Tests
def test_get_brands():
    """Test getting car brands"""
    response = client.get("/api/v1/catalog/brands")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_models_by_brand():
    """Test getting models by brand"""
    response = client.get("/api/v1/catalog/brands/1/models")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_categories():
    """Test getting categories"""
    response = client.get("/api/v1/catalog/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_features():
    """Test getting car features"""
    response = client.get("/api/v1/catalog/features")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# Subscription Tests
def test_get_subscription_plans():
    """Test getting subscription plans"""
    response = client.get("/api/v1/subscriptions/plans")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


# Car Listing Tests (Requires Authentication)
def get_auth_headers():
    """Helper function to get authentication headers"""
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "cartest@example.com",
            "password": "CarTest123",
            "first_name": "Car",
            "last_name": "Tester",
            "city_id": 1,
            "role": "seller"
        }
    )
    
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "cartest@example.com",
            "password": "CarTest123"
        }
    )
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_cars():
    """Test listing cars"""
    response = client.get("/api/v1/cars")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_search_cars_with_filters():
    """Test searching cars with filters"""
    response = client.get(
        "/api/v1/cars",
        params={
            "min_price": 500000,
            "max_price": 1000000,
            "min_year": 2020
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


def test_stats_endpoint():
    """Test platform statistics endpoint"""
    response = client.get("/api/v1/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_listings" in data
    assert "total_users" in data
    assert "total_brands" in data


# Password Validation Tests
def test_weak_password():
    """Test registration with weak password"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@example.com",
            "password": "weak",
            "first_name": "Weak",
            "last_name": "Password",
            "city_id": 1,
            "role": "buyer"
        }
    )
    assert response.status_code == 422


# Pagination Tests
def test_pagination():
    """Test pagination parameters"""
    response = client.get(
        "/api/v1/cars",
        params={
            "page": 1,
            "page_size": 10
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 10


if __name__ == "__main__":
    pytest.main([__file__, "-v"])