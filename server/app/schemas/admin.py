"""
===========================================
FILE: app/schemas/admin.py - COMPLETE ADMIN SCHEMAS
Path: server/app/schemas/admin.py
VERSION: 1.0.0 - All Admin Response Models
===========================================
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from decimal import Decimal


# ========================================
# DASHBOARD SCHEMAS
# ========================================

class AdminDashboardResponse(BaseModel):
    """Admin dashboard overview statistics"""
    # User Statistics
    total_users: int
    active_users: int
    verified_users: int
    banned_users: int
    buyers_count: int
    sellers_count: int
    dealers_count: int
    new_users_today: int
    
    # Car Statistics
    total_cars: int
    active_cars: int
    pending_approval_cars: int
    new_cars_today: int
    
    # Reports
    pending_reports: int
    resolved_reports: int
    
    # Payments
    pending_payments: int
    verified_payments_today: int
    
    # Security
    fraud_indicators: int
    high_severity_fraud: int


# ========================================
# USER MANAGEMENT SCHEMAS
# ========================================

class UserListResponse(BaseModel):
    """User list item response"""
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    email_verified: bool
    is_active: bool
    is_banned: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None


class UserDetailResponse(BaseModel):
    """Detailed user information"""
    id: int
    email: str
    first_name: str
    last_name: str
    phone: str
    role: str
    
    # Verification
    email_verified: bool
    phone_verified: bool
    identity_verified: bool
    business_verified: bool
    
    # Status
    is_active: bool
    is_banned: bool
    ban_reason: Optional[str] = None
    banned_at: Optional[datetime] = None
    banned_until: Optional[datetime] = None
    
    # Business Info
    business_name: Optional[str] = None
    business_permit_number: Optional[str] = None
    tin_number: Optional[str] = None
    
    # Statistics
    total_cars: int
    active_cars: int
    warnings_count: int
    
    # Subscription
    subscription_status: str
    subscription_expires_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime
    last_login_at: Optional[datetime] = None


class UserBanRequest(BaseModel):
    """Request to ban a user"""
    reason: str = Field(..., min_length=10, max_length=500)
    duration_days: Optional[int] = Field(None, ge=1, le=365, description="Ban duration in days, None for permanent")


class UserVerifyRequest(BaseModel):
    """Request to verify a user"""
    verification_type: str = Field(..., pattern="^(identity|business)$")
    notes: Optional[str] = Field(None, max_length=500)


class UserRoleChangeRequest(BaseModel):
    """Request to change user role"""
    new_role: str = Field(..., pattern="^(buyer|seller|dealer|moderator)$")
    reason: str = Field(..., min_length=10, max_length=500)


# ========================================
# REPORTS MANAGEMENT SCHEMAS
# ========================================

class ReportListResponse(BaseModel):
    """Report list item"""
    id: int
    report_type: str
    status: str
    reporter_name: str
    reported_user_id: Optional[int] = None
    reported_user_name: Optional[str] = None
    reported_car_id: Optional[int] = None
    description: str  # Truncated
    created_at: datetime


class ReportDetailResponse(BaseModel):
    """Detailed report information"""
    id: int
    report_type: str
    status: str
    description: str  # Full description
    resolution: Optional[str] = None
    
    # Reporter Info
    reporter_id: int
    reporter_name: str
    reporter_email: str
    
    # Reported User Info
    reported_user_id: Optional[int] = None
    reported_user_name: Optional[str] = None
    reported_user_email: Optional[str] = None
    
    # Reported Car Info
    reported_car_id: Optional[int] = None
    reported_car_title: Optional[str] = None
    
    # Resolution
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    
    created_at: datetime


class ReportResolveRequest(BaseModel):
    """Request to resolve a report"""
    status: str = Field(..., pattern="^(resolved|dismissed)$")
    resolution: str = Field(..., min_length=10, max_length=1000)
    action_taken: Optional[str] = Field(None, pattern="^(none|ban_user|remove_car|warning)$")


# ========================================
# CAR MODERATION SCHEMAS
# ========================================

class CarModerationListResponse(BaseModel):
    """Car pending moderation list item"""
    id: int
    title: str
    brand: str
    model: str
    year: int
    price: float
    seller_id: int
    seller_name: str
    status: str
    created_at: datetime


class CarApprovalRequest(BaseModel):
    """Request to approve or reject a car"""
    approved: bool
    notes: Optional[str] = Field(None, max_length=500, description="Reason for rejection or approval notes")


# ========================================
# FRAUD & SECURITY SCHEMAS
# ========================================

class FraudIndicatorResponse(BaseModel):
    """Fraud indicator information"""
    id: int
    user_id: Optional[int] = None
    car_id: Optional[int] = None
    indicator_type: str
    severity: str
    description: str
    detected_at: datetime


class AuditLogResponse(BaseModel):
    """Audit log entry"""
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: str
    created_at: datetime


# ========================================
# SYSTEM CONFIGURATION SCHEMAS
# ========================================

class SystemConfigResponse(BaseModel):
    """System configuration entry"""
    id: int
    config_key: str
    config_value: str
    data_type: str
    description: str
    is_public: bool
    updated_at: datetime


class SystemConfigUpdate(BaseModel):
    """Update system configuration"""
    config_value: str = Field(..., max_length=5000)
    data_type: Optional[str] = Field(None, pattern="^(string|text|image|number|boolean)$")
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None


# ========================================
# EXPORTS
# ========================================

__all__ = [
    # Dashboard
    "AdminDashboardResponse",
    
    # User Management
    "UserListResponse",
    "UserDetailResponse",
    "UserBanRequest",
    "UserVerifyRequest",
    "UserRoleChangeRequest",
    
    # Reports
    "ReportListResponse",
    "ReportDetailResponse",
    "ReportResolveRequest",
    
    # Car Moderation
    "CarModerationListResponse",
    "CarApprovalRequest",
    
    # Fraud & Security
    "FraudIndicatorResponse",
    "AuditLogResponse",
    
    # System Config
    "SystemConfigResponse",
    "SystemConfigUpdate"
]