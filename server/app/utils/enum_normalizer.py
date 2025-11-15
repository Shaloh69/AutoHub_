"""
Enum Value Normalizer for AutoHub

This utility provides centralized enum value normalization to ensure 100% alignment
with the SQL schema. It handles the mixed casing pattern where:
- Car specification enums use UPPERCASE (e.g., GASOLINE, MANUAL, DRAFT)
- Descriptive attribute enums use lowercase (e.g., sedan, buyer, public)

Usage:
    from app.utils.enum_normalizer import normalize_car_data, normalize_user_data

    # Normalize incoming data
    normalized_data = normalize_car_data(request_data)

    # Validate enum value
    is_valid = is_valid_enum_value('fuel_type', 'GASOLINE')
"""

from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


# ==========================================
# UPPERCASE ENUMS (Car Specifications)
# ==========================================

UPPERCASE_ENUMS = {
    # Car Status
    'status': {
        'DRAFT', 'PENDING', 'ACTIVE', 'SOLD', 'RESERVED',
        'INACTIVE', 'REJECTED', 'EXPIRED'
    },

    # Approval Status
    'approval_status': {
        'PENDING', 'APPROVED', 'REJECTED'
    },

    # Fuel Type
    'fuel_type': {
        'GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID'
    },

    # Transmission Type
    'transmission': {
        'MANUAL', 'AUTOMATIC', 'CVT', 'DCT'
    },

    # Drivetrain Type
    'drivetrain': {
        'FWD', 'RWD', 'AWD', '4WD'
    },

    # Condition Rating
    'condition_rating': {
        'BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'
    },
    'car_condition': {  # Alternative field name
        'BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'
    },
}


# ==========================================
# lowercase enums (Descriptive Attributes)
# ==========================================

LOWERCASE_ENUMS = {
    # Visibility
    'visibility': {
        'public', 'private', 'unlisted'
    },

    # Body Type
    'body_type': {
        'sedan', 'suv', 'pickup', 'van', 'hatchback',
        'coupe', 'mpv', 'crossover', 'wagon', 'convertible'
    },

    # Engine Type
    'engine_type': {
        'gasoline', 'diesel', 'electric', 'hybrid', 'plug-in-hybrid'
    },

    # User Role
    'role': {
        'buyer', 'seller', 'dealer', 'admin', 'moderator'
    },

    # Inquiry Type
    'inquiry_type': {
        'general', 'test_drive', 'price_negotiation', 'inspection',
        'purchase_intent', 'financing', 'trade_in'
    },

    # Inquiry Status
    'inquiry_status': {
        'new', 'read', 'replied', 'in_negotiation',
        'test_drive_scheduled', 'closed', 'converted', 'spam'
    },

    # Transaction Type
    'transaction_type': {
        'sale', 'reservation', 'deposit'
    },

    # Transaction Status
    'transaction_status': {
        'pending', 'confirmed', 'completed', 'cancelled', 'disputed'
    },

    # Payment Status
    'payment_status': {
        'pending', 'paid', 'failed', 'refunded'
    },

    # Report Type
    'report_type': {
        'spam', 'fraud', 'inappropriate', 'scam', 'fake_listing', 'other'
    },

    # Report Status
    'report_status': {
        'pending', 'investigating', 'resolved', 'dismissed'
    },

    # Priority
    'priority': {
        'low', 'medium', 'high', 'urgent'
    },

    # Payment Method
    'payment_method': {
        'cash', 'bank_transfer', 'financing', 'installment'
    },

    # Subscription Status
    'subscription_status': {
        'active', 'cancelled', 'expired', 'suspended'
    },

    # Billing Cycle
    'billing_cycle': {
        'monthly', 'annual'
    },

    # Verification Level
    'verification_level': {
        'none', 'email', 'phone', 'identity', 'business'
    },

    # Currency
    'currency': {
        'php', 'usd'
    },

    # Mileage Unit
    'mileage_unit': {
        'km', 'miles'
    },
}


# ==========================================
# Obsolete Value Mappings
# ==========================================

