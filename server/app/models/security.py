from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, JSON, Boolean, Enum
from datetime import datetime
from app.database import Base
import enum


class FraudSeverity(str, enum.Enum):
    """Fraud severity enum - UPPERCASE to match SQL schema"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FraudIndicator(Base):
    __tablename__ = "fraud_indicators"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), index=True)
    indicator_type = Column(String(100), nullable=False)
    severity = Column(Enum(FraudSeverity), default=FraudSeverity.LOW, index=True)
    description = Column(Text)
    detected_at = Column(TIMESTAMP, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)


class SystemConfig(Base):
    __tablename__ = "system_configs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_key = Column(String(100), unique=True, nullable=False, index=True)
    config_value = Column(Text)
    data_type = Column(String(20))
    description = Column(Text)
    is_public = Column(Boolean, default=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)