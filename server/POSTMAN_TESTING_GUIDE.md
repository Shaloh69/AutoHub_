# AutoHub Philippines - Complete Postman API Testing Guide

## Table of Contents
1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoint Reference](#api-endpoint-reference)
5. [Testing Workflows](#testing-workflows)
6. [Common Use Cases](#common-use-cases)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Overview

### API Information
- **Base URL**: `http://localhost:8000`
- **API Version**: v1
- **Authentication**: JWT Bearer Token (HS256)
- **Content-Type**: `application/json`
- **Token Expiration**: 24 hours (access), 30 days (refresh)

### Technology Stack
- **Framework**: FastAPI 0.109.0
- **Database**: MySQL (via PyMySQL)
- **ORM**: SQLAlchemy 2.0.25
- **Authentication**: JWT (python-jose)
- **File Upload**: Multipart/form-data
- **Documentation**: OpenAPI 3.0 (Swagger UI at `/api/docs`)

### Total Endpoints
- **75+ API endpoints** across 8 modules
- **5 User roles**: buyer, seller, dealer, moderator, admin
- **4 Verification levels**: email, phone, identity, business

---

## Setup Instructions

### 1. Import Postman Collection

**Option A: Import from File**
1. Open Postman
2. Click "Import" button
3. Select `AutoHub_Postman_Collection.json`
4. Collection will appear in your workspace

**Option B: Import from URL**
```
File > Import > Link > Paste collection URL
```

### 2. Set Up Environment Variables

Create a new environment in Postman with these variables:

| Variable | Initial Value | Current Value | Description |
|----------|---------------|---------------|-------------|
| `base_url` | `http://localhost:8000` | - | API base URL |
| `access_token` | ` ` | (auto-set after login) | JWT access token |
| `refresh_token` | ` ` | (auto-set after login) | JWT refresh token |
| `user_id` | ` ` | (auto-set after login) | Current user ID |
| `car_id` | ` ` | (manually set) | Car ID for testing |
| `inquiry_id` | ` ` | (manually set) | Inquiry ID for testing |

### 3. Start the Server

```bash
cd /home/user/AutoHub_/server
python main.py
```

Server will start on `http://localhost:8000`

### 4. Verify Server is Running

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "app": "CarMarket Philippines",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## Authentication Flow

### Step 1: Register a New User

**Endpoint**: `POST /api/v1/auth/register`

**Request Body**:
```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+639171234567",
  "city_id": 1
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "1",
  "email": "testuser@example.com",
  "role": "buyer"
}
```

**Post-Response Script** (auto-sets tokens):
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set('access_token', jsonData.access_token);
    pm.environment.set('refresh_token', jsonData.refresh_token);
    pm.environment.set('user_id', jsonData.user_id);
}
```

### Step 2: Login

**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:
```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123!"
}
```

**Response**: Same as registration

### Step 3: Use Protected Endpoints

All protected endpoints require the JWT token in the Authorization header:

**Header**:
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Example cURL**:
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 4: Refresh Token

When access token expires (after 24 hours):

**Endpoint**: `POST /api/v1/auth/refresh`

**Request Body**:
```json
{
  "refresh_token": "{{refresh_token}}"
}
```

**Response**: Returns new access_token

---

## API Endpoint Reference

### 1. Authentication Endpoints (`/api/v1/auth`)

#### 1.1 Register User
- **Method**: POST
- **Path**: `/api/v1/auth/register`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string (min 8 chars)",
    "first_name": "string",
    "last_name": "string",
    "phone": "string (+639XXXXXXXXX)",
    "city_id": "integer",
    "business_name": "string (optional, for sellers)"
  }
  ```
- **Response**: TokenResponse with access_token, refresh_token
- **Status Codes**:
  - 200: Success
  - 400: Validation error (email already exists, weak password)
  - 422: Invalid input format

#### 1.2 Login
- **Method**: POST
- **Path**: `/api/v1/auth/login`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: TokenResponse
- **Status Codes**:
  - 200: Success
  - 401: Invalid credentials
  - 403: Account banned/suspended

#### 1.3 Get Current User
- **Method**: GET
- **Path**: `/api/v1/auth/me`
- **Auth**: Required
- **Response**: UserProfile object
- **Status Codes**:
  - 200: Success
  - 401: Unauthorized (invalid/expired token)

#### 1.4 Check Email Availability
- **Method**: GET
- **Path**: `/api/v1/auth/check-email/{email}`
- **Auth**: None
- **Response**:
  ```json
  {
    "email": "test@example.com",
    "available": true,
    "message": "Email is available"
  }
  ```

#### 1.5 Get Verification Status
- **Method**: GET
- **Path**: `/api/v1/auth/verification-status`
- **Auth**: Required
- **Response**:
  ```json
  {
    "user_id": 1,
    "email_verified": true,
    "phone_verified": false,
    "identity_verified": false,
    "business_verified": false,
    "verification_level": "email",
    "is_fully_verified": false
  }
  ```

#### 1.6 Change Password
- **Method**: POST
- **Path**: `/api/v1/auth/change-password`
- **Auth**: Required
- **Body**:
  ```json
  {
    "old_password": "string",
    "new_password": "string"
  }
  ```

#### 1.7 Forgot Password
- **Method**: POST
- **Path**: `/api/v1/auth/forgot-password`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "string"
  }
  ```

#### 1.8 Logout
- **Method**: POST
- **Path**: `/api/v1/auth/logout`
- **Auth**: Required
- **Response**: `{"message": "Logged out successfully"}`

---

### 2. User Management Endpoints (`/api/v1/users`)

#### 2.1 Get User Profile
- **Method**: GET
- **Path**: `/api/v1/users/profile`
- **Auth**: Required
- **Response**: Complete UserProfile with all fields

#### 2.2 Update User Profile
- **Method**: PUT
- **Path**: `/api/v1/users/profile`
- **Auth**: Required
- **Body**:
  ```json
  {
    "first_name": "string",
    "last_name": "string",
    "phone": "string",
    "bio": "string",
    "city_id": "integer"
  }
  ```

#### 2.3 Upload Profile Photo
- **Method**: POST
- **Path**: `/api/v1/users/profile/photo`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Body** (form-data):
  - `file`: Image file (JPEG/PNG/WebP, max 5MB)
- **Response**: `{"message": "Profile photo uploaded"}`

#### 2.4 Upgrade to Seller
- **Method**: POST
- **Path**: `/api/v1/users/upgrade-role`
- **Auth**: Required
- **Body**:
  ```json
  {
    "new_role": "seller",
    "business_name": "My Auto Sales"
  }
  ```
- **Response**: RoleUpgradeResponse
- **Note**: Sellers can create up to 3 free listings

#### 2.5 Upgrade to Dealer
- **Method**: POST
- **Path**: `/api/v1/users/upgrade-role`
- **Auth**: Required
- **Body**:
  ```json
  {
    "new_role": "dealer",
    "business_name": "Premium Dealership Inc.",
    "business_permit_number": "BP-2024-12345",
    "tin_number": "123-456-789-000"
  }
  ```
- **Note**: Requires business verification, allows 10-100 listings

#### 2.6 Submit Identity Verification
- **Method**: POST
- **Path**: `/api/v1/users/verify-identity`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Body** (form-data):
  - `id_type`: "drivers_license" | "passport" | "national_id"
  - `id_number`: string
  - `id_front_image`: file
  - `id_back_image`: file
- **Response**: `{"message": "Identity verification submitted"}`

#### 2.7 Get My Listings
- **Method**: GET
- **Path**: `/api/v1/users/listings`
- **Auth**: Required
- **Query Params**:
  - `status`: "active" | "pending" | "sold" | "expired" (optional)
  - `skip`: integer (default: 0)
  - `limit`: integer (default: 20)
- **Response**: Array of CarResponse

#### 2.8 Favorites Management
- **Get Favorites**: `GET /api/v1/users/favorites`
- **Add to Favorites**: `POST /api/v1/users/favorites/{car_id}`
- **Remove from Favorites**: `DELETE /api/v1/users/favorites/{car_id}`

#### 2.9 Notifications
- **Get Notifications**: `GET /api/v1/users/notifications?unread_only=true`
- **Mark as Read**: `PUT /api/v1/users/notifications/{notification_id}/read`
- **Mark All as Read**: `PUT /api/v1/users/notifications/read-all`

---

### 3. Cars & Listings Endpoints (`/api/v1/cars`)

#### 3.1 Create Car Listing
- **Method**: POST
- **Path**: `/api/v1/cars`
- **Auth**: Required (seller/dealer role)
- **Body**:
  ```json
  {
    "brand_id": 1,
    "model_id": 1,
    "year": 2020,
    "price": 850000,
    "title": "2020 Toyota Vios 1.3E MT - Well Maintained",
    "description": "Excellent condition, single owner...",
    "mileage": 35000,
    "fuel_type": "gasoline",
    "transmission": "manual",
    "city_id": 1,
    "latitude": 14.5995,
    "longitude": 120.9842,
    "features": [1, 2, 3, 5, 8]
  }
  ```
- **Fuel Types**: gasoline, diesel, hybrid, electric, cng, lpg
- **Transmissions**: manual, automatic, semi_automatic, cvt
- **Response**: `{"id": 1, "message": "Car created"}`

#### 3.2 Search Cars (Public)
- **Method**: GET
- **Path**: `/api/v1/cars`
- **Auth**: None
- **Query Params**:
  - `q`: Search query (searches title, description)
  - `brand_id`: Filter by brand
  - `model_id`: Filter by model
  - `min_price`, `max_price`: Price range
  - `min_year`, `max_year`: Year range
  - `fuel_type`: Filter by fuel type
  - `transmission`: Filter by transmission
  - `city_id`: Filter by city
  - `latitude`, `longitude`, `radius_km`: Location-based search
  - `sort_by`: price | year | mileage | created_at
  - `sort_order`: asc | desc
  - `page`: Page number (default: 1)
  - `page_size`: Items per page (default: 20, max: 100)
- **Response**: PaginatedResponse with array of CarResponse

**Example**:
```
GET /api/v1/cars?q=toyota&min_price=500000&max_price=1000000&transmission=automatic&page=1&page_size=20&sort_by=price&sort_order=asc
```

#### 3.3 Get Car Details
- **Method**: GET
- **Path**: `/api/v1/cars/{car_id}`
- **Auth**: None
- **Response**: CarDetailResponse with full car information, seller details, images

#### 3.4 Update Car Listing
- **Method**: PUT
- **Path**: `/api/v1/cars/{car_id}`
- **Auth**: Required (owner only)
- **Body**:
  ```json
  {
    "price": 820000,
    "title": "Updated title",
    "description": "Updated description",
    "mileage": 36000,
    "status": "active"
  }
  ```

#### 3.5 Delete Car Listing
- **Method**: DELETE
- **Path**: `/api/v1/cars/{car_id}`
- **Auth**: Required (owner only)
- **Response**: `{"message": "Car deleted successfully"}`

#### 3.6 Upload Car Images
- **Method**: POST
- **Path**: `/api/v1/cars/{car_id}/images`
- **Auth**: Required (owner)
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: Image file (JPEG/PNG/WebP, max 10MB)
  - `image_type`: exterior | interior | engine | dashboard | wheels | damage | documents | other
  - `is_primary`: boolean (set as primary image)
- **Note**: Max 20 images per car
- **Response**: CarImageUpload with image URLs (thumbnail, medium, large)

#### 3.7 Delete Car Image
- **Method**: DELETE
- **Path**: `/api/v1/cars/{car_id}/images/{image_id}`
- **Auth**: Required (owner)

#### 3.8 Boost Listing
- **Method**: POST
- **Path**: `/api/v1/cars/{car_id}/boost`
- **Auth**: Required (seller)
- **Body**:
  ```json
  {
    "duration_hours": 24
  }
  ```
- **Note**: Requires subscription credits

#### 3.9 Feature Listing
- **Method**: POST
- **Path**: `/api/v1/cars/{car_id}/feature`
- **Auth**: Required (seller)
- **Body**:
  ```json
  {
    "duration_days": 7
  }
  ```
- **Note**: Requires subscription credits

#### 3.10 Get Price History
- **Method**: GET
- **Path**: `/api/v1/cars/{car_id}/price-history`
- **Auth**: None
- **Response**: Array of price changes with dates

#### 3.11 Reference Data
- **Get All Brands**: `GET /api/v1/cars/brands/all?is_popular=true`
- **Get Models by Brand**: `GET /api/v1/cars/brands/{brand_id}/models`
- **Get All Features**: `GET /api/v1/cars/features/all?category=safety`

---

### 4. Subscriptions Endpoints (`/api/v1/subscriptions`)

#### 4.1 Get Subscription Plans
- **Method**: GET
- **Path**: `/api/v1/subscriptions/plans`
- **Auth**: None
- **Response**: Array of SubscriptionPlanResponse
  ```json
  [
    {
      "id": 1,
      "name": "Basic",
      "description": "For individual sellers",
      "price": 499,
      "billing_cycle": "monthly",
      "max_listings": 10,
      "max_featured_listings": 1,
      "boost_credits": 5
    }
  ]
  ```

#### 4.2 Subscribe to Plan
- **Method**: POST
- **Path**: `/api/v1/subscriptions/subscribe`
- **Auth**: Required
- **Body**:
  ```json
  {
    "plan_id": 2,
    "billing_cycle": "monthly",
    "payment_method": "qr_code",
    "promo_code": "WELCOME10"
  }
  ```
- **Response**: QRCodePaymentResponse
  ```json
  {
    "payment_id": 1,
    "subscription_id": 1,
    "amount": "449.10",
    "currency": "PHP",
    "qr_code_image_url": "https://...",
    "payment_instructions": "Scan QR code...",
    "status": "pending"
  }
  ```

#### 4.3 Get Current Subscription
- **Method**: GET
- **Path**: `/api/v1/subscriptions/current`
- **Auth**: Required
- **Response**: UserSubscriptionResponse with plan details

#### 4.4 Submit Payment Reference
- **Method**: POST
- **Path**: `/api/v1/subscriptions/submit-reference`
- **Auth**: Required
- **Body**:
  ```json
  {
    "payment_id": 1,
    "reference_number": "GCASH-123456789"
  }
  ```

#### 4.5 Get Payment History
- **Method**: GET
- **Path**: `/api/v1/subscriptions/payments`
- **Auth**: Required
- **Response**: Array of Payment objects

---

### 5. Inquiries Endpoints (`/api/v1/inquiries`)

#### 5.1 Create Inquiry
- **Method**: POST
- **Path**: `/api/v1/inquiries`
- **Auth**: Optional (logged in users get better tracking)
- **Body**:
  ```json
  {
    "car_id": 1,
    "subject": "Interested in your 2020 Toyota Vios",
    "message": "Is this still available?",
    "buyer_name": "John Doe",
    "buyer_email": "buyer@example.com",
    "buyer_phone": "+639171234567",
    "inquiry_type": "general",
    "test_drive_requested": true,
    "inspection_requested": false,
    "financing_needed": true
  }
  ```
- **Inquiry Types**: general, price_negotiation, test_drive, inspection, financing
- **Response**: `{"id": 1, "message": "Inquiry created"}`

#### 5.2 Get My Inquiries
- **Method**: GET
- **Path**: `/api/v1/inquiries?role=sent&status=new`
- **Auth**: Required
- **Query Params**:
  - `role`: "sent" (buyer) | "received" (seller)
  - `status`: new | replied | negotiating | closed
- **Response**: Array of InquiryResponse

#### 5.3 Get Inquiry Details
- **Method**: GET
- **Path**: `/api/v1/inquiries/{inquiry_id}`
- **Auth**: Required (buyer or seller)
- **Response**: InquiryDetailResponse with full conversation

#### 5.4 Respond to Inquiry
- **Method**: POST
- **Path**: `/api/v1/inquiries/{inquiry_id}/respond`
- **Auth**: Required (seller)
- **Body**:
  ```json
  {
    "message": "Yes, still available!",
    "response_type": "positive",
    "counter_offer_price": 800000
  }
  ```
- **Response Types**: positive, negative, counter_offer

#### 5.5 Update Status
- **Method**: PUT
- **Path**: `/api/v1/inquiries/{inquiry_id}`
- **Auth**: Required (seller)
- **Body**:
  ```json
  {
    "status": "closed"
  }
  ```

#### 5.6 Rate Inquiry
- **Method**: POST
- **Path**: `/api/v1/inquiries/{inquiry_id}/rate`
- **Auth**: Required
- **Body**:
  ```json
  {
    "rating": 5
  }
  ```

---

### 6. Transactions Endpoints (`/api/v1/transactions`)

#### 6.1 Create Transaction
- **Method**: POST
- **Path**: `/api/v1/transactions`
- **Auth**: Required
- **Body**:
  ```json
  {
    "car_id": 1,
    "agreed_price": 800000,
    "payment_method": "bank_transfer",
    "deposit_amount": 50000,
    "financing_provider": "BPI Auto Loan",
    "down_payment": 200000,
    "monthly_installment": 18500
  }
  ```
- **Payment Methods**: cash, bank_transfer, installment, financing
- **Response**: `{"id": 1, "message": "Transaction created"}`

#### 6.2 Get Transactions
- **Method**: GET
- **Path**: `/api/v1/transactions?role=buyer`
- **Auth**: Required
- **Query Params**:
  - `role`: buyer | seller
- **Response**: Array of TransactionResponse

#### 6.3 Get Transaction Details
- **Method**: GET
- **Path**: `/api/v1/transactions/{transaction_id}`
- **Auth**: Required (buyer or seller)
- **Response**: TransactionDetailResponse

#### 6.4 Update Transaction Status
- **Method**: PUT
- **Path**: `/api/v1/transactions/{transaction_id}`
- **Auth**: Required (buyer/seller)
- **Body**:
  ```json
  {
    "status": "deposit_paid"
  }
  ```
- **Statuses**: initiated, negotiating, deposit_paid, completed, cancelled

---

### 7. Analytics Endpoints (`/api/v1/analytics`)

#### 7.1 Get Dashboard Stats
- **Method**: GET
- **Path**: `/api/v1/analytics/dashboard`
- **Auth**: Required
- **Response**:
  ```json
  {
    "total_listings": 5,
    "active_listings": 3,
    "total_views": 1234,
    "total_inquiries": 45
  }
  ```

#### 7.2 Get Car Views Analytics
- **Method**: GET
- **Path**: `/api/v1/analytics/cars/{car_id}/views?days=30`
- **Auth**: Required (owner)
- **Query Params**:
  - `days`: 1-365 (default: 30)
- **Response**:
  ```json
  {
    "car_id": 1,
    "total_views": 234,
    "period_days": 30,
    "daily_views": [
      {"date": "2024-01-01", "views": 12},
      {"date": "2024-01-02", "views": 8}
    ]
  }
  ```

#### 7.3 Get Market Insights
- **Method**: GET
- **Path**: `/api/v1/analytics/market-insights?brand_id=1&model_id=1`
- **Auth**: None
- **Response**:
  ```json
  {
    "avg_price": 850000,
    "min_price": 600000,
    "max_price": 1200000,
    "listing_count": 45
  }
  ```

---

### 8. Admin Endpoints (`/api/v1/admin`)

**Note**: All admin endpoints require `admin` or `moderator` role

#### 8.1 Admin Dashboard
- **Method**: GET
- **Path**: `/api/v1/admin/dashboard`
- **Auth**: Required (admin)
- **Response**: AdminDashboardResponse with comprehensive statistics

#### 8.2 User Management
- **Get All Users**: `GET /api/v1/admin/users?page=1&page_size=20&role=seller`
- **Get User Details**: `GET /api/v1/admin/users/{user_id}`
- **Ban User**: `POST /api/v1/admin/users/{user_id}/ban`
- **Unban User**: `POST /api/v1/admin/users/{user_id}/unban`
- **Verify User**: `POST /api/v1/admin/users/{user_id}/verify`
- **Change Role**: `POST /api/v1/admin/users/{user_id}/change-role`

#### 8.3 Reports Management
- **Get Reports**: `GET /api/v1/admin/reports?status=pending`
- **Get Report Details**: `GET /api/v1/admin/reports/{report_id}`
- **Resolve Report**: `POST /api/v1/admin/reports/{report_id}/resolve`

#### 8.4 Car Moderation
- **Get Pending Cars**: `GET /api/v1/admin/cars/pending`
- **Approve/Reject Car**: `POST /api/v1/admin/cars/{car_id}/approve`

#### 8.5 Payment Verification
- **Get Pending Payments**: `GET /api/v1/admin/payments/pending`
- **Get Payment Details**: `GET /api/v1/admin/payments/{payment_id}`
- **Verify Payment**: `POST /api/v1/admin/payments/verify`
  ```json
  {
    "payment_id": 1,
    "action": "verify",
    "admin_notes": "Payment verified",
    "rejection_reason": ""
  }
  ```
- **Get Payment Statistics**: `GET /api/v1/admin/payments/statistics`

#### 8.6 Security & Monitoring
- **Get Fraud Indicators**: `GET /api/v1/admin/fraud-indicators?severity=high`
- **Get Audit Logs**: `GET /api/v1/admin/audit-logs?limit=100`
- **Get System Config**: `GET /api/v1/admin/system-config`
- **Update System Config**: `PUT /api/v1/admin/system-config/{key}`

---

## Testing Workflows

### Workflow 1: Complete User Journey (Buyer)

**Step 1**: Register as buyer
```
POST /api/v1/auth/register
```

**Step 2**: Browse cars (no auth needed)
```
GET /api/v1/cars?q=toyota&min_price=500000&max_price=1000000
```

**Step 3**: View car details
```
GET /api/v1/cars/1
```

**Step 4**: Add to favorites
```
POST /api/v1/users/favorites/1
```

**Step 5**: Send inquiry
```
POST /api/v1/inquiries
{
  "car_id": 1,
  "message": "Interested in this car"
}
```

**Step 6**: Check notifications
```
GET /api/v1/users/notifications
```

---

### Workflow 2: Complete Seller Journey

**Step 1**: Register as buyer, then upgrade to seller
```
POST /api/v1/users/upgrade-role
{
  "new_role": "seller",
  "business_name": "My Auto Sales"
}
```

**Step 2**: Create car listing
```
POST /api/v1/cars
{
  "brand_id": 1,
  "model_id": 1,
  "title": "2020 Toyota Vios",
  "price": 850000,
  ...
}
```

**Step 3**: Upload car images
```
POST /api/v1/cars/1/images
[multipart form-data with image files]
```

**Step 4**: Check received inquiries
```
GET /api/v1/inquiries?role=received
```

**Step 5**: Respond to inquiry
```
POST /api/v1/inquiries/1/respond
{
  "message": "Yes, available!",
  "response_type": "positive"
}
```

**Step 6**: View analytics
```
GET /api/v1/analytics/cars/1/views?days=30
```

---

### Workflow 3: Subscription & Payment

**Step 1**: View subscription plans
```
GET /api/v1/subscriptions/plans
```

**Step 2**: Subscribe to a plan
```
POST /api/v1/subscriptions/subscribe
{
  "plan_id": 2,
  "billing_cycle": "monthly",
  "payment_method": "qr_code"
}
```

**Step 3**: Get QR code (from response)
```json
{
  "qr_code_image_url": "https://...",
  "payment_id": 1
}
```

**Step 4**: Submit payment reference after paying
```
POST /api/v1/subscriptions/submit-reference
{
  "payment_id": 1,
  "reference_number": "GCASH-123456789"
}
```

**Step 5**: Admin verifies payment
```
POST /api/v1/admin/payments/verify
{
  "payment_id": 1,
  "action": "verify",
  "admin_notes": "Verified"
}
```

---

### Workflow 4: Admin Moderation

**Step 1**: Login as admin
```
POST /api/v1/auth/login
{
  "email": "admin@autohub.ph",
  "password": "admin_password"
}
```

**Step 2**: View dashboard
```
GET /api/v1/admin/dashboard
```

**Step 3**: Get pending cars for approval
```
GET /api/v1/admin/cars/pending
```

**Step 4**: Approve car
```
POST /api/v1/admin/cars/1/approve
{
  "approved": true,
  "notes": "Listing approved"
}
```

**Step 5**: Get pending payments
```
GET /api/v1/admin/payments/pending
```

**Step 6**: Verify payment
```
POST /api/v1/admin/payments/verify
{
  "payment_id": 1,
  "action": "verify"
}
```

---

## Common Use Cases

### Use Case 1: Search Cars by Location

**Request**:
```
GET /api/v1/cars?latitude=14.5995&longitude=120.9842&radius_km=50&sort_by=price&sort_order=asc
```

Returns all cars within 50km of Manila, sorted by price ascending.

### Use Case 2: Filter Cars by Multiple Criteria

**Request**:
```
GET /api/v1/cars?brand_id=1&min_year=2018&max_year=2024&fuel_type=gasoline&transmission=automatic&min_price=700000&max_price=1200000&page=1&page_size=20
```

Returns Toyota cars from 2018-2024, gasoline, automatic, priced 700k-1.2M.

### Use Case 3: Upload Multiple Car Images

**Step 1**: Upload primary image
```
POST /api/v1/cars/1/images
[form-data]
file: exterior-front.jpg
image_type: exterior
is_primary: true
```

**Step 2**: Upload additional images
```
POST /api/v1/cars/1/images
[form-data]
file: interior-dashboard.jpg
image_type: interior
is_primary: false
```

Repeat for all images (max 20 per car).

### Use Case 4: Price Negotiation Flow

**Buyer sends inquiry with offer**:
```
POST /api/v1/inquiries
{
  "car_id": 1,
  "inquiry_type": "price_negotiation",
  "offered_price": 780000,
  "message": "Can you do 780k?"
}
```

**Seller responds with counter-offer**:
```
POST /api/v1/inquiries/1/respond
{
  "response_type": "counter_offer",
  "counter_offer_price": 820000,
  "message": "Best I can do is 820k"
}
```

**Buyer accepts and creates transaction**:
```
POST /api/v1/transactions
{
  "car_id": 1,
  "agreed_price": 820000,
  "payment_method": "bank_transfer"
}
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Insufficient permissions, banned user |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Invalid data format |
| 500 | Internal Server Error | Server-side error |

