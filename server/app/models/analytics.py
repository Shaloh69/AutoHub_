from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class CarView(Base):
    __tablename__ = "car_views"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    session_id = Column(String(255))
    
    # Device & Location
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    device_type = Column(Enum("desktop", "mobile", "tablet"))
    referrer = Column(String(500))
    
    # Timestamps
    viewed_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    car = relationship("Car", back_populates="views")


class UserAction(Base):
    __tablename__ = "user_actions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action_type = Column(String(50), nullable=False, index=True)
    target_type = Column(String(50))
    target_id = Column(Integer)
    # FIXED: Renamed 'metadata' to 'action_metadata' to avoid SQLAlchemy reserved word
    action_metadata = Column(JSON, name="metadata")  # Maps to 'metadata' column in DB
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="actions")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    related_id = Column(Integer)
    related_type = Column(String(50))
    is_read = Column(Boolean, default=False)
    read_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")