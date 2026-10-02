from datetime import date, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import StudySession, Category, Subject, Chapter, Topic
from ..schemas.history import HistoryResponse, DailyChartData, CategorySummary
from ..schemas.study_session import StudySessionResponse
from .performance_service import format_duration

def get_history_data(db: Session, period_days: int = 7) -> HistoryResponse:
    today = date.today()
    start_date = today - timedelta(days=period_days - 1)

    # Fetch all categories
    categories = db.query(Category).all()
    cat_id_to_name = {c.id: c.name.upper() for c in categories}
    standard_cats = ["GATE", "SEMESTER", "LABS"]

    # Category summaries init
    category_totals: Dict[str, int] = {cat: 0 for cat in standard_cats}
    for cat_name in cat_id_to_name.values():
        if cat_name not in category_totals:
            category_totals[cat_name] = 0

    # Query sessions in the period
    sessions = (
        db.query(StudySession)
        .filter(StudySession.study_date >= start_date, StudySession.study_date <= today)
        .order_by(StudySession.start_time.desc())
        .all()
    )

    # Populate session response objects with names
    session_responses: List[StudySessionResponse] = []
    total_seconds = 0

    for s in sessions:
        total_seconds += s.duration_seconds
        c_name = cat_id_to_name.get(s.category_id, "OTHER")
        if c_name in category_totals:
            category_totals[c_name] += s.duration_seconds
        else:
            category_totals[c_name] = s.duration_seconds

        resp = StudySessionResponse(
            id=s.id,
            user_id=s.user_id,
            category_id=s.category_id,
            subject_id=s.subject_id,
            chapter_id=s.chapter_id,
            topic_id=s.topic_id,
            session_type=s.session_type,
            start_time=s.start_time,
            end_time=s.end_time,
            duration_seconds=s.duration_seconds,
            study_date=s.study_date,
            notes=s.notes,
            category_name=s.category.name if s.category else c_name,
            subject_name=s.subject.name if s.subject else None,
            chapter_name=s.chapter.name if s.chapter else None,
            topic_name=s.topic.name if s.topic else None,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        session_responses.append(resp)

    # Build daily chart data for each day in range
    daily_chart: List[DailyChartData] = []
    curr = start_date
    while curr <= today:
        day_date_str = curr.strftime("%Y-%m-%d")
        day_name = curr.strftime("%A")
        
        # calculate seconds for this day
        day_sessions = [s for s in sessions if s.study_date == curr]
        gate_sec = sum(s.duration_seconds for s in day_sessions if cat_id_to_name.get(s.category_id) == "GATE")
        sem_sec = sum(s.duration_seconds for s in day_sessions if cat_id_to_name.get(s.category_id) == "SEMESTER")
        labs_sec = sum(s.duration_seconds for s in day_sessions if cat_id_to_name.get(s.category_id) == "LABS")
        other_sec = sum(s.duration_seconds for s in day_sessions if cat_id_to_name.get(s.category_id) not in ["GATE", "SEMESTER", "LABS"])
        
        tot_day_sec = gate_sec + sem_sec + labs_sec + other_sec

        daily_chart.append(
            DailyChartData(
                date=day_date_str,
                day_name=day_name,
                GATE=round(gate_sec / 3600.0, 2),
                SEMESTER=round(sem_sec / 3600.0, 2),
                LABS=round(labs_sec / 3600.0, 2),
                total=round(tot_day_sec / 3600.0, 2),
            )
        )
        curr += timedelta(days=1)

    cat_summaries: Dict[str, CategorySummary] = {}
    for cat_name, sec in category_totals.items():
        cat_summaries[cat_name] = CategorySummary(
            name=cat_name,
            seconds=sec,
            hours=round(sec / 3600.0, 2),
            formatted=format_duration(sec),
        )

    return HistoryResponse(
        period_days=period_days,
        total_seconds=total_seconds,
        total_hours=round(total_seconds / 3600.0, 2),
        total_formatted=format_duration(total_seconds),
        total_sessions=len(sessions),
        category_summaries=cat_summaries,
        chart_data=daily_chart,
        sessions=session_responses,
    )
