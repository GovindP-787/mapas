# Installation & Setup Guide

Complete step-by-step guide for setting up the MAPAS Backend.

## Prerequisites

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **pip** (included with Python)
- **~500MB disk space** (for dependencies and models)
- **~2GB RAM** for runtime

## Option 1: Automated Setup (Recommended)

### Windows
```bash
cd mapas-backend
setup.bat
```

The script will:
1. ✓ Check Python installation
2. ✓ Create virtual environment
3. ✓ Activate environment
4. ✓ Upgrade pip
5. ✓ Install all dependencies

### Linux/macOS
```bash
cd mapas-backend
chmod +x setup.sh
./setup.sh
```

---

## Option 2: Manual Setup

### Step 1: Create Virtual Environment

**Windows:**
```bash
cd mapas-backend
python -m venv venv
```

**Linux/macOS:**
```bash
cd mapas-backend
python3 -m venv venv
```

### Step 2: Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/macOS:**
```bash
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal line.

### Step 3: Upgrade pip

**All Platforms:**
```bash
pip install --upgrade pip
```

### Step 4: Install Dependencies

**All Platforms:**
```bash
pip install -r requirements.txt
```

This installs:
- fastapi (web framework)
- uvicorn (ASGI server)
- insightface (face detection)
- onnxruntime (model inference)
- opencv-python (image processing)
- numpy (numerical computing)
- scipy (similarity calculations)
- python-multipart (file uploads)
- python-dotenv (config management)
- pydantic (data validation)

---

## Verify Installation

### Check Python
```bash
python --version
```
Should show: Python 3.10.x or higher

### Check pip
```bash
pip --version
```

### Check Virtual Environment
```bash
pip list
```
Should show all installed packages

### Test Import
```bash
python -c "import fastapi; import insightface; print('✓ All imports successful')"
```

---

## First Run

### Start the Backend

From the `mapas-backend` directory with virtual environment activated:

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Verify Backend is Running

Open in your browser:
```
http://localhost:8000/docs
```

You should see the Swagger API documentation.

### Test Health Endpoint

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "MAPAS Food Delivery Backend",
  "version": "1.0.0"
}
```

---

## Configuration

The backend uses `.env` for configuration. Key settings:

```env
# Server
HOST=0.0.0.0        # Listen on all interfaces
PORT=8000           # Server port

# Face Verification
FACE_VERIFICATION_THRESHOLD=0.45    # Lower = lenient, Higher = strict

# CORS (Frontend Access)
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### To Customize:

1. Open `.env` in a text editor
2. Modify settings as needed
3. Save file
4. Restart backend (`Ctrl+C` then `python main.py`)

---

## Troubleshooting

### Issue: Python not found
**Solution:** 
- Install Python 3.10+ from https://www.python.org/
- Add Python to PATH during installation
- Restart terminal after install

### Issue: pip command not found
**Solution:**
- Ensure Python installed correctly
- Try: `python -m pip` instead of `pip`
- Restart terminal

### Issue: Virtual environment not activating
**Windows:** Try `venv\Scripts\activate.bat` instead
**Linux/Mac:** Ensure you ran `chmod +x setup.sh`

### Issue: InsightFace/ONNX errors
**Solution:**
```bash
pip install --force-reinstall onnxruntime
pip install --force-reinstall insightface
```

### Issue: Port 8000 already in use
**Solution:**
1. Edit `.env` and change `PORT=8001`
2. Restart backend
3. Access at `http://localhost:8001`

### Issue: CORS errors when calling from frontend
**Solution:**
1. Edit `.env`
2. Add your frontend URL to `CORS_ORIGINS`
3. Example: `CORS_ORIGINS=http://localhost:3000,http://localhost:8000`
4. Restart backend

---

## Development vs Production

### Development Mode (Default)
```bash
python main.py
```
- Auto-reloads on code changes
- Debug output visible
- Slower startup

### Production Mode
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
- No auto-reload
- 4 worker processes
- Better performance

### Docker Deployment
```bash
docker build -t mapas-backend .
docker run -p 8000:8000 mapas-backend
```

---

## Next Steps

1. **Read Documentation:**
   - Start with [INDEX.md](INDEX.md) for overview
   - [README.md](README.md) for full details
   - [QUICKSTART.md](QUICKSTART.md) for quick reference

2. **Test the API:**
   - Open http://localhost:8000/docs in browser
   - Try the endpoints interactively
   - Read [TESTING.md](TESTING.md) for comprehensive tests

3. **Integrate with Frontend:**
   - See [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
   - Examples in Python, JavaScript, TypeScript

4. **Customize Configuration:**
   - Edit `.env` for your needs
   - Set face verification threshold
   - Add frontend CORS origins

---

## System Requirements

### Minimum
- Python 3.10
- 2GB RAM
- 500MB disk space
- CPU with SSE4.1 support

### Recommended
- Python 3.10+
- 4GB+ RAM
- 1GB disk space
- Modern multi-core processor

### Operating Systems
- ✓ Windows 10/11
- ✓ macOS (Intel/ARM)
- ✓ Ubuntu 20.04+
- ✓ CentOS 7+
- ✓ Other Linux distributions

---

## Getting Help

If you encounter issues:

1. **Check logs** - Terminal output shows errors
2. **Review README.md** - Troubleshooting section
3. **Test endpoints** - Use Swagger UI at /docs
4. **Verify dependencies** - Run `pip list`

---

## Quick Commands Reference

```bash
# Activate environment
source venv/bin/activate  (Linux/Mac)
venv\Scripts\activate     (Windows)

# Deactivate environment
deactivate

# Start backend
python main.py

# View installed packages
pip list

# Upgrade package
pip install --upgrade <package_name>

# Install from requirements
pip install -r requirements.txt

# See help
python main.py --help
```

---

## Installation Complete ✓

You're ready to use MAPAS Backend!

**Next:** Read [QUICKSTART.md](QUICKSTART.md) for API usage examples.
