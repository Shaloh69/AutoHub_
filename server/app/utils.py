import os
import uuid
import hashlib
from typing import Optional, Tuple
from datetime import datetime, timedelta
from PIL import Image
import io
from config import get_settings
from sqlalchemy.orm import Session
from models import User, Car
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import math

settings = get_settings()


class FileHandler:
    """Handle file uploads and storage"""
    
    @staticmethod
    def generate_filename(original_filename: str, prefix: str = "") -> str:
        """Generate unique filename"""
        ext = os.path.splitext(original_filename)[1]
        unique_id = uuid.uuid4().hex
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"{prefix}{timestamp}_{unique_id}{ext}"
    
    @staticmethod
    def validate_image(file_content: bytes, max_size: int = None) -> Tuple[bool, str]:
        """
        Validate image file
        Returns: (is_valid, error_message)
        """
        if max_size is None:
            max_size = settings.MAX_UPLOAD_SIZE
        
        if len(file_content) > max_size:
            return False, f"File size exceeds {max_size / 1024 / 1024}MB limit"
        
        try:
            img = Image.open(io.BytesIO(file_content))
            img.verify()
            
            if img.format.lower() not in ['jpeg', 'jpg', 'png', 'webp']:
                return False, "Invalid image format. Only JPEG, PNG, and WebP allowed"
            
            return True, ""
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
    
    @staticmethod
    def resize_image(file_content: bytes, max_width: int, max_height: int) -> bytes:
        """Resize image maintaining aspect ratio"""
        img = Image.open(io.BytesIO(file_content))
        
        # Convert RGBA to RGB if necessary
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        
        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        return output.read()
    
    @staticmethod
    def save_image(file_content: bytes, filename: str, subdirectory: str = "cars") -> str:
        """
        Save image to local storage
        Returns: relative file path
        """
        upload_dir = os.path.join(settings.UPLOAD_DIR, subdirectory)
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        return f"/{subdirectory}/{filename}"
    
    @staticmethod
    def create_thumbnails(file_content: bytes, filename: str, subdirectory: str = "cars") -> dict:
        """
        Create multiple image sizes
        Returns: dict with paths to different sizes
        """
        sizes = {
            'thumbnail': (200, 150),
            'medium': (800, 600),
            'large': (1600, 1200)
        }
        
        paths = {}
        
        for size_name, (width, height) in sizes.items():
            resized = FileHandler.resize_image(file_content, width, height)
            size_filename = f"{size_name}_{filename}"
            path = FileHandler.save_image(resized, size_filename, subdirectory)
            paths[size_name] = path
        
        # Save original
        original_path = FileHandler.save_image(file_content, filename, subdirectory)
        paths['original'] = original_path
        
        return paths
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete file from storage"""
        try:
            full_path = os.path.join(settings.UPLOAD_DIR, file_path.lstrip('/'))
            if os.path.exists(full_path):
                os.remove(full_path)
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False


class EmailService:
    """Handle email sending"""
    
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send email via SMTP"""
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            print("SMTP credentials not configured")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg['To'] = to_email
            
            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    @staticmethod
    def send_verification_email(to_email: str, token: str) -> bool:
        """Send email verification"""
        verification_url = f"https://carmarketplace.ph/verify-email?token={token}"
        
        html = f"""
        <html>
            <body>
                <h2>Welcome to Car Marketplace Philippines!</h2>
                <p>Please verify your email address by clicking the link below:</p>
                <p><a href="{verification_url}">Verify Email Address</a></p>
                <p>Or copy this link: {verification_url}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </body>
        </html>
        """
        
        text = f"""
        Welcome to Car Marketplace Philippines!
        
        Please verify your email address by visiting:
        {verification_url}
        
        This link will expire in 24 hours.
        If you didn't create an account, please ignore this email.
        """
        
        return EmailService.send_email(to_email, "Verify Your Email", html, text)
    
    @staticmethod
    def send_password_reset_email(to_email: str, token: str) -> bool:
        """Send password reset email"""
        reset_url = f"https://carmarketplace.ph/reset-password?token={token}"
        
        html = f"""
        <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password. Click the link below to set a new password:</p>
                <p><a href="{reset_url}">Reset Password</a></p>
                <p>Or copy this link: {reset_url}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </body>
        </html>
        """
        
        text = f"""
        Password Reset Request
        
        You requested to reset your password. Visit this link to set a new password:
        {reset_url}
        
        This link will expire in 1 hour.
        If you didn't request this, please ignore this email.
        """
        
        return EmailService.send_email(to_email, "Password Reset Request", html, text)
    
    @staticmethod
    def send_inquiry_notification(seller_email: str, car_title: str, inquiry_id: int) -> bool:
        """Send inquiry notification to seller"""
        inquiry_url = f"https://carmarketplace.ph/inquiries/{inquiry_id}"
        
        html = f"""
        <html>
            <body>
                <h2>New Inquiry Received</h2>
                <p>You have received a new inquiry for your listing:</p>
                <p><strong>{car_title}</strong></p>
                <p><a href="{inquiry_url}">View Inquiry</a></p>
            </body>
        </html>
        """
        
        return EmailService.send_email(seller_email, "New Inquiry Received", html)


