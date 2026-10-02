from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, Float, DateTime, Date, Text
from ..database import Base

class DailyTarget(Base):
    __tablename__ = "daily_targets"

    id = Column(Integer, primary_key=True, index=True)
    target_date = Column(Date, default=date.today, nullable=False, unique=True)
    target_hours = Column(Float, default=4.0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
