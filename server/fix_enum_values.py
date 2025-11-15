"""
Script to fix enum values in the database to match the updated schema.

This script updates any old lowercase enum values to the new UPPERCASE values
for CarStatus, ApprovalStatus, FuelType, TransmissionType, DrivetrainType, and ConditionRating.

Run with: python fix_enum_values.py
"""
from app.database import SessionLocal
from app.models.car import Car
from sqlalchemy import text

def fix_enum_values():
    """Update old enum values to match new schema"""
    db = SessionLocal()

    try:
        print("🔍 Checking for enum mismatches in cars table...")

        # Check and fix CarStatus
        print("\n📊 Checking CarStatus values...")
        status_mapping = {
            'draft': 'DRAFT',
            'pending': 'PENDING',
            'active': 'ACTIVE',
            'sold': 'SOLD',
            'reserved': 'RESERVED',
            'inactive': 'INACTIVE',
            'rejected': 'REJECTED',
            'expired': 'EXPIRED',
            'removed': 'INACTIVE'  # Map old 'removed' to 'INACTIVE'
        }

        for old_val, new_val in status_mapping.items():
            result = db.execute(
                text(f"UPDATE cars SET status = :new_val WHERE status = :old_val"),
                {"new_val": new_val, "old_val": old_val}
            )
            if result.rowcount > 0:
                print(f"  ✅ Updated {result.rowcount} cars: status '{old_val}' → '{new_val}'")

        # Check and fix ApprovalStatus
        print("\n📊 Checking ApprovalStatus values...")
        approval_mapping = {
            'pending': 'PENDING',
            'approved': 'APPROVED',
            'rejected': 'REJECTED'
        }

        for old_val, new_val in approval_mapping.items():
            result = db.execute(
                text(f"UPDATE cars SET approval_status = :new_val WHERE approval_status = :old_val"),
                {"new_val": new_val, "old_val": old_val}
            )
            if result.rowcount > 0:
                print(f"  ✅ Updated {result.rowcount} cars: approval_status '{old_val}' → '{new_val}'")

        # Check and fix FuelType
        print("\n📊 Checking FuelType values...")
        fuel_mapping = {
            'gasoline': 'GASOLINE',
            'diesel': 'DIESEL',
            'electric': 'ELECTRIC',
            'hybrid': 'HYBRID'
        }

        for old_val, new_val in fuel_mapping.items():
            result = db.execute(
                text(f"UPDATE cars SET fuel_type = :new_val WHERE fuel_type = :old_val"),
                {"new_val": new_val, "old_val": old_val}
            )
            if result.rowcount > 0:
                print(f"  ✅ Updated {result.rowcount} cars: fuel_type '{old_val}' → '{new_val}'")

        # Check and fix TransmissionType
        print("\n📊 Checking TransmissionType values...")
        transmission_mapping = {
            'manual': 'MANUAL',
            'automatic': 'AUTOMATIC',
            'cvt': 'CVT',
            'dct': 'DCT',
            'amt': 'AUTOMATIC'  # Map old 'amt' to 'AUTOMATIC'
        }

        for old_val, new_val in transmission_mapping.items():
            result = db.execute(
                text(f"UPDATE cars SET transmission = :new_val WHERE transmission = :old_val"),
                {"new_val": new_val, "old_val": old_val}
            )
            if result.rowcount > 0:
                print(f"  ✅ Updated {result.rowcount} cars: transmission '{old_val}' → '{new_val}'")

        # Check and fix DrivetrainType
        print("\n📊 Checking DrivetrainType values...")
        drivetrain_mapping = {
            'fwd': 'FWD',
            'rwd': 'RWD',
            'awd': 'AWD',
            '4wd': '4WD'
        }

        for old_val, new_val in drivetrain_mapping.items():
            result = db.execute(
                text(f"UPDATE cars SET drivetrain = :new_val WHERE drivetrain = :old_val"),
                {"new_val": new_val, "old_val": old_val}
            )
            if result.rowcount > 0:
                print(f"  ✅ Updated {result.rowcount} cars: drivetrain '{old_val}' → '{new_val}'")

        # Check and fix ConditionRating
        print("\n📊 Checking ConditionRating values...")
        condition_mapping = {
            'brand_new': 'BRAND_NEW',
            'like_new': 'LIKE_NEW',
            'excellent': 'EXCELLENT',
            'very_good': 'GOOD',  # Map old 'very_good' to 'GOOD'
            'good': 'GOOD',
            'fair': 'FAIR',
            'poor': 'POOR'
        }

        for old_val, new_val in condition_mapping.items():
            result = db.execute(
                text(f"UPDATE cars SET car_condition = :new_val WHERE car_condition = :old_val"),
                {"new_val": new_val, "old_val": old_val}
            )
            if result.rowcount > 0:
                print(f"  ✅ Updated {result.rowcount} cars: car_condition '{old_val}' → '{new_val}'")

            # Also update condition_rating if it exists
            result = db.execute(
                text(f"UPDATE cars SET condition_rating = :new_val WHERE condition_rating = :old_val"),
                {"new_val": new_val, "old_val": old_val}
            )
            if result.rowcount > 0:
                print(f"  ✅ Updated {result.rowcount} cars: condition_rating '{old_val}' → '{new_val}'")

        db.commit()
        print("\n✅ Enum values updated successfully!")

        # Show summary of current values
        print("\n📈 Current value distribution:")
        print("\nStatus:")
        result = db.execute(text("SELECT status, COUNT(*) as count FROM cars GROUP BY status"))
        for row in result:
            print(f"  {row[0]}: {row[1]}")

        print("\nApproval Status:")
        result = db.execute(text("SELECT approval_status, COUNT(*) as count FROM cars GROUP BY approval_status"))
        for row in result:
            print(f"  {row[0]}: {row[1]}")

        print("\nFuel Type:")
        result = db.execute(text("SELECT fuel_type, COUNT(*) as count FROM cars GROUP BY fuel_type"))
        for row in result:
            print(f"  {row[0]}: {row[1]}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  Database Enum Value Fixer")
    print("=" * 60)
    fix_enum_values()
    print("\n" + "=" * 60)
    print("  Done!")
    print("=" * 60)
