# Enum Normalizer Usage Guide

## Overview

The Enum Normalizer is a centralized utility that ensures 100% alignment between SQL schema enum values, Python models, Pydantic schemas, and TypeScript frontend types.

## The Enum Casing Pattern

AutoHub uses a **mixed casing pattern** for enum values:

### UPPERCASE Enums (Car Specifications)
These represent technical specifications and should be UPPERCASE:
- `CarStatus`: DRAFT, PENDING, ACTIVE, SOLD, RESERVED, INACTIVE, REJECTED, EXPIRED
- `ApprovalStatus`: PENDING, APPROVED, REJECTED
- `FuelType`: GASOLINE, DIESEL, ELECTRIC, HYBRID
- `TransmissionType`: MANUAL, AUTOMATIC, CVT, DCT
- `DrivetrainType`: FWD, RWD, AWD, 4WD
- `ConditionRating`: BRAND_NEW, LIKE_NEW, EXCELLENT, GOOD, FAIR, POOR

### lowercase enums (Descriptive Attributes)
These represent descriptive or categorical attributes and should be lowercase:
- `Visibility`: public, private, unlisted
- `BodyType`: sedan, suv, pickup, van, hatchback, coupe, mpv, crossover, wagon, convertible
- `EngineType`: gasoline, diesel, electric, hybrid, plug-in-hybrid
- `UserRole`: buyer, seller, dealer, admin, moderator
- `InquiryType`: general, test_drive, price_negotiation, inspection, purchase_intent, financing, trade_in
- `InquiryStatus`: new, read, replied, in_negotiation, test_drive_scheduled, closed, converted, spam

## Basic Usage

### Import the Normalizer

```python
from app.utils.enum_normalizer import (
    normalize_car_data,
    normalize_user_data,
    normalize_inquiry_data,
    normalize_enum_value,
    is_valid_enum_value,
    validate_car_enums
)
```

### Normalize Incoming API Data

```python
# In your API endpoint
@router.post("/cars", response_model=CarResponse)
async def create_car(car_data: CarCreate, db: Session = Depends(get_db)):
    # Convert Pydantic model to dict
    car_dict = car_data.model_dump()

    # Normalize all enum values
    normalized_data = normalize_car_data(car_dict)

    # Now safe to save to database
    car = CarService.create_car(db, user_id, normalized_data)
    return car
```

### Normalize Individual Values

```python
# Normalize a single enum field
fuel_type = normalize_enum_value('fuel_type', 'gasoline')  # Returns: 'GASOLINE'
body_type = normalize_enum_value('body_type', 'SEDAN')     # Returns: 'sedan'
status = normalize_enum_value('status', 'active')          # Returns: 'ACTIVE'
```

### Normalize Search Filters

```python
# In search endpoint
normalized_fuel = normalize_enum_value('fuel_type', fuel_type) if fuel_type else None
normalized_trans = normalize_enum_value('transmission', transmission) if transmission else None

filters = {
    'fuel_type': normalized_fuel,
    'transmission': normalized_trans,
    # ... other filters
}
```

## Advanced Usage

### Validate Before Saving

```python
# Validate all enum values in car data
errors = validate_car_enums(car_data)

if errors:
    raise HTTPException(
        status_code=422,
        detail={"errors": errors}
    )
```

### Check if Value is Valid

```python
# Check individual value
if not is_valid_enum_value('fuel_type', 'GASOLINE'):
    raise ValueError("Invalid fuel type")

# Supports obsolete values too
is_valid_enum_value('status', 'removed')  # Returns True (maps to 'INACTIVE')
is_valid_enum_value('transmission', 'amt')  # Returns True (maps to 'AUTOMATIC')
```

### Get Valid Values for a Field

```python
from app.utils.enum_normalizer import get_valid_values

# Get all valid values for a field
valid_fuel_types = get_valid_values('fuel_type')
# Returns: {'GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID'}

valid_body_types = get_valid_values('body_type')
# Returns: {'sedan', 'suv', 'pickup', 'van', ...}
```

### Database Migration Support

```python
from app.utils.enum_normalizer import get_normalization_mapping

# Get mapping of old values to new values
status_mapping = get_normalization_mapping('status')
# Returns: {
#   'active': 'ACTIVE',
#   'removed': 'INACTIVE',
#   'ACTIVE': 'ACTIVE',
#   ...
# }

# Use in migration script
for old_val, new_val in status_mapping.items():
    db.execute(
        text("UPDATE cars SET status = :new WHERE status = :old"),
        {"new": new_val, "old": old_val}
    )
```

