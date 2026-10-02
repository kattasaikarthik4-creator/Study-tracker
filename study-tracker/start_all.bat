@echo off
echo ==============================================
echo   LAUNCHING STUDY TRACKER APPLICATION
echo ==============================================
start "Study Tracker Backend (FastAPI)" cmd /c "%~dp0start_backend.bat"
timeout /t 2 /nobreak >nul
start "Study Tracker Frontend (React + Vite)" cmd /c "%~dp0start_frontend.bat"
echo.
echo Backend:  http://localhost:8000
echo Swagger:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
echo Both servers have been launched in separate windows!
pause
