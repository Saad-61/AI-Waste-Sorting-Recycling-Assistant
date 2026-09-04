import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ScanRecord(Base):
    """Stores metadata for each image scan / analysis session"""
    __tablename__ = "scan_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    filename = Column(String(255), nullable=True)
    total_objects = Column(Integer, default=0)
    primary_disposal_bin = Column(String(50), nullable=True)
    processing_time_ms = Column(Float, default=0.0)
    image_base64 = Column(Text, nullable=True)

    # Relationships
    detected_items = relationship("DetectedItem", back_populates="scan", cascade="all, delete-orphan")


class DetectedItem(Base):
    """Stores individual detected waste items and recyclability decisions"""
    __tablename__ = "detected_items"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scan_records.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    material_type = Column(String(100), nullable=True)
    disposal_bin = Column(String(50), nullable=False)
    recyclable = Column(String(20), default="unknown")  # recyclable, non-recyclable, conditional
    instructions = Column(Text, nullable=True)
    bbox_coordinates = Column(String(100), nullable=True)  # JSON or "x1,y1,x2,y2"
    xai_saliency_available = Column(Integer, default=0)

    # Relationships
    scan = relationship("ScanRecord", back_populates="detected_items")
