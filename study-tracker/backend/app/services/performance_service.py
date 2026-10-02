from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Category, Subject, Chapter, Topic, StudySession
from ..schemas.performance import (
    TopicPerformance,
    ChapterPerformance,
    SubjectPerformance,
    CategoryPerformance,
)

def format_duration(seconds: int) -> str:
    if seconds <= 0:
        return "0m"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0 and minutes > 0:
        return f"{hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h"
    else:
        return f"{minutes}m"

def format_last_studied(dt: Optional[datetime]) -> Optional[str]:
    if not dt:
        return None
    now = datetime.now()
    diff = now.date() - dt.date()
    if diff.days == 0:
        return "Today"
    elif diff.days == 1:
        return "Yesterday"
    elif diff.days < 7:
        return f"{diff.days} days ago"
    else:
        return dt.strftime("%b %d, %Y")

def calculate_topic_performance(db: Session, topic: Topic) -> TopicPerformance:
    res = db.query(
        func.coalesce(func.sum(StudySession.duration_seconds), 0),
        func.count(StudySession.id),
        func.max(StudySession.start_time)
    ).filter(StudySession.topic_id == topic.id).first()

    spent_seconds = int(res[0])
    session_count = int(res[1])
    last_studied_dt = res[2]

    spent_hours = round(spent_seconds / 3600.0, 2)
    target_hours = float(topic.target_hours) if topic.target_hours else 0.0

    target_seconds = int(target_hours * 3600)
    remaining_seconds = max(0, target_seconds - spent_seconds)
    remaining_hours = round(remaining_seconds / 3600.0, 2)

    progress_percent = 0.0
    if target_hours > 0:
        progress_percent = min(100.0, round((spent_hours / target_hours) * 100.0, 1))

    return TopicPerformance(
        id=topic.id,
        name=topic.name,
        chapter_id=topic.chapter_id,
        target_hours=target_hours,
        spent_seconds=spent_seconds,
        spent_hours=spent_hours,
        spent_formatted=format_duration(spent_seconds),
        remaining_seconds=remaining_seconds,
        remaining_hours=remaining_hours,
        remaining_formatted=format_duration(remaining_seconds),
        progress_percent=progress_percent,
        session_count=session_count,
        last_studied=format_last_studied(last_studied_dt),
    )

def calculate_chapter_performance(db: Session, chapter: Chapter) -> ChapterPerformance:
    res = db.query(
        func.coalesce(func.sum(StudySession.duration_seconds), 0),
        func.count(StudySession.id),
        func.max(StudySession.start_time)
    ).filter(StudySession.chapter_id == chapter.id).first()

    spent_seconds = int(res[0])
    session_count = int(res[1])
    last_studied_dt = res[2]

    topics = db.query(Topic).filter(Topic.chapter_id == chapter.id).all()
    topic_performances = [calculate_topic_performance(db, t) for t in topics]

    # Target hours: use chapter target_hours if set > 0, else sum of topic targets
    target_hours = float(chapter.target_hours) if chapter.target_hours and chapter.target_hours > 0 else sum(t.target_hours for t in topic_performances)

    spent_hours = round(spent_seconds / 3600.0, 2)
    target_seconds = int(target_hours * 3600)
    remaining_seconds = max(0, target_seconds - spent_seconds)
    remaining_hours = round(remaining_seconds / 3600.0, 2)

    progress_percent = 0.0
    if target_hours > 0:
        progress_percent = min(100.0, round((spent_hours / target_hours) * 100.0, 1))

    return ChapterPerformance(
        id=chapter.id,
        name=chapter.name,
        subject_id=chapter.subject_id,
        target_hours=target_hours,
        spent_seconds=spent_seconds,
        spent_hours=spent_hours,
        spent_formatted=format_duration(spent_seconds),
        remaining_seconds=remaining_seconds,
        remaining_hours=remaining_hours,
        remaining_formatted=format_duration(remaining_seconds),
        progress_percent=progress_percent,
        session_count=session_count,
        last_studied=format_last_studied(last_studied_dt),
        topics=topic_performances,
    )

def calculate_subject_performance(db: Session, subject: Subject) -> SubjectPerformance:
    res = db.query(
        func.coalesce(func.sum(StudySession.duration_seconds), 0),
        func.count(StudySession.id),
        func.max(StudySession.start_time)
    ).filter(StudySession.subject_id == subject.id).first()

    spent_seconds = int(res[0])
    session_count = int(res[1])
    last_studied_dt = res[2]

    chapters = db.query(Chapter).filter(Chapter.subject_id == subject.id).all()
    chapter_performances = [calculate_chapter_performance(db, c) for c in chapters]

    # Target hours: use subject target_hours if set > 0, else sum of chapter targets
    target_hours = float(subject.target_hours) if subject.target_hours and subject.target_hours > 0 else sum(c.target_hours for c in chapter_performances)

    spent_hours = round(spent_seconds / 3600.0, 2)
    target_seconds = int(target_hours * 3600)
    remaining_seconds = max(0, target_seconds - spent_seconds)
    remaining_hours = round(remaining_seconds / 3600.0, 2)

    progress_percent = 0.0
    if target_hours > 0:
        progress_percent = min(100.0, round((spent_hours / target_hours) * 100.0, 1))

    return SubjectPerformance(
        id=subject.id,
        name=subject.name,
        category_id=subject.category_id,
        description=subject.description,
        target_hours=target_hours,
        spent_seconds=spent_seconds,
        spent_hours=spent_hours,
        spent_formatted=format_duration(spent_seconds),
        remaining_seconds=remaining_seconds,
        remaining_hours=remaining_hours,
        remaining_formatted=format_duration(remaining_seconds),
        progress_percent=progress_percent,
        session_count=session_count,
        last_studied=format_last_studied(last_studied_dt),
        chapters=chapter_performances,
    )

def calculate_category_performance(db: Session, category: Category) -> CategoryPerformance:
    res = db.query(
        func.coalesce(func.sum(StudySession.duration_seconds), 0),
        func.count(StudySession.id),
        func.max(StudySession.start_time)
    ).filter(StudySession.category_id == category.id).first()

    spent_seconds = int(res[0])
    session_count = int(res[1])
    last_studied_dt = res[2]

    subjects = db.query(Subject).filter(Subject.category_id == category.id).all()
    subject_performances = [calculate_subject_performance(db, s) for s in subjects]

    target_hours = sum(s.target_hours for s in subject_performances)
    spent_hours = round(spent_seconds / 3600.0, 2)
    target_seconds = int(target_hours * 3600)
    remaining_seconds = max(0, target_seconds - spent_seconds)
    remaining_hours = round(remaining_seconds / 3600.0, 2)

    progress_percent = 0.0
    if target_hours > 0:
        progress_percent = min(100.0, round((spent_hours / target_hours) * 100.0, 1))

    return CategoryPerformance(
        id=category.id,
        name=category.name,
        target_hours=target_hours,
        spent_seconds=spent_seconds,
        spent_hours=spent_hours,
        spent_formatted=format_duration(spent_seconds),
        remaining_seconds=remaining_seconds,
        remaining_hours=remaining_hours,
        remaining_formatted=format_duration(remaining_seconds),
        progress_percent=progress_percent,
        session_count=session_count,
        last_studied=format_last_studied(last_studied_dt),
        subjects=subject_performances,
    )
