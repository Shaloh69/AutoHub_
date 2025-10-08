import re
from typing import Tuple


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate Philippine phone number"""
    # Philippine phone formats: +639xxxxxxxxx, 09xxxxxxxxx, 639xxxxxxxxx
    patterns = [
        r'^\+639\d{9}$',
        r'^09\d{9}$',
        r'^639\d{9}$'
    ]
    return any(re.match(pattern, phone) for pattern in patterns)


def normalize_phone(phone: str) -> str:
    """Normalize phone number to +639xxxxxxxxx format"""
    phone = re.sub(r'[^\d+]', '', phone)
    if phone.startswith('09'):
        return '+63' + phone[1:]
    elif phone.startswith('639'):
        return '+' + phone
    elif phone.startswith('+639'):
        return phone
    return phone


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    return True, ""


def validate_vin(vin: str) -> bool:
    """Validate Vehicle Identification Number (VIN)"""
    # VIN is 17 characters, alphanumeric (excluding I, O, Q)
    if len(vin) != 17:
        return False
    
    pattern = r'^[A-HJ-NPR-Z0-9]{17}$'
    return bool(re.match(pattern, vin.upper()))


def validate_plate_number(plate: str) -> bool:
    """Validate Philippine license plate number"""
    # Philippine formats: ABC 1234, ABC-1234, 1234-ABC
    patterns = [
        r'^[A-Z]{3}\s?\d{4}$',
        r'^[A-Z]{3}-\d{4}$',
        r'^\d{4}-[A-Z]{3}$'
    ]
    return any(re.match(pattern, plate.upper()) for pattern in patterns)


def validate_coordinates(lat: float, lng: float) -> bool:
    """Validate coordinates are within Philippines bounds"""
    # Philippines bounds approximately
    # Latitude: 4.5° to 21.5° N
    # Longitude: 116° to 127° E
    return (4.5 <= lat <= 21.5) and (116.0 <= lng <= 127.0)

