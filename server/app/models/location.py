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
    __tablename__ = "ph_cities"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("ph_provinces.id"), nullable=False, index=True)
    city_code = Column(String(10), index=True)
    name = Column(String(100), nullable=False, index=True)
    city_type = Column(String(20), default="municipality")  # city, municipality, component_city
    zip_code = Column(String(10))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
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
    category = Column(String(20))  # primary, neutral, metallic, special
    is_popular = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<StandardColor {self.name}>"