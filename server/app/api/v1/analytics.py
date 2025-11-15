from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.car import Car
from app.models.analytics import CarView, UserAction
from app.models.inquiry import Inquiry

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    # FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    
    # Get user's cars
    # Fixed: Use UPPERCASE for Car.status to match SQL schema
    total_listings = db.query(Car).filter(Car.seller_id == user_id).count()
    active_listings = db.query(Car).filter(
        Car.seller_id == user_id,
        Car.status == "ACTIVE"
    ).count()
    
    # Get total views
    total_views = db.query(func.sum(Car.views_count)).filter(
        Car.seller_id == user_id
    ).scalar() or 0
    
    # Get inquiries
    total_inquiries = db.query(Inquiry).filter(
        Inquiry.seller_id == user_id
    ).count()
    
    return {
        "total_listings": total_listings,
        "active_listings": active_listings,
        "total_views": int(total_views),
        "total_inquiries": total_inquiries
    }


@router.get("/cars/{car_id}/views")
async def get_car_analytics(
    car_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get car view analytics"""
    # Verify ownership - FIX: Use getattr
    user_id = int(getattr(current_user, 'id', 0))
    car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # Get views for the past N days
    since_date = datetime.utcnow() - timedelta(days=days)
    
    views = db.query(
        func.date(CarView.viewed_at).label("date"),
        func.count(CarView.id).label("count")
    ).filter(
        CarView.car_id == car_id,
        CarView.viewed_at >= since_date
    ).group_by(func.date(CarView.viewed_at)).all()
    
    # FIX: Use getattr for views_count
    total_views = int(getattr(car, 'views_count', 0))
    
    return {
        "car_id": car_id,
        "total_views": total_views,
        "period_days": days,
        "daily_views": [{"date": str(v.date), "count": v.count} for v in views]
    }


@router.get("/market-insights")
async def get_market_insights(
    brand_id: Optional[int] = None,
    model_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get market insights"""
    # Fixed: Use UPPERCASE for Car.status to match SQL schema
    query = db.query(
        func.avg(Car.price).label("avg_price"),
        func.min(Car.price).label("min_price"),
        func.max(Car.price).label("max_price"),
        func.count(Car.id).label("listing_count")
    ).filter(Car.status == "ACTIVE")
    
    if brand_id:
        query = query.filter(Car.brand_id == brand_id)
    if model_id:
        query = query.filter(Car.model_id == model_id)
    
    result = query.first()
    
    # Handle None result
    if not result:
        return {
            "avg_price": 0.0,
            "min_price": 0.0,
            "max_price": 0.0,
            "listing_count": 0
        }
    
    # FIX: Safe conversion of aggregate results
    avg_price = result.avg_price
    min_price = result.min_price
    max_price = result.max_price
    listing_count = result.listing_count
    
    return {
        "avg_price": float(avg_price) if avg_price is not None else 0.0,
        "min_price": float(min_price) if min_price is not None else 0.0,
        "max_price": float(max_price) if max_price is not None else 0.0,
        "listing_count": int(listing_count) if listing_count is not None else 0
    }