from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)

    subjects = relationship("Subject", back_populates="category", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="category")
    schedules = relationship("Schedule", back_populates="category")
