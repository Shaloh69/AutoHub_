from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Tuple, cast, Any
from datetime import datetime, timedelta
from decimal import Decimal
from app.models.car import Car, CarImage, CarFeature, Brand, Model, Feature
from app.models.user import User
from app.models.location import PhCity
from app.models.transaction import PriceHistory
from app.models.analytics import CarView
from app.models.subscription import UserSubscription, SubscriptionPlan
from app.database import cache
from app.utils.helpers import generate_slug, calculate_distance
import json


class CarService:
    """Car listing service - FIXED VERSION"""
    
    @staticmethod
    def create_car(db: Session, user_id: int, car_data: dict) -> Car:
        """Create car listing"""
        # Verify user can create listing
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # FIX: Use getattr to safely check can_list_cars
        can_list = getattr(user, 'can_list_cars', False)
        if not can_list:
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
        
        # FIX: Use getattr for province_id and region_id
        car_data["province_id"] = int(getattr(city, 'province_id', 0))
        car_data["region_id"] = int(getattr(getattr(city, 'province', None), 'region_id', 0))
        
        # Generate SEO slug
        car_data["seo_slug"] = generate_slug(car_data["title"])
        
        # Set status
        car_data["status"] = "pending"
        car_data["approval_status"] = "pending"
        
        # Create car
        car = Car(
            seller_id=user_id,
            **car_data,
            created_at=datetime.utcnow()
        )
        
        db.add(car)
        db.flush()
        
        # FIX: Cast car.id to int
        car_id_value = int(getattr(car, 'id', 0))
        
        # Add features
        if feature_ids:
            for feature_id in feature_ids:
                car_feature = CarFeature(car_id=car_id_value, feature_id=feature_id)
                db.add(car_feature)
        
        # Calculate scores
        completeness = CarService.calculate_completeness(car)
        quality = CarService.calculate_quality_score(car)
        
        setattr(car, 'completeness_score', completeness)
        setattr(car, 'quality_score', quality)
        
        # Update user stats - FIX: Use getattr for all user attributes
        user_listings = int(getattr(user, 'total_listings', 0))
        user_active = int(getattr(user, 'active_listings', 0))
        
        setattr(user, 'total_listings', user_listings + 1)
        setattr(user, 'active_listings', user_active + 1)
        
        db.commit()
        db.refresh(car)
        
        # Clear cache
        cache.delete(f"user_cars:{user_id}")
        
        return car
    
    @staticmethod
    def update_car(db: Session, car_id: int, user_id: int, car_data: dict) -> Car:
        """Update car listing"""
        car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
        if not car:
            raise ValueError("Car not found or unauthorized")
        
        # Track price changes
        if "price" in car_data:
            new_price = Decimal(str(car_data["price"]))
            # FIX: Use getattr for price
            old_price_value = getattr(car, 'price', None)
            old_price = Decimal(str(old_price_value)) if old_price_value else Decimal('0')
            
            if new_price != old_price:
                price_change = ((new_price - old_price) / old_price) * 100 if old_price > 0 else Decimal('0')
                
                price_history = PriceHistory(
                    car_id=car_id,
                    old_price=old_price,
                    new_price=new_price,
                    price_change_percent=price_change,
                    change_reason="manual",
                    changed_by=user_id
                )
                db.add(price_history)
        
        # Update fields
        for key, value in car_data.items():
            if hasattr(car, key) and key != "id":
                setattr(car, key, value)
        
        setattr(car, 'updated_at', datetime.utcnow())
        
        # Recalculate scores
        completeness = CarService.calculate_completeness(car)
        quality = CarService.calculate_quality_score(car)
        
        setattr(car, 'completeness_score', completeness)
        setattr(car, 'quality_score', quality)
        
        db.commit()
        db.refresh(car)
        
        # Clear cache
        cache.delete(f"car:{car_id}")
        
        return car
    
    @staticmethod
    def delete_car(db: Session, car_id: int, user_id: int) -> bool:
        """Delete car listing"""
        car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
        if not car:
            raise ValueError("Car not found or unauthorized")
        
        # Soft delete
        setattr(car, 'deleted_at', datetime.utcnow())
        setattr(car, 'is_active', False)
        setattr(car, 'status', 'removed')
        
        # Update user stats - FIX: Use getattr
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            current_active = int(getattr(user, 'active_listings', 0))
            setattr(user, 'active_listings', max(0, current_active - 1))
        
        db.commit()
        
        # Clear cache
        cache.delete(f"car:{car_id}")
        cache.delete(f"user_cars:{user_id}")
        
        return True
    
    @staticmethod
    def get_car(db: Session, car_id: int, user_id: Optional[int] = None) -> Optional[Car]:
        """Get single car with details"""
        # Try cache first
        cached = cache.get_json(f"car:{car_id}")
        if cached:
            car = db.query(Car).filter(Car.id == car_id).first()
        else:
            car = db.query(Car).options(
                joinedload(Car.images),
                joinedload(Car.features),
                joinedload(Car.seller),
                joinedload(Car.brand),
                joinedload(Car.model),
                joinedload(Car.city)
            ).filter(Car.id == car_id).first()
            
            if car:
                # FIX: Use getattr for car.id
                car_id_value = int(getattr(car, 'id', 0))
                # Cache for 5 minutes
                cache.set_json(f"car:{car_id}", {"id": car_id_value}, ttl=300)
        
        if not car:
            return None
        
        # Record view
        CarService.record_view(db, car_id, user_id)
        
        return car
    
    @staticmethod
    def search_cars(
        db: Session,
        filters: dict,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Car], int]:
        """Search cars with filters"""
        query = db.query(Car).filter(
            Car.is_active == True,  # noqa: E712
            Car.approval_status == "approved",
            Car.status == "active",
            Car.deleted_at.is_(None)
        )
        
        # Apply filters
        if filters.get("q"):
            search_term = f"%{filters['q']}%"
            query = query.filter(
                or_(
                    Car.title.like(search_term),
                    Car.description.like(search_term)
                )
            )
        
        if filters.get("brand_id"):
            query = query.filter(Car.brand_id == filters["brand_id"])
        
        if filters.get("model_id"):
            query = query.filter(Car.model_id == filters["model_id"])
        
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
        
        if filters.get("city_id"):
            query = query.filter(Car.city_id == filters["city_id"])
        
        if filters.get("province_id"):
            query = query.filter(Car.province_id == filters["province_id"])
        
        if filters.get("region_id"):
            query = query.filter(Car.region_id == filters["region_id"])
        
        if filters.get("is_featured"):
            query = query.filter(Car.is_featured == True)  # noqa: E712
        
        # Location-based search
        if filters.get("latitude") and filters.get("longitude"):
            radius_km = filters.get("radius_km", 25)
            # Simple bounding box search
            lat_range = radius_km / 110.574
            lng_range = radius_km / (111.320 * abs(filters["latitude"]))
            
            query = query.filter(
                Car.latitude.between(
                    filters["latitude"] - lat_range,
                    filters["latitude"] + lat_range
                ),
                Car.longitude.between(
                    filters["longitude"] - lng_range,
                    filters["longitude"] + lng_range
                )
            )
        
        # Sorting
        sort_by = filters.get("sort_by", "created_at")
        sort_order = filters.get("sort_order", "desc")
        
        if sort_by == "price":
            order_col = Car.price
        elif sort_by == "year":
            order_col = Car.year
        elif sort_by == "mileage":
            order_col = Car.mileage
        elif sort_by == "views_count":
            order_col = Car.views_count
        else:
            order_col = Car.created_at
        
        if sort_order == "asc":
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        cars = query.offset(offset).limit(page_size).all()
        
        return cars, total
    
    @staticmethod
    def boost_car(db: Session, car_id: int, user_id: int, duration_hours: int = 168) -> Car:
        """Boost car listing for increased visibility"""
        car = db.query(Car).filter(Car.id == car_id, Car.seller_id == user_id).first()
        if not car:
            raise ValueError("Car not found or unauthorized")
        
        # Set boost expiry
        setattr(car, 'boosted_until', datetime.utcnow() + timedelta(hours=duration_hours))
        
        # Boost ranking - FIX: Use getattr
        current_ranking = int(getattr(car, 'ranking_score', 0))
        setattr(car, 'ranking_score', current_ranking + 10)
        
        db.commit()
        db.refresh(car)
        
        return car
    
    @staticmethod
    def check_listing_limits(db: Session, user_id: int) -> bool:
        """Check if user can create more listings"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Get user's subscription
        subscription = db.query(UserSubscription).filter(
            UserSubscription.user_id == user_id,
            UserSubscription.status == "active"
        ).first()
        
        # FIX: Use getattr for active_listings
        current_active = int(getattr(user, 'active_listings', 0))
        
        if not subscription:
            # Free tier limit
            return current_active < 3
        
        # FIX: Use getattr for plan attributes
        plan = getattr(subscription, 'plan', None)
        if not plan:
            return current_active < 3
        
        max_listings = int(getattr(plan, 'max_active_listings', 3))
        return current_active < max_listings
    
    @staticmethod
    def calculate_completeness(car: Car) -> int:
        """Calculate completeness score (0-100)"""
        score = 0
        
        # Basic fields (5 points each)
        description = str(getattr(car, 'description', ''))
        if description and len(description) > 50:
            score += 5
        if getattr(car, 'vin_number', None):
            score += 5
        if getattr(car, 'engine_size', None):
            score += 5
        if getattr(car, 'horsepower', None):
            score += 5
        if getattr(car, 'detailed_address', None):
            score += 5
        
        # Images (20 points)
        if hasattr(car, 'images'):
            images = getattr(car, 'images', [])
            if images:
                image_count = len(images)
                score += min(20, image_count * 4)
        
        # Features (15 points)
        if hasattr(car, 'features'):
            features = getattr(car, 'features', [])
            if features:
                feature_count = len(features)
                score += min(15, feature_count * 3)
        
        # Documentation (10 points)
        reg_status = str(getattr(car, 'registration_status', ''))
        or_cr = str(getattr(car, 'or_cr_status', ''))
        
        if reg_status == "registered":
            score += 5
        if or_cr == "complete":
            score += 5
        
        # History (10 points)
        if not getattr(car, 'accident_history', True):
            score += 5
        if getattr(car, 'service_history_available', False):
            score += 5
        
        # Warranty (10 points)
        if getattr(car, 'warranty_remaining', False):
            score += 10
        
        return min(100, score)
    
    @staticmethod
    def calculate_quality_score(car: Car) -> int:
        """Calculate quality score based on condition"""
        score = 50  # Base score
        
        # Condition rating
        condition_scores = {
            "excellent": 25,
            "very_good": 20,
            "good": 15,
            "fair": 10,
            "poor": 5
        }
        condition = str(getattr(car, 'condition_rating', 'fair'))
        

        score += condition_scores.get(condition, 10)
        
        # Mileage (lower is better)
        mileage = int(getattr(car, 'mileage', 100000))
        if mileage < 20000:
            score += 15
        elif mileage < 50000:
            score += 10
        elif mileage < 100000:
            score += 5
        
        # History
        if not getattr(car, 'accident_history', True):
            score += 10
        
        num_owners = int(getattr(car, 'number_of_owners', 1))
        if num_owners == 1:
            score += 5
        
        return min(100, score)
    
    @staticmethod
    def record_view(db: Session, car_id: int, user_id: Optional[int] = None):
        """Record car view"""
        view = CarView(
            car_id=car_id,
            user_id=user_id,
            viewed_at=datetime.utcnow()
        )
        db.add(view)
        
        # Update view count - FIX: Use getattr
        car = db.query(Car).filter(Car.id == car_id).first()
        if car:
            current_views = int(getattr(car, 'views_count', 0))
            setattr(car, 'views_count', current_views + 1)
        
        db.commit()
    
    @staticmethod
    def get_brands(db: Session, popular_only: bool = False) -> List[Brand]:
        """Get all brands"""
        query = db.query(Brand)
        if popular_only:
            query = query.filter(Brand.is_popular == True)  # noqa: E712
        return query.order_by(Brand.display_order, Brand.name).all()
    
    @staticmethod
    def get_models(db: Session, brand_id: Optional[int] = None) -> List[Model]:
        """Get models, optionally filtered by brand"""
        query = db.query(Model)
        if brand_id:
            query = query.filter(Model.brand_id == brand_id)
        return query.order_by(Model.name).all()
    
    @staticmethod
    def get_features(db: Session, category: Optional[str] = None) -> List[Feature]:
        """Get features, optionally filtered by category"""
        query = db.query(Feature)
        if category:
            query = query.filter(Feature.category == category)
        return query.order_by(Feature.category, Feature.name).all()