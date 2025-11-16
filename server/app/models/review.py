from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Text, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class ReviewStatus(str, enum.Enum):
    """Review status enum - UPPERCASE to match normalized SQL schema"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    HIDDEN = "HIDDEN"


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="SET NULL"), index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"))

    # Review Content
    rating = Column(DECIMAL(3, 2), nullable=False)  # e.g., 4.50
    title = Column(String(255))
    comment = Column(Text)
    pros = Column(Text)
    cons = Column(Text)

    # Verification & Recommendations
    would_recommend = Column(Boolean, default=True)
    verified_purchase = Column(Boolean, default=False)

    # Engagement
    helpful_count = Column(Integer, default=0)
    reported_count = Column(Integer, default=0)

    # Moderation
    status = Column(Enum(ReviewStatus), default=ReviewStatus.PENDING)
    admin_notes = Column(Text)

    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    car = relationship("Car", back_populates="reviews")
    seller = relationship("User", foreign_keys=[seller_id], backref="seller_reviews")
    buyer = relationship("User", foreign_keys=[buyer_id], backref="buyer_reviews")
    transaction = relationship("Transaction", backref="review")

    def __repr__(self):
        return f"<Review {self.id} - Car:{self.car_id} Rating:{self.rating}>"
