"""Text-to-Speech service for public announcements.

Supports two providers:
  - pyttsx3   : offline, robotic (default / fallback)
  - elevenlabs: cloud-based, human-quality voices
"""

import pyttsx3
import subprocess
import sys
import os
import threading
from pathlib import Path
from typing import Optional
from datetime import datetime
from logger import get_logger

log = get_logger("mapas.tts")

# ---------------------------------------------------------------------------
# ElevenLabs helper
# ---------------------------------------------------------------------------

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

ELEVENLABS_VOICES = {
    "Rachel":  "21m00Tcm4TlvDq8ikWAM",
    "Domi":    "AZnzlk1XvdvUeBnXmlld",
    "Bella":   "EXAVITQu4vr4xnSDxMaL",
    "Antoni":  "ErXwobaYiN019PkySvjV",
    "Josh":    "TxGEqnHWrfWFTfGW9XjX",
    "Arnold":  "VR6AewLTigWG4xSOukaG",
    "Adam":    "pNInz6obpgDQGcFmaJgB",
    "Sam":     "yoZ06aMxZJJ28mfd3POQ",
    "Charlie": "IKne3meq5aSn9XLyUdCD",
    "Emily":   "LcfcDJNUP1GQjkzn1xUU",
}


def _play_file_windows(path: str):
    """Play an audio file using the Windows default player (non-blocking)."""
    try:
        os.startfile(str(path))
    except Exception as e:
        log.error(f"os.startfile failed: {e}. Trying subprocess...")
        subprocess.Popen(
            ["powershell", "-c", f"(New-Object Media.SoundPlayer '{path}').PlaySync()"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


def _elevenlabs_synthesize(
    text: str,
    api_key: str,
    voice_id: str,
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    language: str = "en",
) -> Optional[bytes]:
    """Call ElevenLabs REST API and return raw MP3 bytes."""
    try:
        import requests as req

        url = f"{ELEVENLABS_API_URL}/{voice_id}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost,
            },
        }
        # language_code is supported by multilingual models
        if language and language != "en" and "multilingual" in model_id:
            payload["language_code"] = language
        response = req.post(url, json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.content
        else:
            log.error(f"ElevenLabs API error {response.status_code}: {response.text[:200]}")
            return None
    except Exception as e:
        log.error(f"ElevenLabs request failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Main service class
# ---------------------------------------------------------------------------

class TTSService:
    """Text-to-Speech service.

    Provider is chosen at runtime:
      - If ``api_key`` is set and ``engine == 'elevenlabs'`` → ElevenLabs.
      - Otherwise falls back to pyttsx3 (offline).
    """

    def __init__(self):
        from config import settings

        self.engine_type: str = settings.TTS_ENGINE
        self.api_key: str = settings.ELEVENLABS_API_KEY
        self.voice_id: str = settings.ELEVENLABS_VOICE_ID
        self.model_id: str = settings.ELEVENLABS_MODEL_ID
        self.stability: float = settings.ELEVENLABS_STABILITY
        self.similarity_boost: float = settings.ELEVENLABS_SIMILARITY_BOOST
        self.language: str = "en"

        self._pyttsx3_engine = None
        self.audio_dir = Path("audio_output")
        self.audio_dir.mkdir(exist_ok=True)

        self._init_pyttsx3()

    # ------------------------------------------------------------------
    # pyttsx3 helpers
    # ------------------------------------------------------------------

    def _init_pyttsx3(self):
        """Initialise / re-initialise the pyttsx3 engine."""
        try:
            if self._pyttsx3_engine:
                try:
                    self._pyttsx3_engine.stop()
                except Exception:
                    pass

            self._pyttsx3_engine = pyttsx3.init()
            self._pyttsx3_engine.setProperty("rate", 150)
            self._pyttsx3_engine.setProperty("volume", 1.0)
            try:
                voices = self._pyttsx3_engine.getProperty("voices")
                if voices:
                    self._pyttsx3_engine.setProperty("voice", voices[0].id)
            except Exception:
                pass
            log.info("pyttsx3 engine initialised")
        except Exception as e:
            log.error(f"pyttsx3 init error: {e}")
            self._pyttsx3_engine = None

    def _pyttsx3_subprocess(self, text: str):
        """Speak via a fresh pyttsx3 subprocess, picking a voice for self.language."""
        import json

        escaped = json.dumps(text)
        lang = self.language or "en"
        code = f"""
import pyttsx3, json
engine = pyttsx3.init()
engine.setProperty('rate', 150)
engine.setProperty('volume', 1.0)
voices = engine.getProperty('voices')
lang = {lang!r}
# Try to find a voice whose id/name contains the language code
matched = None
if voices:
    for v in voices:
        vid = (v.id + ' ' + (v.name or '')).lower()
        if lang.lower() in vid or lang.replace('-','_').lower() in vid:
            matched = v.id
            break
    engine.setProperty('voice', matched if matched else voices[0].id)
engine.say(json.loads({escaped!r}))
engine.runAndWait()
"""
        subprocess.Popen(
            [sys.executable, "-c", code],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        log.info(f"pyttsx3 subprocess started (lang={lang}) for: {text[:50]}…")

    # ------------------------------------------------------------------
    # ElevenLabs helpers
    # ------------------------------------------------------------------

    def _elevenlabs_play(self, text: str):
        """Synthesise with ElevenLabs and play the resulting MP3."""
        audio_bytes = _elevenlabs_synthesize(
            text,
            api_key=self.api_key,
            voice_id=self.voice_id,
            model_id=self.model_id,
            stability=self.stability,
            similarity_boost=self.similarity_boost,
            language=self.language,
        )
        if not audio_bytes:
            log.warning("ElevenLabs returned no audio – falling back to pyttsx3")
            self._pyttsx3_subprocess(text)
            return

        ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        out = self.audio_dir / f"el_{ts}.mp3"
        out.write_bytes(audio_bytes)
        log.info(f"✓ ElevenLabs audio saved: {out}")
        _play_file_windows(str(out))

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def configure(
        self,
        engine_type: Optional[str] = None,
        api_key: Optional[str] = None,
        voice_id: Optional[str] = None,
        model_id: Optional[str] = None,
        stability: Optional[float] = None,
        similarity_boost: Optional[float] = None,
        language: Optional[str] = None,
    ):
        """Update provider settings at runtime (called from the settings endpoint)."""
        if engine_type is not None:
            self.engine_type = engine_type
        if api_key is not None:
            self.api_key = api_key
        if voice_id is not None:
            self.voice_id = voice_id
        if model_id is not None:
            self.model_id = model_id
        if stability is not None:
            self.stability = stability
        if similarity_boost is not None:
            self.similarity_boost = similarity_boost
        if language is not None:
            self.language = language
        log.info(f"TTS configured: engine={self.engine_type}, voice={self.voice_id}, lang={self.language}")

    @property
    def _use_elevenlabs(self) -> bool:
        return self.engine_type == "elevenlabs" and bool(self.api_key)

    def text_to_speech_simple(self, text: str):
        """Speak text in a background thread (fire-and-forget)."""
        if self._use_elevenlabs:
            t = threading.Thread(target=self._elevenlabs_play, args=(text,), daemon=True)
            t.start()
        else:
            self._pyttsx3_subprocess(text)

    def synthesize_and_play(self, text: str, filename: Optional[str] = None) -> str:
        """Synthesise, save to file, and play.  Returns the saved path."""
        if not filename:
            filename = f"announcement_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        if self._use_elevenlabs:
            audio_bytes = _elevenlabs_synthesize(
                text,
                api_key=self.api_key,
                voice_id=self.voice_id,
                model_id=self.model_id,
                stability=self.stability,
                similarity_boost=self.similarity_boost,
            )
            if audio_bytes:
                out = self.audio_dir / f"{filename}.mp3"
                out.write_bytes(audio_bytes)
                log.info(f"✓ Saved to: {out}")
                _play_file_windows(str(out))
                return str(out)
            log.warning("ElevenLabs synthesis failed – falling back to pyttsx3")

        # pyttsx3 path
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        engine.setProperty("volume", 1.0)
        out = self.audio_dir / f"{filename}.mp3"
        engine.save_to_file(text, str(out))
        engine.runAndWait()
        log.info(f"✓ Saved to: {out}")
        return str(out)

    def get_status(self) -> dict:
        return {
            "engine": self.engine_type,
            "elevenlabs_configured": bool(self.api_key),
            "voice_id": self.voice_id,
            "model_id": self.model_id,
            "language": self.language,
            "available_voices": ELEVENLABS_VOICES,
        }


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_tts_service: Optional[TTSService] = None


def get_tts_service() -> TTSService:
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
