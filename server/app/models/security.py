from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, JSON, Boolean
from datetime import datetime
from app.database import Base


class FraudIndicator(Base):
    __tablename__ = "fraud_indicators"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    car_id = Column(Integer, ForeignKey("cars.id"), index=True)
    indicator_type = Column(String(100), nullable=False)
    severity = Column(String(20))
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