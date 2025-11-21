"""
===========================================
FILE: app/api/v1/admin.py - COMPLETE ADMIN SYSTEM
Path: server/app/api/v1/admin.py
VERSION: 2.0.0 - Full Admin Management System
===========================================

COMPLETE ADMIN ENDPOINTS:
✅ Payment Verification (existing - preserved)
✅ User Management (NEW)
✅ Reports Management (NEW)
✅ Car Moderation (NEW)
✅ Fraud Monitoring (NEW)
✅ Audit Logs (NEW)
✅ System Configuration (NEW)
✅ Dashboard Statistics (NEW)
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.subscription import (
    AdminVerifyPaymentRequest, AdminVerifyPaymentResponse,
    PendingPaymentSummary, SubscriptionPaymentDetailedResponse,
    PaymentStatisticsResponse, PaymentSettingResponse, PaymentSettingUpdate,
    PaymentVerificationLogResponse
)
from app.schemas.admin import (
    # User Management
    UserListResponse, UserDetailResponse, UserBanRequest, UserVerifyRequest,
    UserRoleChangeRequest,
    # Reports Management
    ReportListResponse, ReportDetailResponse, ReportResolveRequest,
    # Car Moderation
    CarModerationListResponse, CarApprovalRequest,
    # Fraud & Security
    FraudIndicatorResponse, AuditLogResponse,
    # System Configuration
    SystemConfigResponse, SystemConfigUpdate,
    # Dashboard
    AdminDashboardResponse
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.core.dependencies import get_current_admin, get_current_moderator
from app.models.user import User, UserRole
from app.models.car import Car
from app.models.subscription import (
    SubscriptionPayment, PaymentSetting, PaymentVerificationLog,
    SubscriptionPlan
)
from app.models.security import FraudIndicator, AuditLog, SystemConfig
from app.services.subscription_service import SubscriptionService
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ========================================
# DASHBOARD & STATISTICS
# ========================================

@router.get("/dashboard", response_model=AdminDashboardResponse)
@router.get("/analytics", response_model=AdminDashboardResponse)  # Alias for frontend compatibility
async def get_admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard with overview statistics"""
    try:
        # User Statistics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        verified_users = db.query(User).filter(User.email_verified == True).count()
        banned_users = db.query(User).filter(User.is_banned == True).count()
        
        # Role Distribution (use UPPERCASE string values to match database)
        buyers = db.query(User).filter(User.role == UserRole.BUYER.value).count()
        sellers = db.query(User).filter(User.role == UserRole.SELLER.value).count()
        dealers = db.query(User).filter(User.role == UserRole.DEALER.value).count()
        
        # Car Statistics
        # Fixed: Use UPPERCASE for Car.status to match SQL schema
        total_cars = db.query(Car).count()
        active_cars = db.query(Car).filter(Car.status == "ACTIVE").count()
        pending_approval = db.query(Car).filter(Car.approval_status == "PENDING").count()

        # Reports Statistics (safely handle if Report model doesn't exist)
        pending_reports = 0
        resolved_reports = 0
        try:
            from app.models.inquiry import Report
            pending_reports = db.query(Report).filter(Report.status == "pending").count()
            resolved_reports = db.query(Report).filter(Report.status == "resolved").count()
        except (ImportError, Exception) as e:
            logger.warning(f"Could not query Report model: {e}")
        
        # Payment Statistics
        payment_stats = SubscriptionService.get_payment_statistics(db)
        
        # Fraud Indicators
        fraud_count = db.query(FraudIndicator).count()
        high_severity_fraud = db.query(FraudIndicator).filter(
            FraudIndicator.severity == "high"
        ).count()
        
        # Recent Activity (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        new_users_today = db.query(User).filter(User.created_at >= yesterday).count()
        new_cars_today = db.query(Car).filter(Car.created_at >= yesterday).count()
        
        return AdminDashboardResponse(
            # Users
            total_users=total_users,
            active_users=active_users,
            verified_users=verified_users,
            banned_users=banned_users,
            buyers_count=buyers,
            sellers_count=sellers,
            dealers_count=dealers,
            new_users_today=new_users_today,
            
            # Cars
            total_cars=total_cars,
            active_cars=active_cars,
            pending_approval_cars=pending_approval,
            new_cars_today=new_cars_today,
            
            # Reports
            pending_reports=pending_reports,
            resolved_reports=resolved_reports,
            
            # Payments
            pending_payments=payment_stats.get("total_pending", 0),
            verified_payments_today=payment_stats.get("total_completed_today", 0),
            
            # Security
            fraud_indicators=fraud_count,
            high_severity_fraud=high_severity_fraud
        )
    except Exception as e:
        logger.error(f"Error fetching admin dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard data"
        )


# ========================================
# USER MANAGEMENT ENDPOINTS
# ========================================

