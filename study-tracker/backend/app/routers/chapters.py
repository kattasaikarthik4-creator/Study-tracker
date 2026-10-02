from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Chapter, Subject
from ..schemas.chapter import ChapterResponse, ChapterCreate, ChapterUpdate

router = APIRouter(prefix="/api/chapters", tags=["Chapters"])

@router.get("/{subject_id}", response_model=List[ChapterResponse])
def get_chapters_by_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return db.query(Chapter).filter(Chapter.subject_id == subject_id).order_by(Chapter.name).all()

@router.post("", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def create_chapter(chapter_in: ChapterCreate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == chapter_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    existing = db.query(Chapter).filter(
        Chapter.subject_id == chapter_in.subject_id,
        Chapter.name.ilike(chapter_in.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Chapter with this name already exists in this subject")

    new_chap = Chapter(
        subject_id=chapter_in.subject_id,
        name=chapter_in.name.strip(),
        target_hours=max(0.0, float(chapter_in.target_hours or 0.0)),
    )
    db.add(new_chap)
    db.commit()
    db.refresh(new_chap)
    return new_chap

@router.put("/{chapter_id}", response_model=ChapterResponse)
def update_chapter(chapter_id: int, chapter_in: ChapterUpdate, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if chapter_in.name is not None:
        trimmed = chapter_in.name.strip()
        if not trimmed:
            raise HTTPException(status_code=400, detail="Chapter name cannot be empty")
        dup = db.query(Chapter).filter(
            Chapter.subject_id == chapter.subject_id,
            Chapter.name.ilike(trimmed),
            Chapter.id != chapter_id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Another chapter with this name already exists in this subject")
        chapter.name = trimmed

    if chapter_in.target_hours is not None:
        chapter.target_hours = max(0.0, float(chapter_in.target_hours))

    db.commit()
    db.refresh(chapter)
    return chapter

@router.delete("/{chapter_id}", status_code=status.HTTP_200_OK)
def delete_chapter(chapter_id: int, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    name = chapter.name
    db.delete(chapter)
    db.commit()
    return {"message": f"Chapter '{name}' and associated topics deleted successfully"}
