from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Category
from ..schemas.category import CategoryResponse, CategoryCreate

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.id).all()

@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name.ilike(category.name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    db_cat = Category(name=category.name.strip().upper())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat
