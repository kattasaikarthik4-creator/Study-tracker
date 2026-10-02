from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ScheduleBase(BaseModel):
    title: str
    category_id: Optional[int] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    day: str  # "Monday", "Tuesday", etc.
    start_time: str  # "08:00"
    end_time: str    # "09:30"
    notes: Optional[str] = None

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[int] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    day: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None

class ScheduleResponse(ScheduleBase):
    id: int
    user_id: Optional[int] = None
    category_name: Optional[str] = None
    subject_name: Optional[str] = None
    chapter_name: Optional[str] = None
    topic_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
