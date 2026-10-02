from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False, index=True)
    target_hours = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    chapter = relationship("Chapter", back_populates="topics")
    study_sessions = relationship("StudySession", back_populates="topic", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="topic", cascade="all, delete-orphan")
