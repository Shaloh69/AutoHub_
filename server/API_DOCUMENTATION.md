# AutoHub - Car Marketplace Philippines API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Testing Guide](#testing-guide)

---

## Overview

**AutoHub** is a comprehensive car marketplace platform for the Philippines with multi-tier subscriptions, location-based search, and fraud detection.

### Base Information

- **Framework**: FastAPI (Python)
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT Bearer Tokens
- **Base URL**: `http://localhost:8000`
- **API Version**: v1
- **Documentation**: `/api/docs` (available in DEBUG mode)

### Technology Stack

- **Backend**: FastAPI, Uvicorn
- **Database**: MySQL, SQLAlchemy 2.0
- **Caching**: Redis
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt
- **Image Processing**: Pillow
- **File Storage**: AWS S3 or Local
- **Email**: aiosmtplib
- **Payments**: Stripe, GCash, PayMaya

---

## Authentication

### Overview

The API uses JWT (JSON Web Tokens) for authentication. Tokens are Bearer tokens passed in the `Authorization` header.

### Getting Tokens

#### 1. Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+639123456789",
  "city_id": 1,
  "role": "buyer"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

#### 2. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Using Tokens

Include the access token in the `Authorization` header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Token Refresh

Access tokens expire after 24 hours. Use the refresh token to get a new access token:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### User Roles

- **buyer**: Can browse cars, create inquiries, add favorites
- **seller**: Can create and manage car listings
- **dealer**: Business account with enhanced features
- **moderator**: Can moderate content and reports
- **admin**: Full system access

---

## API Endpoints

### Health & Information

#### Health Check
```http
GET /health
```
Returns API health status and version information.

#### API Root
```http
GET /
```
Returns welcome message and available endpoints.

---

### 1. Authentication Endpoints

