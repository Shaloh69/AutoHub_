"""
===========================================
FILE: app/models/car_document.py - Car Documents Model
Path: car_marketplace_ph/app/models/car_document.py
Purpose: Store and manage car documentation files
===========================================
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class DocumentType(str, enum.Enum):
    """Document types for car papers"""
    OR_CR = "OR_CR"
    REGISTRATION = "REGISTRATION"
    INSURANCE = "INSURANCE"
    WARRANTY = "WARRANTY"
    SERVICE_HISTORY = "SERVICE_HISTORY"
    DEED_OF_SALE = "DEED_OF_SALE"
    LTO_DOCUMENTS = "LTO_DOCUMENTS"
    OTHER = "OTHER"


class CarDocument(Base):
    """Car document model for storing car papers/documentation"""
    __tablename__ = "car_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(SQLEnum(DocumentType), nullable=False, index=True)
    document_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # in bytes
    mime_type = Column(String(100))  # e.g., application/pdf, image/jpeg
    title = Column(String(255))
    description = Column(Text)
    uploaded_at = Column(TIMESTAMP, default=datetime.utcnow)
    is_verified = Column(Boolean, default=False, index=True)
    verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    car = relationship("Car", back_populates="documents")
    verifier = relationship("User", foreign_keys=[verified_by])

    def __repr__(self):
        return f"<CarDocument(id={self.id}, car_id={self.car_id}, type={self.document_type})>"
