import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application configuration."""
    
    # API Configuration
    APP_NAME = "MAPAS Food Delivery Backend"
    APP_VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Server Configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    
    # Face Verification Settings
    FACE_DETECTION_THRESHOLD = float(os.getenv("FACE_DETECTION_THRESHOLD", "0.5"))
    FACE_VERIFICATION_THRESHOLD = float(os.getenv("FACE_VERIFICATION_THRESHOLD", "0.25"))
    FACE_DETECTION_SIZE = tuple(map(int, os.getenv("FACE_DETECTION_SIZE", "640,640").split(",")))
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://localhost:8000,http://localhost:8001,http://localhost:8002"
    ).split(",")
    
    # InsightFace Model Configuration
    INSIGHTFACE_MODEL = os.getenv("INSIGHTFACE_MODEL", "buffalo_l")
    
    # MongoDB Configuration
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "mapas_db")
    MONGODB_ANNOUNCEMENTS_COLLECTION = os.getenv("MONGODB_ANNOUNCEMENTS_COLLECTION", "announcements")
    
    # TTS Configuration
    TTS_ENGINE = os.getenv("TTS_ENGINE", "pyttsx3")  # Options: pyttsx3, gtts


settings = Settings()
