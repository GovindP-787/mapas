# Troubleshooting Broadcast Announcement Failures

## Issues Fixed ✅
1. **Removed duplicate `.env` entries** that were causing MongoDB configuration conflicts
2. **Improved TTS text escaping** to handle special characters properly
3. **Enhanced error reporting** in frontend with detailed console logs

---

## If Broadcasts Still Fail

### Step 1: Check Backend Status
```powershell
cd "d:\vibe ui\mapas-backend"
python main.py
```

Look for these messages in the startup logs:
- ✓ MongoDB connection ready
- ✓ Text-to-Speech service ready

### Step 2: Check Browser Console (F12)
Open the browser's developer console and look for detailed error messages:
- Network tab: Check if the POST request to `/announcements/broadcast` is being sent
- Console tab: Look for logged errors with specific details

### Step 3: Run Backend Diagnostic Test
```powershell
cd "d:\vibe ui\mapas-backend"
python test_broadcast.py
```

This will verify:
- MongoDB connectivity
- TTS service status
- Announcement storage
- Audio playback initiation

### Step 4: Check MongoDB Data
1. Open MongoDB Compass
2. Navigate to database: `MAPAS`
3. Check collection: `Announcement`
4. Verify recent announcements are being stored

### Step 5: Verify System Audio
- Open Windows Settings → Sound
- Ensure volume is not muted
- Check that audio output device is properly configured

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to connect to MongoDB` | MongoDB not running | Start MongoDB service |
| `HTTP 500: Error broadcasting announcement` | Backend server error | Check backend logs in `mapas-backend/logs/` |
| `HTTP connection refused` | Backend not running | Start backend with `python main.py` |
| `CORS error` | Frontend/backend port mismatch | Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000` |
| `No audio heard` | System audio muted or no speakers | Check Windows audio settings |

---

## Log Files to Check

### Backend Logs
- Location: `mapas-backend/logs/mapas_backend_*.log`
- Look for: `Error broadcasting announcement` or `Error in subprocess`

### Frontend Console
- Press F12 in browser
- Check Console tab for error details
- Look for network requests to `/announcements/broadcast`

---

## Quick Reset If Issues Persist

```powershell
# 1. Stop running services (Ctrl+C)

# 2. Clean Python cache
cd "d:\vibe ui\mapas-backend"
Remove-Item -Recurse -Force __pycache__
Remove-Item -Recurse -Force .pytest_cache

# 3. Reinstall dependencies
pip install --force-reinstall -r requirements.txt -q

# 4. Restart backend
python main.py

# 5. Reload frontend (Ctrl+Shift+R in browser)
```

---

## Still Having Issues?

1. **Collect diagnostic info:**
   ```powershell
   python test_broadcast.py  # Save output
   # Check logs in mapas-backend/logs/
   # Open browser F12 console and try broadcast again
   ```

2. **Share the following:**
   - Error message from browser console (F12)
   - Error message from backend logs
   - Output of `python test_broadcast.py`

3. **Windows-Specific Notes:**
   - Ensure pyttsx3 has required SAPI5 drivers installed
   - Check Windows audio service is running: `Get-Service -Name "Windows Audio"`
