# Car Marketplace Philippines - Backend API

A comprehensive car marketplace platform built specifically for the Philippines market with FastAPI, featuring multi-tier subscriptions, location-based search, and complete transaction management.

## 🚀 Features

- **User Management**: Registration, authentication with JWT, role-based access control
- **Car Listings**: Full CRUD operations with advanced search and filtering
- **Subscription System**: Free, Basic, Premium, Pro, and Enterprise plans
- **Location-Based**: Philippines-specific regions, provinces, and cities with GPS coordinates
- **Inquiry System**: Buyer-seller communication with test drive scheduling
- **Image Management**: Multiple images per listing with automatic resizing
- **Analytics**: View tracking, user actions, and performance metrics
- **Notifications**: Real-time notifications for important events
- **Fraud Detection**: Built-in security and fraud prevention
- **Payment Integration**: Ready for Stripe, GCash, PayMaya integration

## 📁 Project Structure

```
car_marketplace_ph/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py           # Authentication endpoints
│   │       ├── cars.py            # Car listing endpoints
│   │       ├── users.py           # User management endpoints
│   │       ├── subscriptions.py   # Subscription endpoints
│   │       └── inquiries.py       # Inquiry endpoints
│   ├── core/
│   │   └── dependencies.py        # FastAPI dependencies (auth, pagination)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # User model
│   │   ├── location.py            # Location models (regions, cities)
│   │   ├── car.py                 # Car models
│   │   ├── inquiry.py             # Inquiry models
│   │   ├── transaction.py         # Transaction models
│   │   ├── subscription.py        # Subscription models
│   │   ├── analytics.py           # Analytics models
│   │   └── security.py            # Security models
│   ├── schemas/
│   │   ├── common.py              # Common Pydantic schemas
│   │   ├── auth.py                # Auth schemas
│   │   ├── car.py                 # Car schemas
│   │   ├── subscription.py        # Subscription schemas
│   │   └── inquiry.py             # Inquiry schemas
│   ├── services/
│   │   ├── auth_service.py        # Authentication business logic
│   │   ├── car_service.py         # Car business logic
│   │   └── file_service.py        # File upload/management
│   ├── config.py                  # Application configuration
│   └── database.py                # Database connection & setup
├── uploads/                       # Local file storage (if not using S3)
├── logs/                          # Application logs
├── .env                          # Environment variables (create from .env.example)
├── .env.example                  # Example environment variables
├── main.py                       # FastAPI application entry point
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## 🛠️ Prerequisites

- Python 3.9 or higher
- MySQL 8.0 or higher
- Redis 6.0 or higher (for caching)
- pip (Python package manager)

## 📦 Installation

### 1. Clone or Download the Project

```bash
# If you have the files, navigate to the project directory
cd car_marketplace_ph
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate

# On Linux/Mac:
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

# Run the SQL schema files
mysql -u root -p < car_marketplace_ph.sql
mysql -u root -p car_marketplace_ph < car_marketplace_SB_exew.sql
```

### 5. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

**Important environment variables to configure:**

```bash
# Database
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/car_marketplace_ph

# Security (Generate secure keys)
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
JWT_SECRET=your-jwt-secret-here

# Redis
REDIS_URL=redis://localhost:6379/0

# File Storage
USE_LOCAL_STORAGE=True
LOCAL_UPLOAD_DIR=uploads
```

### 6. Create Required Directories

```bash
mkdir -p uploads logs
```

## 🚀 Running the Application

### Development Mode

```bash
# Make sure virtual environment is activated
# Windows:
.venv\Scripts\activate

# Linux/Mac:
source .venv/bin/activate

# Run the application
python main.py
```

The API will be available at: `http://localhost:8000`

API Documentation (Swagger UI): `http://localhost:8000/api/docs`

### Production Mode

