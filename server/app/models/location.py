"""
===========================================
FILE: app/models/location.py
Path: car_marketplace_ph/app/models/location.py
COMPLETE FIXED VERSION - PhCity table fixed
===========================================
"""
from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, ForeignKey, TIMESTAMP
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
    # FIXED: Use TIMESTAMP type matching database
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
    city_code = Column(String(10), index=True)
    name = Column(String(100), nullable=False, index=True)
    # FIXED: Use proper ENUM matching database
    city_type = Column(String(20), default="city")  # Using String to match ENUM('city', 'municipality', 'district')
    # CRITICAL FIX: Added missing column is_highly_urbanized
    is_highly_urbanized = Column(Boolean, default=False)
    latitude = Column(DECIMAL(10, 8), nullable=False, default=14.5995)
    longitude = Column(DECIMAL(11, 8), nullable=False, default=120.9842)
    zip_code = Column(String(10))
    # Added via ALTER statements in database:
    population = Column(Integer)
    is_capital = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    province = relationship("PhProvince", back_populates="cities")
    
    def __repr__(self):
        return f"<PhCity {self.name}, {self.province.name}>"


class StandardColor(Base):
    __tablename__ = "standard_colors"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    hex_code = Column(String(7))
    # Using String to handle ENUM values
    category = Column(String(20), index=True)  # primary, neutral, metallic, special
    is_popular = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<StandardColor {self.name}>"