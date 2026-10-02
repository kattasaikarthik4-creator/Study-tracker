# STUDY TRACKER — Academic Study Tracking Application

A production-style full-stack academic study tracking application designed for rigorous preparation across **GATE**, **SEMESTER**, and **LABS**.

---

## 📌 Key Architectural Principles

- **Zero Hardcoded Syllabus**: No subjects, chapters, or topics are pre-loaded. You define your complete academic structure dynamically through the **Syllabus** page.
- **Zero Hardcoded Study Hours**: Study hours are computed dynamically from stored **Live Sessions** (tracked via interactive stopwatch timer) and **Logged Sessions** (manually recorded).
- **Persistent Global Timer**: The live timer persists in local storage across browser refreshes and page navigations, so your focus session is never lost.
- **Dynamic Performance & History**: Real-time aggregation of spent time, target completion percentages, remaining hours, and weekly category timelines using **Recharts**.

---

## 🏗️ Tech Stack & Architecture

```
Frontend (React 19 + Vite 8 + Tailwind CSS v4 + Recharts)
   │
   ▼ REST API (HTTP / JSON / CORS Enabled)
Backend (Python 3.14 + FastAPI + Pydantic v2)
   │
   ▼ SQLAlchemy ORM 2.x
Database (SQLite: study_tracker.db)
```

- **Frontend**:
  - React 19 + Vite 8
  - Tailwind CSS v4
  - React Router DOM v7
  - Recharts for stacked timeline & target-vs-actual analytics
  - Lucide React for modern icons
  - Global `TimerContext` with local storage recovery

- **Backend**:
  - Python 3.14
  - FastAPI
  - Pydantic v2
  - SQLAlchemy 2.x ORM
  - Uvicorn ASGI Server

- **Database**:
  - SQLite (`study_tracker.db`)

---

## 📁 Project Structure

```
study-tracker/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── apiClient.js
│   │   │   ├── categoryApi.js
│   │   │   ├── subjectApi.js
│   │   │   ├── chapterApi.js
│   │   │   ├── topicApi.js
│   │   │   ├── syllabusApi.js
│   │   │   ├── studySessionApi.js
│   │   │   ├── performanceApi.js
│   │   │   ├── scheduleApi.js
│   │   │   └── historyApi.js
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ActiveTimerBanner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   ├── context/
│   │   │   └── TimerContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Sessions.jsx
│   │   │   ├── Syllabus.jsx
│   │   │   ├── Performance.jsx
│   │   │   ├── WeeklySchedule.jsx
│   │   │   └── History.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models/
│   │   │   ├── category.py
│   │   │   ├── subject.py
│   │   │   ├── chapter.py
│   │   │   ├── topic.py
│   │   │   ├── study_session.py
│   │   │   ├── schedule.py
│   │   │   └── daily_target.py
│   │   ├── schemas/
│   │   │   ├── category.py
│   │   │   ├── subject.py
│   │   │   ├── chapter.py
│   │   │   ├── topic.py
│   │   │   ├── study_session.py
│   │   │   ├── schedule.py
│   │   │   ├── performance.py
│   │   │   └── history.py
│   │   ├── routers/
│   │   │   ├── categories.py
│   │   │   ├── subjects.py
│   │   │   ├── chapters.py
│   │   │   ├── topics.py
│   │   │   ├── study_sessions.py
│   │   │   ├── syllabus.py
│   │   │   ├── performance.py
│   │   │   ├── schedule.py
│   │   │   └── history.py
│   │   └── services/
│   │       ├── performance_service.py
│   │       └── history_service.py
│   ├── requirements.txt
│   ├── .env.example
│   └── test_api.py
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup

1. Open a terminal in the `study-tracker/backend` folder:
   ```powershell
   cd study-tracker/backend
   ```
2. (Optional) Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - **Backend API URL**: `http://localhost:8000`
   - **Interactive API Documentation (Swagger)**: `http://localhost:8000/docs`

---

### 2. Frontend Setup

1. Open another terminal in the `study-tracker/frontend` folder:
   ```powershell
   cd study-tracker/frontend
   ```
