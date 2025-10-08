from pydantic import BaseModel, ConfigDict
from typing import Generic, TypeVar, List, Optional
from datetime import datetime

T = TypeVar('T')


class ResponseBase(BaseModel):
    """Base response model"""
    success: bool = True
    message: str = "Success"


class MessageResponse(BaseModel):
    """Simple message response"""
    message: str
    success: bool = True


class IDResponse(BaseModel):
    """Response with ID"""
    id: int
    message: str = "Operation successful"
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = 1
    page_size: int = 20
