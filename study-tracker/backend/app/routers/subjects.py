from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Subject, Category
from ..schemas.subject import SubjectResponse, SubjectCreate, SubjectUpdate

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
def get_all_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).order_by(Subject.name).all()

@router.get("/{category_id}", response_model=List[SubjectResponse])
def get_subjects_by_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return db.query(Subject).filter(Subject.category_id == category_id).order_by(Subject.name).all()

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(subject_in: SubjectCreate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == subject_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check duplicate subject within same category
    existing = db.query(Subject).filter(
        Subject.category_id == subject_in.category_id,
        Subject.name.ilike(subject_in.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject with this name already exists in this category")

    new_sub = Subject(
        category_id=subject_in.category_id,
        name=subject_in.name.strip(),
        description=subject_in.description.strip() if subject_in.description else None,
        target_hours=max(0.0, float(subject_in.target_hours or 0.0)),
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, subject_in: SubjectUpdate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if subject_in.name is not None:
        trimmed = subject_in.name.strip()
        if not trimmed:
            raise HTTPException(status_code=400, detail="Subject name cannot be empty")
        # Check duplicate
        dup = db.query(Subject).filter(
            Subject.category_id == subject.category_id,
            Subject.name.ilike(trimmed),
            Subject.id != subject_id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Another subject with this name already exists in this category")
        subject.name = trimmed

    if subject_in.description is not None:
        subject.description = subject_in.description.strip() if subject_in.description else None

    if subject_in.target_hours is not None:
        subject.target_hours = max(0.0, float(subject_in.target_hours))

    db.commit()
    db.refresh(subject)
    return subject

@router.delete("/{subject_id}", status_code=status.HTTP_200_OK)
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    name = subject.name
    db.delete(subject)
    db.commit()
    return {"message": f"Subject '{name}' and associated chapters and topics deleted successfully"}
