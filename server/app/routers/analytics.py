"""
Analytics Router
Exposes advanced analytics and insights through REST API
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, get_current_user_id, require_role
from analytics_service import AnalyticsService
from models import User
from typing import Optional

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/cars/{car_id}/performance")
async def get_car_performance_analytics(
    car_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get comprehensive performance analytics for a specific car listing
    
    Returns:
    - Performance metrics (views, inquiries, engagement)
    - Price analysis and competitiveness
    - Traffic sources and viewer demographics
    - Temporal analytics (hourly/daily trends)
    - Actionable recommendations
    """
    
    analytics = AnalyticsService(db)
    result = analytics.get_car_performance(car_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Verify ownership or admin access
    from models import Car
    car = db.query(Car).filter(Car.id == car_id).first()
    
    if car.seller_id != user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user.role not in ['admin', 'moderator']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view these analytics"
            )
    
    return result


@router.get("/seller/dashboard")
async def get_seller_dashboard_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get comprehensive seller performance analytics
    
    Parameters:
    - days: Number of days to analyze (default: 30, max: 365)
    
    Returns:
    - Overview metrics (listings, sales, revenue)
    - Engagement metrics (views, inquiries, conversion)
    - Sales performance (conversion rate, time to sell)
    - Communication metrics (response rate, time)
    - Market analysis (market share, competitive position)
    - Trends over time
    - Top performing listings
    - Personalized recommendations
    """
    
    analytics = AnalyticsService(db)
    result = analytics.get_seller_analytics(user.id, days)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analytics data available"
        )
    
    return result


@router.get("/market/insights")
async def get_market_insights(
    brand_id: Optional[int] = Query(None),
    region_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get market-wide analytics and insights
    
    Parameters:
    - brand_id: Filter by specific brand (optional)
    - region_id: Filter by specific region (optional)
    
    Returns:
    - Market overview (listings, pricing, demand)
    - Price analytics (statistics, distribution, trends)
    - Popular categories (brands, models, body types)
    - Geographic insights (hotspots, regional breakdown)
    - Temporal patterns (seasonal trends, monthly data)
    - Buyer behavior analysis
    """
    
    analytics = AnalyticsService(db)
    result = analytics.get_market_insights(brand_id, region_id)
    
    return result


@router.get("/competitor/analysis")
async def get_competitor_analysis(
    radius_km: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Analyze competitors in your market area
    
    Parameters:
    - radius_km: Search radius in kilometers (default: 25)
    
    Returns:
    - Competing listings count
    - Price comparison with competitors
    - Engagement comparison (views, inquiries)
    - Top competitors identification
    - Your market position
    - Competitive recommendations
    """
    
    if user.role not in ['seller', 'dealer', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Competitor analysis is only available for sellers"
        )
    
    analytics = AnalyticsService(db)
    result = analytics.get_competitor_analysis(user.id, radius_km)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unable to perform competitor analysis"
        )
    
    return result


@router.get("/trends/pricing")
async def get_pricing_trends(
    brand_id: Optional[int] = Query(None),
    model_id: Optional[int] = Query(None),
    region_id: Optional[int] = Query(None),
    days: int = Query(180, ge=30, le=365),
    db: Session = Depends(get_db)
):
    """
    Get pricing trends over time
    
    Parameters:
    - brand_id: Filter by brand
    - model_id: Filter by model
    - region_id: Filter by region
    - days: Number of days to analyze
    
    Returns:
    - Price trends over time
    - Average, median, min, max prices
    - Price change percentages
    """
    
    from models import Car
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    query = db.query(Car).filter(Car.status == 'approved')
    
    if brand_id:
        query = query.filter(Car.brand_id == brand_id)
    if model_id:
        query = query.filter(Car.model_id == model_id)
    if region_id:
        query = query.filter(Car.region_id == region_id)
    
    since_date = datetime.utcnow() - timedelta(days=days)
    query = query.filter(Car.created_at >= since_date)
    
    # Get monthly price trends - MySQL compatible
    trends = db.query(
        func.DATE_FORMAT(Car.created_at, '%Y-%m-01').label('month'),
        func.avg(Car.price).label('avg_price'),
        func.min(Car.price).label('min_price'),
        func.max(Car.price).label('max_price'),
        func.count(Car.id).label('listings')
    ).filter(
        Car.status == 'approved',
        Car.created_at >= since_date
    )
    
    if brand_id:
        trends = trends.filter(Car.brand_id == brand_id)
    if model_id:
        trends = trends.filter(Car.model_id == model_id)
    if region_id:
        trends = trends.filter(Car.region_id == region_id)
    
    trends = trends.group_by('month').order_by('month').all()
    
    return {
        "filters": {
            "brand_id": brand_id,
            "model_id": model_id,
            "region_id": region_id,
            "days": days
        },
        "trends": [
            {
                "month": str(month),
                "average_price": round(float(avg), 2),
                "min_price": round(float(min_p), 2),
                "max_price": round(float(max_p), 2),
                "listings": listings
            }
            for month, avg, min_p, max_p, listings in trends
        ]
    }


@router.get("/engagement/summary")
async def get_engagement_summary(
    car_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get engagement summary for your listings or specific car
    
    Parameters:
    - car_id: Specific car ID (optional, defaults to all your cars)
    
    Returns:
    - Total and average views
    - Total and average inquiries
    - Total favorites
    - Engagement rates
    - Best and worst performing listings
    """
    
    from models import Car
    from sqlalchemy import func
    
    if car_id:
        # Check ownership
        car = db.query(Car).filter(Car.id == car_id).first()
        if not car:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Car not found"
            )
        
        if car.seller_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this car's analytics"
            )
        
        cars = [car]
    else:
        cars = db.query(Car).filter(
            Car.seller_id == user_id,
            Car.status.in_(['approved', 'pending'])
        ).all()
    
    if not cars:
        return {
            "message": "No listings found",
            "total_views": 0,
            "total_inquiries": 0,
            "total_favorites": 0
        }
    
    total_views = sum(car.views_count for car in cars)
    total_inquiries = sum(car.contact_count for car in cars)
    total_favorites = sum(car.favorite_count for car in cars)
    
    # Calculate engagement rate
    engagement_rate = (
        (total_inquiries + total_favorites * 0.5) / total_views * 100
        if total_views > 0 else 0
    )
    
    # Find best and worst performers
    cars_with_score = [
        (car, car.views_count + car.contact_count * 2 + car.favorite_count)
        for car in cars
    ]
    cars_with_score.sort(key=lambda x: x[1], reverse=True)
    
    best_performer = cars_with_score[0][0] if cars_with_score else None
    worst_performer = cars_with_score[-1][0] if len(cars_with_score) > 1 else None
    
    return {
        "total_listings": len(cars),
        "total_views": total_views,
        "total_inquiries": total_inquiries,
        "total_favorites": total_favorites,
        "average_views_per_listing": round(total_views / len(cars), 2),
        "average_inquiries_per_listing": round(total_inquiries / len(cars), 2),
        "engagement_rate": round(engagement_rate, 2),
        "best_performer": {
            "id": best_performer.id,
            "title": best_performer.title,
            "views": best_performer.views_count,
            "inquiries": best_performer.contact_count,
            "favorites": best_performer.favorite_count
        } if best_performer else None,
        "worst_performer": {
            "id": worst_performer.id,
            "title": worst_performer.title,
            "views": worst_performer.views_count,
            "inquiries": worst_performer.contact_count,
            "favorites": worst_performer.favorite_count
        } if worst_performer and len(cars) > 1 else None
    }


