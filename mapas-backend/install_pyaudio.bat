@echo off
REM PyAudio Installation Script for Windows
REM This script handles the installation of PyAudio which requires special handling

echo.
echo ============================================
echo PyAudio Setup for MAPAS Audio Streaming
echo ============================================
echo.

REM Check if virtual environment is activated
if not defined VIRTUAL_ENV (
    echo ERROR: Virtual environment not activated
    echo Please run: venv\Scripts\activate.bat
    pause
    exit /b 1
)

echo [1/3] Installing PyAudio wheel (pre-built)...

REM Try to install from wheel first (no compilation needed)
python -m pip install --upgrade pip setuptools wheel
python -m pip install pipwin --quiet

if errorlevel 1 (
    echo WARNING: pipwin installation failed, trying direct pip install...
) else (
    echo Attempting to install PyAudio via pipwin...
    pipwin install pyaudio
    
    if errorlevel 1 (
        echo WARNING: pipwin install failed, trying alternative method...
    ) else (
        echo.
        echo ============================================
        echo ✓ PyAudio installed successfully via pipwin!
        echo ============================================
        pause
        exit /b 0
    )
)

echo.
echo [2/3] Trying pip direct installation...
python -m pip install pyaudio --no-cache-dir

if errorlevel 1 (
    echo.
    echo ERROR: PyAudio installation failed!
    echo.
    echo SOLUTION OPTION 1: Download pre-compiled wheel
    echo 1. Visit: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
    echo 2. Download matching your Python version (e.g., PyAudio-0.2.13-cp311-cp311-win_amd64.whl)
    echo 3. Run: pip install path\to\PyAudio-0.2.13-cp311-cp311-win_amd64.whl
    echo.
    echo SOLUTION OPTION 2: Skip PyAudio (use Web Audio API only)
    echo - Audio streaming will use browser's Web Audio API
    echo - System devices still available for other features
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Verifying PyAudio installation...
python -c "import pyaudio; print('✓ PyAudio imported successfully'); pa = pyaudio.PyAudio(); print(f'✓ Found {pa.get_device_count()} audio devices'); pa.terminate()"

if errorlevel 1 (
    echo ERROR: PyAudio verification failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✓ PyAudio setup completed successfully!
echo ============================================
echo.
pause
