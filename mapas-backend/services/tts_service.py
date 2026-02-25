"""Text-to-Speech service for public announcements."""

import pyttsx3
from typing import Optional
import os
from pathlib import Path
import time
import threading
import subprocess
import sys
from logger import get_logger

log = get_logger("mapas.tts")


class TTSService:
    """Text-to-Speech service using pyttsx3 for offline TTS."""
    
    def __init__(self):
        """Initialize TTS service."""
        self.engine = None
        self.init_engine()
        
        # Create directory for audio files if it doesn't exist
        self.audio_dir = Path("audio_output")
        self.audio_dir.mkdir(exist_ok=True)
    
    def init_engine(self):
        """Initialize or reinitialize the engine."""
        try:
            if self.engine:
                try:
                    self.engine.stop()
                except:
                    pass
            
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 150)
            self.engine.setProperty('volume', 1.0)
            
            # Try to set voice
            try:
                voices = self.engine.getProperty('voices')
                if voices:
                    self.engine.setProperty('voice', voices[0].id)
            except:
                pass
            
            log.info("Engine initialized")
        except Exception as e:
            log.error(f"Error initializing engine: {e}")
            self.engine = None
    
    def text_to_speech_subprocess(self, text: str):
        """Play TTS using subprocess (more reliable on Windows)."""
        try:
            # Properly escape the text for Python code injection
            import json
            escaped_text = json.dumps(text)
            
            code = f"""
import pyttsx3
import json
engine = pyttsx3.init()
engine.setProperty('rate', 150)
engine.setProperty('volume', 1.0)
voices = engine.getProperty('voices')
if voices:
    engine.setProperty('voice', voices[0].id)
text = json.loads({escaped_text!r})
engine.say(text)
engine.runAndWait()
"""
            # Run in subprocess to avoid engine state issues
            process = subprocess.Popen(
                [sys.executable, '-c', code],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            # Don't wait - let it run in background
            log.info(f"Started subprocess for: {text[:50]}...")
        except Exception as e:
            log.error(f"Error in subprocess: {e}")
    
    def text_to_speech_thread(self, text: str):
        """Play TTS in a separate thread."""
        try:
            # Reinitialize engine for this thread
            self.init_engine()
            
            if self.engine is None:
                log.warning("Engine is None, trying subprocess...")
                self.text_to_speech_subprocess(text)
                return
            
            log.info(f"Starting playback: {text[:50]}...")
            self.engine.say(text)
            self.engine.runAndWait()
            log.info("✓ Playback complete")
        except Exception as e:
            log.error(f"Error during playback: {e}")
            # Fallback to subprocess
            try:
                self.text_to_speech_subprocess(text)
            except Exception as e2:
                log.error(f"Subprocess also failed: {e2}")
    
    def text_to_speech_simple(self, text: str):
        """
        Simple TTS - play text through speakers in background thread.
        """
        try:
            # Use subprocess approach which is more reliable on Windows
            self.text_to_speech_subprocess(text)
        except Exception as e:
            log.error(f"Error queuing speech: {e}")
    
    def synthesize_and_play(self, text: str, filename: Optional[str] = None) -> str:
        """
        Convert text to speech and save to file.
        """
        try:
            # Create a fresh engine for file output
            engine = pyttsx3.init()
            engine.setProperty('rate', 150)
            engine.setProperty('volume', 1.0)
            
            if not filename:
                from datetime import datetime
                filename = f"announcement_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            output_path = self.audio_dir / f"{filename}.mp3"
            engine.save_to_file(text, str(output_path))
            engine.runAndWait()
            
            log.info(f"✓ Saved to: {output_path}")
            return str(output_path)
        except Exception as e:
            log.error(f"Error in synthesis: {e}")
            return ""
    
    def set_voice_properties(self, rate: int = 150, volume: float = 1.0):
        """Set TTS voice properties."""
        try:
            if self.engine:
                self.engine.setProperty('rate', rate)
                self.engine.setProperty('volume', volume)
                log.info(f"Voice properties set: rate={rate}, volume={volume}")
        except Exception as e:
            log.error(f"Error setting properties: {e}")


# Create a singleton instance
_tts_service = None

def get_tts_service() -> TTSService:
    """Get or create TTS service instance."""
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
