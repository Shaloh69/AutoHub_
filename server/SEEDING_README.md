# AutoHub Database Seeding Guide

This document explains how to use the database seeders for the AutoHub project.

## Overview

The seeding system is split into two files for better maintainability:

1. **`create_temp_data.py`** - Main seeder for core data (users, brands, subscriptions, etc.)
2. **`seed_cars.py`** - Dedicated car seeder for managing car listings

This modular approach allows you to:
- Seed core data without creating cars
- Add/remove cars independently
- Customize car data without touching other seed logic
- Run car seeding multiple times with different data

---

## Quick Start

### First Time Setup (Complete Database)

```bash
cd /home/user/AutoHub_/server

# Run main seeder (creates users, brands, categories, etc.)
python3 create_temp_data.py

# Follow the prompts to optionally create sample cars
```

### Add Cars Only

```bash
# Run car seeder independently
python3 seed_cars.py

# Choose from:
# 1. Add sample cars (keeps existing data)
# 2. Clear ALL cars and add new ones
# 3. Clear ALL cars only (no new cars)
```

---

## Files Explained

### `create_temp_data.py` - Main Seeder

**What it creates:**
- ✅ Users (admin, seller, buyer)
- ✅ Brands and models (Toyota, Honda, Mitsubishi, etc.)
- ✅ Categories (Sedan, SUV, Pickup, etc.)
- ✅ Features (ABS, Airbags, Bluetooth, etc.)
- ✅ Standard colors
- ✅ Subscriptions for users
- ✅ Inquiries, transactions, reviews (if cars exist)
- ✅ Favorites and notifications

**Test accounts created:**
```
Admin:  admin@autohub.com  / admin123
Seller: seller@autohub.com / seller123
Buyer:  buyer@autohub.com  / buyer123
```

**Interactive options:**
- Create sample cars (default)
- Skip car creation
- Clear existing cars and create new ones

**Run:**
```bash
python3 create_temp_data.py
```

---

### `seed_cars.py` - Car Seeder

**What it creates:**
- 🚗 Sample car listings (Toyota, Honda, Mitsubishi, etc.)
- 📸 Multiple images per car (EXTERIOR, INTERIOR, ENGINE)
- ⚡ Features assigned to each car
- 📊 Realistic pricing and specifications

**Sample cars included:**
- Toyota Vios 2020 (₱650,000)
- Toyota Fortuner 2018 (₱1,450,000) - SOLD
- Honda Civic RS Turbo 2019 (₱1,250,000)
- Honda CR-V 2017 (₱1,100,000)
- Mitsubishi Montero Sport 2021 (₱1,850,000)
- Toyota Innova 2019 (₱1,150,000)
- Toyota Wigo 2018 (₱380,000)
- Honda City 2020 (₱850,000)
- Mitsubishi Xpander 2021 (₱1,100,000)
- Toyota Corolla Altis 2019 (₱950,000)

**Interactive options:**
1. Add sample cars (keeps existing cars and adds new ones)
2. Clear ALL cars and add new sample cars (⚠️ destructive)
3. Clear ALL cars only (⚠️ destructive, no new cars added)

**Run:**
```bash
python3 seed_cars.py
```

**Programmatic usage:**
```python
from seed_cars import create_sample_cars, clear_all_cars
from app.database import SessionLocal

db = SessionLocal()

# Create cars for a specific seller
cars = create_sample_cars(db, seller_email="seller@autohub.com")

# Clear all cars (requires confirmation)
clear_all_cars(db)

db.close()
```

---

## Common Scenarios

### 1. Fresh Database Setup

```bash
# Step 1: Run main seeder
python3 create_temp_data.py
# Choose option 1 to create sample cars

# Done! You now have a fully populated database
```

### 2. Add More Cars to Existing Database

```bash
# Run car seeder only
python3 seed_cars.py
# Choose option 1 to add more cars
```

### 3. Reset Car Data Only

