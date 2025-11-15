# AutoHub Philippines - Complete API Endpoints Summary

**Last Updated**: 2025-11-15
**Total Endpoints**: 75+
**Base URL**: `http://localhost:8000`

---

## Quick Statistics

- **Total Modules**: 8
- **Total Endpoints**: 75
- **Public Endpoints**: 15 (no authentication required)
- **Protected Endpoints**: 60 (authentication required)
- **Admin-Only Endpoints**: 23
- **Moderator Endpoints**: 6

---

## Endpoints by Module

### 1. Health & Status (2 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Server health check |
| GET | `/` | ❌ | API welcome message |

---

### 2. Authentication (12 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Register new user |
| POST | `/api/v1/auth/login` | ❌ | Login to get JWT tokens |
| POST | `/api/v1/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/v1/auth/logout` | ✅ | Logout and invalidate token |
| GET | `/api/v1/auth/me` | ✅ | Get current user profile |
| GET | `/api/v1/auth/check-email/{email}` | ❌ | Check email availability |
| POST | `/api/v1/auth/verify-email` | ❌ | Verify email with token |
| GET | `/api/v1/auth/verification-status` | ✅ | Get verification status |
| POST | `/api/v1/auth/forgot-password` | ❌ | Request password reset |
| POST | `/api/v1/auth/reset-password` | ❌ | Reset password with token |
| POST | `/api/v1/auth/change-password` | ✅ | Change password |
| POST | `/api/v1/auth/resend-verification` | ✅ | Resend verification email |

---

### 3. Users (14 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users/profile` | ✅ | Get user profile |
| PUT | `/api/v1/users/profile` | ✅ | Update user profile |
| POST | `/api/v1/users/profile/photo` | ✅ | Upload profile photo |
| POST | `/api/v1/users/upgrade-role` | ✅ | Upgrade to seller/dealer |
| POST | `/api/v1/users/verify-identity` | ✅ | Submit identity verification |
| GET | `/api/v1/users/listings` | ✅ | Get user's car listings |
| GET | `/api/v1/users/favorites` | ✅ | Get favorite cars |
| POST | `/api/v1/users/favorites/{car_id}` | ✅ | Add car to favorites |
| DELETE | `/api/v1/users/favorites/{car_id}` | ✅ | Remove from favorites |
| GET | `/api/v1/users/notifications` | ✅ | Get notifications |
| PUT | `/api/v1/users/notifications/{id}/read` | ✅ | Mark notification as read |
| PUT | `/api/v1/users/notifications/read-all` | ✅ | Mark all as read |

---

### 4. Cars (14 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/cars` | ✅🔑 | Create car listing (seller+) |
| GET | `/api/v1/cars` | ❌ | Search/browse cars |
| GET | `/api/v1/cars/{car_id}` | ❌ | Get car details |
| PUT | `/api/v1/cars/{car_id}` | ✅👤 | Update car (owner only) |
| DELETE | `/api/v1/cars/{car_id}` | ✅👤 | Delete car (owner only) |
| POST | `/api/v1/cars/{car_id}/images` | ✅👤 | Upload car image |
| DELETE | `/api/v1/cars/{car_id}/images/{image_id}` | ✅👤 | Delete car image |
| POST | `/api/v1/cars/{car_id}/boost` | ✅🔑 | Boost listing (seller+) |
| POST | `/api/v1/cars/{car_id}/feature` | ✅🔑 | Feature listing (seller+) |
| GET | `/api/v1/cars/{car_id}/price-history` | ❌ | Get price history |
| GET | `/api/v1/cars/brands/all` | ❌ | Get all brands |
| GET | `/api/v1/cars/brands/{id}/models` | ❌ | Get models by brand |
| GET | `/api/v1/cars/features/all` | ❌ | Get all features |

**Legend**:
- ❌ No auth required
- ✅ Auth required
- 🔑 Seller/Dealer role required
- 👤 Owner only
- 👑 Admin only
- 🛡️ Moderator/Admin

---