@router.get("/users", response_model=PaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    user_status: Optional[str] = None,
    search: Optional[str] = None,
    verified_only: bool = False,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List all users with filtering and pagination
    
    Filters:
    - role: Filter by user role (buyer, seller, dealer)
    - status: Filter by status (active, banned)
    - search: Search by name or email
    - verified_only: Show only verified users
    """
    try:
        query = db.query(User)
        
        # Apply filters
        if role:
            query = query.filter(User.role == role.upper())
        
        if user_status == "active":
            query = query.filter(User.is_active == True, User.is_banned == False)
        elif user_status == "banned":
            query = query.filter(User.is_banned == True)
        
        if verified_only:
            query = query.filter(User.email_verified == True)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.like(search_term),
                    User.first_name.like(search_term),
                    User.last_name.like(search_term)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        users = query.order_by(desc(User.created_at)).offset(offset).limit(page_size).all()
        
        # Format response
        items = [
            UserListResponse(
                id=int(getattr(u, 'id', 0)),
                email=str(getattr(u, 'email', '')),
                first_name=str(getattr(u, 'first_name', '')),
                last_name=str(getattr(u, 'last_name', '')),
                role=str(getattr(u, 'role', 'buyer')),
                email_verified=bool(getattr(u, 'email_verified', False)),
                is_active=bool(getattr(u, 'is_active', True)),
                is_banned=bool(getattr(u, 'is_banned', False)),
                created_at=getattr(u, 'created_at', datetime.utcnow()),
                last_login_at=getattr(u, 'last_login_at', None)
            )
            for u in users
        ]
        
        total_pages = (total + page_size - 1) // page_size
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_details(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user statistics
    # Fixed: Use UPPERCASE for Car.status and UserSubscription.status to match SQL schema
    cars_count = db.query(Car).filter(Car.seller_id == user_id).count()
    active_cars = db.query(Car).filter(
        Car.seller_id == user_id,
        Car.status == "ACTIVE"
    ).count()

    # Get subscription info
    from app.models.subscription import UserSubscription
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user_id,
        UserSubscription.status == "ACTIVE"
    ).first()
    
    return UserDetailResponse(
        id=int(getattr(user, 'id', 0)),
        email=str(getattr(user, 'email', '')),
        first_name=str(getattr(user, 'first_name', '')),
        last_name=str(getattr(user, 'last_name', '')),
        phone=str(getattr(user, 'phone', '') or ''),
        role=str(getattr(user, 'role', 'buyer')),
        
        # Verification
        email_verified=bool(getattr(user, 'email_verified', False)),
        phone_verified=bool(getattr(user, 'phone_verified', False)),
        identity_verified=bool(getattr(user, 'identity_verified', False)),
        business_verified=bool(getattr(user, 'business_verified', False)),
        
        # Status
        is_active=bool(getattr(user, 'is_active', True)),
        is_banned=bool(getattr(user, 'is_banned', False)),
        ban_reason=str(getattr(user, 'ban_reason', '') or ''),
        banned_at=getattr(user, 'banned_at', None),
        banned_until=getattr(user, 'banned_until', None),
        
        # Business Info
        business_name=str(getattr(user, 'business_name', '') or ''),
        business_permit_number=str(getattr(user, 'business_permit_number', '') or ''),
        tin_number=str(getattr(user, 'tin_number', '') or ''),
        
        # Statistics
        total_cars=cars_count,
        active_cars=active_cars,
        warnings_count=int(getattr(user, 'warnings_count', 0)),
        
        # Subscription
        subscription_status=str(getattr(subscription, 'status', 'none') if subscription else 'none'),
        subscription_expires_at=getattr(subscription, 'end_date', None) if subscription else None,
        
        # Timestamps
        created_at=getattr(user, 'created_at', datetime.utcnow()),
        last_login_at=getattr(user, 'last_login_at', None)
    )


@router.post("/users/{user_id}/ban", response_model=MessageResponse)
async def ban_user(
    user_id: int,
    ban_request: UserBanRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Ban a user account"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent banning other admins
    user_role = getattr(user, 'role', None)

    # Convert to uppercase string for comparison (database stores UPPERCASE)
    if isinstance(user_role, str):
        user_role_str = user_role.upper()
    else:
        user_role_str = str(user_role).upper() if user_role else None

    # Compare with UPPERCASE enum values
    if user_role_str in [UserRole.ADMIN.value, UserRole.MODERATOR.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot ban admin or moderator accounts"
        )
    
    # Update user status
    setattr(user, 'is_banned', True)
    setattr(user, 'is_active', False)
    setattr(user, 'ban_reason', ban_request.reason)
    setattr(user, 'banned_at', datetime.utcnow())
    setattr(user, 'banned_by', int(getattr(current_admin, 'id', 0)))
    
    if ban_request.duration_days:
        banned_until = datetime.utcnow() + timedelta(days=ban_request.duration_days)
        setattr(user, 'banned_until', banned_until)
    
    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="ban_user",
        entity_type="user",
        entity_id=user_id,
        new_values={
            "banned": True,
            "reason": ban_request.reason,
            "duration_days": ban_request.duration_days
        }
    )
    db.add(audit)
    
    # Send notification to user
    try:
        NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Account Banned",
            message=f"Your account has been banned. Reason: {ban_request.reason}",
            notification_type="account_banned"
        )
        
        # Send email
        await EmailService.send_email(
            to_email=str(getattr(user, 'email', '')),
            subject="Account Banned - Car Marketplace Philippines",
            body=f"Your account has been banned.\n\nReason: {ban_request.reason}\n\nIf you believe this is an error, please contact support."
        )
    except Exception as e:
        logger.error(f"Failed to send ban notification: {e}")
    
    db.commit()
    
    return MessageResponse(
        message=f"User banned successfully for reason: {ban_request.reason}",
        success=True
    )


@router.post("/users/{user_id}/unban", response_model=MessageResponse)
async def unban_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Unban a user account"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user status
    setattr(user, 'is_banned', False)
    setattr(user, 'is_active', True)
    setattr(user, 'ban_reason', None)
    setattr(user, 'banned_at', None)
    setattr(user, 'banned_until', None)
    setattr(user, 'banned_by', None)
    
    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="unban_user",
        entity_type="user",
        entity_id=user_id,
        new_values={"banned": False}
    )
    db.add(audit)
    
    # Send notification
    try:
        NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Account Unbanned",
            message="Your account has been unbanned. You can now access all features.",
            notification_type="account_unbanned"
        )
    except Exception as e:
        logger.error(f"Failed to send unban notification: {e}")
    
    db.commit()
    
    return MessageResponse(
        message="User unbanned successfully",
        success=True
    )


@router.post("/users/{user_id}/verify", response_model=MessageResponse)
async def verify_user(
    user_id: int,
    verify_request: UserVerifyRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Manually verify a user's identity or business"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    notification_message = ""
    # Update verification status
    if verify_request.verification_type == "identity":
        setattr(user, 'identity_verified', True)
        setattr(user, 'verified_at', datetime.utcnow())
        notification_message = "Your identity has been verified by our team."
    elif verify_request.verification_type == "business":
        setattr(user, 'business_verified', True)
        notification_message = "Your business has been verified by our team."
    
    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action=f"verify_user_{verify_request.verification_type}",
        entity_type="user",
        entity_id=user_id,
        new_values={
            "verification_type": verify_request.verification_type,
            "notes": verify_request.notes
        }
    )
    db.add(audit)
    
    # Send notification
    try:
        NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Verification Approved",
            message=notification_message,
            notification_type="verification_approved"
        )
    except Exception as e:
        logger.error(f"Failed to send verification notification: {e}")
    
    db.commit()
    
    return MessageResponse(
        message=f"User {verify_request.verification_type} verified successfully",
        success=True
    )


@router.post("/users/{user_id}/change-role", response_model=MessageResponse)
async def change_user_role(
    user_id: int,
    role_request: UserRoleChangeRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Change a user's role (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_role = getattr(user, 'role', 'buyer')
    
    # Validate new role
    if role_request.new_role not in ['buyer', 'seller', 'dealer', 'moderator']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )
    
    # Update role
    setattr(user, 'role', role_request.new_role)
    
    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="change_user_role",
        entity_type="user",
        entity_id=user_id,
        old_values={"role": old_role},
        new_values={
            "role": role_request.new_role,
            "reason": role_request.reason
        }
    )
    db.add(audit)
    
    # Send notification
    try:
        NotificationService.create_notification(
            db,
            user_id=user_id,
            title="Role Changed",
            message=f"Your role has been changed from {old_role} to {role_request.new_role}",
            notification_type="role_changed"
        )
    except Exception as e:
        logger.error(f"Failed to send role change notification: {e}")
    
    db.commit()
    
    return MessageResponse(
        message=f"User role changed from {old_role} to {role_request.new_role}",
        success=True
    )


# ========================================
# REPORTS MANAGEMENT ENDPOINTS
# ========================================

@router.get("/reports", response_model=PaginatedResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_status: Optional[str] = None,
    report_type: Optional[str] = None,
    current_moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """List all reports with filtering"""
    try:
        from app.models.inquiry import Report
        
        query = db.query(Report)
        
        # Apply filters
        if user_status:
            query = query.filter(Report.status == status)
        
        if report_type:
            query = query.filter(Report.report_type == report_type)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        reports = query.order_by(desc(Report.created_at)).offset(offset).limit(page_size).all()
        
        # Format response with user details
        items = []
        for report in reports:
            reporter = db.query(User).filter(User.id == getattr(report, 'reporter_id', 0)).first()
            reported_user = None
            if getattr(report, 'reported_user_id', None):
                reported_user = db.query(User).filter(
                    User.id == getattr(report, 'reported_user_id', 0)
                ).first()
            
            items.append(ReportListResponse(
                id=int(getattr(report, 'id', 0)),
                report_type=str(getattr(report, 'report_type', '')),
                status=str(getattr(report, 'status', 'pending')),
                reporter_name=f"{getattr(reporter, 'first_name', '')} {getattr(reporter, 'last_name', '')}".strip() if reporter else "Unknown",
                reported_user_id=getattr(report, 'reported_user_id', None),
                reported_user_name=f"{getattr(reported_user, 'first_name', '')} {getattr(reported_user, 'last_name', '')}".strip() if reported_user else None,
                reported_car_id=getattr(report, 'reported_car_id', None),
                description=str(getattr(report, 'description', ''))[:200],
                created_at=getattr(report, 'created_at', datetime.utcnow())
            ))
        
        total_pages = (total + page_size - 1) // page_size
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    except Exception as e:
        logger.error(f"Error listing reports: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch reports"
        )


@router.get("/reports/{report_id}", response_model=ReportDetailResponse)
async def get_report_details(
    report_id: int,
    current_moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific report"""
    from app.models.inquiry import Report
    
    report = db.query(Report).filter(Report.id == report_id).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Get reporter details
    reporter = db.query(User).filter(
        User.id == getattr(report, 'reporter_id', 0)
    ).first()
    
    # Get reported user details
    reported_user = None
    if getattr(report, 'reported_user_id', None):
        reported_user = db.query(User).filter(
            User.id == getattr(report, 'reported_user_id', 0)
        ).first()
    
    # Get reported car details
    reported_car = None
    if getattr(report, 'reported_car_id', None):
        reported_car = db.query(Car).filter(
            Car.id == getattr(report, 'reported_car_id', 0)
        ).first()
    
    return ReportDetailResponse(
        id=int(getattr(report, 'id', 0)),
        report_type=str(getattr(report, 'report_type', '')),
        status=str(getattr(report, 'status', 'pending')),
        description=str(getattr(report, 'description', '')),
        resolution=str(getattr(report, 'resolution', '') or ''),
        
        # Reporter Info
        reporter_id=int(getattr(report, 'reporter_id', 0)),
        reporter_name=f"{getattr(reporter, 'first_name', '')} {getattr(reporter, 'last_name', '')}".strip() if reporter else "Unknown",
        reporter_email=str(getattr(reporter, 'email', '')) if reporter else "",
        
        # Reported User Info
        reported_user_id=getattr(report, 'reported_user_id', None),
        reported_user_name=f"{getattr(reported_user, 'first_name', '')} {getattr(reported_user, 'last_name', '')}".strip() if reported_user else None,
        reported_user_email=str(getattr(reported_user, 'email', '')) if reported_user else None,
        
        # Reported Car Info
        reported_car_id=getattr(report, 'reported_car_id', None),
        reported_car_title=str(getattr(reported_car, 'title', '')) if reported_car else None,
        
        # Resolution Info
        resolved_by=getattr(report, 'resolved_by', None),
        resolved_at=getattr(report, 'resolved_at', None),
        
        created_at=getattr(report, 'created_at', datetime.utcnow())
    )


@router.post("/reports/{report_id}/resolve", response_model=MessageResponse)
async def resolve_report(
    report_id: int,
    resolve_request: ReportResolveRequest,
    current_moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """Resolve a report"""
    from app.models.inquiry import Report
    
    report = db.query(Report).filter(Report.id == report_id).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Update report status
    setattr(report, 'status', resolve_request.status)
    setattr(report, 'resolution', resolve_request.resolution)
    setattr(report, 'resolved_by', int(getattr(current_moderator, 'id', 0)))
    setattr(report, 'resolved_at', datetime.utcnow())
    
    # Create audit log
    moderator_id = int(getattr(current_moderator, 'id', 0))
    audit = AuditLog(
        user_id=moderator_id,
        action="resolve_report",
        entity_type="report",
        entity_id=report_id,
        new_values={
            "status": resolve_request.status,
            "resolution": resolve_request.resolution,
            "action_taken": resolve_request.action_taken
        }
    )
    db.add(audit)
    
    # Take action if needed
    if resolve_request.action_taken == "ban_user" and getattr(report, 'reported_user_id', None):
        reported_user = db.query(User).filter(
            User.id == getattr(report, 'reported_user_id', 0)
        ).first()
        if reported_user:
            setattr(reported_user, 'is_banned', True)
            setattr(reported_user, 'ban_reason', f"Report resolved: {resolve_request.resolution}")
            setattr(reported_user, 'banned_at', datetime.utcnow())
            setattr(reported_user, 'banned_by', moderator_id)
    
    elif resolve_request.action_taken == "remove_car" and getattr(report, 'reported_car_id', None):
        reported_car = db.query(Car).filter(
            Car.id == getattr(report, 'reported_car_id', 0)
        ).first()
        if reported_car:
            setattr(reported_car, 'status', 'removed')
            setattr(reported_car, 'is_active', False)
    
    # Notify reporter
    try:
        NotificationService.create_notification(
            db,
            user_id=int(getattr(report, 'reporter_id', 0)),
            title="Report Resolved",
            message=f"Your report has been resolved: {resolve_request.resolution}",
            notification_type="report_resolved",
            related_id=report_id,
            related_type="report"
        )
    except Exception as e:
        logger.error(f"Failed to send resolution notification: {e}")
    
    db.commit()
    
    return MessageResponse(
        message=f"Report resolved as {resolve_request.status}",
        success=True
    )


# ========================================
# CAR MODERATION ENDPOINTS
# ========================================

@router.get("/cars/pending", response_model=PaginatedResponse)
async def list_pending_cars(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """List all cars pending approval with full details for display"""
    try:
        from app.schemas.car import CarResponse
        from app.utils.enum_helpers import normalize_enum_value

        # Fixed: Use UPPERCASE for Car.status to match SQL schema
        query = db.query(Car).filter(Car.status == "PENDING")

        # Get total count
        total = query.count()

        # Apply pagination
        offset = (page - 1) * page_size
        cars = query.order_by(desc(Car.created_at)).offset(offset).limit(page_size).all()

        # Format response with full CarResponse objects to include main_image
        items = []
        for car in cars:
            car_dict = {
                "id": car.id,
                "seller_id": car.seller_id,
                "brand_id": car.brand_id,
                "model_id": car.model_id,
                "category_id": car.category_id,
                "color_id": car.color_id,
                "interior_color_id": car.interior_color_id,
                "title": car.title,
                "description": car.description,
                "year": car.year,
                "price": car.price,
                "currency_id": car.currency_id,
                "mileage": car.mileage,
                "fuel_type": car.fuel_type if isinstance(car.fuel_type, str) else car.fuel_type.value,
                "transmission": car.transmission if isinstance(car.transmission, str) else car.transmission.value,
                "car_condition": car.car_condition if isinstance(car.car_condition, str) else car.car_condition.value,
                "city_id": car.city_id,
                "province_id": car.province_id,
                "region_id": car.region_id,
                "status": car.status if isinstance(car.status, str) else car.status.value,
                "approval_status": car.approval_status if isinstance(car.approval_status, str) else car.approval_status.value,
                "is_featured": car.is_featured,
                "is_premium": car.is_premium,
                "is_active": car.is_active,
                "views_count": car.views_count,
                "contact_count": car.contact_count,
                "favorite_count": car.favorite_count,
                "average_rating": car.average_rating,
                "created_at": car.created_at,
                "updated_at": car.updated_at,
                # Media - Include main_image for frontend display
                "main_image": car.main_image,
                # Convert related objects to avoid ORM serialization issues
                "images": [],  # Empty for list view to improve performance
                "brand_rel": None,
                "model_rel": None,
                "city": None,
            }
            items.append(CarResponse.model_validate(car_dict))

        total_pages = (total + page_size - 1) // page_size
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    except Exception as e:
        logger.error(f"Error listing pending cars: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending cars"
        )


@router.post("/cars/{car_id}/approve", response_model=MessageResponse)
async def approve_car(
    car_id: int,
    approval_request: CarApprovalRequest,
    current_moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """Approve or reject a car listing"""
    car = db.query(Car).filter(Car.id == car_id).first()
    
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Update car status (use UPPERCASE to match SQL schema)
    if approval_request.approved:
        setattr(car, 'status', 'ACTIVE')
        setattr(car, 'approval_status', 'APPROVED')
        setattr(car, 'is_active', True)
        notification_title = "Car Listing Approved"
        notification_message = f"Your car listing '{getattr(car, 'title', '')}' has been approved and is now live!"
    else:
        setattr(car, 'status', 'REJECTED')
        setattr(car, 'approval_status', 'REJECTED')
        setattr(car, 'is_active', False)
        setattr(car, 'rejection_reason', approval_request.notes)
        notification_title = "Car Listing Rejected"
        notification_message = f"Your car listing '{getattr(car, 'title', '')}' was rejected. Reason: {approval_request.notes or 'No reason provided'}"
    
    # Create audit log
    moderator_id = int(getattr(current_moderator, 'id', 0))
    audit = AuditLog(
        user_id=moderator_id,
        action="moderate_car",
        entity_type="car",
        entity_id=car_id,
        new_values={
            "approved": approval_request.approved,
            "status": getattr(car, 'status', ''),
            "notes": approval_request.notes
        }
    )
    db.add(audit)
    
    # Notify seller
    try:
        seller_id = int(getattr(car, 'seller_id', 0))
        NotificationService.create_notification(
            db,
            user_id=seller_id,
            title=notification_title,
            message=notification_message,
            notification_type="car_moderation",
            related_id=car_id,
            related_type="car"
        )
    except Exception as e:
        logger.error(f"Failed to send moderation notification: {e}")
    
    db.commit()

    return MessageResponse(
        message=f"Car {'approved' if approval_request.approved else 'rejected'} successfully",
        success=True
    )


@router.post("/cars/{car_id}/reject", response_model=MessageResponse)
async def reject_car(
    car_id: int,
    rejection_data: dict,
    current_moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Reject a car listing (frontend-compatible endpoint)

    Converts frontend's 'reason' field to backend's 'notes' field.
    """
    # Convert frontend request to backend format
    approval_request = CarApprovalRequest(
        approved=False,
        notes=rejection_data.get('reason', rejection_data.get('notes', 'No reason provided'))
    )

    # Call the main approve function
    car = db.query(Car).filter(Car.id == car_id).first()

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )

    # Update car status (use UPPERCASE to match SQL schema)
    setattr(car, 'status', 'REJECTED')
    setattr(car, 'approval_status', 'REJECTED')
    setattr(car, 'is_active', False)
    setattr(car, 'rejection_reason', approval_request.notes)

    # Create audit log
    moderator_id = int(getattr(current_moderator, 'id', 0))
    audit = AuditLog(
        user_id=moderator_id,
        action="reject_car",
        entity_type="car",
        entity_id=car_id,
        new_values={
            "approved": False,
            "status": "REJECTED",
            "approval_status": "REJECTED",
            "rejection_reason": approval_request.notes
        }
    )
    db.add(audit)

    # Notify seller
    try:
        seller_id = int(getattr(car, 'seller_id', 0))
        NotificationService.create_notification(
            db,
            user_id=seller_id,
            title="Car Listing Rejected",
            message=f"Your car listing '{getattr(car, 'title', '')}' was rejected. Reason: {approval_request.notes}",
            notification_type="car_moderation",
            related_id=car_id,
            related_type="car"
        )
    except Exception as e:
        logger.error(f"Failed to send rejection notification: {e}")

    db.commit()

    return MessageResponse(
        message="Car rejected successfully",
        success=True
    )


# ========================================
# FRAUD & SECURITY ENDPOINTS
# ========================================

@router.get("/fraud-indicators", response_model=List[FraudIndicatorResponse])
async def list_fraud_indicators(
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List fraud indicators"""
    try:
        query = db.query(FraudIndicator)
        
        if severity:
            query = query.filter(FraudIndicator.severity == severity)
        
        indicators = query.order_by(desc(FraudIndicator.detected_at)).limit(limit).all()
        
        return [
            FraudIndicatorResponse(
                id=int(getattr(ind, 'id', 0)),
                user_id=getattr(ind, 'user_id', None),
                car_id=getattr(ind, 'car_id', None),
                indicator_type=str(getattr(ind, 'indicator_type', '')),
                severity=str(getattr(ind, 'severity', '')),
                description=str(getattr(ind, 'description', '')),
                detected_at=getattr(ind, 'detected_at', datetime.utcnow())
            )
            for ind in indicators
        ]
    except Exception as e:
        logger.error(f"Error listing fraud indicators: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch fraud indicators"
        )


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List audit logs"""
    try:
        query = db.query(AuditLog)
        
        if action:
            query = query.filter(AuditLog.action == action)
        
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        
        logs = query.order_by(desc(AuditLog.created_at)).limit(limit).all()
        
        items = []
        for log in logs:
            user = db.query(User).filter(User.id == getattr(log, 'user_id', 0)).first()
            
            items.append(AuditLogResponse(
                id=int(getattr(log, 'id', 0)),
                user_id=getattr(log, 'user_id', None),
                user_email=str(getattr(user, 'email', '')) if user else None,
                action=str(getattr(log, 'action', '')),
                entity_type=str(getattr(log, 'entity_type', '') or ''),
                entity_id=getattr(log, 'entity_id', None),
                old_values=getattr(log, 'old_values', None),
                new_values=getattr(log, 'new_values', None),
                ip_address=str(getattr(log, 'ip_address', '') or ''),
                created_at=getattr(log, 'created_at', datetime.utcnow())
            ))
        
        return items
    except Exception as e:
        logger.error(f"Error listing audit logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch audit logs"
        )


# ========================================
# SYSTEM CONFIGURATION ENDPOINTS
# ========================================

@router.get("/system-config", response_model=List[SystemConfigResponse])
async def list_system_configs(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all system configurations"""
    configs = db.query(SystemConfig).all()
    
    return [
        SystemConfigResponse(
            id=int(getattr(config, 'id', 0)),
            config_key=str(getattr(config, 'config_key', '')),
            config_value=str(getattr(config, 'config_value', '') or ''),
            data_type=str(getattr(config, 'data_type', '') or ''),
            description=str(getattr(config, 'description', '') or ''),
            is_public=bool(getattr(config, 'is_public', False)),
            updated_at=getattr(config, 'updated_at', datetime.utcnow())
        )
        for config in configs
    ]


@router.put("/system-config/{config_key}", response_model=MessageResponse)
async def update_system_config(
    config_key: str,
    config_update: SystemConfigUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a system configuration"""
    config = db.query(SystemConfig).filter(SystemConfig.config_key == config_key).first()
    
    if not config:
        # Create new config
        config = SystemConfig(
            config_key=config_key,
            config_value=config_update.config_value,
            data_type=config_update.data_type or "string",
            description=config_update.description or "",
            is_public=config_update.is_public or False
        )
        db.add(config)
        message = "Configuration created successfully"
    else:
        # Update existing config
        setattr(config, 'config_value', config_update.config_value)
        if config_update.data_type:
            setattr(config, 'data_type', config_update.data_type)
        if config_update.description:
            setattr(config, 'description', config_update.description)
        if config_update.is_public is not None:
            setattr(config, 'is_public', config_update.is_public)
        
        message = "Configuration updated successfully"
    
    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="update_system_config",
        entity_type="system_config",
        entity_id=getattr(config, 'id', None),
        new_values={
            "config_key": config_key,
            "config_value": config_update.config_value
        }
    )
    db.add(audit)
    
    db.commit()
    
    return MessageResponse(message=message, success=True)


# ========================================
# PAYMENT VERIFICATION ENDPOINTS (EXISTING - PRESERVED)
# ========================================

@router.get("/payments/pending", response_model=List[PendingPaymentSummary])
async def get_pending_payments(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get list of pending payments requiring verification
    
    Returns list of payments with user details, sorted by submission date
    """
    try:
        pending_payments = SubscriptionService.get_pending_payments(db, limit, offset)
        return [PendingPaymentSummary(**p) for p in pending_payments]
    except Exception as e:
        logger.error(f"Error fetching pending payments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending payments"
        )


@router.get("/payments/statistics", response_model=PaymentStatisticsResponse)
async def get_payment_statistics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get payment statistics for admin dashboard"""
    try:
        stats = SubscriptionService.get_payment_statistics(db)
        return PaymentStatisticsResponse(**stats)
    except Exception as e:
        logger.error(f"Error fetching payment statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment statistics"
        )


@router.get("/payments/{payment_id}", response_model=SubscriptionPaymentDetailedResponse)
async def get_payment_details_admin(
    payment_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed payment information (admin view)"""
    payment = db.query(SubscriptionPayment, User, SubscriptionPlan).join(
        User, SubscriptionPayment.user_id == User.id
    ).join(
        SubscriptionPlan, SubscriptionPayment.plan_id == SubscriptionPlan.id
    ).filter(
        SubscriptionPayment.id == payment_id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    payment_obj, user_obj, plan_obj = payment

    amount = getattr(payment_obj, "amount", Decimal("0"))
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    
    return SubscriptionPaymentDetailedResponse(
        id=int(getattr(payment_obj, 'id', 0)),
        subscription_id=int(getattr(payment_obj, 'subscription_id', 0)),
        user_id=int(getattr(payment_obj, 'user_id', 0)),
        plan_id=int(getattr(payment_obj, 'plan_id', 0)),
        amount=amount,
        currency=str(getattr(payment_obj, 'currency', 'PHP')),
        payment_method=str(getattr(payment_obj, 'payment_method', '')),
        status=str(getattr(payment_obj, 'status', '')),
        reference_number=str(getattr(payment_obj, 'reference_number', '') or ''),
        qr_code_shown=bool(getattr(payment_obj, 'qr_code_shown', False)),
        submitted_at=getattr(payment_obj, 'submitted_at', None),
        admin_verified_by=getattr(payment_obj, 'admin_verified_by', None),
        admin_verified_at=getattr(payment_obj, 'admin_verified_at', None),
        admin_notes=str(getattr(payment_obj, 'admin_notes', '') or ''),
        rejection_reason=str(getattr(payment_obj, 'rejection_reason', '') or ''),
        created_at=getattr(payment_obj, 'created_at', datetime.utcnow()),
        paid_at=getattr(payment_obj, 'paid_at', None),
        user_email=str(getattr(user_obj, 'email', '')),
        user_name=f"{getattr(user_obj, 'first_name', '')} {getattr(user_obj, 'last_name', '')}".strip(),
        plan_name=str(getattr(plan_obj, 'name', ''))
    )


@router.post("/payments/verify", response_model=AdminVerifyPaymentResponse)
async def verify_payment(
    verify_request: AdminVerifyPaymentRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verify or reject a payment
    
    This is the main admin action for QR code payment verification
    """
    try:
        admin_id = int(getattr(current_admin, 'id', 0))
        
        result = SubscriptionService.verify_payment(
            db=db,
            payment_id=verify_request.payment_id,
            admin_id=admin_id,
            action=verify_request.action,
            admin_notes=verify_request.admin_notes,
            rejection_reason=verify_request.rejection_reason
        )
        
        previous_status = result.get("previous_status")
        new_status = result.get("new_status")
        user_id = result.get("user_id")
        user_email = result.get("user_email")
        user_name = result.get("user_name")
        reference_number = result.get("reference_number")
        amount = result.get("amount", Decimal("0"))
        
        # Send email notification to user
        email_sent = False
        try:
            if verify_request.action == "verify":
                # Approved email
                subject = "Payment Verified - Subscription Activated"
                text_body = f"""
Hello {user_name},

Great news! Your payment has been verified and your subscription is now active.

Payment Details:
- Reference Number: {reference_number}
- Amount: ₱{amount:.2f}
- Status: Verified

{verify_request.admin_notes or ''}

Thank you for choosing Car Marketplace Philippines!

Best regards,
Car Marketplace Philippines Team
"""
                
                # Create notification
                NotificationService.create_notification(
                    db,
                    user_id=user_id,
                    title="Payment Verified",
                    message=f"Your payment (Ref: {reference_number}) has been verified. Your subscription is now active!",
                    notification_type="payment_verified",
                    related_id=verify_request.payment_id,
                    related_type="payment"
                )
            else:
                # Rejected email
                subject = "Payment Verification Failed"
                text_body = f"""
Hello {user_name},

Unfortunately, we were unable to verify your payment.

Payment Details:
- Reference Number: {reference_number}
- Amount: ₱{amount:.2f}
- Status: Rejected
- Reason: {verify_request.rejection_reason or 'No reason provided'}

{verify_request.admin_notes or ''}

If you believe this is an error, please contact our support team with your reference number.

Thank you,
Car Marketplace Philippines Team
"""
                
                # Create notification
                NotificationService.create_notification(
                    db,
                    user_id=user_id,
                    title="Payment Verification Failed",
                    message=f"Your payment (Ref: {reference_number}) could not be verified. Reason: {verify_request.rejection_reason}",
                    notification_type="payment_rejected",
                    related_id=verify_request.payment_id,
                    related_type="payment"
                )
            
            email_sent = await EmailService.send_email(
                to_email=user_email,
                subject=subject,
                body=text_body
            )
        except Exception as e:
            logger.error(f"Failed to send user notification email: {e}")
        
        return AdminVerifyPaymentResponse(
            success=True,
            message=f"Payment {verify_request.action}d successfully",
            payment_id=verify_request.payment_id,
            previous_status=previous_status,
            new_status=new_status,
            verified_by=admin_id,
            verified_at=datetime.utcnow(),
            user_email_sent=email_sent
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify payment"
        )


@router.get("/payments/{payment_id}/logs", response_model=List[PaymentVerificationLogResponse])
async def get_payment_logs(
    payment_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get verification logs for a payment"""
    logs = db.query(PaymentVerificationLog, User).join(
        User, PaymentVerificationLog.admin_id == User.id
    ).filter(
        PaymentVerificationLog.payment_id == payment_id
    ).order_by(
        PaymentVerificationLog.created_at.desc()
    ).all()
    
    return [
        PaymentVerificationLogResponse(
            id=int(getattr(log, 'id', 0)),
            payment_id=int(getattr(log, 'payment_id', 0)),
            admin_id=int(getattr(log, 'admin_id', 0)),
            admin_name=f"{getattr(admin, 'first_name', '')} {getattr(admin, 'last_name', '')}".strip(),
            action=str(getattr(log, 'action', '')),
            previous_status=str(getattr(log, 'previous_status', '') or ''),
            new_status=str(getattr(log, 'new_status', '') or ''),
            notes=str(getattr(log, 'notes', '') or ''),
            created_at=getattr(log, 'created_at', datetime.utcnow())
        )
        for log, admin in logs
    ]


# ========================================
# PAYMENT SETTINGS ENDPOINTS
# ========================================

@router.get("/settings/payment", response_model=List[PaymentSettingResponse])
async def get_payment_settings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all payment settings"""
    settings = db.query(PaymentSetting).all()
    
    return [
        PaymentSettingResponse(
            id=int(getattr(s, 'id', 0)),
            setting_key=str(getattr(s, 'setting_key', '')),
            setting_value=str(getattr(s, 'setting_value', '')),
            setting_type=str(getattr(s, 'setting_type', 'string')),
            description=str(getattr(s, 'description', '') or ''),
            is_active=bool(getattr(s, 'is_active', True)),
        )
        for s in settings
    ]


@router.put("/settings/payment/{setting_key}", response_model=MessageResponse)
async def update_payment_setting(
    setting_key: str,
    setting_update: PaymentSettingUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a payment setting"""
    setting = db.query(PaymentSetting).filter(
        PaymentSetting.setting_key == setting_key
    ).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setting not found"
        )
    
    # Update setting
    setattr(setting, 'setting_value', setting_update.setting_value)
    setattr(setting, 'updated_by', int(getattr(current_admin, 'id', 0)))
    setattr(setting, 'updated_at', datetime.utcnow())
    
    if setting_update.is_active is not None:
        setattr(setting, 'is_active', setting_update.is_active)
    
    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="update_payment_setting",
        entity_type="payment_setting",
        entity_id=getattr(setting, 'id', None),
        new_values={
            "setting_key": setting_key,
            "setting_value": setting_update.setting_value
        }
    )
    db.add(audit)
    
    db.commit()
    
    return MessageResponse(
        message="Payment setting updated successfully",
        success=True
    )


@router.post("/settings/qr-code/upload", response_model=MessageResponse)
async def upload_qr_code(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Upload GCash QR code image for subscription payments

    Accepts: image/png, image/jpeg, image/jpg
    Max size: 5MB
    """
    import os
    import uuid
    from pathlib import Path

    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )

    # Validate file size (5MB max)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )

    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/qr")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if file.filename else "png"
    unique_filename = f"gcash_qr_{uuid.uuid4().hex}.{file_extension}"
    file_path = upload_dir / unique_filename

    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Update or create payment_qr_code_image setting
    qr_setting = db.query(PaymentSetting).filter(
        PaymentSetting.setting_key == "payment_qr_code_image"
    ).first()

    file_url = f"/uploads/qr/{unique_filename}"
    admin_id = int(getattr(current_admin, 'id', 0))

    if qr_setting:
        # Delete old file if exists
        old_path = getattr(qr_setting, 'setting_value', '')
        if old_path and old_path.startswith('/uploads/qr/'):
            old_file = Path(old_path.lstrip('/'))
            if old_file.exists():
                try:
                    old_file.unlink()
                except:
                    pass

        # Update existing setting
        setattr(qr_setting, 'setting_value', file_url)
        setattr(qr_setting, 'updated_by', admin_id)
        setattr(qr_setting, 'updated_at', datetime.utcnow())
    else:
        # Create new setting
        qr_setting = PaymentSetting(
            setting_key="payment_qr_code_image",
            setting_value=file_url,
            setting_type="IMAGE",
            description="GCash QR code image for subscription payments",
            is_active=True,
            created_by=admin_id,
            updated_by=admin_id
        )
        db.add(qr_setting)

    # Create audit log
    audit = AuditLog(
        user_id=admin_id,
        action="upload_qr_code",
        entity_type="payment_setting",
        entity_id=getattr(qr_setting, 'id', None),
        new_values={
            "setting_key": "payment_qr_code_image",
            "file_url": file_url
        }
    )
    db.add(audit)

    db.commit()

    return MessageResponse(
        message=f"QR code uploaded successfully: {file_url}",
        success=True
    )


@router.put("/settings/payment-instructions", response_model=MessageResponse)
async def update_payment_instructions(
    instructions: str = Query(..., min_length=10, max_length=1000),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update payment instructions for QR code payments"""
    admin_id = int(getattr(current_admin, 'id', 0))

    setting = db.query(PaymentSetting).filter(
        PaymentSetting.setting_key == "payment_instructions"
    ).first()

    if setting:
        setattr(setting, 'setting_value', instructions)
        setattr(setting, 'updated_by', admin_id)
        setattr(setting, 'updated_at', datetime.utcnow())
    else:
        setting = PaymentSetting(
            setting_key="payment_instructions",
            setting_value=instructions,
            setting_type="TEXT",
            description="Payment instructions for QR code payments",
            is_active=True,
            created_by=admin_id,
            updated_by=admin_id
        )
        db.add(setting)

    # Create audit log
    audit = AuditLog(
        user_id=admin_id,
        action="update_payment_instructions",
        entity_type="payment_setting",
        entity_id=getattr(setting, 'id', None),
        new_values={"instructions": instructions}
    )
    db.add(audit)

    db.commit()

    return MessageResponse(
        message="Payment instructions updated successfully",
        success=True
    )


# ========================================
# CURRENCY MANAGEMENT (NEW)
# ========================================

@router.get("/currencies", response_model=List[dict])
async def list_currencies(
    is_active: Optional[bool] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all currencies"""
    from app.models.location import Currency

    query = db.query(Currency)
    if is_active is not None:
        query = query.filter(Currency.is_active == is_active)

    currencies = query.all()

    return [
        {
            "id": int(getattr(c, 'id', 0)),
            "code": str(getattr(c, 'code', '')),
            "name": str(getattr(c, 'name', '')),
            "symbol": str(getattr(c, 'symbol', '')),
            "exchange_rate_to_php": float(getattr(c, 'exchange_rate_to_php', 1.0)),
            "is_active": bool(getattr(c, 'is_active', True)),
            "updated_at": getattr(c, 'updated_at', None)
        }
        for c in currencies
    ]


@router.post("/currencies", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_currency(
    currency_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create new currency"""
    from app.models.location import Currency

    # Check if currency code already exists
    existing = db.query(Currency).filter(Currency.code == currency_data.get('code')).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Currency code already exists"
        )

    currency = Currency(
        code=currency_data.get('code'),
        name=currency_data.get('name'),
        symbol=currency_data.get('symbol'),
        exchange_rate_to_php=currency_data.get('exchange_rate_to_php', 1.0),
        is_active=currency_data.get('is_active', True)
    )

    db.add(currency)

    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="create_currency",
        entity_type="currency",
        new_values=currency_data
    )
    db.add(audit)

    db.commit()

    return MessageResponse(message="Currency created successfully", success=True)


@router.put("/currencies/{currency_id}", response_model=MessageResponse)
async def update_currency(
    currency_id: int,
    currency_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update currency"""
    from app.models.location import Currency

    currency = db.query(Currency).filter(Currency.id == currency_id).first()
    if not currency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Currency not found"
        )

    # Store old values for audit
    old_values = {
        "code": str(getattr(currency, 'code', '')),
        "name": str(getattr(currency, 'name', '')),
        "symbol": str(getattr(currency, 'symbol', '')),
        "exchange_rate_to_php": float(getattr(currency, 'exchange_rate_to_php', 1.0)),
        "is_active": bool(getattr(currency, 'is_active', True))
    }

    # Update fields
    for key, value in currency_data.items():
        if hasattr(currency, key):
            setattr(currency, key, value)

    setattr(currency, 'updated_at', datetime.utcnow())

    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="update_currency",
        entity_type="currency",
        entity_id=currency_id,
        old_values=old_values,
        new_values=currency_data
    )
    db.add(audit)

    db.commit()

    return MessageResponse(message="Currency updated successfully", success=True)


@router.delete("/currencies/{currency_id}", response_model=MessageResponse)
async def delete_currency(
    currency_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete/deactivate currency"""
    from app.models.location import Currency

    currency = db.query(Currency).filter(Currency.id == currency_id).first()
    if not currency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Currency not found"
        )

    # Soft delete by deactivating
    setattr(currency, 'is_active', False)

    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="delete_currency",
        entity_type="currency",
        entity_id=currency_id
    )
    db.add(audit)

    db.commit()

    return MessageResponse(message="Currency deactivated successfully", success=True)


# ========================================
# PROMOTION CODE MANAGEMENT (NEW)
# ========================================

@router.get("/promotion-codes", response_model=List[dict])
async def list_promotion_codes(
    is_active: Optional[bool] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all promotion codes"""
    from app.models.subscription import PromotionCode

    query = db.query(PromotionCode)
    if is_active is not None:
        query = query.filter(PromotionCode.is_active == is_active)

    codes = query.order_by(PromotionCode.created_at.desc()).all()

    return [
        {
            "id": int(getattr(c, 'id', 0)),
            "code": str(getattr(c, 'code', '')),
            "description": str(getattr(c, 'description', '') or ''),
            "discount_type": str(getattr(c, 'discount_type', '')),
            "discount_value": float(getattr(c, 'discount_value', 0)),
            "valid_from": getattr(c, 'valid_from', None),
            "valid_until": getattr(c, 'valid_until', None),
            "max_uses": getattr(c, 'max_uses', None),
            "max_uses_per_user": int(getattr(c, 'max_uses_per_user', 1)),
            "current_uses": int(getattr(c, 'current_uses', 0)),
            "min_purchase_amount": float(getattr(c, 'min_purchase_amount', 0)) if getattr(c, 'min_purchase_amount', None) else None,
            "applicable_plans": str(getattr(c, 'applicable_plans', '') or ''),
            "is_active": bool(getattr(c, 'is_active', True)),
            "created_at": getattr(c, 'created_at', None),
            "created_by": getattr(c, 'created_by', None)
        }
        for c in codes
    ]


@router.post("/promotion-codes", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_promotion_code(
    promo_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create new promotion code"""
    from app.models.subscription import PromotionCode

    # Check if code already exists
    existing = db.query(PromotionCode).filter(
        PromotionCode.code == promo_data.get('code')
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion code already exists"
        )

    admin_id = int(getattr(current_admin, 'id', 0))

    promo = PromotionCode(
        code=promo_data.get('code'),
        description=promo_data.get('description'),
        discount_type=promo_data.get('discount_type'),
        discount_value=promo_data.get('discount_value'),
        valid_from=promo_data.get('valid_from'),
        valid_until=promo_data.get('valid_until'),
        max_uses=promo_data.get('max_uses'),
        max_uses_per_user=promo_data.get('max_uses_per_user', 1),
        min_purchase_amount=promo_data.get('min_purchase_amount'),
        applicable_plans=promo_data.get('applicable_plans'),
        is_active=promo_data.get('is_active', True),
        created_by=admin_id
    )

    db.add(promo)

    # Create audit log
    audit = AuditLog(
        user_id=admin_id,
        action="create_promotion_code",
        entity_type="promotion_code",
        new_values=promo_data
    )
    db.add(audit)

    db.commit()

    return MessageResponse(message="Promotion code created successfully", success=True)


@router.put("/promotion-codes/{promo_id}", response_model=MessageResponse)
async def update_promotion_code(
    promo_id: int,
    promo_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update promotion code"""
    from app.models.subscription import PromotionCode

    promo = db.query(PromotionCode).filter(PromotionCode.id == promo_id).first()
    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion code not found"
        )

    # Update fields
    for key, value in promo_data.items():
        if hasattr(promo, key) and key != 'id' and key != 'created_by':
            setattr(promo, key, value)

    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="update_promotion_code",
        entity_type="promotion_code",
        entity_id=promo_id,
        new_values=promo_data
    )
    db.add(audit)

    db.commit()

    return MessageResponse(message="Promotion code updated successfully", success=True)


@router.delete("/promotion-codes/{promo_id}", response_model=MessageResponse)
async def delete_promotion_code(
    promo_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Deactivate promotion code"""
    from app.models.subscription import PromotionCode

    promo = db.query(PromotionCode).filter(PromotionCode.id == promo_id).first()
    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion code not found"
        )

    # Soft delete by deactivating
    setattr(promo, 'is_active', False)

    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="delete_promotion_code",
        entity_type="promotion_code",
        entity_id=promo_id
    )
    db.add(audit)

    db.commit()

    return MessageResponse(message="Promotion code deactivated successfully", success=True)


@router.get("/promotion-codes/{promo_id}/usage", response_model=List[dict])
async def get_promotion_code_usage(
    promo_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get promotion code usage statistics"""
    from app.models.subscription import PromotionCodeUsage

    usages = db.query(PromotionCodeUsage).filter(
        PromotionCodeUsage.promo_code_id == promo_id
    ).all()

    return [
        {
            "id": int(getattr(u, 'id', 0)),
            "user_id": int(getattr(u, 'user_id', 0)),
            "subscription_id": int(getattr(u, 'subscription_id', 0)),
            "discount_amount": float(getattr(u, 'discount_amount', 0)),
            "used_at": getattr(u, 'used_at', None)
        }
        for u in usages
    ]


# ========================================
# FRAUD DETECTION MANAGEMENT (NEW)
# ========================================

@router.post("/fraud-indicators", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_fraud_indicator(
    fraud_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Manually flag fraud indicator"""
    fraud = FraudIndicator(
        user_id=fraud_data.get('user_id'),
        car_id=fraud_data.get('car_id'),
        indicator_type=fraud_data.get('indicator_type'),
        severity=fraud_data.get('severity', 'medium'),
        description=fraud_data.get('description')
    )

    db.add(fraud)

    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="create_fraud_indicator",
        entity_type="fraud_indicator",
        new_values=fraud_data
    )
    db.add(audit)

    # Notify user if specified
    if fraud_data.get('notify_user') and fraud_data.get('user_id'):
        try:
            NotificationService.create_notification(
                db,
                user_id=fraud_data.get('user_id'),
                title="Security Alert",
                message=f"Unusual activity detected: {fraud_data.get('description', 'Please review your account.')}",
                notification_type="security_alert"
            )
        except Exception as e:
            logger.error(f"Failed to send fraud notification: {e}")

    db.commit()

    return MessageResponse(message="Fraud indicator created successfully", success=True)


@router.put("/fraud-indicators/{fraud_id}/resolve", response_model=MessageResponse)
async def resolve_fraud_indicator(
    fraud_id: int,
    resolution_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark fraud indicator as resolved"""
    fraud = db.query(FraudIndicator).filter(FraudIndicator.id == fraud_id).first()
    if not fraud:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fraud indicator not found"
        )

    # Delete as resolved (could be soft delete if model is updated)
    db.delete(fraud)

    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit = AuditLog(
        user_id=admin_id,
        action="resolve_fraud_indicator",
        entity_type="fraud_indicator",
        entity_id=fraud_id,
        new_values=resolution_data
    )
    db.add(audit)

    db.commit()

    return MessageResponse(message="Fraud indicator resolved successfully", success=True)


@router.get("/fraud-indicators/statistics")
async def get_fraud_statistics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get fraud detection statistics"""
    total = db.query(FraudIndicator).count()

    high_severity = db.query(FraudIndicator).filter(
        FraudIndicator.severity == "high"
    ).count()

    medium_severity = db.query(FraudIndicator).filter(
        FraudIndicator.severity == "medium"
    ).count()

    low_severity = db.query(FraudIndicator).filter(
        FraudIndicator.severity == "low"
    ).count()

    # Recent fraud (last 7 days)
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent = db.query(FraudIndicator).filter(
        FraudIndicator.detected_at >= week_ago
    ).count()

    return {
        "total_indicators": total,
        "high_severity": high_severity,
        "medium_severity": medium_severity,
        "low_severity": low_severity,
        "recent_7_days": recent
    }


# ========================================
# REVIEW MODERATION
# ========================================

@router.get("/reviews", response_model=List[dict])
async def list_reviews(
    status: Optional[str] = None,
    car_id: Optional[int] = None,
    seller_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all reviews for moderation"""
    from app.models.review import Review

    query = db.query(Review)

    if status:
        query = query.filter(Review.status == status)
    if car_id:
        query = query.filter(Review.car_id == car_id)
    if seller_id:
        query = query.filter(Review.seller_id == seller_id)

    reviews = query.order_by(desc(Review.created_at)).limit(limit).offset(offset).all()

    return [{
        "id": int(getattr(r, 'id', 0)),
        "car_id": getattr(r, 'car_id', None),
        "seller_id": int(getattr(r, 'seller_id', 0)),
        "buyer_id": int(getattr(r, 'buyer_id', 0)),
        "rating": float(getattr(r, 'rating', 0)),
        "title": getattr(r, 'title', None),
        "comment": getattr(r, 'comment', None),
        "verified_purchase": bool(getattr(r, 'verified_purchase', False)),
        "status": str(getattr(r, 'status', '')),
        "created_at": getattr(r, 'created_at', None),
        "updated_at": getattr(r, 'updated_at', None)
    } for r in reviews]


@router.post("/reviews/{review_id}/moderate", response_model=MessageResponse)
async def moderate_review(
    review_id: int,
    moderation_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Moderate review (approve/reject/hide)"""
    from app.models.review import Review, ReviewStatus

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    action = moderation_data.get('status')
    if action not in ['approved', 'rejected', 'hidden', 'pending']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be: approved, rejected, hidden, or pending"
        )

    # Update review status
    old_status = str(getattr(review, 'status', ''))
    setattr(review, 'status', ReviewStatus(action.upper()))
    setattr(review, 'admin_notes', moderation_data.get('admin_notes', ''))
    setattr(review, 'updated_at', datetime.utcnow())

    db.commit()

    # Create audit log
    admin_id = int(getattr(current_admin, 'id', 0))
    audit_log = AuditLog(
        user_id=admin_id,
        action=f"review_{action}",
        entity_type="review",
        entity_id=review_id,
        old_values={"status": old_status},
        new_values={"status": action, "admin_notes": moderation_data.get('admin_notes', '')},
        created_at=datetime.utcnow()
    )
    db.add(audit_log)
    db.commit()

    # Update seller and car ratings if approved
    if action == 'approved':
        seller_id = int(getattr(review, 'seller_id', 0))
        car_id = getattr(review, 'car_id', None)

        # Update seller rating
        from sqlalchemy import func
        avg_rating = db.query(func.avg(Review.rating)).filter(
            Review.seller_id == seller_id,
            Review.status == ReviewStatus.APPROVED
        ).scalar()

        total_reviews = db.query(func.count(Review.id)).filter(
            Review.seller_id == seller_id,
            Review.status == ReviewStatus.APPROVED
        ).scalar()

        seller = db.query(User).filter(User.id == seller_id).first()
        if seller:
            from decimal import Decimal
            setattr(seller, 'average_rating', avg_rating or Decimal("0.00"))
            setattr(seller, 'total_ratings', total_reviews or 0)

        # Update car rating if car exists
        if car_id:
            avg_car_rating = db.query(func.avg(Review.rating)).filter(
                Review.car_id == car_id,
                Review.status == ReviewStatus.APPROVED
            ).scalar()

            car = db.query(Car).filter(Car.id == car_id).first()
            if car:
                setattr(car, 'average_rating', avg_car_rating or Decimal("0.00"))

        db.commit()

    # Send notifications to buyer
    buyer_id = int(getattr(review, 'buyer_id', 0))
    from app.services.notification_service import NotificationService

    if action == 'approved':
        NotificationService.notify_review_approved(db, buyer_id, review_id)
    elif action == 'rejected':
        admin_notes = moderation_data.get('admin_notes', '')
        NotificationService.notify_review_rejected(db, buyer_id, review_id, admin_notes if admin_notes else None)

    return MessageResponse(
        message=f"Review {action} successfully",
        success=True
    )


@router.get("/reviews/statistics")
async def get_review_statistics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get review moderation statistics"""
    from app.models.review import Review, ReviewStatus

    total = db.query(Review).count()
    pending = db.query(Review).filter(Review.status == ReviewStatus.PENDING).count()
    approved = db.query(Review).filter(Review.status == ReviewStatus.APPROVED).count()
    rejected = db.query(Review).filter(Review.status == ReviewStatus.REJECTED).count()
    hidden = db.query(Review).filter(Review.status == ReviewStatus.HIDDEN).count()

    verified_purchases = db.query(Review).filter(Review.verified_purchase == True).count()

    from sqlalchemy import func
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.status == ReviewStatus.APPROVED
    ).scalar()

    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "hidden": hidden,
        "verified_purchases": verified_purchases,
        "average_rating": float(avg_rating) if avg_rating else 0.0
    }


# ========================================
# CAR DOCUMENTS VERIFICATION
# ========================================

@router.get("/cars/{car_id}/documents", response_model=List)
async def get_car_documents_admin(
    car_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all documents for a car (admin view) - Returns all documents including unverified ones"""
    from app.models.car_document import CarDocument
    from app.schemas.car_document import CarDocumentResponse

    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    documents = db.query(CarDocument).filter(
        CarDocument.car_id == car_id
    ).order_by(CarDocument.uploaded_at.desc()).all()

    return [CarDocumentResponse.model_validate(doc) for doc in documents]


@router.post("/cars/{car_id}/documents/{document_id}/verify", response_model=MessageResponse)
async def verify_car_document(
    car_id: int,
    document_id: int,
    is_verified: bool = Query(..., description="Verification status"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Verify or reject a car document"""
    from app.models.car_document import CarDocument

    document = db.query(CarDocument).filter(
        CarDocument.id == document_id,
        CarDocument.car_id == car_id
    ).first()

    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    admin_id = int(getattr(current_admin, 'id', 0))
    setattr(document, 'is_verified', is_verified)
    setattr(document, 'verified_by', admin_id)
    setattr(document, 'verified_at', datetime.utcnow())

    db.commit()

    status_text = "verified" if is_verified else "rejected"
    return MessageResponse(message=f"Document {status_text} successfully", success=True)


# ===========================================
# COMPLETE ADMIN ENDPOINTS SUMMARY:
# ===========================================
#
# ✅ DASHBOARD (1 endpoint)
#    - GET /dashboard - Overview statistics
#
# ✅ USER MANAGEMENT (6 endpoints)
#    - GET /users - List all users with filters
#    - GET /users/{user_id} - Get user details
#    - POST /users/{user_id}/ban - Ban a user
#    - POST /users/{user_id}/unban - Unban a user
#    - POST /users/{user_id}/verify - Verify user identity/business
#    - POST /users/{user_id}/change-role - Change user role
#
# ✅ REPORTS MANAGEMENT (3 endpoints)
#    - GET /reports - List all reports with filters
#    - GET /reports/{report_id} - Get report details
#    - POST /reports/{report_id}/resolve - Resolve a report
#
# ✅ CAR MODERATION (2 endpoints)
#    - GET /cars/pending - List pending car approvals
#    - POST /cars/{car_id}/approve - Approve/reject car listing
#
# ✅ FRAUD & SECURITY (2 endpoints)
#    - GET /fraud-indicators - List fraud indicators
#    - GET /audit-logs - View audit logs
#
# ✅ SYSTEM CONFIGURATION (2 endpoints)
#    - GET /system-config - List system configurations
#    - PUT /system-config/{config_key} - Update configuration
#
# ✅ PAYMENT VERIFICATION (6 endpoints - PRESERVED)
#    - GET /payments/pending - List pending payments
#    - GET /payments/{payment_id} - Get payment details
#    - POST /payments/verify - Verify/reject payment
#    - GET /payments/statistics - Payment statistics
#    - GET /payments/{payment_id}/logs - Payment verification logs
#    - GET /settings/payment - Get payment settings
#    - PUT /settings/payment/{setting_key} - Update payment setting
#
# ✅ CURRENCY MANAGEMENT (4 endpoints - NEW)
#    - GET /currencies - List all currencies
#    - POST /currencies - Create new currency
#    - PUT /currencies/{id} - Update currency
#    - DELETE /currencies/{id} - Deactivate currency
#
# ✅ PROMOTION CODES (5 endpoints - NEW)
#    - GET /promotion-codes - List all promotion codes
#    - POST /promotion-codes - Create promotion code
#    - PUT /promotion-codes/{id} - Update promotion code
#    - DELETE /promotion-codes/{id} - Deactivate promotion code
#    - GET /promotion-codes/{id}/usage - Get usage statistics
#
# ✅ FRAUD DETECTION (4 endpoints - NEW)
#    - GET /fraud-indicators - List fraud indicators
#    - POST /fraud-indicators - Create fraud indicator
#    - PUT /fraud-indicators/{id}/resolve - Resolve fraud
#    - GET /fraud-indicators/statistics - Fraud statistics
#
# ✅ REVIEW MODERATION (3 endpoints - NEW)
#    - GET /reviews - List all reviews for moderation
#    - POST /reviews/{id}/moderate - Approve/reject/hide review
#    - GET /reviews/statistics - Review moderation statistics
#
# TOTAL: 38 Admin Endpoints (was 22, added 16 new)
# ===========================================