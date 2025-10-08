from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.core.dependencies import get_current_user, get_current_seller
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
    # Get user's cars
    total_listings = db.query(Car).filter(Car.seller_id == current_user.id).count()  # type: ignore
    active_listings = db.query(Car).filter(
        Car.seller_id == current_user.id,  # type: ignore
        Car.status == "active"  # type: ignore
    ).count()
    
    # Get total views
    total_views = db.query(func.sum(Car.views_count)).filter(
        Car.seller_id == current_user.id  # type: ignore
    ).scalar() or 0
    
    # Get inquiries
    total_inquiries = db.query(Inquiry).filter(
        Inquiry.seller_id == current_user.id  # type: ignore
    ).count()
    
    return {
        "total_listings": total_listings,
        "active_listings": active_listings,
        "total_views": total_views,
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
    # Verify ownership
    car = db.query(Car).filter(Car.id == car_id, Car.seller_id == current_user.id).first()  # type: ignore
    if not car:  # type: ignore
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
    
    return {
        "car_id": car_id,
        "total_views": car.views_count,  # type: ignore
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
    query = db.query(
        func.avg(Car.price).label("avg_price"),
        func.min(Car.price).label("min_price"),
        func.max(Car.price).label("max_price"),
        func.count(Car.id).label("listing_count")
    ).filter(Car.status == "active")  # type: ignore
    
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
    
    return {
        "avg_price": float(result.avg_price) if result.avg_price else 0.0,
        "min_price": float(result.min_price) if result.min_price else 0.0,
        "max_price": float(result.max_price) if result.max_price else 0.0,
        "listing_count": result.listing_count if result.listing_count else 0
    }