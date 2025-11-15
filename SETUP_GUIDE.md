# AutoHub Philippines - Complete Setup Guide

This guide provides complete instructions for setting up and testing the AutoHub car marketplace platform with full client-server integration.

## 🎯 Overview

AutoHub is a complete car marketplace platform for the Philippines featuring:
- **Backend**: FastAPI (Python) with SQLite/MySQL database
- **Frontend**: Next.js 15 with TypeScript and HeroUI components
- **API Documentation**: Postman collection included
- **Features**: Multi-tier subscriptions, location-based search, car listings, inquiries, transactions, and admin panel

---

## 📋 Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **npm or yarn** (for frontend dependencies)
- **SQLite** (default) or **MySQL 8.0+** (optional)
- **Redis** (optional, for caching)

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install Python dependencies
pip3 install -r requirements.txt

# Environment is already configured in .env
# Database will use SQLite by default (car_marketplace_ph.db)

# Start the backend server
python3 main.py
```

The backend API will be available at:
- **API Base**: http://localhost:8000/api/v1
- **API Docs**: http://localhost:8000/api/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

### 2. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install Node.js dependencies
npm install

# Environment is already configured in .env.local
# API URL points to http://localhost:8000/api/v1

# Start the Next.js development server
npm run dev
```

The frontend will be available at:
- **Application**: http://localhost:3000

### 3. Test the Connection

```bash
# Run the API connection test script
node test_api_connection.js
```

You should see all endpoints reporting success ✓

---

## 📁 Project Structure

```
AutoHub_/
├── server/                          # Backend API (FastAPI)
│   ├── app/
│   │   ├── api/v1/                 # API endpoints
│   │   │   ├── auth.py             # Authentication
│   │   │   ├── cars.py             # Car listings
│   │   │   ├── users.py            # User management
│   │   │   ├── locations.py        # Philippine locations (NEW)
│   │   │   ├── subscriptions.py    # Subscription plans
│   │   │   ├── inquiries.py        # Buyer/Seller messaging
│   │   │   ├── transactions.py     # Payments & transactions
│   │   │   ├── analytics.py        # Analytics & reporting
│   │   │   └── admin.py            # Admin operations
│   │   ├── models/                 # Database models
│   │   ├── schemas/                # Pydantic schemas
│   │   ├── services/               # Business logic
│   │   ├── config.py               # Configuration
│   │   └── database.py             # Database setup
│   ├── .env                        # Environment configuration
│   ├── main.py                     # Application entry point
│   └── requirements.txt            # Python dependencies
│
├── client/                          # Frontend (Next.js)
│   ├── app/                        # Next.js app router
│   │   ├── (customer)/            # Customer pages
│   │   ├── auth/                  # Authentication pages
│   │   ├── seller/                # Seller dashboard
│   │   ├── admin/                 # Admin panel
│   │   └── ...
│   ├── components/                # React components
│   ├── services/
│   │   └── api.ts                 # API client service
│   ├── types/                     # TypeScript types
│   ├── .env.local                 # Environment configuration
│   ├── package.json               # Node dependencies
│   └── ...
│
├── AutoHub_API.postman_collection.json  # Postman collection
├── test_api_connection.js              # API test script
└── SETUP_GUIDE.md                      # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/refresh` - Refresh access token

### Locations (NEW)
- `GET /api/v1/locations/regions` - Get Philippine regions
- `GET /api/v1/locations/provinces` - Get provinces
- `GET /api/v1/locations/cities` - Get cities/municipalities
- `GET /api/v1/locations/search` - Search locations

### Cars
- `GET /api/v1/cars` - Search/list cars with filters
- `GET /api/v1/cars/{id}` - Get car details
- `POST /api/v1/cars` - Create car listing (auth required)
- `PUT /api/v1/cars/{id}` - Update car listing
- `DELETE /api/v1/cars/{id}` - Delete car listing
- `GET /api/v1/cars/brands` - Get all brands
- `GET /api/v1/cars/models` - Get models by brand

### Users
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update profile
- `GET /api/v1/users/listings` - Get user's car listings
- `GET /api/v1/users/favorites` - Get favorite cars
- `POST /api/v1/users/favorites/{car_id}` - Add to favorites

### Inquiries
- `POST /api/v1/inquiries` - Create inquiry
- `GET /api/v1/inquiries` - Get inquiries (sent/received)
- `POST /api/v1/inquiries/{id}/responses` - Respond to inquiry

### Transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions` - Get transactions
- `PUT /api/v1/transactions/{id}` - Update transaction

### Subscriptions
- `GET /api/v1/subscriptions/plans` - Get all plans
- `GET /api/v1/subscriptions/current` - Get current subscription
- `POST /api/v1/subscriptions/subscribe` - Subscribe to plan

### Analytics
- `GET /api/v1/analytics/dashboard` - Get dashboard data
- `GET /api/v1/analytics/cars/{id}/views` - Get car view stats

### Admin
- `GET /api/v1/admin/analytics` - Admin analytics
- `GET /api/v1/admin/cars/pending` - Pending approvals
- `POST /api/v1/admin/cars/{id}/approve` - Approve car
- `GET /api/v1/admin/users` - Get all users

---

## 📮 Postman Collection

Import the Postman collection to test all endpoints:

