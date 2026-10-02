@echo off
echo Starting Study Tracker Backend on http://localhost:8000 ...
cd /d "%~dp0\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