### 5. Subscriptions (9 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/subscriptions/plans` | ❌ | Get subscription plans |
| POST | `/api/v1/subscriptions/subscribe` | ✅ | Subscribe to plan |
| GET | `/api/v1/subscriptions/current` | ✅ | Get current subscription |
| POST | `/api/v1/subscriptions/cancel` | ✅ | Cancel subscription |
| POST | `/api/v1/subscriptions/upgrade` | ✅ | Upgrade subscription |
| POST | `/api/v1/subscriptions/validate-promo` | ✅ | Validate promo code |
| GET | `/api/v1/subscriptions/payments` | ✅ | Get payment history |
| POST | `/api/v1/subscriptions/submit-reference` | ✅ | Submit payment reference |
| GET | `/api/v1/subscriptions/payment/{id}` | ✅ | Get payment details |

---

### 6. Inquiries (7 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/inquiries` | ⚠️ | Create inquiry (optional auth) |
| GET | `/api/v1/inquiries` | ✅ | Get inquiries (sent/received) |
| GET | `/api/v1/inquiries/{inquiry_id}` | ✅ | Get inquiry details |
| POST | `/api/v1/inquiries/{id}/respond` | ✅🔑 | Respond to inquiry (seller) |
| PUT | `/api/v1/inquiries/{inquiry_id}` | ✅🔑 | Update status (seller) |
| POST | `/api/v1/inquiries/{inquiry_id}/rate` | ✅ | Rate inquiry experience |
| DELETE | `/api/v1/inquiries/{inquiry_id}` | ✅ | Delete inquiry |

---

### 7. Transactions (4 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/transactions` | ✅ | Create transaction |
| GET | `/api/v1/transactions` | ✅ | Get transactions (buyer/seller) |
| GET | `/api/v1/transactions/{transaction_id}` | ✅ | Get transaction details |
| PUT | `/api/v1/transactions/{transaction_id}` | ✅ | Update transaction status |

---

### 8. Analytics (3 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/analytics/dashboard` | ✅ | Get dashboard statistics |
| GET | `/api/v1/analytics/cars/{id}/views` | ✅👤 | Get car views (owner) |
| GET | `/api/v1/analytics/market-insights` | ❌ | Get market insights |

---

### 9. Admin (23 endpoints)

#### User Management (6 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/users` | 👑 | Get all users (paginated) |
| GET | `/api/v1/admin/users/{user_id}` | 👑 | Get user details |
| POST | `/api/v1/admin/users/{id}/ban` | 👑 | Ban user |
| POST | `/api/v1/admin/users/{id}/unban` | 👑 | Unban user |
| POST | `/api/v1/admin/users/{id}/verify` | 👑 | Verify user manually |
| POST | `/api/v1/admin/users/{id}/change-role` | 👑 | Change user role |

#### Reports Management (3 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/reports` | 🛡️ | Get all reports |
| GET | `/api/v1/admin/reports/{report_id}` | 🛡️ | Get report details |
| POST | `/api/v1/admin/reports/{id}/resolve` | 🛡️ | Resolve report |

#### Car Moderation (2 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/cars/pending` | 🛡️ | Get pending cars |
| POST | `/api/v1/admin/cars/{id}/approve` | 🛡️ | Approve/reject car |

#### Payment Verification (5 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/payments/pending` | 👑 | Get pending payments |
| GET | `/api/v1/admin/payments/{payment_id}` | 👑 | Get payment details |
| POST | `/api/v1/admin/payments/verify` | 👑 | Verify/reject payment |
| GET | `/api/v1/admin/payments/statistics` | 👑 | Get payment statistics |
| GET | `/api/v1/admin/payments/{id}/logs` | 👑 | Get payment logs |

#### Security & System (5 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/dashboard` | 👑 | Admin dashboard stats |
| GET | `/api/v1/admin/fraud-indicators` | 👑 | Get fraud indicators |
| GET | `/api/v1/admin/audit-logs` | 👑 | Get audit logs |
| GET | `/api/v1/admin/system-config` | 👑 | Get system config |
| PUT | `/api/v1/admin/system-config/{key}` | 👑 | Update system config |

