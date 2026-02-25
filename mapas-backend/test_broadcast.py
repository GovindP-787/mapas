#!/usr/bin/env python
"""Test script for broadcast announcement system."""

import sys
from datetime import datetime
from config import settings
from models import Announcement
from services.database import AnnouncementRepository
from services.tts_service import get_tts_service
from logger import get_logger

log = get_logger("test_broadcast")

def test_mongodb():
    """Test MongoDB connection."""
    print("\n" + "="*60)
    print("Testing MongoDB Connection")
    print("="*60)
    try:
        repo = AnnouncementRepository()
        print(f"✓ Connected to MongoDB")
        print(f"  URL: {settings.MONGODB_URL}")
        print(f"  DB: {settings.MONGODB_DB_NAME}")
        print(f"  Collection: {settings.MONGODB_ANNOUNCEMENTS_COLLECTION}")
        
        # Try to list collections
        collections = repo.db.list_collection_names()
        print(f"  Available collections: {collections}")
        
        return repo
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return None

def test_tts():
    """Test TTS service."""
    print("\n" + "="*60)
    print("Testing TTS Service")
    print("="*60)
    try:
        tts = get_tts_service()
        print(f"✓ TTS service initialized")
        print(f"  Engine: {settings.TTS_ENGINE}")
        print(f"  Audio output dir: audio_output/")
        return tts
    except Exception as e:
        print(f"✗ TTS initialization failed: {e}")
        return None

def test_announcement_creation(repo):
    """Test creating an announcement."""
    print("\n" + "="*60)
    print("Testing Announcement Creation")
    print("="*60)
    try:
        announcement = Announcement(
            message="Test announcement from broadcast test",
            announcement_type="test",
            triggered_by="test_script"
        )
        print(f"✓ Announcement object created")
        print(f"  Message: {announcement.message}")
        print(f"  Type: {announcement.announcement_type}")
        
        # Store in MongoDB
        announcement_id = repo.create_announcement(announcement)
        print(f"✓ Stored in MongoDB")
        print(f"  ID: {announcement_id}")
        
        # Retrieve it back
        retrieved = repo.get_announcement_by_id(announcement_id)
        if retrieved:
            print(f"✓ Retrieved from MongoDB")
            print(f"  Retrieved message: {retrieved.get('message')}")
            return announcement_id, announcement
        else:
            print(f"✗ Failed to retrieve announcement")
            return None, None
    except Exception as e:
        print(f"✗ Announcement creation failed: {e}")
        import traceback
        traceback.print_exc()
        return None, None

def test_tts_playback(tts, text):
    """Test TTS playback."""
    print("\n" + "="*60)
    print("Testing TTS Playback")
    print("="*60)
    try:
        print(f"Playing: '{text}'")
        tts.text_to_speech_simple(text)
        print(f"✓ TTS playback initiated")
        return True
    except Exception as e:
        print(f"✗ TTS playback failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║" + "  MAPAS Broadcast Announcement System - Diagnostic Test  ".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")
    
    # Test MongoDB
    repo = test_mongodb()
    if not repo:
        print("\n✗ Cannot proceed without MongoDB connection")
        return 1
    
    # Test TTS
    tts = test_tts()
    if not tts:
        print("\n✗ Cannot proceed without TTS service")
        return 1
    
    # Test announcement creation
    announcement_id, announcement = test_announcement_creation(repo)
    if not announcement:
        print("\n✗ Cannot proceed without working announcement creation")
        return 1
    
    # Test TTS playback
    if not test_tts_playback(tts, announcement.message):
        print("\n✗ TTS playback failed")
        return 1
    
    print("\n" + "="*60)
    print("✓ ALL TESTS PASSED")
    print("="*60)
    print("\nBroadcast system appears to be working correctly.")
    print("If you're still experiencing issues, check:")
    print("  1. Logs in mapas-backend/logs/")
    print("  2. MongoDB Compass to verify data storage")
    print("  3. System audio output is not muted")
    return 0

if __name__ == "__main__":
    sys.exit(main())
