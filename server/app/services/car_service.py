from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Tuple, cast
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
    """Car listing service"""
    
    @staticmethod
    def create_car(db: Session, user_id: int, car_data: dict) -> Car:
        """Create car listing"""
        # Verify user can create listing
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.can_list_cars: # type: ignore
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
        car_data["province_id"] = int(city.province_id)  # type: ignore
        car_data["region_id"] = int(city.province.region_id)  # type: ignore
        
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
        
        # Add features
        if feature_ids:
            for feature_id in feature_ids:
                car_feature = CarFeature(car_id=int(car.id), feature_id=feature_id)  # type: ignore
                db.add(car_feature)
        
        # Calculate scores
        completeness = CarService.calculate_completeness(car)
        quality = CarService.calculate_quality_score(car)
        
        setattr(car, 'completeness_score', completeness)
        setattr(car, 'quality_score', quality)
        
        # Update user stats
        user_listings = int(user.total_listings) if user.total_listings else 0  # type: ignore
        user_active = int(user.active_listings) if user.active_listings else 0  # type: ignore
        
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
            old_price = Decimal(str(car.price))  # type: ignore
            
            if new_price != old_price:
                price_change = ((new_price - old_price) / old_price) * 100
                
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
        
        # Update user stats
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            current_active = int(user.active_listings) if user.active_listings else 0  # type: ignore
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
                # Cache for 5 minutes
                cache.set_json(f"car:{car_id}", {"id": int(car.id)}, ttl=300)  # type: ignore
        
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
            # This is a simple bounding box search
            # For production, use spatial queries
            lat_range = radius_km / 110.574  # Rough conversion
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
        
        # Check if user has boost credits
        # TODO: Implement credit checking
        
        # Set boost expiry
        setattr(car, 'boosted_until', datetime.utcnow() + timedelta(hours=duration_hours))
        
        # Boost ranking
        current_ranking = int(car.ranking_score) if car.ranking_score else 0  # type: ignore
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
        
        current_active = int(user.active_listings) if user.active_listings else 0  # type: ignore
        
        if not subscription:
            # Free tier limit
            return current_active < 3
        
        plan = subscription.plan
        max_listings = int(plan.max_active_listings) if plan.max_active_listings else 0  # type: ignore
        return current_active < max_listings
    
    @staticmethod
    def calculate_completeness(car: Car) -> int:
        """Calculate completeness score (0-100)"""
        score = 0
        
        # Basic fields (5 points each)
        description = str(car.description) if car.description else ""  # type: ignore
        if description and len(description) > 50:
            score += 5
        if car.vin_number: # type: ignore
            score += 5
        if car.engine_size: # type: ignore
            score += 5
        if car.horsepower: # type: ignore
            score += 5
        if car.detailed_address: # type: ignore
            score += 5
        
        # Images (20 points)
        if hasattr(car, 'images') and car.images:
            image_count = len(car.images)
            score += min(20, image_count * 4)
        
        # Features (15 points)
        if hasattr(car, 'features') and car.features:
            feature_count = len(car.features)
            score += min(15, feature_count * 3)
        
        # Documentation (10 points)
        reg_status = str(car.registration_status) if car.registration_status else ""  # type: ignore
        or_cr = str(car.or_cr_status) if car.or_cr_status else ""  # type: ignore
        
        if reg_status == "registered":
            score += 5
        if or_cr == "complete":
            score += 5
        
        # History (10 points)
        if not car.accident_history: # type: ignore
            score += 5
        if car.service_history_available: # type: ignore
            score += 5
        
        # Warranty (10 points)
        if car.warranty_remaining: # type: ignore
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
        condition = str(car.condition_rating) if car.condition_rating else "fair"  # type: ignore
        score += condition_scores.get(condition, 10)
        
        # Mileage (lower is better)
        mileage = int(car.mileage) if car.mileage else 100000  # type: ignore
        if mileage < 20000:
            score += 15
        elif mileage < 50000:
            score += 10
        elif mileage < 100000:
            score += 5
        
        # History
        if not car.accident_history: # type: ignore
            score += 10
        
        num_owners = int(car.number_of_owners) if car.number_of_owners else 1  # type: ignore
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
        
        # Update view count
        car = db.query(Car).filter(Car.id == car_id).first()
        if car:
            current_views = int(car.views_count) if car.views_count else 0  # type: ignore
            setattr(car, 'views_count', current_views + 1)
        
        db.commit()
    
    @staticmethod
    def get_brands(db: Session, popular_only: bool = False) -> List[Brand]:
        """Get all brands"""
        query = db.query(Brand)
        if popular_only:
            query = query.filter(Brand.is_popular_in_ph == True)  # noqa: E712
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