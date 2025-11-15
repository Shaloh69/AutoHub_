# 🚗 AutoHub - Complete Testing Guide

## Table of Contents
1. [Setup & Prerequisites](#setup--prerequisites)
2. [Creating Test Accounts](#creating-test-accounts)
3. [Testing as a Buyer](#testing-as-a-buyer)
4. [Testing as a Seller](#testing-as-a-seller)
5. [Testing as an Admin](#testing-as-an-admin)
6. [Testing the Complete Flow](#testing-the-complete-flow)
7. [API Testing with Postman](#api-testing-with-postman)

---

## Setup & Prerequisites

### 1. Start the Backend Server
```bash
cd server
python3 -m uvicorn main:app --reload --port 8000
```
**Server will run at:** `http://localhost:8000`
**API Docs:** `http://localhost:8000/docs`

### 2. Start the Frontend Client
```bash
cd client
npm run dev
```
**Client will run at:** `http://localhost:3000`

---

## Creating Test Accounts

### Option 1: Create Admin Account (Command Line)
```bash
cd server
python3 create_admin.py admin@autohub.com Admin123456 John Admin
```

### Option 2: Create Admin Account (Interactive)
```bash
cd server
python3 create_admin.py
```
Follow the prompts to create an admin or moderator account.

### Option 3: Register via Web Interface

#### Register as a Buyer
1. Go to `http://localhost:3000/auth/register`
2. Fill in the form:
   - **Email:** buyer@test.com
   - **Password:** Password123
   - **First Name:** John
   - **Last Name:** Buyer
   - **Phone:** +639123456789
   - **Role:** Select "Buyer"
   - **Location:** Select Region, Province, City
3. Click "Sign Up"

#### Register as a Seller
1. Go to `http://localhost:3000/auth/register`
2. Fill in the form:
   - **Email:** seller@test.com
   - **Password:** Password123
   - **First Name:** Jane
   - **Last Name:** Seller
   - **Phone:** +639123456789
   - **Role:** Select "Seller" or "Dealer"
   - **Location:** Select Region, Province, City
3. Click "Sign Up"

#### Register as a Dealer
Same as seller, but select "Dealer" role for enhanced features.

---

## Testing as a Buyer

### 1. Login
- Go to `http://localhost:3000/auth/login`
- Email: `buyer@test.com`
- Password: `Password123`

### 2. Browse Available Cars
**URL:** `http://localhost:3000/cars`

**Features to test:**
- ✅ View all active car listings
- ✅ Search by keyword
- ✅ Filter by brand, price, year, etc.
- ✅ Sort by price, date, popularity
- ✅ Pagination

### 3. View Car Details
**URL:** `http://localhost:3000/cars/[car-id]`

**Features to test:**
- ✅ View complete car information
- ✅ View image gallery
- ✅ View seller information
- ✅ Add to favorites (heart icon)
- ✅ Send inquiry to seller
- ✅ View similar cars

### 4. Manage Favorites
**URL:** `http://localhost:3000/favorites`

**Features to test:**
- ✅ View all favorited cars
- ✅ Remove from favorites
- ✅ Navigate to car details

### 5. View Profile
**URL:** `http://localhost:3000/profile`

**Features to test:**
- ✅ View profile information
- ✅ Update profile details
- ✅ Change password
- ✅ Upload profile picture

### 6. Check Notifications
**URL:** `http://localhost:3000/notifications`

**Features to test:**
- ✅ View all notifications
- ✅ Mark as read
- ✅ View notification details

---

## Testing as a Seller

### 1. Login as Seller
- Go to `http://localhost:3000/auth/login`
- Email: `seller@test.com`
- Password: `Password123`

### 2. Seller Dashboard
**URL:** `http://localhost:3000/seller/dashboard`

**Features to test:**
- ✅ View total listings count
- ✅ View total views/favorites
- ✅ View earnings analytics
- ✅ View recent inquiries
- ✅ View all your car listings
- ✅ Filter listings by status (All, Active, Pending, Sold)
- ✅ Edit car listing
- ✅ Delete car listing
- ✅ Mark car as sold
- ✅ Boost listing (if subscribed)

**Dashboard Stats:**
- Total Listings
- Active Listings
- Total Views
- Total Favorites
- Total Inquiries
- Revenue (if applicable)

### 3. Create New Car Listing
**URL:** `http://localhost:3000/seller/new`

**Multi-Step Form:**

#### Step 1: Basic Information
- **Title:** 2020 Toyota Camry Hybrid LE
- **Brand:** Toyota
- **Model:** Camry
- **Category:** Sedan
- **Year:** 2020
- **Price:** ₱1,500,000
- **Negotiable:** Yes/No
- **Description:** Detailed description of the car

#### Step 2: Specifications
- **Mileage:** 25,000 km
- **Fuel Type:** Hybrid
- **Transmission:** Automatic
- **Drivetrain:** FWD
- **Engine Displacement:** 2.5L
- **Number of Cylinders:** 4
- **Horsepower:** 208 hp
- **Torque:** 221 Nm
- **Fuel Economy:** 15 km/L
- **Seating Capacity:** 5
- **Number of Doors:** 4
- **Color (Exterior):** Pearl White
- **Color (Interior):** Black Leather

#### Step 3: Condition & History
- **Condition Rating:** Excellent
- **Number of Owners:** 1
- **Accident History:** No
- **Flood History:** No
- **Service History Available:** Yes
- **Registration Status:** Registered
- **Warranty Remaining:** 6 months

#### Step 4: Features & Amenities
Select applicable features:
- ☑️ Air Conditioning
- ☑️ Power Steering
- ☑️ Power Windows
- ☑️ ABS (Anti-lock Braking System)
- ☑️ Airbags
- ☑️ Cruise Control
- ☑️ Navigation System
- ☑️ Backup Camera
- ☑️ Bluetooth
- ☑️ Keyless Entry
- ☑️ Push Start
- ☑️ Sunroof/Moonroof
- ☑️ Leather Seats
- ☑️ Heated Seats

#### Step 5: Location & Contact
- **Region:** NCR
- **Province:** Metro Manila
- **City:** Quezon City
- **Contact Name:** Jane Seller
- **Contact Phone:** +639123456789
- **Preferred Contact Method:** Phone

#### Step 6: Upload Images
- Upload 5-20 images
- First image becomes the main/cover image
- Supported formats: JPG, PNG
- Max size: 5MB per image

#### Step 7: Review & Submit
- Review all entered information
- Submit for admin approval
- Car status: **Pending** (awaiting admin approval)

### 4. Manage Inquiries
**URL:** `http://localhost:3000/seller/inquiries`

**Features to test:**
- ✅ View all inquiries from buyers
- ✅ Filter by car listing
- ✅ Mark inquiry as responded
- ✅ Reply to inquiries (if messaging is implemented)

### 5. View Analytics
**Dashboard Analytics Show:**
- Total views per listing
- Favorites count
- Inquiry conversion rate
- Best performing listings
- Traffic sources

---

## Testing as an Admin

### 1. Login as Admin
- Go to `http://localhost:3000/auth/login`
- Email: `admin@autohub.com`
- Password: `Admin123456`

### 2. Admin Dashboard
**URL:** `http://localhost:3000/admin`

**Platform Statistics:**
- Total Users (Buyers, Sellers, Dealers)
- Total Cars (Active, Pending, Sold)
- Total Revenue
- Active Subscriptions
- Recent Transactions
- System Health

### 3. Review Pending Car Listings
**In Admin Dashboard - "Pending Cars" Tab**

**Features to test:**
- ✅ View all pending car listings
- ✅ View car details
- ✅ View seller information
- ✅ **Approve** car listing
  - Changes status from "pending" → "active"
  - Car becomes visible to buyers
  - Seller receives notification
- ✅ **Reject** car listing
  - Provide rejection reason
  - Changes status to "rejected"
  - Seller receives notification with reason
  - Seller can edit and resubmit

**Approval Process:**
1. Click on pending car listing
2. Review all details (info, images, seller)
3. Click "Approve" or "Reject"
4. If rejecting, enter reason (e.g., "Poor image quality", "Missing information")
5. Confirm action

### 4. User Management
**In Admin Dashboard - "Users" Tab**

**Features to test:**
- ✅ View all registered users
- ✅ Filter by role (Buyer, Seller, Dealer, Admin)
- ✅ Search users by name or email
- ✅ View user details
- ✅ **Ban** user account
  - User cannot login
  - All listings become inactive
- ✅ **Unban** user account
  - Restore access
  - Listings can be reactivated
- ✅ View user's listings
- ✅ View user's transactions

### 5. Platform Analytics
**Features to test:**
- ✅ View total platform revenue
- ✅ View subscription analytics
- ✅ View listing statistics
- ✅ View user growth over time
- ✅ Export reports (if implemented)

---

## Testing the Complete Flow

### End-to-End Test Scenario

#### 1. **Seller Creates Listing**
1. Login as seller (`seller@test.com`)
2. Go to `/seller/new`
3. Fill out complete car listing form
4. Upload 5+ images
5. Submit for approval
6. **Expected:** Car status = "pending"
7. **Expected:** Seller dashboard shows pending car

#### 2. **Admin Reviews & Approves**
1. Login as admin (`admin@autohub.com`)
2. Go to `/admin`
3. Navigate to "Pending Cars" tab
4. Find the newly submitted car
5. Review all details
6. Click "Approve"
7. **Expected:** Car status changes to "active"
8. **Expected:** Seller receives notification

#### 3. **Buyer Discovers & Inquires**
1. Login as buyer (`buyer@test.com`)
2. Go to `/cars`
3. **Expected:** See the newly approved car listing
4. Click on the car to view details (`/cars/[id]`)
5. Add to favorites (heart icon)
6. **Expected:** Favorites count increases
7. Submit an inquiry with a message
8. **Expected:** Inquiry sent to seller

#### 4. **Seller Responds**
1. Login as seller
2. Go to `/seller/inquiries`
3. **Expected:** See new inquiry from buyer
4. Mark as responded or reply (if messaging exists)

#### 5. **Buyer Purchases (Offline)**
- In real scenario, buyer contacts seller offline
- They complete transaction

#### 6. **Seller Marks as Sold**
1. Login as seller
2. Go to `/seller/dashboard`
3. Find the sold car
4. Mark as "Sold"
5. **Expected:** Car status = "sold"
6. **Expected:** Car no longer appears in active listings

---

## API Testing with Postman

You have a complete Postman collection at: `AutoHub_API.postman_collection.json`

### Import to Postman
1. Open Postman
2. Click "Import"
3. Select `AutoHub_API.postman_collection.json`
4. Collection includes all 50+ endpoints

### Key Endpoints to Test

#### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

#### Cars (Buyer)
```
GET /api/v1/cars                    # Browse cars
GET /api/v1/cars/{id}               # Car details
POST /api/v1/cars/{id}/favorite     # Add to favorites
POST /api/v1/cars/{id}/inquire      # Send inquiry
```

#### Cars (Seller)
```
POST /api/v1/cars                   # Create listing
GET /api/v1/users/me/listings       # My listings
PUT /api/v1/cars/{id}               # Update listing
DELETE /api/v1/cars/{id}            # Delete listing
PATCH /api/v1/cars/{id}/status      # Change status
```

#### Admin
```
GET /api/v1/admin/analytics         # Platform stats
GET /api/v1/admin/cars/pending      # Pending cars
POST /api/v1/admin/cars/{id}/approve # Approve car
POST /api/v1/admin/cars/{id}/reject  # Reject car
GET /api/v1/admin/users             # All users
POST /api/v1/admin/users/{id}/ban   # Ban user
POST /api/v1/admin/users/{id}/unban # Unban user
```

---

## Common Testing Scenarios

### 1. Test Image Upload
- **File size limit:** 5MB per image
- **Formats:** JPG, PNG
- **Max images:** 20 per listing
- **Min images:** 1

### 2. Test Filters & Search
- Search by keyword in title/description
- Filter by brand
- Filter by price range
- Filter by year range
- Filter by location
- Combine multiple filters

### 3. Test Permissions
- ✅ Buyer cannot access `/seller/dashboard`
- ✅ Seller cannot access `/admin`
- ✅ Unauthenticated users redirected to login
- ✅ Only car owner can edit their listing
- ✅ Only admin can approve/reject cars

### 4. Test Validation
- Required fields cannot be empty
- Email must be valid format
- Password minimum 8 characters
- Price must be positive number
- Year must be valid (e.g., 1900-2025)
- Phone number format validation

---

## Troubleshooting

### Backend Not Starting
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process if needed
kill -9 [PID]

# Restart server
cd server
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend Not Starting
```bash
# Check if port 3000 is in use
lsof -i :3000

# Install dependencies if needed
cd client
npm install

# Start dev server
npm run dev
```

### Database Issues
```bash
# Reset database (if needed)
cd server
rm car_marketplace_ph.db

# Restart server (will recreate DB)
python3 -m uvicorn main:app --reload --port 8000
```

### CORS Errors
- Ensure server is running on `http://localhost:8000`
- Ensure client is running on `http://localhost:3000`
- Check `server/.env` has correct CORS origins

---

## Quick Reference

### User Roles
| Role | Can List Cars | Can Approve | Admin Access |
|------|--------------|-------------|--------------|
| Buyer | ❌ | ❌ | ❌ |
| Seller | ✅ | ❌ | ❌ |
| Dealer | ✅ (unlimited) | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ |
| Moderator | ✅ | ✅ | Partial |

### Car Statuses
- **Draft:** Saved but not submitted
- **Pending:** Awaiting admin approval
- **Active:** Approved and visible to buyers
- **Sold:** Marked as sold
- **Rejected:** Rejected by admin

### Key URLs
- **Homepage:** http://localhost:3000
- **Browse Cars:** http://localhost:3000/cars
- **Seller Dashboard:** http://localhost:3000/seller/dashboard
- **Create Listing:** http://localhost:3000/seller/new
- **Admin Dashboard:** http://localhost:3000/admin
- **API Docs:** http://localhost:8000/docs

---

## Testing Checklist

### Buyer Flow
- [ ] Register as buyer
- [ ] Login successfully
- [ ] Browse car listings
- [ ] Search and filter cars
- [ ] View car details
- [ ] Add car to favorites
- [ ] Remove from favorites
- [ ] Send inquiry to seller
- [ ] Update profile
- [ ] View notifications

### Seller Flow
- [ ] Register as seller
- [ ] Login successfully
- [ ] View seller dashboard
- [ ] Create new car listing (all steps)
- [ ] Upload multiple images
- [ ] View listing in "Pending" status
- [ ] Edit existing listing
- [ ] View inquiries from buyers
- [ ] Mark car as sold
- [ ] Delete listing
- [ ] View analytics

### Admin Flow
- [ ] Create admin account
- [ ] Login as admin
- [ ] View platform statistics
- [ ] View pending car listings
- [ ] Approve a car listing
- [ ] Reject a car listing (with reason)
- [ ] View all users
- [ ] Ban a user
- [ ] Unban a user
- [ ] Search users by email/name
- [ ] View platform analytics

### Complete Workflow
- [ ] Seller creates listing → Pending
- [ ] Admin approves → Active
- [ ] Buyer views on /cars
- [ ] Buyer favorites car
- [ ] Buyer sends inquiry
- [ ] Seller sees inquiry
- [ ] Seller marks as sold
- [ ] Car no longer in active listings

---

## Success! 🎉

You've successfully tested all major features of AutoHub!

**Need Help?**
- Check API docs: http://localhost:8000/docs
- Review Postman collection for API examples
- Check browser console for frontend errors
- Check terminal for backend errors
