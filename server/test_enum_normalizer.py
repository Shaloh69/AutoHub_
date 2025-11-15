"""
Test script for enum_normalizer utility

Run with: python test_enum_normalizer.py
"""

from app.utils.enum_normalizer import (
    normalize_enum_value,
    normalize_car_data,
    normalize_user_data,
    normalize_inquiry_data,
    is_valid_enum_value,
    validate_car_enums,
    get_valid_values,
    get_normalization_mapping
)


def test_normalize_enum_value():
    """Test individual enum value normalization"""
    print("\n" + "="*60)
    print("Testing normalize_enum_value()")
    print("="*60)

    test_cases = [
        # UPPERCASE enums (car specs)
        ('fuel_type', 'gasoline', 'GASOLINE'),
        ('fuel_type', 'GASOLINE', 'GASOLINE'),
        ('fuel_type', 'Gasoline', 'GASOLINE'),
        ('transmission', 'manual', 'MANUAL'),
        ('transmission', 'amt', 'AUTOMATIC'),  # Obsolete value
        ('status', 'active', 'ACTIVE'),
        ('status', 'removed', 'INACTIVE'),  # Obsolete value
        ('condition_rating', 'very_good', 'GOOD'),  # Obsolete value
        ('condition_rating', 'EXCELLENT', 'EXCELLENT'),

        # lowercase enums (descriptive)
        ('body_type', 'SEDAN', 'sedan'),
        ('body_type', 'sedan', 'sedan'),
        ('visibility', 'PUBLIC', 'public'),
        ('visibility', 'public', 'public'),
        ('role', 'BUYER', 'buyer'),
        ('role', 'buyer', 'buyer'),

        # Non-enum fields (should return as-is)
        ('price', 500000, 500000),
        ('title', 'Toyota Camry', 'Toyota Camry'),
    ]

    for field, input_val, expected in test_cases:
        result = normalize_enum_value(field, input_val)
        status = "✅" if result == expected else "❌"
        print(f"{status} {field}: '{input_val}' → '{result}' (expected: '{expected}')")


def test_normalize_car_data():
    """Test car data normalization"""
    print("\n" + "="*60)
    print("Testing normalize_car_data()")
    print("="*60)

    # Simulate incoming API request with mixed case enum values
    incoming_data = {
        'title': 'Toyota Fortuner 2023',
        'year': 2023,
        'price': 1500000,
        'fuel_type': 'diesel',  # lowercase (should become DIESEL)
        'transmission': 'automatic',  # lowercase (should become AUTOMATIC)
        'status': 'active',  # lowercase (should become ACTIVE)
        'approval_status': 'pending',  # lowercase (should become PENDING)
        'condition_rating': 'excellent',  # lowercase (should become EXCELLENT)
        'body_type': 'SUV',  # uppercase (should become suv)
        'visibility': 'PUBLIC',  # uppercase (should become public)
        'negotiable': True,
        'mileage': 15000
    }

    print("\n📥 Incoming data:")
    for key, value in incoming_data.items():
        print(f"  {key}: {value}")

    normalized = normalize_car_data(incoming_data)

    print("\n📤 Normalized data:")
    for key, value in normalized.items():
        if incoming_data.get(key) != value:
            print(f"  {key}: {value} ✨ (changed from '{incoming_data[key]}')")
        else:
            print(f"  {key}: {value}")


def test_normalize_user_data():
    """Test user data normalization"""
    print("\n" + "="*60)
    print("Testing normalize_user_data()")
    print("="*60)

    incoming_data = {
        'email': 'john@example.com',
        'first_name': 'John',
        'last_name': 'Doe',
        'role': 'SELLER',  # uppercase (should become seller)
        'verification_level': 'EMAIL',  # uppercase (should become email)
    }

    print("\n📥 Incoming data:")
    for key, value in incoming_data.items():
        print(f"  {key}: {value}")

    normalized = normalize_user_data(incoming_data)

    print("\n📤 Normalized data:")
    for key, value in normalized.items():
        if incoming_data.get(key) != value:
            print(f"  {key}: {value} ✨ (changed from '{incoming_data[key]}')")
        else:
            print(f"  {key}: {value}")