**Base Path**: `/api/v1/auth`

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register` | No | Register new user account |
| POST | `/login` | No | Login with email/password |
| POST | `/refresh` | No | Refresh access token |
| POST | `/logout` | Yes | Logout and revoke tokens |
| GET | `/me` | Yes | Get current user profile |
| POST | `/verify-email` | No | Verify email with token |
| POST | `/forgot-password` | No | Request password reset |
| POST | `/reset-password` | No | Reset password with token |
| POST | `/change-password` | Yes | Change password |
| POST | `/resend-verification` | Yes | Resend verification email |
| GET | `/check-email/{email}` | No | Check email availability |
| GET | `/verification-status` | Yes | Get verification status |

---

### 2. Cars Endpoints

**Base Path**: `/api/v1/cars`

#### Search Cars
```http
GET /api/v1/cars?page=1&page_size=20&min_price=500000&max_price=2000000
```

**Query Parameters:**
- `q`: Search query (string)
- `brand_id`: Filter by brand (integer)
- `model_id`: Filter by model (integer)
- `min_price`, `max_price`: Price range
- `min_year`, `max_year`: Year range
- `fuel_type`: diesel, gasoline, electric, hybrid
- `transmission`: automatic, manual
- `city_id`, `province_id`, `region_id`: Location filters
- `latitude`, `longitude`, `radius_km`: Location-based search
- `sort_by`: created_at, price, year, mileage, views_count
- `sort_order`: asc, desc
- `page`, `page_size`: Pagination

#### Create Car Listing
```http
POST /api/v1/cars
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "2020 Toyota Fortuner",
  "description": "Well-maintained SUV",
  "brand_id": 1,
  "model_id": 1,
  "year": 2020,
  "price": 1500000,
  "mileage": 45000,
  "fuel_type": "diesel",
  "transmission": "automatic",
  "condition_rating": "excellent",
  "city_id": 1,
  "negotiable": true,
  "financing_available": true
}
```

**Requirements:**
- User must have `seller` or `dealer` role
- Email must be verified
- Must not exceed subscription listing limit

#### Complete Cars Endpoint List

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Optional | Search cars with filters |
| POST | `/` | Yes (Seller) | Create car listing |
| GET | `/{car_id}` | Optional | Get car details |
| PUT | `/{car_id}` | Yes (Owner) | Update car listing |
| DELETE | `/{car_id}` | Yes (Owner) | Delete car listing |
| POST | `/{car_id}/images` | Yes (Owner) | Upload car image |
| DELETE | `/{car_id}/images/{image_id}` | Yes (Owner) | Delete car image |
| POST | `/{car_id}/boost` | Yes (Owner) | Boost listing visibility |
| POST | `/{car_id}/feature` | Yes (Owner) | Make listing featured |
| GET | `/{car_id}/price-history` | No | Get price change history |
| GET | `/brands/all` | No | Get all brands |
| GET | `/brands/{brand_id}/models` | No | Get brand models |
| GET | `/features/all` | No | Get all features |

---

### 3. Users Endpoints

**Base Path**: `/api/v1/users`

#### Get Profile
```http
GET /api/v1/users/profile
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+639123456789",
  "bio": "Car enthusiast"
}
```

#### Upgrade Role
```http
POST /api/v1/users/upgrade-role
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_role": "seller",
  "business_name": "My Car Business",
  "business_permit_number": "BP-12345"
}
```

**Requirements for Role Upgrade:**
- Current role must be `buyer`
- Email must be verified
- For `dealer` role: business information required

#### Complete Users Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| POST | `/profile/photo` | Upload profile photo |
| POST | `/upgrade-role` | Upgrade to seller/dealer |
| POST | `/verify-identity` | Submit identity verification |
| GET | `/listings` | Get user's car listings |
| GET | `/favorites` | Get favorite cars |
| POST | `/favorites/{car_id}` | Add car to favorites |
| DELETE | `/favorites/{car_id}` | Remove from favorites |
| GET | `/notifications` | Get notifications |
| PUT | `/notifications/{id}/read` | Mark notification read |
| PUT | `/notifications/read-all` | Mark all notifications read |

---

### 4. Subscriptions Endpoints

**Base Path**: `/api/v1/subscriptions`

#### Get Plans
```http
GET /api/v1/subscriptions/plans
```

#### Subscribe to Plan (QR Code Payment)
```http
POST /api/v1/subscriptions/subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan_id": 1,
  "billing_cycle": "monthly",
  "payment_method": "qr_code",
  "promo_code": "PROMO2024"
}
```

**Response:**
```json
{
  "payment_id": 1,
  "subscription_id": 1,
  "amount": 499.00,
  "currency": "PHP",
  "qr_code_image_url": "https://...",
  "payment_instructions": "Scan QR code with GCash...",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00"
}
```

#### Submit Payment Reference
```http
POST /api/v1/subscriptions/submit-reference
Authorization: Bearer {token}
Content-Type: application/json

{
  "payment_id": 1,
  "reference_number": "GCash-1234567890"
}
```

**Payment Workflow:**
1. User subscribes to plan → receives QR code
2. User scans QR code and pays via GCash/PayMaya
3. User receives reference number from payment provider
4. User submits reference number via API
5. Admin verifies payment
6. Subscription activated

#### Complete Subscriptions Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | Get all subscription plans |
| GET | `/current` | Get current subscription |
| POST | `/subscribe` | Subscribe to plan |
| POST | `/submit-reference` | Submit payment reference |
| POST | `/validate-promo` | Validate promo code |
| GET | `/payments` | Get payment history |
| GET | `/payment/{id}` | Get payment details |
| POST | `/upgrade` | Upgrade subscription |
| POST | `/cancel` | Cancel subscription |

---

### 5. Inquiries Endpoints

**Base Path**: `/api/v1/inquiries`

#### Create Inquiry (Guest or Authenticated)
```http
POST /api/v1/inquiries
Content-Type: application/json

