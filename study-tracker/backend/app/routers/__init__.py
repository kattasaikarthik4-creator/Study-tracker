from .categories import router as categories_router
from .subjects import router as subjects_router
from .chapters import router as chapters_router
from .topics import router as topics_router
from .study_sessions import router as study_sessions_router
from .syllabus import router as syllabus_router
from .performance import router as performance_router
from .schedule import router as schedule_router
from .history import router as history_router

__all__ = [
    "categories_router",
    "subjects_router",
    "chapters_router",
    "topics_router",
    "study_sessions_router",
    "syllabus_router",
    "performance_router",
    "schedule_router",
    "history_router",
]
