# 📢 MAPAS Public Announcement System

## Quick Start

The Public Announcement System is now fully integrated into MAPAS! Follow these steps to get started:

### 1. **Configure MongoDB**

Your announcement system uses MongoDB to store all broadcasts. 

**Two Options:**

**Option A: Local MongoDB (Recommended for MVP)**
- MongoDB is already running on your machine
- Connection string: `mongodb://localhost:27017`
- Database name: `mapas_db`
- Collection name: `announcements`

**Option B: MongoDB Atlas (Cloud)**
- Create account at https://www.mongodb.com/cloud/atlas
- Use connection string from Atlas dashboard

### 2. **Setup Backend**

```bash
cd mapas-backend

# Create virtual environment (if first time)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy example config
copy .env.example .env

# Update .env with your MongoDB URL if needed
# Default is: MONGODB_URL=mongodb://localhost:27017

# Start backend
python main.py
```

You should see:
```
✓ Connected to MongoDB: mongodb://localhost:27017
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. **Setup Frontend**

```bash
cd mapas-dashboard

# Create environment file
copy .env.local.example .env.local

# Install dependencies (if first time)
npm install

# Start development server
npm run dev
```

### 4. **Access the System**

Open your browser and go to:
```
http://localhost:3000/dashboard/operations
```

---

## Features

### 📱 User Interface

The **Operations Control** page includes:

**Broadcast Section:**
- 📝 Custom message input (up to 500 characters)
- 🎯 Announcement type selector (Emergency / General)
- 🔊 4 quick-access predefined announcements
- 📊 Character count indicator
- ⚠️ Confirmation dialog before broadcast

**Announcement History:**
- 📋 Chronological list of all broadcasts
- 🔍 Filter by type (All / Emergency / General)
- ⏰ Timestamps for each announcement
- 🗑️ Delete individual announcements
- ↕️ Scrollable history view

### 🎙️ Announcement Types

**Emergency Announcements:**
- 🚨 Visual indicator with red badge
- Higher priority display
- Examples: "Evacuate immediately", "Danger zone", "Area restricted"

**General Announcements:**
- 📢 Standard blue badge
- Regular notifications
- Examples: "All clear", "System update", "Welcome message"

### 🔊 Audio Output

- **Offline TTS (pyttsx3)**: No internet required
- **Real-time speech synthesis**: Converts text to speech instantly
- **System speaker output**: Plays through your computer's speakers
- **Future drone integration**: Will connect to drone-mounted speakers

---

## Backend API Reference

### Broadcast Announcement

```
POST /announcements/broadcast
```

**Request:**
```json
{
  "message": "Please evacuate immediately",
  "announcement_type": "emergency",
  "triggered_by": "operator"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "message": "Please evacuate immediately",
  "announcement_type": "emergency",
  "triggered_by": "operator",
  "created_at": "2026-02-13T10:30:00Z",
  "status": "broadcasted"
}
```

### Get Announcements

```
GET /announcements?limit=50
```

### Filter by Type

```
GET /announcements/type/emergency
GET /announcements/type/general
```

### Get Specific Announcement

```
GET /announcements/{announcement_id}
```

### Delete Announcement

```
DELETE /announcements/{announcement_id}
```

---

## MongoDB Data Structure

### Announcements Collection

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "message": "Please evacuate immediately",
  "announcement_type": "emergency",
  "triggered_by": "operator",
  "created_at": ISODate("2026-02-13T10:30:00Z")
}
```

### Verify in MongoDB Compass

1. Open **MongoDB Compass**
2. Look for database: **mapas_db**
3. Look for collection: **announcements**
4. Double-click to view documents
5. Each broadcast will appear as a new document

---

## Troubleshooting

### ❌ "Cannot connect to MongoDB"

**Solution:**
1. Ensure MongoDB is running
2. Check `.env` file has correct `MONGODB_URL`
3. Default: `mongodb://localhost:27017`
4. If using MongoDB Atlas, use full connection string

### ❌ "Frontend can't reach backend"

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
2. Ensure backend is running on port 8000
3. Verify CORS is enabled (it is by default)

### ❌ "No sound when broadcasting"

**Solution:**
1. Check system volume is not muted
2. Check audio device is selected
3. Ensure pyttsx3 is installed: `pip install pyttsx3`
4. Try broadcasting again

### ❌ "Database not found"

**Solution:**
1. Open MongoDB Compass
2. Create database: **mapas_db**
3. Create collection: **announcements**
4. Or, broadcast first announcement (it creates it automatically)

---

## Configuration Files

### Backend (.env)

