from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Category, Subject, Chapter, Topic
from ..schemas.subject import SubjectCreate, SubjectResponse
from ..schemas.chapter import ChapterCreate, ChapterResponse
from ..schemas.topic import TopicCreate, TopicResponse
from .subjects import create_subject
from .chapters import create_chapter
from .topics import create_topic

router = APIRouter(prefix="/api/syllabus", tags=["Syllabus"])

@router.get("")
def get_full_syllabus(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Category)
    if category_id:
        query = query.filter(Category.id == category_id)
    categories = query.order_by(Category.id).all()

    result = []
    for cat in categories:
        subjects_data = []
        for sub in sorted(cat.subjects, key=lambda s: s.name.lower()):
            chapters_data = []
            for ch in sorted(sub.chapters, key=lambda c: c.name.lower()):
                topics_data = []
                for tp in sorted(ch.topics, key=lambda t: t.name.lower()):
                    topics_data.append({
                        "id": tp.id,
                        "chapter_id": tp.chapter_id,
                        "name": tp.name,
                        "target_hours": tp.target_hours,
                        "created_at": tp.created_at,
                        "updated_at": tp.updated_at,
                    })
                chapters_data.append({
                    "id": ch.id,
                    "subject_id": ch.subject_id,
                    "name": ch.name,
                    "target_hours": ch.target_hours,
                    "topics": topics_data,
                    "created_at": ch.created_at,
                    "updated_at": ch.updated_at,
                })
            subjects_data.append({
                "id": sub.id,
                "category_id": sub.category_id,
                "name": sub.name,
                "description": sub.description,
                "target_hours": sub.target_hours,
                "chapters": chapters_data,
                "created_at": sub.created_at,
                "updated_at": sub.updated_at,
            })
        result.append({
            "id": cat.id,
            "name": cat.name,
            "subjects": subjects_data,
        })
    return result

@router.post("/subject", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def syllabus_create_subject(subject_in: SubjectCreate, db: Session = Depends(get_db)):
    return create_subject(subject_in, db)

@router.post("/chapter", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def syllabus_create_chapter(chapter_in: ChapterCreate, db: Session = Depends(get_db)):
    return create_chapter(chapter_in, db)

@router.post("/topic", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
def syllabus_create_topic(topic_in: TopicCreate, db: Session = Depends(get_db)):
    return create_topic(topic_in, db)
