#!/usr/bin/env python3
"""
Fix QR code URLs in database to use relative paths only
This ensures URLs work correctly regardless of the backend server address
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.subscription import PaymentSetting
from sqlalchemy import text

def fix_qr_urls():
    """Fix QR code URLs to use relative paths only"""
    db = SessionLocal()
    try:
        # Get the current QR code setting
        qr_setting = db.query(PaymentSetting).filter(
            PaymentSetting.setting_key == 'payment_qr_code_image'
        ).first()

        if not qr_setting:
            print("❌ No QR code setting found in database")
            return False

        current_value = qr_setting.setting_value
        print(f"📝 Current value: {current_value}")

        # Check if it contains absolute URL
        if 'http://' in current_value or 'https://' in current_value:
            # Extract just the path portion
            if '/uploads/qr/' in current_value:
                # Find the /uploads/qr/ part and take everything from there
                path_start = current_value.find('/uploads/qr/')
                new_value = current_value[path_start:]

                print(f"🔧 Fixing URL...")
                print(f"   Old: {current_value}")
                print(f"   New: {new_value}")

                qr_setting.setting_value = new_value
                db.commit()
                print("✅ URL fixed successfully!")
                return True
            else:
                print("⚠️  URL contains http:// but doesn't contain /uploads/qr/")
                return False
        else:
            print("✅ URL is already using relative path - no fix needed")
            return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("QR Code URL Fix Script")
    print("=" * 60)
    print()

    success = fix_qr_urls()

    print()
    print("=" * 60)
    if success:
        print("✅ Database update completed successfully!")
        print("⚠️  IMPORTANT: Restart the backend server for changes to take effect")
    else:
        print("❌ Database update failed!")
    print("=" * 60)

    sys.exit(0 if success else 1)