```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=mapas_db
MONGODB_ANNOUNCEMENTS_COLLECTION=announcements
TTS_ENGINE=pyttsx3
DEBUG=True
PORT=8000
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## System Architecture

```
Frontend (Next.js + React)
    ↓
REST API (FastAPI + Python)
    ↓
MongoDB (Document Database)
    ↓ (Also plays audio)
TTS Engine (pyttsx3)
    ↓
System Speakers
```

---

## Development

### Project Structure

```
mapas-backend/
  ├── main.py                      # FastAPI endpoints
  ├── models.py                    # Data models (including Announcement)
  ├── config.py                    # Configuration
  ├── requirements.txt             # Python dependencies
  └── services/
      ├── database.py              # MongoDB operations
      ├── tts_service.py           # Text-to-Speech
      └── face_service.py          # Face detection

mapas-dashboard/
  ├── next.config.ts
  ├── package.json
  └── src/
      ├── app/
      │   └── dashboard/
      │       └── operations/
      │           └── page.tsx      # Operations page
      └── components/
          ├── PublicAnnouncementPanel.tsx  # Announcement UI
          └── ui/                    # UI components
```

### Adding New Features

#### Add a new predefined announcement:

Edit [PublicAnnouncementPanel.tsx](./mapas-dashboard/src/components/PublicAnnouncementPanel.tsx):

```tsx
const PREDEFINED_ANNOUNCEMENTS = [
    {
        label: "Your Label",
        message: "Your message text",
        type: "emergency" // or "general"
    },
    // ... more announcements
]
```

#### Change TTS voice properties:

Edit [tts_service.py](./mapas-backend/services/tts_service.py):

```python
# Speed: 50-300 (default 150)
# Volume: 0-1 (default 1.0)
tts_service.set_voice_properties(rate=150, volume=1.0)
```

---

## Production Deployment

### For Drone Integration

When deploying to actual drone hardware:

1. **Onboard Computer**: Raspberry Pi or Jetson Nano
2. **Speaker Module**: High-volume external speaker
3. **Communication**: WebSockets or MQTT for real-time control
4. **Camera Integration**: Trigger announcements based on detected events

Example future architecture:
```
Drone Onboard Computer (Raspberry Pi)
    ├── FastAPI Backend (Local)
    ├── MongoDB (Local or Cloud)
    ├── TTS Engine
    └── Speaker Module (Connected via GPIO/I2S)
```

---

## Testing

### Manual Testing

1. **Start backend**: `python main.py`
2. **Start frontend**: `npm run dev`
3. **Navigate to**: `http://localhost:3000/dashboard/operations`
4. **Test scenarios**:
   - [ ] Broadcast custom message
   - [ ] Use predefined announcement
   - [ ] Switch between Emergency/General
   - [ ] Verify sound plays
   - [ ] Check announcement appears in history
   - [ ] Filter history by type
   - [ ] Delete announcement
   - [ ] Verify in MongoDB Compass

---

## Future Enhancements

✨ Planned Features:

- 🌐 Multi-language support
- 🎙️ Live microphone input streaming
- 📡 WebSocket/MQTT real-time communication
- 🎯 Location-based announcements
- 📹 Camera-triggered announcements (AI-based)
- 🎚️ Volume/speed controls
- 📊 Advanced analytics
- 🔔 Push notifications
- 👥 Multi-operator coordination

---

## Quick Reference Commands

```bash
# Backend
cd mapas-backend
python -m venv venv              # Create environment
.\venv\Scripts\activate          # Activate (Windows)
pip install -r requirements.txt  # Install packages
python main.py                   # Start server

# Frontend
cd mapas-dashboard
npm install                      # Install packages
npm run dev                       # Start dev server

# MongoDB
# Open MongoDB Compass
# Verify: mapas_db → announcements collection
```

---

## Getting Help

1. **Check logs**: Look for error messages in terminal
2. **Verify MongoDB**: Open MongoDB Compass, check data
3. **Check browser console**: F12 → Console tab
4. **Check network**: F12 → Network tab
5. **Read logs**: See [MONGODB_INTEGRATION.md](./mapas-backend/MONGODB_INTEGRATION.md)

---

## Support Files

- 📖 [MongoDB Integration Guide](./mapas-backend/MONGODB_INTEGRATION.md)
- ⚙️ [Backend Configuration](./mapas-backend/.env.example)
- 🎨 [Frontend Configuration](./mapas-dashboard/.env.local.example)
- 🚀 [Quick Setup Script](./setup-announcement-system.bat)

---

**Version**: MAPAS v2.4.0  
**Last Updated**: February 13, 2026  
**Status**: ✅ Ready for MVP Testing
