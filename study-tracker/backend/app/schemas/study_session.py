from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date

class StudySessionBase(BaseModel):
    category_id: int
    subject_id: int
    chapter_id: int
    topic_id: int
    session_type: str  # "LIVE" or "LOGGED"
    start_time: datetime
    end_time: datetime
    duration_seconds: Optional[int] = None
    study_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("session_type")
    @classmethod
    def validate_session_type(cls, v: str) -> str:
        upper = v.upper()
        if upper not in ["LIVE", "LOGGED"]:
            raise ValueError("session_type must be LIVE or LOGGED")
        return upper

class StudySessionCreate(StudySessionBase):
    pass

class StudySessionResponse(StudySessionBase):
    id: int
    user_id: Optional[int] = None
    duration_seconds: int
    study_date: date
    category_name: Optional[str] = None
    subject_name: Optional[str] = None
    chapter_name: Optional[str] = None
    topic_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
