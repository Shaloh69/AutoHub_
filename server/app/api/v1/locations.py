"""
Location API Endpoints - Philippine Regions, Provinces, Cities
Path: server/app/api/v1/locations.py
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.location import PhRegion, PhProvince, PhCity

router = APIRouter()


# Pydantic schemas for responses
from pydantic import BaseModel

class RegionResponse(BaseModel):
    id: int
    region_code: str
    name: str
    long_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class ProvinceResponse(BaseModel):
    id: int
    region_id: int
    province_code: str
    name: str
    capital: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class CityResponse(BaseModel):
    id: int
    province_id: int
    city_code: Optional[str] = None
    name: str
    city_type: str
    is_highly_urbanized: bool
    latitude: float
    longitude: float
    zip_code: Optional[str] = None
    population: int
    is_capital: bool
    is_active: bool

    class Config:
        from_attributes = True


# ==================== REGIONS ====================

@router.get("/regions", response_model=List[RegionResponse])
def get_regions(
    active_only: bool = Query(True, description="Only return active regions"),
    db: Session = Depends(get_db)
):
    """
    Get all Philippine regions
    """
    query = db.query(PhRegion)

    if active_only:
        query = query.filter(PhRegion.is_active == True)

    regions = query.order_by(PhRegion.name).all()
    return regions


@router.get("/regions/{region_id}", response_model=RegionResponse)
def get_region(
    region_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific region by ID
    """
    region = db.query(PhRegion).filter(PhRegion.id == region_id).first()

    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    return region


# ==================== PROVINCES ====================

@router.get("/provinces", response_model=List[ProvinceResponse])
def get_provinces(
    region_id: Optional[int] = Query(None, description="Filter by region ID"),
    active_only: bool = Query(True, description="Only return active provinces"),
    db: Session = Depends(get_db)
):
    """
    Get all Philippine provinces, optionally filtered by region
    """
    query = db.query(PhProvince)

    if region_id:
        query = query.filter(PhProvince.region_id == region_id)

    if active_only:
        query = query.filter(PhProvince.is_active == True)

    provinces = query.order_by(PhProvince.name).all()
    return provinces


@router.get("/provinces/{province_id}", response_model=ProvinceResponse)
def get_province(
    province_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific province by ID
    """
    province = db.query(PhProvince).filter(PhProvince.id == province_id).first()

    if not province:
        raise HTTPException(status_code=404, detail="Province not found")

    return province


# ==================== CITIES ====================

@router.get("/cities", response_model=List[CityResponse])
def get_cities(
    province_id: Optional[int] = Query(None, description="Filter by province ID"),
    region_id: Optional[int] = Query(None, description="Filter by region ID"),
    active_only: bool = Query(True, description="Only return active cities"),
    search: Optional[str] = Query(None, description="Search by city name"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Get all Philippine cities/municipalities, with optional filters
    """
    query = db.query(PhCity)

    if province_id:
        query = query.filter(PhCity.province_id == province_id)

    if region_id:
        # Join with province to filter by region
        query = query.join(PhProvince).filter(PhProvince.region_id == region_id)

    if active_only:
        query = query.filter(PhCity.is_active == True)

    if search:
        query = query.filter(PhCity.name.ilike(f"%{search}%"))

    cities = query.order_by(PhCity.name).limit(limit).all()
    return cities


@router.get("/cities/{city_id}", response_model=CityResponse)
def get_city(
    city_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific city by ID
    """
    city = db.query(PhCity).filter(PhCity.id == city_id).first()

    if not city:
        raise HTTPException(status_code=404, detail="City not found")

    return city


# ==================== SEARCH & HELPERS ====================

@router.get("/search")
def search_locations(
    query: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Search across regions, provinces, and cities
    """
    results = {
        "regions": [],
        "provinces": [],
        "cities": []
    }

    # Search regions
    regions = db.query(PhRegion).filter(
        PhRegion.name.ilike(f"%{query}%"),
        PhRegion.is_active == True
    ).limit(limit).all()
    results["regions"] = [RegionResponse.model_validate(r) for r in regions]

    # Search provinces
    provinces = db.query(PhProvince).filter(
        PhProvince.name.ilike(f"%{query}%"),
        PhProvince.is_active == True
    ).limit(limit).all()
    results["provinces"] = [ProvinceResponse.model_validate(p) for p in provinces]

    # Search cities
    cities = db.query(PhCity).filter(
        PhCity.name.ilike(f"%{query}%"),
        PhCity.is_active == True
    ).limit(limit).all()
    results["cities"] = [CityResponse.model_validate(c) for c in cities]

    return results
