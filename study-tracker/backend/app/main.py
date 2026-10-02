import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import Category, User
from .routers import (
    categories_router,
    subjects_router,
    chapters_router,
    topics_router,
    study_sessions_router,
    syllabus_router,
    performance_router,
    schedule_router,
    history_router,
)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed default user
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            user = User(id=1, username="default_user")
            db.add(user)

        # Seed categories: GATE, SEMESTER, LABS
        standard_categories = ["GATE", "SEMESTER", "LABS"]
        for cat_name in standard_categories:
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                cat = Category(name=cat_name)
                db.add(cat)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Database init exception: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and standard categories exist
    init_db()
    yield

app = FastAPI(
    title="STUDY TRACKER API",
    description="Academic study tracking system API for GATE, Semester, and Labs",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(categories_router)
app.include_router(subjects_router)
app.include_router(chapters_router)
app.include_router(topics_router)
app.include_router(study_sessions_router)
app.include_router(syllabus_router)
app.include_router(performance_router)
app.include_router(schedule_router)
app.include_router(history_router)

@app.get("/")
def root():
    return {
        "app": "STUDY TRACKER",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
