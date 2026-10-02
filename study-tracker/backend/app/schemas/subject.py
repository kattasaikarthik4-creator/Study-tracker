from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .chapter import ChapterResponse

class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_hours: Optional[float] = 0.0

class SubjectCreate(SubjectBase):
    category_id: int

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_hours: Optional[float] = None

class SubjectResponse(SubjectBase):
    id: int
    category_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    chapters: List[ChapterResponse] = []

    class Config:
        from_attributes = True