### Error Response Format

All errors return JSON:
```json
{
  "success": false,
  "error": "Detailed error message",
  "detail": "Additional context (optional)"
}
```

### Common Errors and Solutions

#### 1. "Invalid token" (401)
**Cause**: Expired or malformed access token

**Solution**:
- Refresh token using `/api/v1/auth/refresh`
- Or re-login using `/api/v1/auth/login`

#### 2. "Insufficient permissions" (403)
**Cause**: User role doesn't have access to endpoint

**Solution**:
- Check user role: GET `/api/v1/auth/me`
- Upgrade role if needed: POST `/api/v1/users/upgrade-role`
- For admin endpoints, contact admin

#### 3. "Email already exists" (400)
**Cause**: Attempting to register with existing email

**Solution**:
- Use `/api/v1/auth/check-email/{email}` first
- Use different email or login instead

#### 4. "Max listings reached" (403)
**Cause**: User exceeded listing limit for their subscription

**Solution**:
- Check current subscription: GET `/api/v1/subscriptions/current`
- Upgrade subscription: POST `/api/v1/subscriptions/upgrade`

#### 5. "File too large" (400)
**Cause**: Uploaded image exceeds 10MB (cars) or 5MB (profile)

**Solution**:
- Compress image before upload
- Use appropriate file format (JPEG recommended)

