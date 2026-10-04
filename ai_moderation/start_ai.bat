@echo off
REM =============================================================
REM  start_ai.bat — Quick Start Script for Safe Space AI Service
REM  Double-click this file to start the AI moderation server.
REM  Requirements: Python installed, virtual environment created.
REM =============================================================

echo.
echo  =====================================================
echo   SAFE SPACE AI MODERATION SERVICE
echo   Aklan State University - Ibajay
echo  =====================================================
echo.
echo  Starting Python AI server...
echo  Do NOT close this window while using the Safe Space platform.
echo.

REM Navigate to the ai_moderation folder
cd /d "%~dp0"

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist "..\venv\Scripts\activate.bat" (
    call ..\venv\Scripts\activate.bat
) else (
    echo.
    echo  ERROR: Virtual environment not found!
    echo  Please follow the installation steps in README.md first.
    echo  Run: python -m venv venv
    echo       venv\Scripts\activate
    echo       pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM Start the FastAPI server
echo  Server starting at: http://127.0.0.1:8000
echo  API docs available: http://127.0.0.1:8000/docs
echo  Press Ctrl+C to stop the server.
echo.

python app.py

echo.
echo  Server stopped.
pause
