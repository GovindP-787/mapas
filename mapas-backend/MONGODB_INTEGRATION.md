# Public Announcement System - MongoDB Integration Guide

## Overview

The Public Announcement System uses MongoDB to store all broadcast announcements. This guide explains how to integrate your local MongoDB instance with the MAPAS backend.

---

## Prerequisites

✅ **MongoDB Compass installed** (you already have this)  
✅ **MongoDB database created** (you already have this)  
✅ **Python 3.8+** with FastAPI and pymongo  

---

## Step 1: Configure MongoDB Connection

### 1.1 Get Your MongoDB Connection String

Since you have MongoDB Compass installed locally, your MongoDB is likely running on the default local instance.

**Default MongoDB Connection String:**
```
mongodb://localhost:27017
```

If you're using MongoDB Atlas (cloud):
```
mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

### 1.2 Update `.env` File

In the `mapas-backend` directory, create or update your `.env` file:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=mapas_db
MONGODB_ANNOUNCEMENTS_COLLECTION=announcements

# Optional: TTS Engine (pyttsx3 for offline, gtts for online)
TTS_ENGINE=pyttsx3

# Other existing configuration...
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

---

## Step 2: Find Your MongoDB Connection Details

### Using MongoDB Compass:

1. **Open MongoDB Compass**
2. **Click "New Connection"** on the home screen
3. **Check if you're already connected** - you should see your connection details at the top
4. **Local instance** typically shows: `mongodb://localhost:27017`

### Connection String Format:
```
mongodb://[user]:[password]@[host]:[port]/[database]
```

---

## Step 3: Create Database & Collection in MongoDB Compass

### 3.1 Create Database

1. Open MongoDB Compass
2. Click **"+ Create Database"** button on the left
3. Enter:
   - **Database Name:** `mapas_db`
   - **Collection Name:** `announcements`
4. Click **"Create Database"**

### 3.2 Verify Collection Creation

The collection will be created automatically when the first announcement is added. You can verify it in MongoDB Compass:

```
mapas_db
  └── announcements (collection)
```

---

## Step 4: Install Required Python Packages

Run the following commands in your `mapas-backend` directory:

```bash
# Activate your Python environment (if using venv)
python -m venv venv
.\venv\Scripts\activate  # On Windows

# Install dependencies (including MongoDB driver)
pip install -r requirements.txt
```

The `requirements.txt` has been updated with:
- **pymongo==4.6.1** - MongoDB Python driver
- **pyttsx3==2.90** - Text-to-Speech engine
- **python-dateutil==2.8.2** - Date utilities

---

## Step 5: Test MongoDB Connection

### 5.1 Run a Quick Test

Create a test script to verify MongoDB connection. In the `mapas-backend` directory, create `test_mongodb.py`:

```python
from services.database import MongoDBClient

try:
    client = MongoDBClient()
    db = client.get_db()
    print("✓ Connected to MongoDB successfully!")
    print(f"Database: {db.name}")
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"✗ Connection failed: {e}")
```

Run it:
```bash
python test_mongodb.py
```

You should see:
```
✓ Connected to MongoDB successfully!
Database: mapas_db
Collections: ['announcements']
```

---

## Step 6: Start the Backend Server

```bash
python main.py
```

You should see:
```
✓ Connected to MongoDB: mongodb://localhost:27017
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 7: Configure Frontend API URL

In the `mapas-dashboard` directory, create or update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This tells the frontend where the backend API is running.

---

## API Endpoints

Once the system is running, you can use these endpoints:

### Broadcast Announcement
```http
POST /announcements/broadcast
Content-Type: application/json

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
```http
GET /announcements?limit=50
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "message": "Please evacuate immediately",
    "announcement_type": "emergency",
    "triggered_by": "operator",
    "created_at": "2026-02-13T10:30:00Z"
  },
  ...
]
```

### Filter by Type
```http
GET /announcements/type/emergency
GET /announcements/type/general
```

