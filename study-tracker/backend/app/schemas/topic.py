from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TopicBase(BaseModel):
    name: str
    target_hours: Optional[float] = 0.0

class TopicCreate(TopicBase):
    chapter_id: int

class TopicUpdate(BaseModel):
    name: Optional[str] = None
    target_hours: Optional[float] = None

class TopicResponse(TopicBase):
    id: int
    chapter_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