#### Payment Settings (2 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/settings/payment` | 👑 | Get payment settings |
| PUT | `/api/v1/admin/settings/payment/{key}` | 👑 | Update payment setting |

---

## Authentication Requirements Summary

### Public Endpoints (15)
No authentication required. Anyone can access.

- All health/status endpoints
- Auth: register, login, refresh, check-email, forgot-password, reset-password
- Cars: search, get details, price history, brands, models, features
- Subscriptions: get plans
- Analytics: market insights

### Protected Endpoints (60)
Require valid JWT Bearer token in Authorization header.

**Format**: `Authorization: Bearer YOUR_ACCESS_TOKEN`

All other endpoints require authentication.

### Role-Based Endpoints

#### Seller/Dealer Required (8 endpoints)
- Create car listing
- Boost listing
- Feature listing
- Respond to inquiry
- Update inquiry status

#### Owner Only (5 endpoints)
- Update/delete own car
- Upload/delete car images
- View car analytics

#### Moderator/Admin (6 endpoints)
- Get/resolve reports
- Approve/reject cars

#### Admin Only (17 endpoints)
- All user management
- Payment verification
- System configuration
- Fraud detection
- Audit logs

---

## Request/Response Formats

### Content Types

**Request**:
- JSON endpoints: `Content-Type: application/json`
- File uploads: `Content-Type: multipart/form-data`

**Response**:
- All responses: `Content-Type: application/json`

### Common Request Bodies

**Authentication**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Car Listing**:
```json
{
  "brand_id": "integer",
  "model_id": "integer",
  "year": "integer",
  "price": "number",
  "title": "string",
  "description": "string",
  "mileage": "integer",
  "fuel_type": "enum",
  "transmission": "enum",
  "city_id": "integer"
}
```

**File Upload (form-data)**:
```
file: [binary]
image_type: "string"
is_primary: "boolean"
```

### Common Response Formats

**Success**:
```json
{
  "message": "Operation successful",
  "success": true
}
```

**With ID**:
```json
{
  "id": 1,
  "message": "Created successfully"
}
```