### Get Specific Announcement
```http
GET /announcements/{announcement_id}
```

### Delete Announcement
```http
DELETE /announcements/{announcement_id}
```

---

## MongoDB Database Schema

The announcements collection stores documents with this structure:

```javascript
{
  "_id": ObjectId("..."),
  "message": "Please evacuate immediately",
  "announcement_type": "emergency",
  "triggered_by": "operator",
  "created_at": ISODate("2026-02-13T10:30:00Z")
}
```

### Field Descriptions:
- **_id**: Unique MongoDB object ID (auto-generated)
- **message**: The announcement text (max 500 characters)
- **announcement_type**: "emergency" or "general"
- **triggered_by**: "operator" (future: or "automated")
- **created_at**: ISO timestamp of when announcement was created

---

## Verification Checklist

Follow these steps to verify everything is working:

- [ ] MongoDB is running locally
- [ ] Database `mapas_db` exists
- [ ] Collection `announcements` exists
- [ ] `.env` file is configured with `MONGODB_URL`
- [ ] Python packages installed (`pymongo`, `pyttsx3`)
- [ ] Backend server starts without connection errors
- [ ] Frontend can reach the backend API
- [ ] Can broadcast announcements from dashboard
- [ ] Announcements appear in MongoDB history
- [ ] Audio plays through system speakers

---

## Troubleshooting

### "Connection refused" Error
```
✗ Failed to connect to MongoDB: [Errno 10061]
```

**Solution:**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify port 27017 is available

### "Database not found" Error
**Solution:**
- Create the database using MongoDB Compass
- Database will also be created on first announcement

### "TTS Engine Error"
```
pyttsx3.driver.EngineDelegate: Error calling onVoicesChanged
```

**Solution:**
- This is a non-critical warning on Windows
- Audio will still play correctly
- Install Microsoft Speech Platform SDK if needed

### Frontend Can't Reach API
**Solution:**
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running on the configured port
- Check CORS settings in backend

---

## Optional: Use MongoDB Atlas (Cloud)

If you want to use MongoDB Atlas instead of local MongoDB:

1. **Create Atlas Account** at https://www.mongodb.com/cloud/atlas
2. **Create a Cluster**
3. **Get Connection String** from Atlas dashboard
4. **Update `.env`:**
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=mapas_db
   ```

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js Dashboard)                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ PublicAnnouncementPanel Component              │ │
│  │ - Input custom messages                        │ │
│  │ - Select predefined announcements              │ │
│  │ - View broadcast history                       │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP REST API (port 3000)
                       ↓
┌─────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                  │
│  ┌────────────────────────────────────────────────┐ │
│  │ /announcements/broadcast (POST)                │ │
│  │ /announcements (GET)                           │ │
│  │ /announcements/type/{type} (GET)               │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ TTS Service (pyttsx3)                          │ │
│  │ - Converts text to speech                      │ │
│  │ - Plays through system speakers                │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ MongoDB Connection (port 27017)
                       ↓
┌─────────────────────────────────────────────────────┐
│  MongoDB (Local/Atlas)                              │
│  ┌────────────────────────────────────────────────┐ │
│  │ mapas_db                                       │ │
│  │  └── announcements (collection)                │ │
│  │      └── {announcement documents}              │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Configure MongoDB connection
2. ✅ Install Python packages
3. ✅ Start backend server
4. ✅ Start frontend dashboard
5. 📍 Navigate to `/dashboard/operations` page
6. 📍 Test broadcasting announcements
7. 📍 Verify announcements appear in MongoDB Compass

---

## Support

For issues or questions:

1. **Check MongoDB Compass** - Verify data is being stored
2. **Check Backend Logs** - Look for connection errors
3. **Check Browser Console** - Look for API errors
4. **Verify `.env` files** - Ensure connection strings are correct

---

**Last Updated:** February 13, 2026  
**System Version:** MAPAS v2.4.0