#### 6. "User is banned" (403)
**Cause**: Account has been banned by admin

**Solution**:
- Check ban reason in error message
- Contact admin to appeal ban

---

## Best Practices

### 1. Token Management
- Store tokens securely (not in localStorage for production)
- Refresh tokens before they expire
- Handle 401 errors gracefully with automatic re-authentication

### 2. Pagination
- Always use pagination for list endpoints
- Default `page_size` is 20, max is 100
- Don't fetch all data at once

### 3. Image Uploads
- Compress images before upload
- Use JPEG for photos (smaller file size)
- Upload primary image first, then additional images
- Maximum 20 images per car listing

### 4. Search Optimization
- Use specific filters instead of broad searches
- Combine location search with other filters
- Use appropriate `sort_by` and `sort_order`

### 5. Error Handling
- Always check response status codes
- Implement retry logic for network errors
- Validate input before sending requests

### 6. Rate Limiting
- Current limit: 60 requests/minute, 1000 requests/hour
- Implement exponential backoff for retries
- Cache frequently accessed data

### 7. Testing Tips
- Test in this order: Health Check → Register → Login → Protected endpoints
- Save tokens as environment variables
- Use Postman Collections for organized testing
- Test error scenarios (invalid data, missing auth, etc.)

### 8. Security
- Never commit tokens to version control
- Use HTTPS in production
- Validate all user input
- Implement CSRF protection for web clients

