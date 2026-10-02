from pydantic import BaseModel
from typing import List, Optional

class PerformanceItemBase(BaseModel):
    id: int
    name: str
    target_hours: float
    spent_seconds: int
    spent_hours: float
    spent_formatted: str
    remaining_seconds: int
    remaining_hours: float
    remaining_formatted: str
    progress_percent: float
    session_count: int
    last_studied: Optional[str] = None

class TopicPerformance(PerformanceItemBase):
    chapter_id: int

class ChapterPerformance(PerformanceItemBase):
    subject_id: int
    topics: List[TopicPerformance] = []

class SubjectPerformance(PerformanceItemBase):
    category_id: int
    description: Optional[str] = None
    chapters: List[ChapterPerformance] = []

class CategoryPerformance(PerformanceItemBase):
    subjects: List[SubjectPerformance] = []