## Obsolete Value Mappings

The normalizer automatically handles obsolete enum values:

| Field | Old Value | New Value |
|-------|-----------|-----------|
| status | removed | INACTIVE |
| transmission | amt | AUTOMATIC |
| condition_rating | very_good | GOOD |

These mappings ensure backward compatibility when migrating old data.

## Model-Specific Normalizers

Use specialized normalizers for different data types:

```python
# Car data
normalized_car = normalize_car_data(car_dict)

# User data
normalized_user = normalize_user_data(user_dict)

# Inquiry data
normalized_inquiry = normalize_inquiry_data(inquiry_dict)

# Transaction data
normalized_transaction = normalize_transaction_data(transaction_dict)

# Subscription data
normalized_subscription = normalize_subscription_data(subscription_dict)
```

## Integration Examples

### FastAPI Endpoint with Normalization

```python
@router.post("/cars", response_model=IDResponse)
async def create_car(
    car_data: CarCreate,
    current_user: User = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    # Normalize enum values
    car_dict = car_data.model_dump()
    normalized_data = normalize_car_data(car_dict)

    # Validate
    errors = validate_car_enums(normalized_data)
    if errors:
        raise HTTPException(status_code=422, detail={"errors": errors})

    # Create
    car = CarService.create_car(db, current_user.id, normalized_data)
    return IDResponse(id=car.id, message="Car created successfully")
```

### Update Endpoint with Partial Data

```python
@router.put("/cars/{car_id}", response_model=CarResponse)
async def update_car(
    car_id: int,
    car_data: CarUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only normalize fields that are being updated
    update_dict = car_data.model_dump(exclude_unset=True)
    normalized_update = normalize_car_data(update_dict)

    car = CarService.update_car(db, car_id, current_user.id, normalized_update)
    return CarResponse.model_validate(car)
```

### Search with Filter Normalization

```python
@router.get("/cars", response_model=PaginatedResponse)
async def search_cars(
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None,
    condition_rating: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Normalize filter values (handles case-insensitive input)
    filters = {
        'fuel_type': normalize_enum_value('fuel_type', fuel_type) if fuel_type else None,
        'transmission': normalize_enum_value('transmission', transmission) if transmission else None,
        'condition_rating': normalize_enum_value('condition_rating', condition_rating) if condition_rating else None,
    }

    cars, total = CarService.search_cars(db, filters, page, page_size)
    return PaginatedResponse(items=cars, total=total, ...)
```

## Testing

Run the test suite to see the normalizer in action:

```bash
cd /home/user/AutoHub_/server
python test_enum_normalizer.py
```

The test suite demonstrates:
- Individual value normalization
- Bulk data normalization
- Validation
- Obsolete value mapping
- Real-world scenarios

## Benefits

1. **Case-Insensitive Input**: Accepts user input in any case (gasoline, GASOLINE, Gasoline)
2. **Automatic Conversion**: Converts to correct SQL schema format
3. **Backward Compatibility**: Handles obsolete enum values from old data
4. **Centralized Logic**: Single source of truth for enum definitions
5. **Validation Support**: Can validate data before database operations
6. **Migration Support**: Provides mappings for batch database updates
7. **Error Prevention**: Eliminates 422 Unprocessable Entity errors from case mismatches

## File Locations

- **Normalizer**: `/home/user/AutoHub_/server/app/utils/enum_normalizer.py`
- **Tests**: `/home/user/AutoHub_/server/test_enum_normalizer.py`
- **Integration**: `/home/user/AutoHub_/server/app/api/v1/cars.py` (example)

## Maintenance

When adding new enum fields:

1. Add the enum values to the appropriate section (`UPPERCASE_ENUMS` or `LOWERCASE_ENUMS`)
2. If there are obsolete values, add mappings to `OBSOLETE_VALUE_MAPPINGS`
3. Run the test suite to verify
4. Update this guide if needed

## Summary

The Enum Normalizer ensures that regardless of how data arrives (frontend, API, database), all enum values are automatically converted to match the SQL schema's expected casing pattern. This eliminates a major source of validation errors and maintains data consistency across the entire application stack.
