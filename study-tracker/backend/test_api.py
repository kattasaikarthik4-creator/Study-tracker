import unittest
from datetime import datetime, timedelta, date
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import Category, Subject, Chapter, Topic, StudySession, Schedule

class TestStudyTrackerAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    def test_01_categories_seeded(self):
        res = self.client.get("/api/categories")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        cat_names = [c["name"] for c in data]
        self.assertIn("GATE", cat_names)
        self.assertIn("SEMESTER", cat_names)
        self.assertIn("LABS", cat_names)

    def test_02_create_subject_chapter_topic(self):
        # 1. Get GATE category
        cats = self.client.get("/api/categories").json()
        gate_cat = next(c for c in cats if c["name"] == "GATE")

        # 2. Create Subject
        sub_res = self.client.post("/api/subjects", json={
            "category_id": gate_cat["id"],
            "name": "Theory of Computation",
            "target_hours": 40.0,
            "description": "Formal languages and automata theory"
        })
        self.assertEqual(sub_res.status_code, 201)
        sub_id = sub_res.json()["id"]

        # 3. Create Chapter
        chap_res = self.client.post("/api/chapters", json={
            "subject_id": sub_id,
            "name": "Automata",
            "target_hours": 10.0
        })
        self.assertEqual(chap_res.status_code, 201)
        chap_id = chap_res.json()["id"]

        # 4. Create Topic
        top_res = self.client.post("/api/topics", json={
            "chapter_id": chap_id,
            "name": "Finite Automata",
            "target_hours": 3.0
        })
        self.assertEqual(top_res.status_code, 201)
        top_id = top_res.json()["id"]

        # 5. Verify Syllabus endpoint returns tree
        tree_res = self.client.get("/api/syllabus")
        self.assertEqual(tree_res.status_code, 200)
        tree = tree_res.json()
        gate_tree = next(c for c in tree if c["name"] == "GATE")
        sub_names = [s["name"] for s in gate_tree["subjects"]]
        self.assertIn("Theory of Computation", sub_names)

    def test_03_study_session_validation_and_creation(self):
        cats = self.client.get("/api/categories").json()
        gate_cat = next(c for c in cats if c["name"] == "GATE")
        subs = self.client.get(f"/api/subjects/{gate_cat['id']}").json()
        sub = next(s for s in subs if s["name"] == "Theory of Computation")
        chaps = self.client.get(f"/api/chapters/{sub['id']}").json()
        chap = next(c for c in chaps if c["name"] == "Automata")
        tops = self.client.get(f"/api/topics/{chap['id']}").json()
        top = next(t for t in tops if t["name"] == "Finite Automata")

        # Invalid end time before start time
        start = datetime.now()
        end = start - timedelta(minutes=30)
        invalid_res = self.client.post("/api/study-sessions", json={
            "category_id": gate_cat["id"],
            "subject_id": sub["id"],
            "chapter_id": chap["id"],
            "topic_id": top["id"],
            "session_type": "LIVE",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        })
        self.assertEqual(invalid_res.status_code, 400)

        # Valid Live Session (1.5 hours = 5400s)
        end_valid = start + timedelta(hours=1, minutes=30)
        valid_res = self.client.post("/api/study-sessions", json={
            "category_id": gate_cat["id"],
            "subject_id": sub["id"],
            "chapter_id": chap["id"],
            "topic_id": top["id"],
            "session_type": "LIVE",
            "start_time": start.isoformat(),
            "end_time": end_valid.isoformat(),
            "duration_seconds": 5400,
            "study_date": date.today().isoformat(),
            "notes": "DFA state transition diagram practice"
        })
        self.assertEqual(valid_res.status_code, 201)
        self.assertEqual(valid_res.json()["duration_seconds"], 5400)

    def test_04_performance_calculation(self):
        res = self.client.get("/api/performance/gate")
        self.assertEqual(res.status_code, 200)
        gate_perf = res.json()
        self.assertGreater(gate_perf["spent_seconds"], 0)
        self.assertGreater(gate_perf["progress_percent"], 0)
        self.assertEqual(gate_perf["name"], "GATE")

    def test_05_schedule_and_history(self):
        # Schedule slot
        sch_res = self.client.post("/api/schedule", json={
            "title": "Evening Gate Revision",
            "day": "Monday",
            "start_time": "18:00",
            "end_time": "19:30",
            "notes": "Solve PYQs"
        })
        self.assertEqual(sch_res.status_code, 201)
        sch_id = sch_res.json()["id"]

        # History
        hist_res = self.client.get("/api/history/7-days")
        self.assertEqual(hist_res.status_code, 200)
        hist = hist_res.json()
        self.assertGreater(hist["total_seconds"], 0)
        self.assertIn("GATE", hist["category_summaries"])

        # Delete schedule
        del_res = self.client.delete(f"/api/schedule/{sch_id}")
        self.assertEqual(del_res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