---

## Environment Setup Checklist

- [ ] Server is running on port 8000
- [ ] Database is connected (MySQL)
- [ ] Postman collection imported
- [ ] Environment variables configured
- [ ] Health check endpoint returns "healthy"
- [ ] Can register a new user successfully
- [ ] Can login and receive tokens
- [ ] Tokens are auto-saved to environment
- [ ] Can access protected endpoints with token

---

## Quick Reference: cURL Examples

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+639171234567",
    "city_id": 1
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search Cars
```bash
curl -X GET "http://localhost:8000/api/v1/cars?q=toyota&min_price=500000&max_price=1000000"
```

### Create Car Listing
```bash
curl -X POST http://localhost:8000/api/v1/cars \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": 1,
    "model_id": 1,
    "year": 2020,
    "price": 850000,
    "title": "2020 Toyota Vios",
    "description": "Well maintained",
    "mileage": 35000,
    "fuel_type": "gasoline",
    "transmission": "manual",
    "city_id": 1
  }'
```

### Upload Car Image
```bash
curl -X POST http://localhost:8000/api/v1/cars/1/images \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "image_type=exterior" \
  -F "is_primary=true"
```

---

## Troubleshooting

### Server Not Starting
1. Check Python version: `python --version` (should be 3.11+)
2. Install dependencies: `pip install -r requirements.txt`
3. Check database connection in config.py
4. View error logs in console

### Database Connection Errors
1. Verify MySQL is running: `mysql -u root -p`
2. Check database exists: `SHOW DATABASES;`
3. Verify credentials in `.env` or `config.py`
4. Check DATABASE_URL format

### Token Issues
1. Token expired: Use refresh token endpoint
2. Token invalid: Re-login
3. Token not being saved: Check Postman environment scripts

### File Upload Failures
1. Check file size (max 10MB for cars, 5MB for profile)
2. Verify file type (JPEG/PNG/WebP only)
3. Ensure `Content-Type: multipart/form-data` header
4. Check file permissions in uploads directory

---

## Support & Documentation

### Additional Resources
- **Swagger UI**: http://localhost:8000/api/docs (when server running)
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

### Contact
For issues or questions:
- GitHub Issues: [Repository URL]
- Email: [Support Email]
- Documentation: This guide

---

**Last Updated**: 2025-11-15
**API Version**: 1.0.0
**Guide Version**: 1.0
