"""Logging configuration for MAPAS backend."""

import logging
import sys
from pathlib import Path
from datetime import datetime

# Create logs directory
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Create log filename with timestamp
LOG_FILE = LOGS_DIR / f"mapas_backend_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

def setup_logging():
    """Configure logging to both file and console."""
    
    # Create logger
    logger = logging.getLogger("mapas")
    logger.setLevel(logging.DEBUG)
    
    # Clear existing handlers
    logger.handlers = []
    
    # Log format
    log_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # File handler
    try:
        file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(log_format)
        logger.addHandler(file_handler)
        print(f"[OK] Logging to file: {LOG_FILE}")
    except Exception as e:
        print(f"[ERROR] Error setting up file logging: {e}")
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(log_format)
    logger.addHandler(console_handler)
    
    return logger

# Initialize logger
logger = setup_logging()

def get_logger(name: str = "mapas"):
    """Get logger instance."""
    return logging.getLogger(name)
