"""
Test script to fetch and validate car data from database
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
from app.models.car import Car
from app.utils.enum_normalizer import normalize_enum_value

def test_car_fetch(car_id: int = 9):
    """Fetch a car and show all its data"""
    db = SessionLocal()

    try:
        car = db.query(Car).filter(Car.id == car_id).first()

        if not car:
            print(f"❌ Car ID {car_id} not found in database")
            return

        print(f"\n{'='*60}")
        print(f"🚗 Car ID {car_id} Data Dump")
        print(f"{'='*60}")

        print(f"\nBasic Info:")
        print(f"  ID: {car.id}")
        print(f"  Title: {car.title}")
        print(f"  Year: {car.year}")
        print(f"  Price: {car.price}")
        print(f"  Mileage: {car.mileage}")

        print(f"\nForeign Keys:")
        print(f"  seller_id: {car.seller_id}")
        print(f"  brand_id: {car.brand_id}")
        print(f"  model_id: {car.model_id}")
        print(f"  city_id: {car.city_id}")
        print(f"  province_id: {car.province_id}")
        print(f"  region_id: {car.region_id}")

        print(f"\nString Fields (for brand/model names):")
        print(f"  make: {repr(getattr(car, 'make', 'MISSING'))}")
        print(f"  model: {repr(getattr(car, 'model', 'MISSING'))}")

        print(f"\nEnum Fields (RAW from DB):")
        print(f"  status: {repr(car.status)} (type: {type(car.status).__name__})")
        print(f"  approval_status: {repr(car.approval_status)} (type: {type(car.approval_status).__name__})")
        print(f"  fuel_type: {repr(car.fuel_type)} (type: {type(car.fuel_type).__name__})")
        print(f"  transmission: {repr(car.transmission)} (type: {type(car.transmission).__name__})")
        print(f"  condition_rating: {repr(getattr(car, 'condition_rating', 'MISSING'))}")
        print(f"  body_type: {repr(getattr(car, 'body_type', 'MISSING'))}")
        print(f"  engine_type: {repr(getattr(car, 'engine_type', 'MISSING'))}")
        print(f"  visibility: {repr(getattr(car, 'visibility', 'MISSING'))}")
        print(f"  mileage_unit: {repr(getattr(car, 'mileage_unit', 'MISSING'))}")
        print(f"  drivetrain: {repr(getattr(car, 'drivetrain', 'MISSING'))}")

        print(f"\nAfter Normalization:")
        normalized_status = normalize_enum_value('status', car.status)
        normalized_fuel = normalize_enum_value('fuel_type', car.fuel_type)
        normalized_transmission = normalize_enum_value('transmission', car.transmission)
        normalized_condition = normalize_enum_value('condition_rating', getattr(car, 'condition_rating', None))
        normalized_body = normalize_enum_value('body_type', getattr(car, 'body_type', None))

        print(f"  status: {repr(normalized_status)}")
        print(f"  fuel_type: {repr(normalized_fuel)}")
        print(f"  transmission: {repr(normalized_transmission)}")
        print(f"  condition_rating: {repr(normalized_condition)}")
        print(f"  body_type: {repr(normalized_body)}")

        print(f"\nRelationships Loaded:")
        print(f"  brand_rel: {car.brand_rel}")
        print(f"  model_rel: {car.model_rel}")
        print(f"  seller: {car.seller}")
        print(f"  city: {car.city}")

        print(f"\n{'='*60}")
        print(f"✅ Car data fetched successfully")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"\n❌ Error fetching car: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    car_id = int(sys.argv[1]) if len(sys.argv) > 1 else 9
    test_car_fetch(car_id)
