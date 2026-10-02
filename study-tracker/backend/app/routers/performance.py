from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Category, Subject, Chapter, Topic
from ..schemas.performance import (
    CategoryPerformance,
    SubjectPerformance,
    ChapterPerformance,
    TopicPerformance,
)
from ..services.performance_service import (
    calculate_category_performance,
    calculate_subject_performance,
    calculate_chapter_performance,
    calculate_topic_performance,
)

router = APIRouter(prefix="/api/performance", tags=["Performance"])

def get_performance_for_category_name(name: str, db: Session) -> CategoryPerformance:
    cat = db.query(Category).filter(Category.name.ilike(name)).first()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category '{name}' not found")
    return calculate_category_performance(db, cat)

@router.get("/gate", response_model=CategoryPerformance)
def get_gate_performance(db: Session = Depends(get_db)):
    return get_performance_for_category_name("GATE", db)

@router.get("/semester", response_model=CategoryPerformance)
def get_semester_performance(db: Session = Depends(get_db)):
    return get_performance_for_category_name("SEMESTER", db)

@router.get("/labs", response_model=CategoryPerformance)
def get_labs_performance(db: Session = Depends(get_db)):
    return get_performance_for_category_name("LABS", db)

@router.get("/category/{category_id}", response_model=CategoryPerformance)
def get_category_performance_by_id(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return calculate_category_performance(db, cat)

@router.get("/subject/{subject_id}", response_model=SubjectPerformance)
def get_subject_performance(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return calculate_subject_performance(db, subject)

@router.get("/chapter/{chapter_id}", response_model=ChapterPerformance)
def get_chapter_performance(chapter_id: int, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return calculate_chapter_performance(db, chapter)

@router.get("/topic/{topic_id}", response_model=TopicPerformance)
def get_topic_performance(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return calculate_topic_performance(db, topic)
