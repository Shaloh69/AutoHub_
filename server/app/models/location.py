from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, JSON, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
from app.database import Base
import enum


class Currency(Base):
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(3), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    symbol = Column(String(10), nullable=False)
    exchange_rate_to_php = Column(DECIMAL(10, 4), default=1.0000)
    is_active = Column(Boolean, default=True, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Currency {self.code}: {self.name}>"


class PhRegion(Base):
    __tablename__ = "ph_regions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    region_code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    long_name = Column(String(200))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    provinces = relationship("PhProvince", back_populates="region")
    
    def __repr__(self):
        return f"<PhRegion {self.region_code}: {self.name}>"


class PhProvince(Base):
    __tablename__ = "ph_provinces"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    region_id = Column(Integer, ForeignKey("ph_regions.id"), nullable=False, index=True)
    province_code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    capital = Column(String(100))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    region = relationship("PhRegion", back_populates="provinces")
    cities = relationship("PhCity", back_populates="province")
    
    def __repr__(self):
        return f"<PhProvince {self.province_code}: {self.name}>"


class PhCity(Base):
    __tablename__ = "ph_cities"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=False, index=True)
    city_code = Column(String(10), unique=True)
    name = Column(String(100), nullable=False, index=True)
    city_type = Column(
        Enum("city", "municipality", "district", name="city_type_enum"),
        default="city",
        index=True
    )
    is_highly_urbanized = Column(Boolean, default=False)
    latitude = Column(DECIMAL(10, 8), nullable=False, default=0)
    longitude = Column(DECIMAL(11, 8), nullable=False, default=0)
    postal_codes = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Spatial column (requires MySQL spatial support or PostGIS)
    # Note: This uses POINT without SRID specification for broader MySQL compatibility
    # location_point = Column(Geometry("POINT"), nullable=True)
    
    # Relationships
    province = relationship("PhProvince", back_populates="cities")
    
    def __repr__(self):
        return f"<PhCity {self.name}, {self.province.name if self.province else 'N/A'}>"
    
    @property
    def coordinates(self):
        """Return coordinates as dict"""
        return {
            "latitude": float(self.latitude),
            "longitude": float(self.longitude)
        }
    
    def distance_to(self, lat: float, lng: float) -> float:
        """
        Calculate approximate distance in kilometers using Haversine formula
        """
        from math import radians, sin, cos, sqrt, atan2
        
        # Earth radius in kilometers
        R = 6371.0
        
        lat1 = radians(float(self.latitude))
        lon1 = radians(float(self.longitude))
        lat2 = radians(lat)
        lon2 = radians(lng)
        
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        
        a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        distance = R * c
        return distance


class ColorFamily(str, enum.Enum):
    BLACK = "black"
    WHITE = "white"
    SILVER = "silver"
    GRAY = "gray"
    RED = "red"
    BLUE = "blue"
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    BROWN = "brown"
    PURPLE = "purple"
    OTHER = "other"


class StandardColor(Base):
    __tablename__ = "standard_colors"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    hex_code = Column(String(7))
    color_family = Column(Enum(ColorFamily), nullable=False, index=True)
    is_common = Column(Boolean, default=True, index=True)
    
    def __repr__(self):
        return f"<StandardColor {self.name} ({self.hex_code})>"b