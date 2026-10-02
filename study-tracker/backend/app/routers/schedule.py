from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Schedule, Category, Subject, Chapter, Topic
from ..schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse

router = APIRouter(prefix="/api/schedule", tags=["Schedule"])

def to_schedule_response(s: Schedule) -> ScheduleResponse:
    return ScheduleResponse(
        id=s.id,
        user_id=s.user_id,
        title=s.title,
        category_id=s.category_id,
        subject_id=s.subject_id,
        chapter_id=s.chapter_id,
        topic_id=s.topic_id,
        day=s.day,
        start_time=s.start_time,
        end_time=s.end_time,
        notes=s.notes,
        category_name=s.category.name if s.category else None,
        subject_name=s.subject.name if s.subject else None,
        chapter_name=s.chapter.name if s.chapter else None,
        topic_name=s.topic.name if s.topic else None,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )

@router.get("", response_model=List[ScheduleResponse])
def get_schedules(day: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Schedule)
    if day:
        query = query.filter(Schedule.day.ilike(day.strip()))
    schedules = query.order_by(Schedule.day, Schedule.start_time).all()
    return [to_schedule_response(s) for s in schedules]

@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(schedule_in: ScheduleCreate, db: Session = Depends(get_db)):
    # Validate category/subject/chapter/topic if passed
    if schedule_in.category_id:
        if not db.query(Category).filter(Category.id == schedule_in.category_id).first():
            raise HTTPException(status_code=404, detail="Category not found")
    if schedule_in.subject_id:
        if not db.query(Subject).filter(Subject.id == schedule_in.subject_id).first():
            raise HTTPException(status_code=404, detail="Subject not found")
    if schedule_in.chapter_id:
        if not db.query(Chapter).filter(Chapter.id == schedule_in.chapter_id).first():
            raise HTTPException(status_code=404, detail="Chapter not found")
    if schedule_in.topic_id:
        if not db.query(Topic).filter(Topic.id == schedule_in.topic_id).first():
            raise HTTPException(status_code=404, detail="Topic not found")

    new_schedule = Schedule(
        user_id=1,
        title=schedule_in.title.strip(),
        category_id=schedule_in.category_id,
        subject_id=schedule_in.subject_id,
        chapter_id=schedule_in.chapter_id,
        topic_id=schedule_in.topic_id,
        day=schedule_in.day.strip().capitalize(),
        start_time=schedule_in.start_time.strip(),
        end_time=schedule_in.end_time.strip(),
        notes=schedule_in.notes.strip() if schedule_in.notes else None,
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return to_schedule_response(new_schedule)

@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(schedule_id: int, schedule_in: ScheduleUpdate, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule entry not found")

    if schedule_in.title is not None:
        schedule.title = schedule_in.title.strip()
    if schedule_in.category_id is not None:
        schedule.category_id = schedule_in.category_id
    if schedule_in.subject_id is not None:
        schedule.subject_id = schedule_in.subject_id
    if schedule_in.chapter_id is not None:
        schedule.chapter_id = schedule_in.chapter_id
    if schedule_in.topic_id is not None:
        schedule.topic_id = schedule_in.topic_id
    if schedule_in.day is not None:
        schedule.day = schedule_in.day.strip().capitalize()
    if schedule_in.start_time is not None:
        schedule.start_time = schedule_in.start_time.strip()
    if schedule_in.end_time is not None:
        schedule.end_time = schedule_in.end_time.strip()
    if schedule_in.notes is not None:
        schedule.notes = schedule_in.notes.strip() if schedule_in.notes else None

    db.commit()
    db.refresh(schedule)
    return to_schedule_response(schedule)

@router.delete("/{schedule_id}", status_code=status.HTTP_200_OK)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule entry deleted successfully"}
