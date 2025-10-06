from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal


class ResponseBase(BaseModel):
    """Base response model"""
    success: bool = True
    message: Optional[str] = None
    

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class PaginatedResponse(ResponseBase):
    """Paginated response model"""
    data: List[Any] = []
    total: int = 0
    page: int = 1
    limit: int = 20
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class LocationBase(BaseModel):
    """Base location model"""
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    model_config = ConfigDict(from_attributes=True)


class CoordinatesSchema(BaseModel):
    """GPS coordinates"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class SearchParams(BaseModel):
    """Common search parameters"""
    q: Optional[str] = Field(None, description="Search query")
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="Sort order")
    

class FilterParams(BaseModel):
    """Base filter parameters"""
    is_active: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


class IDResponse(ResponseBase):
    """Response with ID"""
    id: int
    

class MessageResponse(ResponseBase):
    """Simple message response"""
    pass


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    details: Optional[dict] = None
    status_code: int = 400


class FileUploadResponse(ResponseBase):
    """File upload response"""
    file_url: str
    file_name: str
    file_size: int
    thumbnail_url: Optional[str] = None
    

class BulkOperationResponse(ResponseBase):
    """Bulk operation response"""
    successful: int = 0
    failed: int = 0
    total: int = 0
    errors: List[dict] = []
    

class StatusResponse(ResponseBase):
    """Status check response"""
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"
    

class CoordinateDistance(BaseModel):
    """Distance between two coordinates"""
    distance_km: float
    from_location: str
    to_location: str


# Enums for responses
class SortOrder(str):
    ASC = "asc"
    DESC = "desc"