from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from decimal import Decimal
from app.models.car import Car, CarImage, CarFeature, Brand, Model, Feature
from app.models.user import User
from app.models.location import PhCity
from app.models.transaction import PriceHistory
from app.models.analytics import CarView, UserAction
from app.database import cache
import json


class CarService:
    """Car listing service"""
    
    @staticmethod
    def create_car(db: Session, user_id: int, car_data: dict) -> Car:
        """Create car listing"""
        # Verify user can create listing
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.can_list_cars:
            raise ValueError("User cannot create listings")
        
        # Check subscription limits
        if not CarService.check_listing_limits(db, user_id):
            raise ValueError("Listing limit reached for current subscription")
        
        # Extract feature IDs
        feature_ids = car_data.pop("feature_ids", [])
        
        # Verify location
        city = db.query(PhCity).filter(PhCity.id == car_data["city_id"]).first()
        if not city:
            raise ValueError("Invalid city_id")
        
        # Set province and region from city
        car_data["province_id"] = city.province_id
        car_data["region_id"] = city.province.region_id
        
        # Generate SEO slug
        car_data["seo_slug"] = CarService.generate_slug(car_data["title"])
        
        # Create car
        car = Car(
            seller_id=user_id,
            **car_data,
            status="pending",
            approval_status="pending",
            created_at=datetime.utcnow()
        )
        
        db.add(car)
        db.flush()
        
        # Add features
        if feature_ids:
            for feature_id in feature_ids:
                car_feature = CarFeature(car_id=car.id, feature_id=feature_id)
                db.add(car_feature)
        
        # Calculate completeness score
        car.completeness_score = CarService.calculate_completeness(car)
        
        db.commit()
        db.refresh(car)
        
        # Clear user cache
        cache.delete(f"user_cars:{user_id}")
        
        # Track action
        CarService.track_action(db, user_id, "upload_car", "car", car.id)
        
        return car
    
    @staticmethod
    def update_car(db: Session, car_id: int, user_id: int, car_data: dict) -> Car:
        """Update car listing"""
        car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
        if not car:
            raise ValueError("Car not found or access denied")
        
        # Track price change
        if "price" in car_data and car_data["price"] != car.price:
            old_price = car.price
            new_price = car_data["price"]
            price_change = ((new_price - old_price) / old_price * 100) if old_price > 0 else 0
            
            price_history = PriceHistory(
                car_id=car.id,
                old_price=old_price,
                new_price=new_price,
                price_change_percent=price_change,
                changed_by=user_id,
                change_reason="manual"
            )
            db.add(price_history)
            car.original_price = old_price
            car.last_price_update = datetime.utcnow()
        
        # Update features if provided
        if "feature_ids" in car_data:
            feature_ids = car_data.pop("feature_ids")
            # Remove old features
            db.query(CarFeature).filter(CarFeature.car_id == car.id).delete()
            # Add new features
            for feature_id in feature_ids:
                car_feature = CarFeature(car_id=car.id, feature_id=feature_id)
                db.add(car_feature)
        
        # Update car fields
        for key, value in car_data.items():
            if hasattr(car, key) and value is not None:
                setattr(car, key, value)
        
        car.updated_at = datetime.utcnow()
        car.completeness_score = CarService.calculate_completeness(car)
        
        db.commit()
        db.refresh(car)
        
        # Clear caches
        cache.delete(f"car:{car.id}")
        cache.delete(f"user_cars:{user_id}")
        
        return car
    
    @staticmethod
    def get_car(db: Session, car_id: int, user_id: Optional[int] = None) -> Optional[Car]:
        """Get car by ID"""
        # Try cache first
        cached = cache.get(f"car:{car_id}")
        if cached:
            return json.loads(cached)
        
        car = db.query(Car).options(
            joinedload(Car.seller),
            joinedload(Car.brand),
            joinedload(Car.model),
            joinedload(Car.city),
            joinedload(Car.images),
            joinedload(Car.features).joinedload(CarFeature.feature)
        ).filter(Car.id == car_id).first()
        
        if car:
            # Track view
            CarService.record_view(db, car.id, user_id)
            
            # Cache for 5 minutes
            cache.set(f"car:{car.id}", json.dumps(car, default=str), ttl=300)
        
        return car
    
    @staticmethod
    def search_cars(db: Session, filters: dict, page: int = 1, limit: int = 20) -> tuple:
        """Search cars with filters"""
        query = db.query(Car).filter(
            Car.status == "approved",
            Car.approval_status == "approved",
            Car.is_active == True
        )
        
        # Apply filters
        if filters.get("q"):
            search_term = f"%{filters['q']}%"
            query = query.filter(
                or_(
                    Car.title.ilike(search_term),
                    Car.description.ilike(search_term)
                )
            )
        
        if filters.get("brand_id"):
            query = query.filter(Car.brand_id == filters["brand_id"])
        
        if filters.get("model_id"):
            query = query.filter(Car.model_id == filters["model_id"])
        
        if filters.get("category_id"):
            query = query.filter(Car.category_id == filters["category_id"])
        
        if filters.get("min_price"):
            query = query.filter(Car.price >= filters["min_price"])
        
        if filters.get("max_price"):
            query = query.filter(Car.price <= filters["max_price"])
        
        if filters.get("min_year"):
            query = query.filter(Car.year >= filters["min_year"])
        
        if filters.get("max_year"):
            query = query.filter(Car.year <= filters["max_year"])
        
        if filters.get("fuel_type"):
            query = query.filter(Car.fuel_type == filters["fuel_type"])
        
        if filters.get("transmission"):
            query = query.filter(Car.transmission == filters["transmission"])
        
        if filters.get("min_mileage"):
            query = query.filter(Car.mileage >= filters["min_mileage"])
        
        if filters.get("max_mileage"):
            query = query.filter(Car.mileage <= filters["max_mileage"])
        
        if filters.get("condition_rating"):
            query = query.filter(Car.condition_rating == filters["condition_rating"])
        
        if filters.get("city_id"):
            query = query.filter(Car.city_id == filters["city_id"])
        
        if filters.get("province_id"):
            query = query.filter(Car.province_id == filters["province_id"])
        
        if filters.get("region_id"):
            query = query.filter(Car.region_id == filters["region_id"])
        
        # Location-based search
        if filters.get("latitude") and filters.get("longitude") and filters.get("radius_km"):
            lat = float(filters["latitude"])
            lng = float(filters["longitude"])
            radius = float(filters["radius_km"])
            
            # Haversine formula for distance in MySQL
            query = query.filter(
                func.acos(
                    func.cos(func.radians(lat)) *
                    func.cos(func.radians(Car.latitude)) *
                    func.cos(func.radians(Car.longitude) - func.radians(lng)) +
                    func.sin(func.radians(lat)) *
                    func.sin(func.radians(Car.latitude))
                ) * 6371 <= radius
            )
        
        if filters.get("is_featured"):
            query = query.filter(Car.is_featured == True, Car.featured_until >= datetime.utcnow())
        
        if filters.get("negotiable") is not None:
            query = query.filter(Car.negotiable == filters["negotiable"])
        
        if filters.get("financing_available"):
            query = query.filter(Car.financing_available == True)
        
        # Sorting
        sort_by = filters.get("sort_by", "created_at")
        sort_order = filters.get("sort_order", "desc")
        
        if sort_by == "price":
            query = query.order_by(Car.price.desc() if sort_order == "desc" else Car.price.asc())
        elif sort_by == "year":
            query = query.order_by(Car.year.desc() if sort_order == "desc" else Car.year.asc())
        elif sort_by == "mileage":
            query = query.order_by(Car.mileage.asc() if sort_order == "asc" else Car.mileage.desc())
        elif sort_by == "views_count":
            query = query.order_by(Car.views_count.desc() if sort_order == "desc" else Car.views_count.asc())
        else:
            query = query.order_by(Car.created_at.desc() if sort_order == "desc" else Car.created_at.asc())
        
        # Get total count
        total = query.count()
        
        # Paginate
        offset = (page - 1) * limit
        cars = query.offset(offset).limit(limit).all()
        
        return cars, total
    
    @staticmethod
    def delete_car(db: Session, car_id: int, user_id: int) -> bool:
        """Delete car listing"""
        car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
        if not car:
            raise ValueError("Car not found or access denied")
        
        # Soft delete
        car.is_active = False
        car.status = "removed"
        db.commit()
        
        # Clear caches
        cache.delete(f"car:{car.id}")
        cache.delete(f"user_cars:{user_id}")
        
        return True
    
    @staticmethod
    def boost_car(db: Session, car_id: int, user_id: int, duration_hours: int = 168) -> Car:
        """Boost car listing"""
        car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
        if not car:
            raise ValueError("Car not found or access denied")
        
        # Check subscription feature usage
        # TODO: Implement subscription feature check
        
        car.last_boosted_at = datetime.utcnow()
        car.boost_count += 1
        car.subscription_boosted = True
        car.subscription_boost_expires_at = datetime.utcnow() + timedelta(hours=duration_hours)
        
        # Increase search score
        car.search_score = min(car.search_score + 5, 10)
        
        db.commit()
        db.refresh(car)
        
        cache.delete(f"car:{car.id}")
        
        return car
    
    @staticmethod
    def check_listing_limits(db: Session, user_id: int) -> bool:
        """Check if user can create more listings"""
        user = db.query(User).filter(User.id == user_id).first()
        
        # Count active listings
        active_count = db.query(Car).filter(
            Car.seller_id == user_id,
            Car.status.in_(["approved", "pending"]),
            Car.is_active == True
        ).count()
        
        # Get subscription limits
        # For now, use default limits
        max_listings = 3  # Free plan default
        
        if user.subscription_status == "active":
            # TODO: Get limits from subscription
            max_listings = 10
        
        return active_count < max_listings
    
    @staticmethod
    def calculate_completeness(car: Car) -> Decimal:
        """Calculate listing completeness score"""
        score = 0
        total_fields = 20
        
        # Required fields (already filled)
        score += 5
        
        # Optional but important fields
        if car.description and len(car.description) > 50:
            score += 1
        if car.engine_size:
            score += 1
        if car.horsepower:
            score += 1
        if car.drivetrain:
            score += 1
        if car.vin:
            score += 1
        if car.plate_number:
            score += 1
        if car.registration_expiry:
            score += 1
        if car.detailed_address:
            score += 1
        if car.warranty_details:
            score += 1
        if car.insurance_company:
            score += 1
        
        # Images (up to 5 points)
        image_count = len(car.images) if hasattr(car, 'images') else 0
        score += min(image_count, 5)
        
        percentage = (score / total_fields) * 100
        return Decimal(str(round(percentage, 2)))
    
    @staticmethod
    def generate_slug(title: str) -> str:
        """Generate SEO-friendly slug"""
        import re
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'[\s-]+', '-', slug)
        slug = slug.strip('-')
        
        # Add timestamp to ensure uniqueness
        from time import time
        slug = f"{slug}-{int(time())}"
        
        return slug[:255]
    
    @staticmethod
    def record_view(db: Session, car_id: int, user_id: Optional[int] = None, session_id: Optional[str] = None, ip_address: Optional[str] = None):
        """Record car view"""
        # Check if unique view
        is_unique = True
        if user_id:
            existing = db.query(CarView).filter(
                CarView.car_id == car_id,
                CarView.user_id == user_id
            ).first()
            is_unique = existing is None
        elif session_id:
            existing = db.query(CarView).filter(
                CarView.car_id == car_id,
                CarView.session_id == session_id
            ).first()
            is_unique = existing is None
        
        # Create view record
        view = CarView(
            car_id=car_id,
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            is_unique_view=is_unique,
            viewed_at=datetime.utcnow()
        )
        db.add(view)
        
        # Update car view counts
        car = db.query(Car).filter(Car.id == car_id).first()
        if car:
            car.views_count += 1
            if is_unique:
                car.unique_views_count += 1
        
        db.commit()
    
    @staticmethod
    def track_action(db: Session, user_id: int, action_type: str, target_type: str, target_id: int, metadata: dict = None):
        """Track user action"""
        action = UserAction(
            user_id=user_id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            metadata=metadata
        )
        db.add(action)
        db.commit()
    
    @staticmethod
    def get_brands(db: Session, popular_only: bool = False) -> List[Brand]:
        """Get all brands"""
        query = db.query(Brand).filter(Brand.is_active == True)
        if popular_only:
            query = query.filter(Brand.is_popular_in_ph == True)
        return query.order_by(Brand.name).all()
    
    @staticmethod
    def get_models(db: Session, brand_id: Optional[int] = None) -> List[Model]:
        """Get models by brand"""
        query = db.query(Model).filter(Model.is_active == True)
        if brand_id:
            query = query.filter(Model.brand_id == brand_id)
        return query.order_by(Model.name).all()
    
    @staticmethod
    def get_features(db: Session, category: Optional[str] = None) -> List[Feature]:
        """Get features"""
        query = db.query(Feature).filter(Feature.is_active == True)
        if category:
            query = query.filter(Feature.category == category)
        return query.order_by(Feature.name).all()