def test_validate_car_enums():
    """Test validation function"""
    print("\n" + "="*60)
    print("Testing validate_car_enums()")
    print("="*60)

    # Valid data
    valid_data = {
        'fuel_type': 'GASOLINE',
        'transmission': 'MANUAL',
        'status': 'ACTIVE',
        'body_type': 'sedan'
    }

    errors = validate_car_enums(valid_data)
    print(f"\n✅ Valid data - Errors: {errors if errors else 'None'}")

    # Invalid data
    invalid_data = {
        'fuel_type': 'INVALID_FUEL',
        'transmission': 'INVALID_TRANS',
        'status': 'ACTIVE',
        'body_type': 'sedan'
    }

    errors = validate_car_enums(invalid_data)
    print(f"\n❌ Invalid data - Errors found:")
    for error in errors:
        print(f"  - {error}")


def test_is_valid_enum_value():
    """Test value validation"""
    print("\n" + "="*60)
    print("Testing is_valid_enum_value()")
    print("="*60)

    test_cases = [
        ('fuel_type', 'GASOLINE', True),
        ('fuel_type', 'gasoline', True),  # Will be normalized
        ('fuel_type', 'INVALID', False),
        ('body_type', 'sedan', True),
        ('body_type', 'SEDAN', True),  # Will be normalized
        ('body_type', 'invalid', False),
        ('status', 'active', True),  # Obsolete but mapped
        ('status', 'removed', True),  # Obsolete but mapped to INACTIVE
    ]

    for field, value, expected in test_cases:
        result = is_valid_enum_value(field, value)
        status = "✅" if result == expected else "❌"
        print(f"{status} {field}: '{value}' → {result} (expected: {expected})")


def test_get_valid_values():
    """Test getting valid values for a field"""
    print("\n" + "="*60)
    print("Testing get_valid_values()")
    print("="*60)

    fields = ['fuel_type', 'body_type', 'status', 'visibility', 'role']

    for field in fields:
        values = get_valid_values(field)
        if values:
            print(f"\n{field}:")
            print(f"  {', '.join(sorted(values))}")


def test_get_normalization_mapping():
    """Test getting complete normalization mapping"""
    print("\n" + "="*60)
    print("Testing get_normalization_mapping()")
    print("="*60)

    fields = ['status', 'fuel_type', 'transmission', 'condition_rating']

    for field in fields:
        mapping = get_normalization_mapping(field)
        print(f"\n{field} mapping:")
        for old_val, new_val in sorted(mapping.items()):
            if old_val != new_val:
                print(f"  '{old_val}' → '{new_val}' ✨")
            else:
                print(f"  '{old_val}' → '{new_val}'")


def test_real_world_scenario():
    """Test a real-world scenario with mixed data"""
    print("\n" + "="*60)
    print("Real-World Scenario: API Request Normalization")
    print("="*60)

    # Simulate data from different sources with inconsistent casing
    api_request = {
        # From frontend form (might be lowercase)
        'fuel_type': 'diesel',
        'transmission': 'automatic',
        'body_type': 'suv',

        # From database (might have old values)
        'status': 'active',  # Old lowercase value
        'condition_rating': 'very_good',  # Obsolete value

        # From user input (might be uppercase)
        'visibility': 'PUBLIC',

        # Regular fields
        'price': 850000,
        'year': 2021,
        'mileage': 45000,
    }

    print("\n📥 Mixed-case API request:")
    for key, value in api_request.items():
        print(f"  {key}: {value}")

    # Normalize the data
    normalized = normalize_car_data(api_request)

    print("\n📤 Normalized for SQL schema:")
    for key, value in normalized.items():
        if api_request.get(key) != value:
            print(f"  {key}: {value} ✨ (was '{api_request[key]}')")
        else:
            print(f"  {key}: {value}")

    # Validate the normalized data
    errors = validate_car_enums(normalized)
    print(f"\n✅ Validation result: {'PASSED' if not errors else 'FAILED'}")
    if errors:
        for error in errors:
            print(f"  ❌ {error}")


if __name__ == "__main__":
    print("\n" + "🔧" * 30)
    print(" " * 20 + "Enum Normalizer Test Suite")
    print("🔧" * 30)

    test_normalize_enum_value()
    test_normalize_car_data()
    test_normalize_user_data()
    test_validate_car_enums()
    test_is_valid_enum_value()
    test_get_valid_values()
    test_get_normalization_mapping()
    test_real_world_scenario()

    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)
    print("\nUsage in your API endpoints:")
    print("  from app.utils.enum_normalizer import normalize_car_data")
    print("  normalized_data = normalize_car_data(request.dict())")
    print("="*60 + "\n")