**File**: `AutoHub_API.postman_collection.json`

The collection includes:
- Pre-configured requests for all endpoints
- Auto-save of authentication tokens
- Example request bodies
- Collection variables for easy testing

To use:
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `AutoHub_API.postman_collection.json`
4. The collection will appear in your workspace

---

## 🔧 Configuration

### Backend Configuration (server/.env)

Key settings:
```env
# Database
DATABASE_URL=sqlite:///./car_marketplace_ph.db  # or MySQL

# API Settings
DEBUG=True
CORS_ORIGINS=["http://localhost:3000"]

# Security
JWT_SECRET_KEY=your-secret-key-here
JWT_EXPIRATION_HOURS=24

# Storage
USE_LOCAL_STORAGE=True
LOCAL_UPLOAD_DIR=uploads
```

### Frontend Configuration (client/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 🧪 Testing

### Test Individual Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Get regions
curl http://localhost:8000/api/v1/locations/regions

# Search cars
curl http://localhost:8000/api/v1/cars?page_size=10

# Get subscription plans
curl http://localhost:8000/api/v1/subscriptions/plans
```

### Test with Postman
1. Import the Postman collection
2. Start with "Register" or "Login" to get authentication token
3. Token will be auto-saved for subsequent requests
4. Test any endpoint in the collection

### Test Full Integration

```bash
# Run the connection test
node test_api_connection.js
```

---

## 🎨 Frontend Features

- **Homepage**: Featured and latest car listings
- **Search**: Advanced filters (brand, model, price, year, location)
- **Car Details**: Full car information with images
- **Authentication**: Register/Login with JWT
- **User Dashboard**: Manage listings, favorites, inquiries
- **Seller Dashboard**: Create/edit listings, view analytics
- **Admin Panel**: User management, car approvals, analytics
- **Subscriptions**: Multi-tier plans with different limits
- **Responsive**: Mobile-friendly design with dark mode

---

## 📊 Database

### SQLite (Default)
- Database file: `server/car_marketplace_ph.db`
- Auto-created on first run
- Perfect for development and testing

### MySQL (Optional)
To use MySQL instead:
1. Create database: `CREATE DATABASE car_marketplace_ph;`
2. Update `.env`:
   ```env
   DATABASE_URL=mysql+pymysql://user:password@localhost:3306/car_marketplace_ph
   ```
3. Restart the server

### Tables
The following tables are auto-created:
- users
- cars, car_images
- brands, models, categories
- ph_regions, ph_provinces, ph_cities
- inquiries, inquiry_responses
- transactions
- subscriptions, subscription_plans
- notifications
- analytics_events

---

## 🔒 Security Notes

**For Development:**
- Default JWT secrets are provided (insecure)
- CORS allows localhost:3000

**For Production:**
- Generate strong secrets for `JWT_SECRET_KEY`
- Update `CORS_ORIGINS` with production domains
- Use HTTPS
- Enable rate limiting
- Set `DEBUG=False`
- Use proper database credentials
- Configure AWS S3 for file storage

---

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python3 --version` (need 3.9+)
- Install dependencies: `pip3 install -r requirements.txt`
- Check port 8000 is free: `lsof -i :8000`

### Frontend won't start
- Check Node version: `node --version` (need 18+)
- Install dependencies: `npm install`
- Check port 3000 is free: `lsof -i :3000`

### API connection fails
- Ensure backend is running on port 8000
- Check CORS settings in `.env`
- Verify API URL in `.env.local`

### Database errors (SQLite)
- SQLite file is created automatically
- Check write permissions in server directory
- Delete `car_marketplace_ph.db` to reset

---

## 📝 Development Workflow

### Creating a Car Listing

1. **Register/Login** (Frontend or Postman)
2. **Get authentication token** (auto-saved in Postman)
3. **Create listing** via:
   - Frontend: Seller Dashboard → New Listing
   - API: POST `/api/v1/cars` with car data
4. **Upload images**: POST `/api/v1/cars/{id}/images`
5. **View listing**: Browse as customer

### User Roles

- **Customer**: Browse cars, send inquiries, favorites
- **Seller**: All customer features + create listings
- **Dealer**: Enhanced seller with more listings
- **Admin**: Full access + user management

---

## 🚢 Production Deployment

### Backend
- Use Gunicorn/Uvicorn workers
- Configure MySQL database
- Set up Redis for caching
- Configure AWS S3 for file storage
- Set environment variables securely
- Enable HTTPS
- Configure email/SMS providers

### Frontend
- Build production: `npm run build`
- Deploy to Vercel/Netlify
- Update API URL to production
- Configure environment variables

---

## 📞 Support

For issues or questions:
- Check API docs: http://localhost:8000/api/docs
- Review this setup guide
- Check server logs for errors
- Test with Postman collection

---

## ✅ Verification Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] API docs accessible at /api/docs
- [ ] Database created successfully
- [ ] Test script shows all endpoints working
- [ ] Postman collection imports successfully
- [ ] Can register/login users
- [ ] Can create car listings (after auth)
- [ ] Can search/filter cars
- [ ] Can view car details

---

**Status**: ✅ Fully configured and tested
**Last Updated**: 2025-11-15
**Server**: Running on http://localhost:8000
**Client**: Running on http://localhost:3000
