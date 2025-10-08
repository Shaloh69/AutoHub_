"""Pydantic Schemas Package"""
from app.schemas.common import (
    ResponseBase,
    MessageResponse,
    IDResponse,
    ErrorResponse,
    PaginatedResponse,
    PaginationParams
)
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    TokenRefresh,
    PasswordReset,
    PasswordResetConfirm,
    PasswordChange,
    EmailVerification,
    PhoneVerification,
    PhoneVerificationRequest,
    UserProfile,
    UserUpdate,
    IdentityVerificationRequest
)
from app.schemas.car import (
    CarCreate,
    CarUpdate,
    CarResponse,
    CarDetailResponse,
    CarImageUpload,
    CarBoost,
    BrandResponse,
    ModelResponse,
    FeatureResponse,
    PriceHistoryResponse
)
from app.schemas.inquiry import (
    InquiryCreate,
    InquiryUpdate,
    InquiryRating,
    InquiryResponseCreate,
    InquiryResponseResponse,
    InquiryResponse,
    InquiryDetailResponse,
    FavoriteResponse,
    NotificationResponse,
    NotificationUpdate
)
from app.schemas.subscription import (
    SubscriptionPlanResponse,
    SubscriptionCreate,
    UserSubscriptionResponse,
    SubscriptionUsageResponse,
    PromoCodeValidation,
    PromoCodeResponse,
    SubscriptionPaymentResponse
)
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionDetailResponse
)

__all__ = [
    # Common
    "ResponseBase", "MessageResponse", "IDResponse", "ErrorResponse",
    "PaginatedResponse", "PaginationParams",
    # Auth
    "UserRegister", "UserLogin", "TokenResponse", "TokenRefresh",
    "PasswordReset", "PasswordResetConfirm", "PasswordChange",
    "EmailVerification", "PhoneVerification", "PhoneVerificationRequest",
    "UserProfile", "UserUpdate", "IdentityVerificationRequest",
    # Car
    "CarCreate", "CarUpdate", "CarResponse", "CarDetailResponse",
    "CarImageUpload", "CarBoost", "BrandResponse", "ModelResponse",
    "FeatureResponse", "PriceHistoryResponse",
    # Inquiry
    "InquiryCreate", "InquiryUpdate", "InquiryRating",
    "InquiryResponseCreate", "InquiryResponseResponse",
    "InquiryResponse", "InquiryDetailResponse",
    "FavoriteResponse", "NotificationResponse", "NotificationUpdate",
    # Subscription
    "SubscriptionPlanResponse", "SubscriptionCreate", "UserSubscriptionResponse",
    "SubscriptionUsageResponse", "PromoCodeValidation", "PromoCodeResponse",
    "SubscriptionPaymentResponse",
    # Transaction
    "TransactionCreate", "TransactionUpdate", "TransactionResponse",
    "TransactionDetailResponse"
]
