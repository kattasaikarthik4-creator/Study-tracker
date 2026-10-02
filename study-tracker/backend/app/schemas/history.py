from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from .study_session import StudySessionResponse

class DailyChartData(BaseModel):
    date: str
    day_name: str
    GATE: float
    SEMESTER: float
    LABS: float
    total: float

class CategorySummary(BaseModel):
    name: str
    seconds: int
    hours: float
    formatted: str

class HistoryResponse(BaseModel):
    period_days: int
    total_seconds: int
    total_hours: float
    total_formatted: str
    total_sessions: int
    category_summaries: Dict[str, CategorySummary]
    chart_data: List[DailyChartData]
    sessions: List[StudySessionResponse]