```bash
# Set DEBUG to False in .env
DEBUG=False

# Run with Gunicorn (Linux/Mac)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or use uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Main API Endpoints

#### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout user
- `GET /me` - Get current user profile
- `POST /verify-email` - Verify email
- `POST /verify-phone` - Verify phone number
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `POST /change-password` - Change password

#### Cars (`/api/v1/cars`)
- `POST /` - Create car listing
- `GET /` - Search cars (with filters)
- `GET /{car_id}` - Get car details
- `PUT /{car_id}` - Update car listing
- `DELETE /{car_id}` - Delete car listing
- `POST /{car_id}/images` - Upload car image
- `DELETE /{car_id}/images/{image_id}` - Delete car image
- `POST /{car_id}/boost` - Boost car listing
- `GET /meta/brands` - Get car brands
- `GET /meta/models` - Get car models
- `GET /meta/features` - Get car features

#### Users (`/api/v1/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /profile/photo` - Upload profile photo
- `GET /listings` - Get user's car listings
- `GET /favorites` - Get favorite cars
- `POST /favorites/{car_id}` - Add to favorites
- `DELETE /favorites/{car_id}` - Remove from favorites
- `GET /notifications` - Get notifications
- `PUT /notifications/{id}` - Mark notification as read

#### Subscriptions (`/api/v1/subscriptions`)
- `GET /plans` - Get subscription plans
- `GET /current` - Get current subscription
- `POST /subscribe` - Subscribe to a plan
- `POST /cancel` - Cancel subscription
- `POST /upgrade` - Upgrade subscription
- `GET /usage` - Get subscription usage
- `POST /validate-promo` - Validate promotion code
- `GET /payments` - Get payment history

#### Inquiries (`/api/v1/inquiries`)
- `POST /` - Create inquiry
- `GET /` - Get inquiries (sent/received)
- `GET /{inquiry_id}` - Get inquiry details
- `POST /{inquiry_id}/respond` - Respond to inquiry
- `PUT /{inquiry_id}` - Update inquiry status
- `POST /{inquiry_id}/rate` - Rate inquiry interaction

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Example: Register and Login

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "city_id": 1,
    "role": "seller"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'

# Use the returned access_token in subsequent requests
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔍 Search Example

```bash
# Search cars by location and price range
curl -X GET "http://localhost:8000/api/v1/cars?city_id=1&min_price=500000&max_price=1000000&fuel_type=gasoline&sort_by=price&sort_order=asc"

# Location-based search (within 25km radius)
curl -X GET "http://localhost:8000/api/v1/cars?latitude=14.5995&longitude=120.9842&radius_km=25"
```

## 💳 Subscription Plans

| Plan | Price/Month | Listings | Features | Boost Credits |
|------|------------|----------|----------|---------------|
| Free | ₱0 | 3 | Basic features | 0 |
| Basic | ₱499 | 10 | Featured in category | 5 |
| Premium | ₱999 | 25 | Homepage featured | 15 |
| Pro | ₱2,499 | 100 | Priority ranking +5 | 50 |
| Enterprise | ₱4,999 | Unlimited | All features | Unlimited |

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check MySQL is running
systemctl status mysql  # Linux
# or
Get-Service MySQL  # Windows PowerShell

# Verify credentials in .env file
# Test connection
mysql -u root -p
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping
# Should return "PONG"

# Start Redis
redis-server
```

### Port Already in Use

```bash
# Change port in main.py or use different port
uvicorn main:app --port 8001
```

## 📝 Development Tips

### Database Migrations

When you modify models:

```bash
# After making changes to models
# The app will auto-create tables on startup
# For production, use Alembic for migrations
```

### Testing API Endpoints

Use the built-in Swagger UI at `/api/docs` for interactive API testing.

### Debugging

Enable debug mode in `.env`:

```bash
DEBUG=True
LOG_LEVEL=DEBUG
```

## 🔒 Security Considerations

- Never commit `.env` file to version control
- Use strong SECRET_KEY and JWT_SECRET
- Enable HTTPS in production
- Implement rate limiting for production
- Regular security audits
- Keep dependencies updated

## 📈 Performance Optimization

- Redis caching is enabled for frequently accessed data
- Database connection pooling is configured
- Image optimization automatically creates thumbnails
- Indexes are properly set on frequently queried columns

## 🤝 Contributing

1. Follow Python PEP 8 style guide
2. Add docstrings to all functions
3. Test endpoints before committing
4. Update README if adding new features

## 📄 License

This project is proprietary software for Car Marketplace Philippines.

## 👥 Support

For issues or questions, please contact: support@carmarketplace.ph

## 🚀 Deployment

### Using Docker (Optional)

```bash
# Build image
docker build -t car-marketplace-api .

# Run container
docker run -p 8000:8000 --env-file .env car-marketplace-api
```

### Production Checklist

- [ ] Set DEBUG=False
- [ ] Use strong secret keys
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Enable rate limiting
- [ ] Use production database
- [ ] Configure email service
- [ ] Set up logging
- [ ] Configure Redis
- [ ] Use CDN for images

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Python Version**: 3.9+  
**Framework**: FastAPI 0.109.0