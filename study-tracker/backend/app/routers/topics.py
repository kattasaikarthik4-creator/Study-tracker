from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Topic, Chapter
from ..schemas.topic import TopicResponse, TopicCreate, TopicUpdate

router = APIRouter(prefix="/api/topics", tags=["Topics"])

@router.get("/{chapter_id}", response_model=List[TopicResponse])
def get_topics_by_chapter(chapter_id: int, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return db.query(Topic).filter(Topic.chapter_id == chapter_id).order_by(Topic.name).all()

@router.post("", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
def create_topic(topic_in: TopicCreate, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == topic_in.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    existing = db.query(Topic).filter(
        Topic.chapter_id == topic_in.chapter_id,
        Topic.name.ilike(topic_in.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Topic with this name already exists in this chapter")

    new_top = Topic(
        chapter_id=topic_in.chapter_id,
        name=topic_in.name.strip(),
        target_hours=max(0.0, float(topic_in.target_hours or 0.0)),
    )
    db.add(new_top)
    db.commit()
    db.refresh(new_top)
    return new_top

@router.put("/{topic_id}", response_model=TopicResponse)
def update_topic(topic_id: int, topic_in: TopicUpdate, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if topic_in.name is not None:
        trimmed = topic_in.name.strip()
        if not trimmed:
            raise HTTPException(status_code=400, detail="Topic name cannot be empty")
        dup = db.query(Topic).filter(
            Topic.chapter_id == topic.chapter_id,
            Topic.name.ilike(trimmed),
            Topic.id != topic_id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Another topic with this name already exists in this chapter")
        topic.name = trimmed

    if topic_in.target_hours is not None:
        topic.target_hours = max(0.0, float(topic_in.target_hours))

    db.commit()
    db.refresh(topic)
    return topic

@router.delete("/{topic_id}", status_code=status.HTTP_200_OK)
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    name = topic.name
    db.delete(topic)
    db.commit()
    return {"message": f"Topic '{name}' deleted successfully"}
