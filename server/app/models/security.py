from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class IndicatorType(str, enum.Enum):
    DUPLICATE_IMAGES = "duplicate_images"
    SUSPICIOUS_PRICE = "suspicious_price"
    FAKE_LOCATION = "fake_location"
    MULTIPLE_ACCOUNTS = "multiple_accounts"
    STOLEN_VEHICLE = "stolen_vehicle"
    FAKE_DOCUMENTS = "fake_documents"
    UNUSUAL_ACTIVITY = "unusual_activity"
    REPORTED_SCAM = "reported_scam"


class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class Operation(str, enum.Enum):
    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class DataType(str, enum.Enum):
    STRING = "string"
    INTEGER = "integer"
    DECIMAL = "decimal"
    BOOLEAN = "boolean"
    JSON = "json"


class FraudIndicator(Base):
    __tablename__ = "fraud_indicators"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=True, index=True)
    indicator_type = Column(Enum(IndicatorType), nullable=False, index=True)
    severity = Column(Enum(Severity), default=Severity.MEDIUM, index=True)
    description = Column(Text, nullable=False)
    evidence = Column(JSON)
    status = Column(Enum(FraudStatus), default=FraudStatus.OPEN, index=True)
    reported_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    investigated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    resolved_at = Column(TIMESTAMP, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    car = relationship("Car")
    reporter = relationship("User", foreign_keys=[reported_by])
    investigator = relationship("User", foreign_keys=[investigated_by])
    
    def __repr__(self):
        return f"<FraudIndicator {self.id}: {self.indicator_type}, Severity {self.severity}>"


class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String(100), nullable=False, index=True)
    operation = Column(Enum(Operation), nullable=False, index=True)
    record_id = Column(Integer, nullable=False, index=True)
    old_values = Column(JSON)
    new_values = Column(JSON)
    changed_fields = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<AuditLog {self.id}: {self.operation} on {self.table_name}.{self.record_id}>"


class SystemConfig(Base):
    __tablename__ = "system_config"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_key = Column(String(100), unique=True, nullable=False, index=True)
    config_value = Column(Text, nullable=False)
    data_type = Column(Enum(DataType), default=DataType.STRING)
    category = Column(String(50), default="general", index=True)
    description = Column(Text)
    is_public = Column(Boolean, default=False, index=True)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    updater = relationship("User")
    
    def __repr__(self):
        return f"<SystemConfig {self.config_key}: {self.config_value}>"
    
    def get_typed_value(self):
        """Convert string value to appropriate type"""
        if self.data_type == DataType.INTEGER:
            return int(self.config_value)
        elif self.data_type == DataType.DECIMAL:
            return float(self.config_value)
        elif self.data_type == DataType.BOOLEAN:
            return self.config_value.lower() in ('true', '1', 'yes')
        elif self.data_type == DataType.JSON:
            import json
            return json.loads(self.config_value)
        else:
            return self.config_value