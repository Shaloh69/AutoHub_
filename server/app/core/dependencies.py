from fastapi import Depends, HTTPException, status, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import AuthService

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    
    # Decode token
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user ID from payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # FIX: Use getattr to safely access Column[bool] values
    is_active = getattr(user, 'is_active', True)
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # FIX: Use getattr to safely access Column[bool] values
    is_banned = getattr(user, 'is_banned', False)
    if is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is banned"
        )
    
    return user


async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    if not authorization:
        return None
    
    if not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = AuthService.decode_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            return None
        
        # FIX: Use getattr to safely access Column[bool] values
        is_active = getattr(user, 'is_active', True)
        is_banned = getattr(user, 'is_banned', False)
        
        if not is_active or is_banned:
            return None
        
        return user
    except:
        return None


async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user with verified email and phone"""
    # FIX: Use getattr to safely access Column[bool] values
    email_verified = getattr(current_user, 'email_verified', False)
    if not email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    
    # FIX: Use getattr to safely access Column[bool] values
    phone_verified = getattr(current_user, 'phone_verified', False)
    if not phone_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Phone verification required"
        )
    
    return current_user


async def get_current_seller(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user with seller/dealer role

    Requirements:
    - Email must be verified
    - Role must be SELLER, DEALER, or ADMIN
    - Phone verification is OPTIONAL (not required)
    """
    # Check email verification
    email_verified = getattr(current_user, 'email_verified', False)
    if not email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required to create listings"
        )

    # CRITICAL FIX: Use getattr to safely access Column role value and compare with UPPERCASE enum values
    # Issue: UserRole enum defines UPPERCASE values (SELLER, DEALER), but code was trying to access
    # lowercase attributes (UserRole.seller, UserRole.dealer) which don't exist
    # Error was: "AttributeError: type object 'UserRole' has no attribute 'seller'"
    user_role = getattr(current_user, 'role', None)

    # Convert to uppercase string for comparison (database stores UPPERCASE)
    if isinstance(user_role, str):
        user_role_str = user_role.upper()
    else:
        user_role_str = str(user_role).upper() if user_role else None

    # Compare with UPPERCASE enum values (e.g., UserRole.SELLER.value = "SELLER")
    if user_role_str not in [UserRole.SELLER.value, UserRole.DEALER.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller or dealer role required"
        )

    return current_user


async def get_current_dealer(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user with dealer role

    Requirements:
    - Email must be verified
    - Role must be DEALER or ADMIN
    - Phone verification is OPTIONAL (not required)
    """
    # Check email verification
    email_verified = getattr(current_user, 'email_verified', False)
    if not email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )

    # FIX: Use getattr to safely access Column role value and compare with UPPERCASE enum values
    user_role = getattr(current_user, 'role', None)

    # Convert to uppercase string for comparison (database stores UPPERCASE)
    if isinstance(user_role, str):
        user_role_str = user_role.upper()
    else:
        user_role_str = str(user_role).upper() if user_role else None

    # Compare with UPPERCASE enum values
    if user_role_str not in [UserRole.DEALER.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dealer role required"
        )

    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user with admin role"""
    # FIX: Use getattr to safely access Column role value and compare with UPPERCASE enum values
    user_role = getattr(current_user, 'role', None)

    # Convert to uppercase string for comparison (database stores UPPERCASE)
    if isinstance(user_role, str):
        user_role_str = user_role.upper()
    else:
        user_role_str = str(user_role).upper() if user_role else None

    # Compare with UPPERCASE enum value
    if user_role_str != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )

    return current_user


async def get_current_moderator(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user with moderator or admin role"""
    # FIX: Use getattr to safely access Column role value and compare with UPPERCASE enum values
    user_role = getattr(current_user, 'role', None)

    # Convert to uppercase string for comparison (database stores UPPERCASE)
    if isinstance(user_role, str):
        user_role_str = user_role.upper()
    else:
        user_role_str = str(user_role).upper() if user_role else None

    # Compare with UPPERCASE enum values
    if user_role_str not in [UserRole.MODERATOR.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator or admin role required"
        )

    return current_user


class PaginationParams:
    """Pagination parameters"""
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page")
    ):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size
        self.limit = page_size


def get_pagination() -> PaginationParams:
    """Dependency for pagination parameters"""
    return Depends(PaginationParams)