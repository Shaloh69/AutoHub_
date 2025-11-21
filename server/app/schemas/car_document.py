"""
===========================================
FILE: app/schemas/car_document.py - Car Document Schemas
Path: car_marketplace_ph/app/schemas/car_document.py
Purpose: Pydantic schemas for car documents
===========================================
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.car_document import DocumentType


class CarDocumentBase(BaseModel):
    """Base schema for car document"""
    document_type: DocumentType
    title: Optional[str] = None
    description: Optional[str] = None


class CarDocumentCreate(CarDocumentBase):
    """Schema for creating a car document"""
    document_url: str
    file_name: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class CarDocumentUpdate(BaseModel):
    """Schema for updating a car document"""
    title: Optional[str] = None
    description: Optional[str] = None
    is_verified: Optional[bool] = None


class CarDocumentResponse(CarDocumentBase):
    """Schema for car document response"""
    id: int
    car_id: int
    document_url: str
    file_name: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_at: datetime
    is_verified: bool
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentVerificationRequest(BaseModel):
    """Schema for document verification request"""
    is_verified: bool = Field(..., description="Verification status")
    notes: Optional[str] = Field(None, description="Verification notes")
