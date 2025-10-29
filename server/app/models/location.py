"""
===========================================
FILE: app/models/location.py - UPDATED PhCity Model
Path: car_marketplace_ph/app/models/location.py
FIXED - Added missing population and is_capital columns
===========================================
"""
from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Currency(Base):
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(3), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    symbol = Column(String(10), nullable=False)
    exchange_rate_to_php = Column(DECIMAL(10, 4), default=1.0000)
    is_active = Column(Boolean, default=True, index=True)
    updated_at = Column(Integer, default=int(datetime.utcnow().timestamp()))
    
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
    """Philippine Cities/Municipalities Model - FIXED VERSION"""
    __tablename__ = "ph_cities"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=False, index=True)
    city_code = Column(String(10), index=True)
    name = Column(String(100), nullable=False, index=True)
    city_type = Column(String(20), default="city")  # city, municipality, district
    is_highly_urbanized = Column(Boolean, default=False)
    latitude = Column(DECIMAL(10, 8), nullable=False, default=14.5995, index=True)
    longitude = Column(DECIMAL(11, 8), nullable=False, default=120.9842, index=True)
    population = Column(Integer, index=True)  # ← ADDED
    is_capital = Column(Boolean, default=False, index=True)  # ← ADDED
    zip_code = Column(String(10))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    province = relationship("PhProvince", back_populates="cities")
    
    def __repr__(self):
        return f"<PhCity {self.name}, {self.province.name if self.province else 'Unknown'}>"
    
    @property
    def full_name(self):
        """Get full city name with province"""
        if self.province:
            return f"{self.name}, {self.province.name}"
        return self.name
    
    @property
    def coordinates(self):
        """Get coordinates as tuple"""
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None


# ===========================================
# CHANGES MADE TO PhCity:
# ===========================================
# 
# ✅ ADDED COLUMNS (2):
# 1. population: INT with index
# 2. is_capital: BOOLEAN with index, default=False
#
# ✅ ADDED HELPER PROPERTIES:
# 1. full_name - returns "City, Province"
# 2. coordinates - returns (lat, lng) tuple
#
# ===========================================
# NOW PERFECTLY ALIGNED WITH DATABASE SCHEMA
# Expected: 13 columns ✓
# ===========================================