```bash
# Run car seeder
python3 seed_cars.py
# Choose option 2 to clear and recreate cars
```

### 4. Reset Everything

```bash
# Delete database and recreate schema
# Then run main seeder
python3 create_temp_data.py
```

### 5. Seed Without Any Cars

```bash
# Run main seeder
python3 create_temp_data.py
# Choose option 2 to skip car creation
```

---

## Customizing Car Data

To add your own car configurations:

1. Open `seed_cars.py`
2. Find the `get_sample_car_data()` function
3. Add your car configurations to the `sample_cars` list:

```python
sample_cars.append({
    "brand_id": toyota.id,
    "model_id": camry.id,  # Make sure model exists!
    "title": "2022 Toyota Camry 2.5 V - Luxury Sedan",
    "description": "Brand new 2022 Camry...",
    "year": 2022,
    "price": Decimal("1800000"),
    "mileage": 5000,
    "fuel_type": FuelType.GASOLINE,
    "transmission": TransmissionType.AUTOMATIC,
    "car_condition": ConditionRating.LIKE_NEW,
    "color_id": get_color_id(db, "White Pearl"),
    "interior_color_id": get_color_id(db, "Black"),
    "body_type": BodyType.SEDAN,
    "engine_size": "2.5L",
    "seats": 5,
    "doors": 4,
    "drivetrain": DrivetrainType.FWD,
    "horsepower": 203,
    "trim": "2.5 V",
    "status": CarStatus.ACTIVE,
    "approval_status": ApprovalStatus.APPROVED,
})
```

4. Run the seeder: `python3 seed_cars.py`

---

## Important Notes

### ⚠️ Warnings

1. **`clear_all_cars()`** deletes:
   - All car listings
   - All images
   - All car features
   - All inquiries
   - All transactions
   - All reviews
   - All favorites
   - All car views

2. **Confirmation required** for destructive operations

3. **Foreign key constraints** are respected (won't break database integrity)

### ✅ Best Practices

1. **Run main seeder first** - Creates users, brands, models required by car seeder
2. **Use car seeder for experimentation** - Safely add/remove cars without affecting users
3. **Keep backups** - If you have important data, back it up before clearing
4. **Check logs** - Both seeders provide detailed output

---

## Troubleshooting

### "Seller not found" Error

**Problem:** Car seeder can't find the seller user.

**Solution:**
```bash
# Run main seeder first to create users
python3 create_temp_data.py
```

### "Brands not found" Error

**Problem:** Car seeder can't find required brands/models.

**Solution:**
```bash
# Run main seeder to create brands and models
python3 create_temp_data.py
```

### "Import Error: seed_cars"

**Problem:** Main seeder can't find seed_cars.py.

**Solution:**
```bash
# Make sure both files are in the same directory
ls -la create_temp_data.py seed_cars.py
```

### Cars Have No Images

**Problem:** Images showing as broken links.

**Solution:**
- Images use placeholder URLs by default (via.placeholder.com)
- Replace with real image URLs in production
- Update `image_url` in `seed_cars.py` line ~350

---

## Schema Compliance

Both seeders are fully aligned with:
- ✅ NORMALIZED SCHEMA v4.0
- ✅ UPPERCASE ENUM values
- ✅ FK relationships (color_id, currency_id, etc.)
- ✅ No duplicate fields (3NF normalization)
- ✅ Complete test data for all features

---

## Need Help?

- Check seeder output for detailed error messages
- Review this README for common scenarios
- Check database schema alignment with `check_schema_alignment.py`

---

## Summary Commands

```bash
# Complete fresh setup
python3 create_temp_data.py  # Choose option 1

# Add more cars
python3 seed_cars.py  # Choose option 1

# Reset car data
python3 seed_cars.py  # Choose option 2

# Core data only (no cars)
python3 create_temp_data.py  # Choose option 2
```

---

**Last Updated:** 2025-11-22
**Schema Version:** NORMALIZED v4.0
