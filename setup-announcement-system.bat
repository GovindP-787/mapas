@echo off
REM MAPAS Public Announcement System - Quick Setup Script
REM This script sets up MongoDB connections and installs dependencies

echo.
echo ============================================
echo MAPAS Public Announcement System Setup
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and add it to PATH
    pause
    exit /b 1
)

echo [1/4] Checking Python installation...
python --version
echo ✓ Python found
echo.

REM Navigate to backend directory
cd mapas-backend

echo [2/4] Installing Python dependencies...
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt
echo ✓ Dependencies installed
echo.

echo [3/4] Checking MongoDB connection...
python -c "from services.database import MongoDBClient; client = MongoDBClient(); print('✓ Connected to MongoDB: ' + client.db.name)" 2>nul
if errorlevel 1 (
    echo ✗ MongoDB connection failed
    echo.
    echo IMPORTANT: MongoDB Connection Setup Required
    echo.
    echo 1. Open MongoDB Compass
    echo 2. Verify you have a database named 'mapas_db'
    echo 3. Create a collection named 'announcements'
    echo 4. Check your .env file has correct MONGODB_URL
    echo.
    echo Default connection: mongodb://localhost:27017
    echo.
    echo For details, see: MONGODB_INTEGRATION.md
    pause
) else (
    echo ✓ MongoDB connected
    echo.
)

echo [4/4] Setup complete!
echo.
echo ============================================
echo Next Steps:
echo ============================================
echo.
echo 1. Ensure .env file is configured (see .env.example)
echo 2. Ensure MongoDB is running
echo 3. Start backend: python main.py
echo 4. Start frontend: npm run dev (in mapas-dashboard)
echo.
echo Open dashboard at: http://localhost:3000/dashboard/operations
echo.
pause