**Token Response**:
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "string",
  "email": "string",
  "role": "string"
}
```

**Paginated Response**:
```json
{
  "items": [],
  "total": "integer",
  "page": "integer",
  "page_size": "integer",
  "total_pages": "integer",
  "has_next": "boolean",
  "has_prev": "boolean"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "detail": "Additional details (optional)"
}
```

---

## Query Parameters Reference

### Pagination (standard across all list endpoints)
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `skip`: Items to skip (alternative to page)
- `limit`: Max items to return (alternative to page_size)

### Filtering
- `q`: Search query (text search)
- `status`: Filter by status
- `role`: Filter by role
- `created_after`: Filter by creation date
- `created_before`: Filter by creation date

### Sorting
- `sort_by`: Field to sort by (price, year, created_at, etc.)
- `sort_order`: asc or desc

### Cars Specific
- `brand_id`, `model_id`: Filter by brand/model
- `min_price`, `max_price`: Price range
- `min_year`, `max_year`: Year range
- `fuel_type`: Filter by fuel type
- `transmission`: Filter by transmission
- `city_id`: Filter by city
- `latitude`, `longitude`, `radius_km`: Location-based search

---

## File Upload Specifications

### Profile Photo
- **Max Size**: 5 MB
- **Formats**: JPEG, PNG, WebP
- **Endpoint**: POST `/api/v1/users/profile/photo`

### Car Images
- **Max Size**: 10 MB per image
- **Max Images**: 20 per car
- **Formats**: JPEG, PNG, WebP
- **Types**: exterior, interior, engine, dashboard, wheels, damage, documents, other
- **Endpoint**: POST `/api/v1/cars/{car_id}/images`
- **Generated Sizes**:
  - Thumbnail: 300x225
  - Medium: 800x600
  - Large: 1920x1440

### Identity Documents
- **Max Size**: 10 MB per file
- **Formats**: JPEG, PNG, PDF
- **Required**: ID front, ID back
- **Optional**: Selfie photo
- **Endpoint**: POST `/api/v1/users/verify-identity`

---

## Rate Limiting

- **Per Minute**: 60 requests
- **Per Hour**: 1000 requests
- **Headers** (returned in response):
  - `X-RateLimit-Limit`: Requests allowed per window
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

**Exceeded Rate Limit Response** (429):
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

---

## Testing Checklist

### Basic Tests
- [ ] Health check returns "healthy"
- [ ] Can register new user
- [ ] Can login and receive tokens
- [ ] Can access protected endpoints with token
- [ ] 401 error when using invalid token
- [ ] 403 error when accessing admin endpoint as regular user

### User Flow Tests
- [ ] Register → Login → Get Profile
- [ ] Upgrade buyer → seller
- [ ] Upload profile photo
- [ ] Submit identity verification
- [ ] Get notifications

### Car Tests
- [ ] Search cars (no auth)
- [ ] Get car details (no auth)
- [ ] Create listing (as seller)
- [ ] Upload car images
- [ ] Update car listing
- [ ] Delete car listing

### Subscription Tests
- [ ] Get subscription plans
- [ ] Subscribe to plan
- [ ] Get QR code for payment
- [ ] Submit payment reference
- [ ] Check current subscription

### Inquiry Tests
- [ ] Send inquiry
- [ ] Get received inquiries (as seller)
- [ ] Respond to inquiry
- [ ] Rate inquiry experience

### Admin Tests
- [ ] Login as admin
- [ ] Get admin dashboard
- [ ] Get pending cars
- [ ] Approve car
- [ ] Get pending payments
- [ ] Verify payment

---

## Postman Collection Structure

The provided Postman collection is organized into folders:

1. **Health Check** (2 requests)
   - Health Check
   - Root Endpoint

2. **1. Authentication** (11 requests)
   - Register User (Buyer)
   - Register Seller
   - Login (with auto token save)
   - Get Current User
   - Check Email
   - Verification Status
   - Refresh Token
   - Change Password
   - Forgot Password
   - Resend Verification
   - Logout

3. **2. User Management** (13 requests)
   - Profile operations
   - Role upgrades
   - Favorites
   - Notifications

4. **3. Cars & Listings** (13 requests)
   - CRUD operations
   - Image management
   - Boost/Feature
   - Reference data

5. **4. Subscriptions** (9 requests)
   - Plans
   - Subscribe
   - Payments

6. **5. Inquiries** (8 requests)
   - Create/respond
   - Manage inquiries

7. **6. Transactions** (5 requests)
   - Create/manage transactions

8. **7. Analytics** (3 requests)
   - Dashboard
   - Views
   - Market insights

9. **8. Admin** (22 requests)
   - User management
   - Reports
   - Car moderation
   - Payment verification
   - System config

**Total Requests in Collection**: 85+ (including examples)

---

## Quick Reference: Common Commands

### Start Server
```bash
cd /home/user/AutoHub_/server
python main.py
```

### Check Health
```bash
curl http://localhost:8000/health
```

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!","first_name":"John","last_name":"Doe","phone":"+639171234567","city_id":1}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!"}'
```

### Search Cars
```bash
curl "http://localhost:8000/api/v1/cars?q=toyota&min_price=500000"
```

---

## Documentation Files

This API documentation consists of:

1. **AutoHub_Postman_Collection.json** - Complete Postman collection (import this)
2. **POSTMAN_TESTING_GUIDE.md** - Comprehensive testing guide (this file)
3. **API_ENDPOINTS_SUMMARY.md** - Quick reference summary
4. **Swagger UI** - http://localhost:8000/api/docs (interactive docs)

---

**For detailed testing workflows, examples, and troubleshooting, see POSTMAN_TESTING_GUIDE.md**

**For code-level details, see the source files in `/home/user/AutoHub_/server/app/api/v1/`**
