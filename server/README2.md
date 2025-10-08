# Car Marketplace Philippines - Complete Backend System

A comprehensive car marketplace platform built specifically for the Philippines market with FastAPI, featuring multi-tier subscriptions, location-based search, fraud detection, and complete transaction management.

## 🚀 Features

- **Multi-tier Subscription System**: Free, Basic, Premium, Pro, and Enterprise plans
- **Location-Based Search**: Philippines-specific regions, provinces, and cities with GPS coordinates
- **Advanced Fraud Detection**: Built-in security and fraud prevention mechanisms
- **Complete Transaction Management**: Full buyer-seller transaction workflow
- **Real-time Notifications**: Push, email, and SMS notifications
- **Analytics & Reporting**: Comprehensive analytics dashboard
- **Payment Integration**: Stripe, GCash, PayMaya, and PayPal support
- **Image Management**: Multiple images per listing with automatic resizing
- **SEO Optimized**: SEO-friendly URLs and metadata

## 📋 Prerequisites

- Python 3.9 or higher
- MySQL 8.0 or higher
- Redis 6.0 or higher (for caching)
- pip (Python package manager)

## 🔧 Installation

### 1. Clone or Download the Project

```bash
cd car_marketplace_ph
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate

# Linux/Mac:
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Create database and import schema
mysql -u root -p < car_marketplace_ph.sql
```

### 5. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# IMPORTANT: Change SECRET_KEY and JWT_SECRET!
nano .env  # or use your preferred editor
```

**Generate secure keys:**
```bash
# For SECRET_KEY and JWT_SECRET
openssl rand -hex 32
```

### 6. Create Required Directories

```bash
mkdir -p uploads logs
chmod 755 uploads logs
```

### 7. Run Application

```bash
# Development mode
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/api/docs`

## 🐳 Docker Setup (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 🗂️ Project Structure

```
car_marketplace_ph/
├── app/
│   ├── __init__.py
│   ├── config.py              # Application configuration
│   ├── database.py            # Database connection & setup
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py        # Authentication endpoints
│   │       ├── cars.py        # Car listing endpoints
│   │       ├── users.py       # User management
│   │       ├── subscriptions.py  # Subscription management
│   │       ├── inquiries.py   # Inquiry/messaging
│   │       ├── transactions.py  # Transaction management
│   │       └── analytics.py   # Analytics endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   └── dependencies.py    # FastAPI dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py           # User model
│   │   ├── location.py       # Location models
│   │   ├── car.py            # Car models
│   │   ├── inquiry.py        # Inquiry models
│   │   ├── transaction.py    # Transaction models
│   │   ├── subscription.py   # Subscription models
│   │   ├── analytics.py      # Analytics models
│   │   └── security.py       # Security models
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py         # Common schemas
│   │   ├── auth.py           # Auth schemas
│   │   ├── car.py            # Car schemas
│   │   ├── subscription.py   # Subscription schemas
│   │   ├── inquiry.py        # Inquiry schemas
│   │   └── transaction.py    # Transaction schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py   # Authentication logic
│   │   ├── car_service.py    # Car business logic
│   │   ├── subscription_service.py  # Subscription logic
│   │   ├── file_service.py   # File management
│   │   ├── notification_service.py  # Notifications
│   │   └── payment_service.py  # Payment processing
│   └── utils/
│       ├── __init__.py
│       ├── validators.py     # Validation functions
│       └── helpers.py        # Helper functions
├── uploads/                  # Local file storage
├── logs/                     # Application logs
├── tests/                    # Test files
├── .env                      # Environment variables
├── .env.example              # Example environment variables
├── .gitignore               # Git ignore file
├── main.py                  # Application entry point
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── pytest.ini               # Pytest configuration
├── car_marketplace_ph.sql   # Database schema
└── README.md                # This file
```

## 🔑 Default Test Users

After importing the database, you can create test users via the API or use these credentials if you've seeded the database:

```
Admin:
Email: admin@carmarketplace.ph
Password: Admin123!

Seller:
Email: seller@example.com  
Password: Seller123!

Buyer:
Email: buyer@example.com
Password: Buyer123!
```

## 🧪 Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in .env
- [ ] Use strong `SECRET_KEY` and `JWT_SECRET`
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up monitoring (New Relic, DataDog)
- [ ] Configure backups
- [ ] Enable rate limiting
- [ ] Use production database with replication
- [ ] Configure email service
- [ ] Set up logging aggregation
- [ ] Configure Redis for sessions
- [ ] Use CDN for images (CloudFront, Cloudflare)
- [ ] Set up SSL certificates

### Using Gunicorn (Production)

```bash
pip install gunicorn

gunicorn main:app \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:8000/health
```

### Metrics

Access application metrics at `/api/v1/analytics/dashboard` (requires authentication)

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check MySQL is running
systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1"
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping
# Should return "PONG"

# Start Redis
redis-server
```

### Permission Issues

```bash
# Fix upload directory permissions
chmod -R 755 uploads
chown -R your-user:your-group uploads
```

## 📝 License

This project is proprietary software for Car Marketplace Philippines.

## 👥 Support

For issues or questions:
- Email: support@carmarketplace.ph
- Documentation: https://docs.carmarketplace.ph

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Python Version**: 3.9+  
**Framework**: FastAPI 0.109.0