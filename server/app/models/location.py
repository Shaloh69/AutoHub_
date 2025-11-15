"""
Location Models - COMPLETE VERSION WITH StandardColor
Path: server/app/models/location.py
Fixed: Added missing StandardColor model
"""
from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, ForeignKey, TIMESTAMP, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional, Tuple, cast
from decimal import Decimal
from app.database import Base


class Currency(Base):
    """Currency model for multi-currency support"""
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(3), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    symbol = Column(String(10), nullable=False)
    exchange_rate_to_php = Column(DECIMAL(10, 4), default=1.0000)
    is_active = Column(Boolean, default=True, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<Currency {self.code}: {self.name}>"


class PhRegion(Base):
    """Philippine Regions model"""
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
    """Philippine Provinces model"""
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
    """Philippine Cities/Municipalities Model"""
    __tablename__ = "ph_cities"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=False, index=True)
    city_code = Column(String(10), index=True)
    name = Column(String(100), nullable=False, index=True)
    city_type = Column(SQLEnum('city', 'municipality', 'district', name='city_type_enum'), default='city')
    is_highly_urbanized = Column(Boolean, default=False)
    latitude = Column(DECIMAL(10, 8), nullable=False, default=14.5995)
    longitude = Column(DECIMAL(11, 8), nullable=False, default=120.9842)
    zip_code = Column(String(10))
    population = Column(Integer, default=0)
    is_capital = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    province = relationship("PhProvince", back_populates="cities")
    
    def __repr__(self):
        return f"<PhCity {self.name}, {self.province.name if self.province else 'Unknown'}>"
    
    @property
    def full_name(self) -> str:
        """Get full city name with province"""
        city_name = cast(str, self.name)
        
        if self.province:
            province_name = cast(str, self.province.name)
            return f"{city_name}, {province_name}"
        return city_name
    
    @property
    def coordinates(self) -> Optional[Tuple[float, float]]:
        """Get coordinates as tuple (latitude, longitude)"""
        latitude = cast(Optional[Decimal], self.latitude)
        longitude = cast(Optional[Decimal], self.longitude)
        
        if latitude is not None and longitude is not None:
            return (float(latitude), float(longitude))
        return None


class StandardColor(Base):
    """Standard color options for cars"""
    __tablename__ = "standard_colors"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    hex_code = Column(String(7))
    category = Column(
        SQLEnum('primary', 'neutral', 'metallic', 'special', name='color_category_enum'),
        default='primary'
    )
    is_popular = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<StandardColor {self.name}>"
    
    @property
    def color_info(self) -> dict:
        """Get color information as dictionary"""
        return {
            'id': self.id,
            'name': cast(str, self.name),
            'hex_code': cast(Optional[str], self.hex_code),
            'category': cast(str, self.category),
            'is_popular': cast(bool, self.is_popular)
        }