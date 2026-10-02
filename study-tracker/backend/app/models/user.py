from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False, default="default_user")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