{
  "car_id": 1,
  "subject": "Interested in this car",
  "message": "Is this car still available?",
  "buyer_name": "John Doe",
  "buyer_email": "john@example.com",
  "buyer_phone": "+639123456789",
  "inquiry_type": "general",
  "test_drive_requested": false
}
```

**Inquiry Types:**
- `general`: General inquiry
- `price_negotiation`: Price negotiation
- `test_drive`: Test drive request
- `inspection`: Inspection request
- `financing`: Financing inquiry

#### Complete Inquiries Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create inquiry (guest/auth) |
| GET | `/` | Get inquiries (sent/received) |
| GET | `/{inquiry_id}` | Get inquiry details |
| POST | `/{inquiry_id}/respond` | Respond to inquiry |
| PUT | `/{inquiry_id}` | Update inquiry status |
| POST | `/{inquiry_id}/rate` | Rate inquiry interaction |
| DELETE | `/{inquiry_id}` | Delete inquiry |

---

### 6. Transactions Endpoints

**Base Path**: `/api/v1/transactions`

#### Create Transaction
```http
POST /api/v1/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "car_id": 1,
  "agreed_price": 1450000,
  "payment_method": "cash",
  "deposit_amount": 145000
}
```

**Transaction Statuses:**
- `pending`: Transaction created
- `deposit_paid`: Deposit received
- `completed`: Transaction completed
- `cancelled`: Transaction cancelled

#### Complete Transactions Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create transaction |
| GET | `/` | Get transactions (buyer/seller) |
| GET | `/{transaction_id}` | Get transaction details |
| PUT | `/{transaction_id}` | Update transaction status |

---

### 7. Analytics Endpoints

**Base Path**: `/api/v1/analytics`

#### Get Dashboard Stats
```http
GET /api/v1/analytics/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "total_listings": 15,
  "active_listings": 12,
  "total_views": 450,
  "total_inquiries": 23
}
```

#### Get Car View Analytics
```http
GET /api/v1/analytics/cars/1/views?days=30
Authorization: Bearer {token}
```

#### Get Market Insights
```http
GET /api/v1/analytics/market-insights?brand_id=1&model_id=5
```

**Response:**
```json
{
  "avg_price": 1250000.50,
  "min_price": 850000.00,
  "max_price": 1850000.00,
  "listing_count": 45
}
```

---

### 8. Admin Endpoints

**Base Path**: `/api/v1/admin`
**Required Role**: `admin` (or `moderator` for some endpoints)

#### Dashboard
```http
GET /api/v1/admin/dashboard
Authorization: Bearer {admin_token}
```

#### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/{id}` | Get user details |
| POST | `/users/{id}/ban` | Ban user |
| POST | `/users/{id}/unban` | Unban user |
| POST | `/users/{id}/verify` | Verify user |
| POST | `/users/{id}/change-role` | Change user role |

#### Payment Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments/pending` | Get pending payments |
| GET | `/payments/{id}` | Get payment details |
| POST | `/payments/verify` | Verify/reject payment |
| GET | `/payments/statistics` | Get payment stats |
| GET | `/payments/{id}/logs` | Get payment logs |

#### Reports Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports` | List all reports |
| GET | `/reports/{id}` | Get report details |
| POST | `/reports/{id}/resolve` | Resolve report |

#### Car Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cars/pending` | List pending cars |
| POST | `/cars/{id}/approve` | Approve/reject car |

#### Security & Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fraud-indicators` | List fraud indicators |
| GET | `/audit-logs` | View audit logs |

#### System Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/system-config` | List configs |
| PUT | `/system-config/{key}` | Update config |
| GET | `/settings/payment` | Get payment settings |
| PUT | `/settings/payment/{key}` | Update payment setting |

---

## Data Models

