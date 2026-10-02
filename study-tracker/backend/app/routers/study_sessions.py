from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import StudySession, Category, Subject, Chapter, Topic
from ..schemas.study_session import StudySessionCreate, StudySessionResponse
from ..services.performance_service import format_duration

router = APIRouter(prefix="/api/study-sessions", tags=["Study Sessions"])

def to_session_response(s: StudySession) -> StudySessionResponse:
    return StudySessionResponse(
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
        category_name=s.category.name if s.category else None,
        subject_name=s.subject.name if s.subject else None,
        chapter_name=s.chapter.name if s.chapter else None,
        topic_name=s.topic.name if s.topic else None,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )

@router.post("", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
def create_study_session(session_in: StudySessionCreate, db: Session = Depends(get_db)):
    # Validate category, subject, chapter, topic
    category = db.query(Category).filter(Category.id == session_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    subject = db.query(Subject).filter(Subject.id == session_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    chapter = db.query(Chapter).filter(Chapter.id == session_in.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    topic = db.query(Topic).filter(Topic.id == session_in.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Time validation
    if session_in.end_time < session_in.start_time:
        raise HTTPException(status_code=400, detail="End time cannot be earlier than start time.")

    time_diff_seconds = int((session_in.end_time - session_in.start_time).total_seconds())
    
    if session_in.duration_seconds and session_in.duration_seconds > 0:
        duration_seconds = session_in.duration_seconds
    else:
        duration_seconds = time_diff_seconds

    if duration_seconds <= 0:
        raise HTTPException(status_code=400, detail="Study duration must be greater than 0 seconds.")

    study_date = session_in.study_date or session_in.start_time.date()

    db_session = StudySession(
        user_id=1,
        category_id=session_in.category_id,
        subject_id=session_in.subject_id,
        chapter_id=session_in.chapter_id,
        topic_id=session_in.topic_id,
        session_type=session_in.session_type.upper(),
        start_time=session_in.start_time,
        end_time=session_in.end_time,
        duration_seconds=duration_seconds,
        study_date=study_date,
        notes=session_in.notes,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return to_session_response(db_session)

@router.get("", response_model=List[StudySessionResponse])
def get_study_sessions(
    category_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    session_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(StudySession)
    if category_id:
        query = query.filter(StudySession.category_id == category_id)
    if subject_id:
        query = query.filter(StudySession.subject_id == subject_id)
    if date_from:
        query = query.filter(StudySession.study_date >= date_from)
    if date_to:
        query = query.filter(StudySession.study_date <= date_to)
    if session_type:
        query = query.filter(StudySession.session_type == session_type.upper())

    sessions = query.order_by(StudySession.start_time.desc()).offset(offset).limit(limit).all()
    return [to_session_response(s) for s in sessions]

@router.get("/today")
def get_today_summary(db: Session = Depends(get_db)):
    today = date.today()
    sessions = (
        db.query(StudySession)
        .filter(StudySession.study_date == today)
        .order_by(StudySession.start_time.desc())
        .all()
    )

    categories = db.query(Category).all()
    cat_id_to_name = {c.id: c.name.upper() for c in categories}
    
    breakdown = {"GATE": 0, "SEMESTER": 0, "LABS": 0}
    for cat_name in cat_id_to_name.values():
        if cat_name not in breakdown:
            breakdown[cat_name] = 0

    total_seconds = 0
    for s in sessions:
        total_seconds += s.duration_seconds
        c_name = cat_id_to_name.get(s.category_id, "OTHER")
        if c_name in breakdown:
            breakdown[c_name] += s.duration_seconds
        else:
            breakdown[c_name] = s.duration_seconds

    category_details = {}
    for cat_name, sec in breakdown.items():
        category_details[cat_name] = {
            "seconds": sec,
            "hours": round(sec / 3600.0, 2),
            "formatted": format_duration(sec),
        }

    return {
        "date": today.isoformat(),
        "total_seconds": total_seconds,
        "total_hours": round(total_seconds / 3600.0, 2),
        "total_formatted": format_duration(total_seconds),
        "categories": category_details,
        "sessions": [to_session_response(s) for s in sessions],
    }

@router.get("/7-days", response_model=List[StudySessionResponse])
def get_seven_days_sessions(db: Session = Depends(get_db)):
    start_date = date.today() - timedelta(days=6)
    sessions = (
        db.query(StudySession)
        .filter(StudySession.study_date >= start_date)
        .order_by(StudySession.start_time.desc())
        .all()
    )
    return [to_session_response(s) for s in sessions]

@router.get("/{session_id}", response_model=StudySessionResponse)
def get_study_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    return to_session_response(session)

@router.delete("/{session_id}", status_code=status.HTTP_200_OK)
def delete_study_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    db.delete(session)
    db.commit()
    return {"message": "Study session deleted successfully"}