class ValidationHelper:
    """Common validation functions"""
    
    @staticmethod
    def validate_philippines_coordinates(latitude: float, longitude: float) -> bool:
        """Validate if coordinates are within Philippines bounds"""
        return (
            settings.PHILIPPINES_BOUNDS_SOUTH <= latitude <= settings.PHILIPPINES_BOUNDS_NORTH
            and settings.PHILIPPINES_BOUNDS_WEST <= longitude <= settings.PHILIPPINES_BOUNDS_EAST
        )
    
    @staticmethod
    def validate_vin(vin: str) -> bool:
        """Validate VIN format"""
        if not vin or len(vin) != 17:
            return False
        
        # VIN should be alphanumeric, no I, O, Q
        invalid_chars = set('IOQ')
        return all(c.isalnum() and c not in invalid_chars for c in vin.upper())
    
    @staticmethod
    def validate_plate_number(plate: str) -> bool:
        """Validate Philippine plate number format"""
        if not plate:
            return False
        
        # Basic validation - alphanumeric with optional dash
        plate = plate.replace('-', '').replace(' ', '')
        return 5 <= len(plate) <= 7 and plate.isalnum()
    
    @staticmethod
    def validate_phone_number(phone: str) -> bool:
        """Validate Philippine phone number"""
        if not phone:
            return False
        
        # Remove common separators
        phone = phone.replace('+', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
        
        # Philippine numbers: 639XXXXXXXXX or 09XXXXXXXXX or 9XXXXXXXXX
        if phone.startswith('63'):
            phone = phone[2:]
        elif phone.startswith('0'):
            phone = phone[1:]
        
        # Should be 10 digits starting with 9
        return len(phone) == 10 and phone.startswith('9') and phone.isdigit()


class GeolocationHelper:
    """Geolocation utilities"""
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula
        Returns distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (
            math.sin(delta_lat / 2) ** 2 +
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    @staticmethod
    def get_bounding_box(latitude: float, longitude: float, radius_km: float) -> dict:
        """
        Get bounding box for a radius search
        Returns: dict with min/max lat/lon
        """
        # Approximate degrees per kilometer
        lat_degree = 1 / 110.574
        lon_degree = 1 / (111.320 * math.cos(math.radians(latitude)))
        
        delta_lat = radius_km * lat_degree
        delta_lon = radius_km * lon_degree
        
        return {
            'min_lat': latitude - delta_lat,
            'max_lat': latitude + delta_lat,
            'min_lon': longitude - delta_lon,
            'max_lon': longitude + delta_lon
        }


class ScoreCalculator:
    """Calculate various scores for cars and users"""
    
    @staticmethod
    def calculate_completeness_score(car: Car) -> float:
        """Calculate how complete a car listing is (0-100)"""
        score = 0.0
        total_fields = 30
        
        # Required fields (already filled)
        score += 10
        
        # Optional but important fields
        if car.description and len(car.description) >= 100:
            score += 5
        if car.engine_size:
            score += 2
        if car.horsepower:
            score += 2
        if car.drivetrain:
            score += 2
        if car.exterior_color_id or car.custom_exterior_color:
            score += 3
        if car.interior_color_id or car.custom_interior_color:
            score += 2
        if car.vin:
            score += 5
        if car.engine_number:
            score += 3
        if car.chassis_number:
            score += 3
        if car.plate_number:
            score += 3
        if car.service_records_available:
            score += 5
        if car.warranty_remaining and car.warranty_details:
            score += 4
        if car.detailed_address:
            score += 3
        if car.images and len(car.images) >= 5:
            score += 10
        if car.images and len(car.images) >= 10:
            score += 5
        if any(img.is_360_view for img in car.images):
            score += 5
        
        # Cap at 100
        return min(score, 100.0)
    
    @staticmethod
    def calculate_quality_score(car: Car, db: Session) -> float:
        """Calculate quality score for ranking (0-10)"""
        score = 5.0  # Base score
        
        # Completeness bonus
        completeness = ScoreCalculator.calculate_completeness_score(car)
        score += (completeness / 100) * 2
        
        # Image quality
        if car.images:
            if len(car.images) >= 10:
                score += 1.0
            elif len(car.images) >= 5:
                score += 0.5
        
        # Seller reputation
        seller = db.query(User).filter(User.id == car.seller_id).first()
        if seller:
            if seller.average_rating >= 4.5:
                score += 1.0
            elif seller.average_rating >= 4.0:
                score += 0.5
            
            if seller.identity_verified:
                score += 0.5
            if seller.business_verified:
                score += 0.5
        
        # Recency boost
        days_old = (datetime.utcnow() - car.created_at).days
        if days_old <= 7:
            score += 0.5
        
        # Premium features
        if car.is_featured:
            score += 0.5
        if car.is_premium:
            score += 0.3
        
        return min(score, 10.0)
    
    @staticmethod
    def calculate_search_score(car: Car, query: str) -> float:
        """Calculate relevance score for search results"""
        score = 0.0
        
        query_lower = query.lower()
        
        # Title match
        if query_lower in car.title.lower():
            score += 5.0
        
        # Description match
        if car.description and query_lower in car.description.lower():
            score += 2.0
        
        # Brand/Model match handled by SQL
        
        # Add quality score
        score += car.quality_score
        
        return score


class PaginationHelper:
    """Helper for pagination"""
    
    @staticmethod
    def paginate(query, page: int, page_size: int):
        """
        Apply pagination to query
        Returns: (items, total_count, total_pages)
        """
        # Ensure valid values
        page = max(1, page)
        page_size = min(max(1, page_size), settings.MAX_PAGE_SIZE)
        
        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total, total_pages


class SlugGenerator:
    """Generate SEO-friendly slugs"""
    
    @staticmethod
    def generate_slug(text: str, max_length: int = 150) -> str:
        """Generate URL-friendly slug from text"""
        import re
        
        # Convert to lowercase
        slug = text.lower()
        
        # Remove special characters
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        
        # Replace spaces with hyphens
        slug = re.sub(r'\s+', '-', slug)
        
        # Remove multiple hyphens
        slug = re.sub(r'-+', '-', slug)
        
        # Trim
        slug = slug.strip('-')
        
        # Truncate if too long
        if len(slug) > max_length:
            slug = slug[:max_length].rsplit('-', 1)[0]
        
        return slug
    
    @staticmethod
    def generate_unique_slug(base_slug: str, model_class, db: Session, id_to_exclude: int = None) -> str:
        """Generate unique slug by appending numbers if needed"""
        slug = base_slug
        counter = 1
        
        while True:
            query = db.query(model_class).filter(model_class.seo_slug == slug)
            
            if id_to_exclude:
                query = query.filter(model_class.id != id_to_exclude)
            
            exists = query.first()
            
            if not exists:
                return slug
            
            slug = f"{base_slug}-{counter}"
            counter += 1


def format_price(price: float, currency: str = "PHP") -> str:
    """Format price for display"""
    if currency == "PHP":
        return f"₱{price:,.2f}"
    return f"{currency} {price:,.2f}"


def format_mileage(mileage: int) -> str:
    """Format mileage for display"""
    return f"{mileage:,} km"


def calculate_age(year: int) -> int:
    """Calculate vehicle age"""
    return datetime.now().year - year