### User
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+639123456789",
  "role": "buyer",
  "email_verified": true,
  "phone_verified": false,
  "identity_verified": false,
  "business_verified": false,
  "is_active": true,
  "is_banned": false,
  "created_at": "2024-01-15T10:30:00",
  "last_login_at": "2024-01-20T14:22:00"
}
```

### Car
```json
{
  "id": 1,
  "title": "2020 Toyota Fortuner",
  "description": "Well-maintained SUV",
  "brand_id": 1,
  "brand": "Toyota",
  "model_id": 1,
  "model": "Fortuner",
  "year": 2020,
  "price": 1500000,
  "mileage": 45000,
  "fuel_type": "diesel",
  "transmission": "automatic",
  "condition_rating": "excellent",
  "status": "active",
  "is_featured": false,
  "negotiable": true,
  "financing_available": true,
  "views_count": 150,
  "contact_count": 12,
  "city_id": 1,
  "latitude": 14.5995,
  "longitude": 120.9842,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-20T14:22:00"
}
```

### Subscription Plan
```json
{
  "id": 1,
  "name": "Basic",
  "description": "Basic seller plan",
  "price_monthly": 499.00,
  "price_annual": 4999.00,
  "features": {
    "max_listings": 10,
    "max_images_per_listing": 10,
    "featured_listings": false,
    "boost_credits": 5
  },
  "is_active": true
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

### Common Error Responses

#### Validation Error (422)
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

#### Permission Error (403)
```json
{
  "success": false,
  "error": "Seller or dealer role required"
}
```

---

## Testing Guide

### Prerequisites

1. **Start the Server**
   ```bash
   cd /home/user/AutoHub_/server
   python main.py
   ```

2. **Import Postman Collection**
   - Import `AutoHub_API_Postman_Collection.json` into Postman
   - Set base_url variable to `http://localhost:8000`

### Testing Workflow

#### 1. Authentication Flow

```
1. Register a new account
   POST /api/v1/auth/register
   → Save access_token and refresh_token

2. Verify email (optional for testing)
   POST /api/v1/auth/verify-email

3. Login
   POST /api/v1/auth/login
   → Update access_token

4. Get user profile
   GET /api/v1/auth/me
```

#### 2. Role Upgrade Flow

```
1. Upgrade to seller
   POST /api/v1/users/upgrade-role
   Body: { "new_role": "seller" }

2. Verify you can now access seller endpoints
   POST /api/v1/cars
```

#### 3. Car Listing Flow

```
1. Create car listing
   POST /api/v1/cars
   → Save car_id

2. Upload car images
   POST /api/v1/cars/{car_id}/images

3. Search for your car
   GET /api/v1/cars?q=Toyota

4. Get car details
   GET /api/v1/cars/{car_id}
```

#### 4. Subscription Flow

```
1. Get available plans
   GET /api/v1/subscriptions/plans

2. Subscribe to a plan
   POST /api/v1/subscriptions/subscribe
   → Save payment_id

3. Submit payment reference
   POST /api/v1/subscriptions/submit-reference

4. Check payment status
   GET /api/v1/subscriptions/payment/{payment_id}
```

#### 5. Inquiry Flow

```
1. Create inquiry (as buyer)
   POST /api/v1/inquiries

2. View received inquiries (as seller)
   GET /api/v1/inquiries?role=received

3. Respond to inquiry
   POST /api/v1/inquiries/{inquiry_id}/respond

4. Rate inquiry
   POST /api/v1/inquiries/{inquiry_id}/rate
```

### Creating Admin User

```bash
cd /home/user/AutoHub_/server
python create_admin.py
```

Follow prompts to create admin account.

### Testing Admin Endpoints

```
1. Login as admin
   POST /api/v1/auth/login

2. View dashboard
   GET /api/v1/admin/dashboard

3. List pending payments
   GET /api/v1/admin/payments/pending

4. Verify a payment
   POST /api/v1/admin/payments/verify
```

---

## Rate Limiting

- **Per minute**: 60 requests
- **Per hour**: 1000 requests

Rate limit headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "has_next": true,
  "has_prev": false
}
```

---

## File Uploads

### Image Upload Requirements

- **Formats**: JPEG, JPG, PNG, WebP
- **Max size**: 5MB per image (cars), 2MB (profile)
- **Car images**: Up to 20 images per listing (subscription-dependent)

### Upload Example

```http
POST /api/v1/cars/1/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary data]
image_type: exterior
is_primary: false
```

---

## Webhooks (Future)

Payment webhook endpoints for GCash/PayMaya integration.

---

## Support

For issues or questions:
- GitHub Issues: [Repository Link]
- Email: support@autohub.ph
- Documentation: https://docs.autohub.ph

---

**Last Updated**: 2024
**API Version**: 1.0.0
