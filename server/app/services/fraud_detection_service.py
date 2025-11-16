"""
Fraud Detection Service - Automatic fraud detection and prevention
Path: server/app/services/fraud_detection_service.py
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from decimal import Decimal
import logging

from app.models.car import Car
from app.models.user import User
from app.models.security import FraudIndicator, AuditLog
from app.models.review import Review
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """Service for automatic fraud detection and prevention"""

    @staticmethod
    def check_duplicate_listing(db: Session, user_id: int, car_data: dict) -> Optional[int]:
        """
        Detect duplicate car listings

        Returns fraud_indicator_id if fraud detected, None otherwise
        """
        try:
            # Check for duplicate VIN
            if car_data.get('vin'):
                duplicate_vin = db.query(Car).filter(
                    and_(
                        Car.seller_id == user_id,
                        Car.vin == car_data['vin'],
                        Car.status.in_(['ACTIVE', 'PENDING'])
                    )
                ).first()

                if duplicate_vin:
                    fraud = FraudIndicator(
                        user_id=user_id,
                        car_id=getattr(duplicate_vin, 'id', None),
                        indicator_type='duplicate_vin',
                        severity='high',
                        description=f"Duplicate VIN detected: {car_data['vin']}. User attempting to list the same vehicle multiple times.",
                        detected_at=datetime.utcnow()
                    )
                    db.add(fraud)
                    db.commit()

                    # Notify admins
                    FraudDetectionService._notify_admins(
                        db,
                        f"Duplicate VIN Detected",
                        f"User ID {user_id} attempting to create duplicate listing with VIN {car_data['vin']}"
                    )

                    return int(getattr(fraud, 'id', 0))

            # Check for very similar listings (same brand, model, year, price)
            if all(k in car_data for k in ['brand_id', 'model_id', 'year', 'price']):
                price_range = float(car_data['price']) * 0.02  # 2% tolerance

                similar = db.query(Car).filter(
                    and_(
                        Car.seller_id == user_id,
                        Car.brand_id == car_data['brand_id'],
                        Car.model_id == car_data['model_id'],
                        Car.year == car_data['year'],
                        Car.price.between(
                            float(car_data['price']) - price_range,
                            float(car_data['price']) + price_range
                        ),
                        Car.status.in_(['ACTIVE', 'PENDING'])
                    )
                ).first()

                if similar:
                    fraud = FraudIndicator(
                        user_id=user_id,
                        car_id=getattr(similar, 'id', None),
                        indicator_type='duplicate_listing',
                        severity='medium',
                        description=f"Very similar listing detected. Same brand, model, year, and price range.",
                        detected_at=datetime.utcnow()
                    )
                    db.add(fraud)
                    db.commit()

                    return int(getattr(fraud, 'id', 0))

            return None

        except Exception as e:
            logger.error(f"Error checking duplicate listing: {e}")
            return None

    @staticmethod
    def check_price_fraud(db: Session, user_id: int, car_data: dict, car_id: Optional[int] = None) -> Optional[int]:
        """
        Detect unrealistic pricing (too low or too high)

        Returns fraud_indicator_id if fraud detected, None otherwise
        """
        try:
            if not all(k in car_data for k in ['brand_id', 'model_id', 'year', 'price']):
                return None

            # Get market average for similar cars
            market_avg = db.query(func.avg(Car.price)).filter(
                and_(
                    Car.brand_id == car_data['brand_id'],
                    Car.model_id == car_data['model_id'],
                    Car.year.between(car_data['year'] - 2, car_data['year'] + 2),
                    Car.status == 'ACTIVE',
                    Car.price > 0
                )
            ).scalar()

            if not market_avg or market_avg == 0:
                # Not enough data to determine fraud
                return None

            market_avg = float(market_avg)
            listing_price = float(car_data['price'])

            # Check if price is suspiciously low (< 50% of market)
            if listing_price < market_avg * 0.5:
                fraud = FraudIndicator(
                    user_id=user_id,
                    car_id=car_id,
                    indicator_type='unrealistic_price_low',
                    severity='high',
                    description=f"Price ₱{listing_price:,.0f} is {((1 - listing_price/market_avg) * 100):.0f}% below market average of ₱{market_avg:,.0f}. Possible scam.",
                    detected_at=datetime.utcnow()
                )
                db.add(fraud)
                db.commit()

                # Notify admins
                FraudDetectionService._notify_admins(
                    db,
                    "Unrealistic Low Price Detected",
                    f"User ID {user_id} listing car at ₱{listing_price:,.0f}, {((1 - listing_price/market_avg) * 100):.0f}% below market"
                )

                return int(getattr(fraud, 'id', 0))

            # Check if price is suspiciously high (> 300% of market)
            if listing_price > market_avg * 3.0:
                fraud = FraudIndicator(
                    user_id=user_id,
                    car_id=car_id,
                    indicator_type='unrealistic_price_high',
                    severity='medium',
                    description=f"Price ₱{listing_price:,.0f} is {((listing_price/market_avg - 1) * 100):.0f}% above market average of ₱{market_avg:,.0f}. Possible price manipulation.",
                    detected_at=datetime.utcnow()
                )
                db.add(fraud)
                db.commit()

                return int(getattr(fraud, 'id', 0))

            return None

        except Exception as e:
            logger.error(f"Error checking price fraud: {e}")
            return None

    @staticmethod
    def check_spam_behavior(db: Session, user_id: int) -> Optional[int]:
        """
        Detect spam account behavior (too many listings in short time)

        Returns fraud_indicator_id if fraud detected, None otherwise
        """
        try:
            # Check listings in last 24 hours
            day_ago = datetime.utcnow() - timedelta(days=1)
            listings_24h = db.query(func.count(Car.id)).filter(
                and_(
                    Car.seller_id == user_id,
                    Car.created_at >= day_ago
                )
            ).scalar() or 0

            # Flag if more than 10 listings in 24 hours
            if listings_24h > 10:
                fraud = FraudIndicator(
                    user_id=user_id,
                    car_id=None,
                    indicator_type='rapid_listing',
                    severity='high',
                    description=f"User created {listings_24h} listings in the last 24 hours. Possible spam account.",
                    detected_at=datetime.utcnow()
                )
                db.add(fraud)
                db.commit()

                # Notify admins
                FraudDetectionService._notify_admins(
                    db,
                    "Spam Account Detected",
                    f"User ID {user_id} created {listings_24h} listings in 24 hours"
                )

                return int(getattr(fraud, 'id', 0))

            # Check listings in last 7 days
            week_ago = datetime.utcnow() - timedelta(days=7)
            listings_7d = db.query(func.count(Car.id)).filter(
                and_(
                    Car.seller_id == user_id,
                    Car.created_at >= week_ago
                )
            ).scalar() or 0

            # Flag if more than 50 listings in 7 days
            if listings_7d > 50:
                fraud = FraudIndicator(
                    user_id=user_id,
                    car_id=None,
                    indicator_type='excessive_listing',
                    severity='medium',
                    description=f"User created {listings_7d} listings in the last 7 days. Possible spam behavior.",
                    detected_at=datetime.utcnow()
                )
                db.add(fraud)
                db.commit()

                return int(getattr(fraud, 'id', 0))

            return None

        except Exception as e:
            logger.error(f"Error checking spam behavior: {e}")
            return None

    @staticmethod
    def check_review_fraud(db: Session, review_data: dict, buyer_id: int) -> Optional[int]:
        """
        Detect fake/spam reviews

        Returns fraud_indicator_id if fraud detected, None otherwise
        """
        try:
            seller_id = review_data.get('seller_id')
            if not seller_id:
                return None

            # Check if buyer has reviewed this seller multiple times
            existing_reviews = db.query(func.count(Review.id)).filter(
                and_(
                    Review.buyer_id == buyer_id,
                    Review.seller_id == seller_id
                )
            ).scalar() or 0

            if existing_reviews >= 3:
                fraud = FraudIndicator(
                    user_id=buyer_id,
                    car_id=None,
                    indicator_type='multiple_reviews',
                    severity='medium',
                    description=f"Buyer has left {existing_reviews + 1} reviews for the same seller. Possible fake review pattern.",
                    detected_at=datetime.utcnow()
                )
                db.add(fraud)
                db.commit()

                return int(getattr(fraud, 'id', 0))

            # Check for review spam (too many reviews in short time)
            day_ago = datetime.utcnow() - timedelta(days=1)
            reviews_24h = db.query(func.count(Review.id)).filter(
                and_(
                    Review.buyer_id == buyer_id,
                    Review.created_at >= day_ago
                )
            ).scalar() or 0

            if reviews_24h > 5:
                fraud = FraudIndicator(
                    user_id=buyer_id,
                    car_id=None,
                    indicator_type='review_spam',
                    severity='medium',
                    description=f"User created {reviews_24h} reviews in 24 hours. Possible review spam.",
                    detected_at=datetime.utcnow()
                )
                db.add(fraud)
                db.commit()

                return int(getattr(fraud, 'id', 0))

            return None

        except Exception as e:
            logger.error(f"Error checking review fraud: {e}")
            return None

    @staticmethod
    def calculate_user_reputation(db: Session, user_id: int) -> Dict:
        """
        Calculate user reputation score

        Returns dict with reputation metrics
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {
                    'score': 0,
                    'level': 'new',
                    'trust_score': 0,
                }

            # Base score
            score = 50.0

            # Email verified: +10
            if getattr(user, 'email_verified', False):
                score += 10

            # Identity verified: +15
            if getattr(user, 'identity_verified', False):
                score += 15

            # Business verified: +10
            if getattr(user, 'business_verified', False):
                score += 10

            # Average rating: 0-20 points
            avg_rating = getattr(user, 'average_rating', None)
            if avg_rating:
                score += (float(avg_rating) / 5.0) * 20

            # Total reviews: 0-15 points
            total_reviews = getattr(user, 'total_reviews', 0)
            if total_reviews:
                score += min(total_reviews / 2, 15)  # Max 15 points (30+ reviews)

            # Active listings: 0-10 points
            active_listings = getattr(user, 'active_listings', 0)
            if active_listings:
                score += min(active_listings / 2, 10)  # Max 10 points (20+ listings)

            # Response rate: 0-10 points
            response_rate = getattr(user, 'response_rate', None)
            if response_rate:
                score += float(response_rate) * 10

            # Account age: 0-10 points
            created_at = getattr(user, 'created_at', None)
            if created_at:
                account_age_days = (datetime.utcnow() - created_at).days
                score += min(account_age_days / 36.5, 10)  # Max 10 points (1+ year)

            # Penalize fraud indicators
            fraud_count = db.query(func.count(FraudIndicator.id)).filter(
                FraudIndicator.user_id == user_id
            ).scalar() or 0

            if fraud_count > 0:
                score -= (fraud_count * 5)  # -5 per fraud indicator

            # Cap score between 0 and 100
            score = max(0, min(100, score))

            # Determine reputation level
            if score >= 90:
                level = 'excellent'
            elif score >= 75:
                level = 'good'
            elif score >= 50:
                level = 'average'
            elif score >= 25:
                level = 'poor'
            else:
                level = 'very_poor'

            # Calculate trust score (0-5)
            trust_score = (score / 100) * 5

            return {
                'score': round(score, 1),
                'level': level,
                'trust_score': round(trust_score, 1),
                'metrics': {
                    'email_verified': getattr(user, 'email_verified', False),
                    'identity_verified': getattr(user, 'identity_verified', False),
                    'business_verified': getattr(user, 'business_verified', False),
                    'average_rating': float(avg_rating) if avg_rating else None,
                    'total_reviews': total_reviews,
                    'active_listings': active_listings,
                    'response_rate': float(response_rate) if response_rate else None,
                    'fraud_indicators': fraud_count,
                }
            }

        except Exception as e:
            logger.error(f"Error calculating user reputation: {e}")
            return {
                'score': 0,
                'level': 'new',
                'trust_score': 0,
            }

    @staticmethod
    def _notify_admins(db: Session, title: str, message: str):
        """Send notification to all admins"""
        try:
            from app.models.user import UserRole
            admins = db.query(User).filter(User.role == UserRole.ADMIN.value).all()

            for admin in admins:
                admin_id = int(getattr(admin, 'id', 0))
                NotificationService.create_notification(
                    db,
                    user_id=admin_id,
                    title=title,
                    message=message,
                    notification_type="fraud_alert"
                )
        except Exception as e:
            logger.error(f"Error notifying admins: {e}")

    @staticmethod
    def run_all_checks(db: Session, user_id: int, car_data: dict, car_id: Optional[int] = None) -> List[int]:
        """
        Run all fraud detection checks

        Returns list of fraud_indicator_ids detected
        """
        fraud_indicators = []

        # Check duplicate listing
        fraud_id = FraudDetectionService.check_duplicate_listing(db, user_id, car_data)
        if fraud_id:
            fraud_indicators.append(fraud_id)

        # Check price fraud
        fraud_id = FraudDetectionService.check_price_fraud(db, user_id, car_data, car_id)
        if fraud_id:
            fraud_indicators.append(fraud_id)

        # Check spam behavior
        fraud_id = FraudDetectionService.check_spam_behavior(db, user_id)
        if fraud_id:
            fraud_indicators.append(fraud_id)

        return fraud_indicators