2. Install frontend dependencies:
   ```powershell
   npm install
   ```
3. Verify environment configuration:
   The `.env` file points to the backend:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the frontend development server:
   ```powershell
   npm run dev
   ```
   - **Frontend App URL**: `http://localhost:5173`

---

## 🧭 Step-by-Step User Workflow

### Step 1: Create Your Syllabus
1. Navigate to **Syllabus** from the left sidebar.
2. Select your category tab: **GATE**, **SEMESTER**, or **LABS**.
3. Click **+ ADD SUBJECT**, specify the Subject Name (e.g., `Theory of Computation`) and Target Hours (e.g., `40`).
4. Under the newly created Subject, click **+ Add Chapter** (e.g., `Automata`, target: `10h`).
5. Under that Chapter, click **+ Add Topic** (e.g., `Finite Automata`, target: `3h`).
6. You can edit, delete, search, and expand/collapse any level in the tree at any time.

### Step 2: Track Live Study Sessions
1. Navigate to **Sessions**.
2. Select **START SESSION**.
3. Pick your **Category → Subject → Chapter → Topic** from the dynamic cascading dropdowns.
4. Click **START**.
5. The timer begins (`00:00:01`, `00:00:02`...).
6. You can freely navigate to **Home**, **Syllabus**, **Performance**, **Weekly Schedule**, or **History** without interrupting the timer!
7. The active session banner remains visible at the top of every page with **Pause**, **Resume**, and **Stop** buttons.
8. Click **STOP**, enter optional notes, and click **Save Study Session**.
9. The session duration is automatically saved to SQLite with type `LIVE`.

### Step 3: Log Offline Sessions
1. In **Sessions**, select **LOG SESSION**.
2. Select your Category, Subject, Chapter, and Topic.
3. Choose the Study Date, Start Time (e.g., `08:00 AM`), and End Time (e.g., `09:30 AM`).
4. Click **SAVE SESSION**.
5. End time earlier than start time is rejected with clear validation alerts.

### Step 4: Review Performance Analytics
1. Navigate to **Performance**.
2. Switch between **GATE**, **SEMESTER**, and **LABS**.
3. Review high-level category cards: Total Studied, Target Goal, Remaining Time, and Progress %.
4. View the **Target vs Actual** Bar Chart and **Category Time Distribution** Donut Chart.
5. Drill down into any Subject to view Chapter progress, and drill into any Chapter to inspect Topic-level progress.

### Step 5: Organize Your Weekly Schedule
1. Navigate to **Weekly Schedule**.
2. View the full 7-day timetable grid (Monday – Sunday).
3. Click **+ ADD SCHEDULE** to plan a study slot with category/subject/topic linking.
4. Edit, move, or delete slots dynamically.

### Step 6: Explore Historical Logs
1. Navigate to **History**.
2. View 7-Day, 30-Day, or Custom range totals.
3. Inspect the stacked bar chart showing daily study hours broken down across GATE, SEMESTER, and LABS.
4. Filter historical tables by Category (**ALL**, **GATE**, **SEMESTER**, **LABS**) and inspect exact session timestamps.

---

## 🧮 How Calculations Work

- **Topic Spent Time**: $\sum \text{session durations where topic\_id} = \text{topic.id}$
- **Chapter Spent Time**: $\sum \text{session durations where chapter\_id} = \text{chapter.id}$
- **Subject Spent Time**: $\sum \text{session durations where subject\_id} = \text{subject.id}$
- **Category Spent Time**: $\sum \text{session durations where category\_id} = \text{category.id}$
- **Target Hours**: User-specified target hours on syllabus topics/chapters/subjects.
- **Progress %**: $\min\left(100\%, \frac{\text{Spent Hours}}{\text{Target Hours}} \times 100\right)$
- **Remaining Time**: $\max(0, \text{Target Seconds} - \text{Spent Seconds})$

---

## 🧪 Testing

The backend includes an automated test suite verifying category seeding, syllabus creation, session validation, performance math, schedule CRUD, and history aggregation:

```powershell
cd study-tracker/backend
python test_api.py
```