@router.get("/platform/statistics")
async def get_platform_statistics(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(['admin', 'moderator']))
):
    """
    Get platform-wide statistics (Admin only)
    
    Returns:
    - Total users, listings, transactions
    - Growth metrics
    - Revenue analytics
    - User engagement
    - Platform health metrics
    """
    
    from models import Car, Inquiry, Transaction
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # User statistics
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    # Listing statistics
    total_listings = db.query(func.count(Car.id)).scalar()
    approved_listings = db.query(func.count(Car.id)).filter(Car.status == 'approved').scalar()
    sold_listings = db.query(func.count(Car.id)).filter(Car.status == 'sold').scalar()
    
    # Activity last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    new_users_30d = db.query(func.count(User.id)).filter(
        User.created_at >= thirty_days_ago
    ).scalar()
    
    new_listings_30d = db.query(func.count(Car.id)).filter(
        Car.created_at >= thirty_days_ago
    ).scalar()
    
    # Engagement
    total_views = db.query(func.sum(Car.views_count)).scalar() or 0
    total_inquiries = db.query(func.count(Inquiry.id)).scalar() or 0
    
    # Revenue (from sold cars)
    total_revenue = db.query(func.sum(Car.price)).filter(
        Car.status == 'sold'
    ).scalar() or 0
    
    # Average prices
    avg_listing_price = db.query(func.avg(Car.price)).filter(
        Car.status == 'approved'
    ).scalar() or 0
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "new_last_30_days": new_users_30d,
            "growth_rate_30d": round(new_users_30d / total_users * 100, 2) if total_users > 0 else 0
        },
        "listings": {
            "total": total_listings,
            "approved": approved_listings,
            "sold": sold_listings,
            "new_last_30_days": new_listings_30d,
            "conversion_rate": round(sold_listings / total_listings * 100, 2) if total_listings > 0 else 0
        },
        "engagement": {
            "total_views": total_views,
            "total_inquiries": total_inquiries,
            "views_per_listing": round(total_views / approved_listings, 2) if approved_listings > 0 else 0,
            "inquiry_rate": round(total_inquiries / total_views * 100, 2) if total_views > 0 else 0
        },
        "financial": {
            "total_transaction_value": round(float(total_revenue), 2),
            "average_listing_price": round(float(avg_listing_price), 2),
            "average_sold_price": round(float(total_revenue / sold_listings), 2) if sold_listings > 0 else 0
        }
    }


@router.get("/real-time/online-users")
async def get_online_users(
    user: User = Depends(require_role(['admin', 'moderator']))
):
    """
    Get list of currently online users (Admin only)
    
    Returns list of user IDs currently connected via WebSocket
    """
    from websocket_manager import connection_manager
    
    online_users = connection_manager.get_online_users()
    
    return {
        "count": len(online_users),
        "user_ids": online_users
    }


@router.post("/test/notification")
async def send_test_notification(
    title: str = Query(...),
    message: str = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Send a test notification to yourself
    
    Parameters:
    - title: Notification title
    - message: Notification message
    
    Useful for testing WebSocket connection
    """
    from websocket_manager import notification_service
    
    await notification_service.send_custom_notification(
        user.id,
        title,
        message,
        "test"
    )
    
    return {
        "success": True,
        "message": "Test notification sent",
        "recipient_user_id": user.id
    }