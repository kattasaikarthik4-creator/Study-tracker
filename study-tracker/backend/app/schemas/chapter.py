from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .topic import TopicResponse

class ChapterBase(BaseModel):
    name: str
    target_hours: Optional[float] = 0.0

class ChapterCreate(ChapterBase):
    subject_id: int

class ChapterUpdate(BaseModel):
    name: Optional[str] = None
    target_hours: Optional[float] = None

class ChapterResponse(ChapterBase):
    id: int
    subject_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    topics: List[TopicResponse] = []

    class Config:
        from_attributes = True
