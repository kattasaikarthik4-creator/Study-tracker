from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.history import HistoryResponse
from ..services.history_service import get_history_data

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("/7-days", response_model=HistoryResponse)
def get_history_7_days(db: Session = Depends(get_db)):
    return get_history_data(db, period_days=7)

@router.get("/30-days", response_model=HistoryResponse)
def get_history_30_days(db: Session = Depends(get_db)):
    return get_history_data(db, period_days=30)

@router.get("/custom", response_model=HistoryResponse)
def get_history_custom(days: int = Query(7, ge=1, le=365), db: Session = Depends(get_db)):
    return get_history_data(db, period_days=days)