OBSOLETE_VALUE_MAPPINGS = {
    # Status mappings
    'status': {
        'removed': 'INACTIVE',
        'inactive': 'INACTIVE',
        'draft': 'DRAFT',
        'pending': 'PENDING',
        'active': 'ACTIVE',
        'sold': 'SOLD',
        'reserved': 'RESERVED',
        'rejected': 'REJECTED',
        'expired': 'EXPIRED',
    },

    # Approval status
    'approval_status': {
        'pending': 'PENDING',
        'approved': 'APPROVED',
        'rejected': 'REJECTED',
    },

    # Fuel type
    'fuel_type': {
        'gasoline': 'GASOLINE',
        'diesel': 'DIESEL',
        'electric': 'ELECTRIC',
        'hybrid': 'HYBRID',
    },

    # Transmission
    'transmission': {
        'manual': 'MANUAL',
        'automatic': 'AUTOMATIC',
        'cvt': 'CVT',
        'dct': 'DCT',
        'amt': 'AUTOMATIC',  # Map old AMT to AUTOMATIC
    },

    # Drivetrain
    'drivetrain': {
        'fwd': 'FWD',
        'rwd': 'RWD',
        'awd': 'AWD',
        '4wd': '4WD',
    },

    # Condition
    'condition_rating': {
        'brand_new': 'BRAND_NEW',
        'like_new': 'LIKE_NEW',
        'excellent': 'EXCELLENT',
        'very_good': 'GOOD',  # Map old very_good to GOOD
        'good': 'GOOD',
        'fair': 'FAIR',
        'poor': 'POOR',
    },
    'car_condition': {
        'brand_new': 'BRAND_NEW',
        'like_new': 'LIKE_NEW',
        'excellent': 'EXCELLENT',
        'very_good': 'GOOD',
        'good': 'GOOD',
        'fair': 'FAIR',
        'poor': 'POOR',
    },
}


# ==========================================
# Core Normalization Functions
# ==========================================

def normalize_enum_value(field_name: str, value: Any) -> Any:
    """
    Normalize a single enum value based on field name and SQL schema.

    Args:
        field_name: The field name (e.g., 'fuel_type', 'status')
        value: The value to normalize

    Returns:
        Normalized value matching SQL schema, or original value if not an enum field

    Examples:
        >>> normalize_enum_value('fuel_type', 'gasoline')
        'GASOLINE'
        >>> normalize_enum_value('fuel_type', 'GASOLINE')
        'GASOLINE'
        >>> normalize_enum_value('body_type', 'SEDAN')
        'sedan'
        >>> normalize_enum_value('visibility', 'PUBLIC')
        'public'
    """
    if value is None:
        return None

    # Handle Python enum objects (e.g., CarStatus.ACTIVE, FuelType.GASOLINE)
    # Extract the .value property if it's an enum
    if hasattr(value, 'value'):
        str_value = str(value.value)
    else:
        # Convert to string for comparison
        str_value = str(value)

    # Check if it's an UPPERCASE enum field
    if field_name in UPPERCASE_ENUMS:
        # Check for obsolete value mapping first
        if field_name in OBSOLETE_VALUE_MAPPINGS:
            lowercase_value = str_value.lower()
            if lowercase_value in OBSOLETE_VALUE_MAPPINGS[field_name]:
                normalized = OBSOLETE_VALUE_MAPPINGS[field_name][lowercase_value]
                if normalized != str_value:
                    logger.info(f"Normalized obsolete {field_name} value: '{str_value}' → '{normalized}'")
                return normalized

        # Convert to uppercase
        uppercase_value = str_value.upper()
        if uppercase_value in UPPERCASE_ENUMS[field_name]:
            return uppercase_value

        logger.warning(f"Invalid {field_name} value: '{str_value}'. Valid values: {UPPERCASE_ENUMS[field_name]}")
        return str_value

    # Check if it's a lowercase enum field
    if field_name in LOWERCASE_ENUMS:
        lowercase_value = str_value.lower()
        if lowercase_value in LOWERCASE_ENUMS[field_name]:
            return lowercase_value

        logger.warning(f"Invalid {field_name} value: '{str_value}'. Valid values: {LOWERCASE_ENUMS[field_name]}")
        return str_value

    # Not an enum field, return as-is
    return value


def normalize_dict_enums(data: Dict[str, Any], field_list: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Normalize all enum values in a dictionary.

    Args:
        data: Dictionary containing data to normalize
        field_list: Optional list of field names to normalize. If None, normalizes all known enum fields.

    Returns:
        Dictionary with normalized enum values

    Examples:
        >>> normalize_dict_enums({'fuel_type': 'gasoline', 'status': 'active'})
        {'fuel_type': 'GASOLINE', 'status': 'ACTIVE'}
        >>> normalize_dict_enums({'body_type': 'SEDAN', 'visibility': 'PUBLIC'})
        {'body_type': 'sedan', 'visibility': 'public'}
    """
    if not data:
        return data

    normalized_data = data.copy()

    # Determine which fields to normalize
    all_enum_fields = set(UPPERCASE_ENUMS.keys()) | set(LOWERCASE_ENUMS.keys())
    fields_to_check = field_list if field_list else all_enum_fields

    for field_name in fields_to_check:
        if field_name in normalized_data:
            normalized_data[field_name] = normalize_enum_value(field_name, normalized_data[field_name])

    return normalized_data


def is_valid_enum_value(field_name: str, value: Any) -> bool:
    """
    Check if a value is valid for the given enum field.

    Args:
        field_name: The field name
        value: The value to check

    Returns:
        True if valid, False otherwise

    Examples:
        >>> is_valid_enum_value('fuel_type', 'GASOLINE')
        True
        >>> is_valid_enum_value('fuel_type', 'gasoline')
        True  # Will be normalized
        >>> is_valid_enum_value('fuel_type', 'INVALID')
        False
    """
    if value is None:
        return True  # None is valid for optional fields

    str_value = str(value)

    # Check UPPERCASE enums
    if field_name in UPPERCASE_ENUMS:
        # Check both direct match and obsolete mappings
        if str_value in UPPERCASE_ENUMS[field_name]:
            return True
        if field_name in OBSOLETE_VALUE_MAPPINGS:
            if str_value.lower() in OBSOLETE_VALUE_MAPPINGS[field_name]:
                return True
        return False

    # Check lowercase enums
    if field_name in LOWERCASE_ENUMS:
        return str_value.lower() in LOWERCASE_ENUMS[field_name]

    # Not an enum field
    return True


# ==========================================
# Model-Specific Normalization Functions
# ==========================================

def normalize_car_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize all enum values in car-related data.

    Args:
        data: Car data dictionary

    Returns:
        Normalized car data
    """
    car_enum_fields = [
        'status', 'approval_status', 'fuel_type', 'transmission',
        'drivetrain', 'condition_rating', 'car_condition',
        'visibility', 'body_type', 'engine_type'
    ]
    return normalize_dict_enums(data, car_enum_fields)


def normalize_user_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize all enum values in user-related data.

    Args:
        data: User data dictionary

    Returns:
        Normalized user data
    """
    user_enum_fields = ['role', 'verification_level']
    return normalize_dict_enums(data, user_enum_fields)


def normalize_inquiry_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize all enum values in inquiry-related data.

    Args:
        data: Inquiry data dictionary

    Returns:
        Normalized inquiry data
    """
    inquiry_enum_fields = ['inquiry_type', 'inquiry_status', 'priority']
    return normalize_dict_enums(data, inquiry_enum_fields)


def normalize_transaction_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize all enum values in transaction-related data.

    Args:
        data: Transaction data dictionary

    Returns:
        Normalized transaction data
    """
    transaction_enum_fields = [
        'transaction_type', 'transaction_status', 'payment_status',
        'payment_method', 'currency'
    ]
    return normalize_dict_enums(data, transaction_enum_fields)


def normalize_subscription_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize all enum values in subscription-related data.

    Args:
        data: Subscription data dictionary

    Returns:
        Normalized subscription data
    """
    subscription_enum_fields = ['subscription_status', 'billing_cycle']
    return normalize_dict_enums(data, subscription_enum_fields)


# ==========================================
# Validation Functions
# ==========================================

def validate_car_enums(data: Dict[str, Any]) -> List[str]:
    """
    Validate all enum values in car data and return list of errors.

    Args:
        data: Car data to validate

    Returns:
        List of error messages (empty if all valid)
    """
    errors = []
    car_enum_fields = [
        'status', 'approval_status', 'fuel_type', 'transmission',
        'drivetrain', 'condition_rating', 'visibility', 'body_type'
    ]

    for field in car_enum_fields:
        if field in data and not is_valid_enum_value(field, data[field]):
            valid_values = UPPERCASE_ENUMS.get(field) or LOWERCASE_ENUMS.get(field)
            errors.append(
                f"Invalid {field} value: '{data[field]}'. "
                f"Valid values: {', '.join(sorted(valid_values))}"
            )

    return errors


def get_valid_values(field_name: str) -> Optional[set]:
    """
    Get the set of valid values for a given enum field.

    Args:
        field_name: The enum field name

    Returns:
        Set of valid values, or None if not an enum field
    """
    if field_name in UPPERCASE_ENUMS:
        return UPPERCASE_ENUMS[field_name]
    if field_name in LOWERCASE_ENUMS:
        return LOWERCASE_ENUMS[field_name]
    return None


# ==========================================
# Batch Normalization for Database Updates
# ==========================================

def get_normalization_mapping(field_name: str) -> Dict[str, str]:
    """
    Get a complete mapping of all possible values (including obsolete ones)
    to their normalized form for a specific field.

    Useful for batch database updates.

    Args:
        field_name: The enum field name

    Returns:
        Dictionary mapping old values to new values
    """
    mapping = {}

    # Add obsolete mappings if available
    if field_name in OBSOLETE_VALUE_MAPPINGS:
        mapping.update(OBSOLETE_VALUE_MAPPINGS[field_name])

    # Add standard values (identity mapping)
    if field_name in UPPERCASE_ENUMS:
        for value in UPPERCASE_ENUMS[field_name]:
            if value not in mapping:
                mapping[value] = value
    elif field_name in LOWERCASE_ENUMS:
        for value in LOWERCASE_ENUMS[field_name]:
            if value not in mapping:
                mapping[value] = value

    return mapping
