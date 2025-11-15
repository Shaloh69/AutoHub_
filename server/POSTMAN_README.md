# AutoHub Philippines - Postman API Documentation

Welcome to the complete Postman testing documentation for AutoHub Philippines Car Marketplace API!

## 📁 Documentation Files

This folder contains comprehensive API documentation and testing resources:

| File | Description | Use For |
|------|-------------|---------|
| **AutoHub_Postman_Collection.json** | Complete Postman collection with 85+ requests | Import into Postman for testing |
| **POSTMAN_TESTING_GUIDE.md** | Comprehensive testing guide with examples | Learn how to test the API |
| **API_ENDPOINTS_SUMMARY.md** | Quick reference of all 75+ endpoints | Quick lookup of endpoints |
| **POSTMAN_README.md** | This file - getting started guide | Start here! |

## 🚀 Quick Start (3 Steps)

### Step 1: Import Postman Collection

1. Open **Postman** (download from [postman.com](https://www.postman.com/downloads/))
2. Click **Import** button (top left)
3. Select `AutoHub_Postman_Collection.json`
4. Collection appears in your workspace ✅

### Step 2: Set Up Environment

1. Click **Environments** (left sidebar)
2. Click **Create Environment** or **+**
3. Name it: `AutoHub Local`
4. Add these variables:

| Variable | Initial Value |
|----------|---------------|
| base_url | http://localhost:8000 |
| access_token | (leave empty) |
| refresh_token | (leave empty) |
| user_id | (leave empty) |
| car_id | (leave empty) |

5. Click **Save**
6. Select **AutoHub Local** from environment dropdown ✅

### Step 3: Start Testing

1. **Start the server**:
   ```bash
   cd /home/user/AutoHub_/server
   python main.py
   ```

2. **Test health check**:
   - In Postman, open: `Health Check > Health Check`
   - Click **Send**
   - You should see: `{"status": "healthy", ...}` ✅

3. **Register a user**:
   - Open: `1. Authentication > Register User (Buyer)`
   - Click **Send**
   - Tokens will auto-save to environment variables ✅

4. **You're ready to test!** 🎉

## 📚 What Can You Test?

### ✅ Authentication & Users
- Register new users (buyer, seller, dealer)
- Login and get JWT tokens
- Update profile and upload photos
- Upgrade from buyer to seller/dealer
- Submit identity verification

### ✅ Car Listings
- Create car listings (as seller)
- Search and browse cars
- Upload up to 20 images per car
- Update and delete listings
- Boost and feature listings

### ✅ Subscriptions & Payments
- View subscription plans
- Subscribe to a plan
- Get QR code for payment
- Submit payment reference
- View payment history

### ✅ Inquiries & Messaging
- Send inquiries about cars
- Respond to inquiries (as seller)
- Negotiate prices
- Rate inquiry experiences

### ✅ Transactions
- Create purchase transactions
- Track transaction status
- Manage buyer/seller interactions

### ✅ Analytics
- View dashboard statistics
- Track car listing views
- Get market insights and pricing data

### ✅ Admin Functions
- Manage users (ban, verify, change roles)
- Moderate car listings
- Verify payments
- View fraud indicators and audit logs
- Configure system settings

## 🎯 Testing Workflows

### Workflow 1: Complete Buyer Journey
1. **Register** → `POST /api/v1/auth/register`
2. **Browse Cars** → `GET /api/v1/cars?q=toyota`
3. **View Details** → `GET /api/v1/cars/1`
4. **Add to Favorites** → `POST /api/v1/users/favorites/1`
5. **Send Inquiry** → `POST /api/v1/inquiries`
6. **Create Transaction** → `POST /api/v1/transactions`

### Workflow 2: Complete Seller Journey
1. **Register & Upgrade** → `POST /api/v1/users/upgrade-role`
2. **Create Listing** → `POST /api/v1/cars`
3. **Upload Images** → `POST /api/v1/cars/1/images`
4. **Receive Inquiry** → `GET /api/v1/inquiries?role=received`
5. **Respond** → `POST /api/v1/inquiries/1/respond`
6. **View Analytics** → `GET /api/v1/analytics/cars/1/views`

### Workflow 3: Subscription Flow
1. **View Plans** → `GET /api/v1/subscriptions/plans`
2. **Subscribe** → `POST /api/v1/subscriptions/subscribe`
3. **Get QR Code** → (from subscribe response)
4. **Submit Reference** → `POST /api/v1/subscriptions/submit-reference`
5. **Admin Verifies** → `POST /api/v1/admin/payments/verify`

## 📖 Documentation Details

### Total Coverage
- **75+ API Endpoints** fully documented
- **85+ Postman Requests** with examples
- **8 Major Modules**: Auth, Users, Cars, Subscriptions, Inquiries, Transactions, Analytics, Admin
- **5 User Roles**: buyer, seller, dealer, moderator, admin
- **All CRUD Operations** covered

### Features
- ✅ Auto-save authentication tokens
- ✅ Pre-configured request bodies with examples
- ✅ Complete error handling documentation
- ✅ File upload examples (images, documents)
- ✅ Pagination, filtering, and sorting examples
- ✅ Location-based search examples
- ✅ Role-based access control testing

## 🔐 Authentication

All protected endpoints require JWT Bearer token:

**Header Format**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**How Tokens Work**:
1. Register or login → Get `access_token` and `refresh_token`
2. Postman auto-saves tokens to environment variables
3. Collection uses `{{access_token}}` variable automatically
4. Token expires after 24 hours → Use refresh endpoint
5. Refresh token valid for 30 days

**Testing Auth**:
- ❌ No Auth: Health check, browse cars, view details
- ✅ Auth Required: Create listings, manage profile, inquiries
- 🔑 Seller Required: Create listings, boost, feature
- 👑 Admin Required: User management, payment verification

## 📊 API Modules Overview

### 1. Authentication (12 endpoints)
Register, login, logout, password management, verification

### 2. Users (14 endpoints)
Profile management, role upgrades, favorites, notifications

### 3. Cars (14 endpoints)
CRUD operations, image uploads, search, boost/feature, reference data

### 4. Subscriptions (9 endpoints)
Plans, subscribe, payments, promo codes

### 5. Inquiries (7 endpoints)
Create, respond, manage buyer-seller communication

### 6. Transactions (4 endpoints)
Purchase transactions, status tracking

### 7. Analytics (3 endpoints)
Dashboard stats, car views, market insights

### 8. Admin (23 endpoints)
User management, moderation, payment verification, system config

## 🧪 Testing Tips

### Best Practices
1. **Always test in order**:
   - Health Check → Register → Login → Protected endpoints

2. **Check environment variables**:
   - Verify `{{access_token}}` is set after login
   - Manually set `{{car_id}}` after creating a car

3. **Use Collection Runner**:
   - Right-click collection → Run collection
   - Test all endpoints automatically

4. **Save responses as examples**:
   - Helps document expected responses
   - Great for team collaboration

### Common Issues

**❌ "Unauthorized" (401)**
- Token expired → Use refresh token endpoint
- Token missing → Check environment variable

**❌ "Forbidden" (403)**
- Insufficient role → Upgrade to seller/dealer
- Account banned → Contact admin

**❌ "Not Found" (404)**
- Wrong endpoint URL → Check base_url variable
- Resource doesn't exist → Create it first

**❌ "Validation Error" (422)**
- Invalid data format → Check request body
- Missing required fields → See examples

## 📁 File Structure

```
server/
├── AutoHub_Postman_Collection.json    # Postman collection (IMPORT THIS)
├── POSTMAN_TESTING_GUIDE.md           # Detailed testing guide
├── API_ENDPOINTS_SUMMARY.md           # Quick reference
├── POSTMAN_README.md                  # This file
└── app/
    ├── api/v1/                        # API route handlers
    │   ├── auth.py                    # Authentication endpoints
    │   ├── users.py                   # User management
    │   ├── cars.py                    # Car listings
    │   ├── subscriptions.py           # Subscriptions
    │   ├── inquiries.py               # Inquiries
    │   ├── transactions.py            # Transactions
    │   ├── analytics.py               # Analytics
    │   └── admin.py                   # Admin endpoints
    ├── models/                        # Database models
    ├── schemas/                       # Request/Response schemas
    └── core/                          # Core utilities
```

## 🎓 Learning Path

### Beginner
1. Read this README
2. Import Postman collection
3. Test Health Check endpoint
4. Register and login
5. Browse cars (public endpoint)

### Intermediate
1. Create car listing (as seller)
2. Upload car images
3. Send inquiries
4. Manage favorites and notifications
5. View analytics

### Advanced
1. Test all subscription flows
2. Test admin endpoints
3. Test role upgrades
4. Test payment verification
5. Test fraud detection and audit logs

## 🔗 Related Resources

### Documentation
- **Swagger UI**: http://localhost:8000/api/docs (when server running)
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Code
- **Server Code**: `/home/user/AutoHub_/server/`
- **API Routes**: `/home/user/AutoHub_/server/app/api/v1/`
- **Database Models**: `/home/user/AutoHub_/server/app/models/`

## ❓ FAQ

**Q: Where do I start?**
A: Import the Postman collection, set up environment variables, start the server, and test the Health Check endpoint.

**Q: How do I test protected endpoints?**
A: First register/login to get tokens. Postman will auto-save them. Then test protected endpoints.

**Q: Can I test without the server running?**
A: No, you need the server running on http://localhost:8000. Run `python main.py` in the server directory.

**Q: How do I become a seller to test car listings?**
A: Register as buyer, login, then use the "Upgrade to Seller" endpoint in User Management folder.

**Q: How do I test admin endpoints?**
A: You need an admin account. Either create one in the database or use the admin creation script.

**Q: What if I get "Rate limit exceeded"?**
A: Wait 60 seconds. The API has a rate limit of 60 requests/minute.

**Q: Can I share this collection with my team?**
A: Yes! Export the collection and environment, and share the JSON files.

## 🎉 You're All Set!

You now have:
- ✅ Complete Postman collection (85+ requests)
- ✅ Comprehensive testing guide
- ✅ Quick reference documentation
- ✅ Testing workflows and examples
- ✅ Error handling guide
- ✅ Best practices and tips

**Ready to start testing?**

1. Import `AutoHub_Postman_Collection.json`
2. Set up environment variables
3. Start the server: `python main.py`
4. Test away! 🚀

---

**Questions or Issues?**
- See `POSTMAN_TESTING_GUIDE.md` for detailed information
- See `API_ENDPOINTS_SUMMARY.md` for quick endpoint reference
- Check server logs for debugging
- Use Swagger UI at http://localhost:8000/api/docs for interactive testing

**Happy Testing! 🎊**

---

**Last Updated**: 2025-11-15
**API Version**: 1.0.0
**Total Endpoints**: 75+
**Total Requests**: 85+
