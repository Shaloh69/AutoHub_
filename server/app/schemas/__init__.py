"""Pydantic Schemas Package - COMPLETE WITH ROLE UPGRADE"""
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
    UserProfile,
    UserUpdate,
    IdentityVerificationRequest,
    RoleUpgradeRequest,  # NEW
    RoleUpgradeResponse  # NEW
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
from app.schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewModerate,
    ReviewHelpful,
    ReviewResponse,
    ReviewDetailResponse,
    ReviewStatsResponse
)

__all__ = [
    # Common
    "ResponseBase", "MessageResponse", "IDResponse", "ErrorResponse",
    "PaginatedResponse", "PaginationParams",
    # Auth (NEW: Role upgrade schemas added)
    "UserRegister", "UserLogin", "TokenResponse", "TokenRefresh",
    "PasswordReset", "PasswordResetConfirm", "PasswordChange",
    "EmailVerification",
    "UserProfile", "UserUpdate", "IdentityVerificationRequest",
    "RoleUpgradeRequest", "RoleUpgradeResponse",  # NEW
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
    "TransactionDetailResponse",
    # Review
    "ReviewCreate", "ReviewUpdate", "ReviewModerate", "ReviewHelpful",
    "ReviewResponse", "ReviewDetailResponse", "ReviewStatsResponse"
]