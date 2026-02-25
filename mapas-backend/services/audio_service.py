"""Audio service for real-time audio streaming and device management."""

try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False
    pyaudio = None

try:
    import numpy as np
except ImportError:
    numpy = None

from typing import List, Dict, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import threading
import queue
from logger import get_logger

log = get_logger("mapas.audio")


class AudioDeviceType(str, Enum):
    """Audio device type enumeration."""
    INPUT = "input"
    OUTPUT = "output"
    BOTH = "both"


@dataclass
class AudioDevice:
    """Audio device information."""
    index: int
    name: str
    device_type: AudioDeviceType
    channels: int
    sample_rate: int
    is_default: bool = False


class AudioService:
    """Service for managing audio devices and streaming."""
    
    CHUNK_SIZE = 1024
    SAMPLE_WIDTH = 2
    CHANNELS = 2      # Stereo (matches most Windows devices)
    SAMPLE_RATE = 44100  # Standard Windows device rate
    
    def __init__(self):
        """Initialize audio service."""
        if not PYAUDIO_AVAILABLE:
            log.warning("⚠️ PyAudio not available - audio device access disabled")
            log.warning("   Install with: pip install pyaudio")
            self.pa = None
            return
        
        try:
            self.pa = pyaudio.PyAudio()
            log.info("✓ PyAudio initialized")
            self._enumerate_devices()
        except Exception as e:
            log.error(f"✗ Failed to initialize PyAudio: {e}")
            log.error(f"   Make sure PyAudio is properly installed")
            self.pa = None
    
    def _enumerate_devices(self) -> None:
        """Enumerate all available audio devices."""
        if not self.pa:
            log.warning("PyAudio not initialized, cannot enumerate devices")
            return
        
        try:
            device_count = self.pa.get_device_count()
            log.info(f"📌 Found {device_count} audio devices")
            
            default_input = self.pa.get_default_input_device_info()
            default_output = self.pa.get_default_output_device_info()
            
            for i in range(device_count):
                try:
                    info = self.pa.get_device_info_by_index(i)
                    channels = info.get("maxInputChannels", 0)
                    
                    device_type = None
                    if info.get("maxInputChannels", 0) > 0:
                        device_type = AudioDeviceType.INPUT
                    if info.get("maxOutputChannels", 0) > 0:
                        if device_type == AudioDeviceType.INPUT:
                            device_type = AudioDeviceType.BOTH
                        else:
                            device_type = AudioDeviceType.OUTPUT
                    
                    if device_type:
                        is_default = (i == default_input["index"]) or (i == default_output["index"])
                        log.info(
                            f"  [{i}] {info['name']} ({device_type}) - "
                            f"In: {info.get('maxInputChannels', 0)}, "
                            f"Out: {info.get('maxOutputChannels', 0)}"
                        )
                except Exception as e:
                    log.warning(f"Error getting info for device {i}: {e}")
        
        except Exception as e:
            log.error(f"✗ Error enumerating devices: {e}")
    
    def get_devices(self, device_type: AudioDeviceType = AudioDeviceType.BOTH) -> List[AudioDevice]:
        """
        Get list of available audio devices.
        
        Args:
            device_type: Filter by device type (input, output, or both)
            
        Returns:
            List of available audio devices
        """
        devices = []
        
        if not self.pa:
            log.warning("PyAudio not initialized")
            return devices
        
        try:
            device_count = self.pa.get_device_count()
            default_input = self.pa.get_default_input_device_info()
            default_output = self.pa.get_default_output_device_info()
            
            for i in range(device_count):
                try:
                    info = self.pa.get_device_info_by_index(i)
                    
                    is_input = info.get("maxInputChannels", 0) > 0
                    is_output = info.get("maxOutputChannels", 0) > 0
                    
                    # Skip devices that don't match filter
                    if device_type == AudioDeviceType.INPUT and not is_input:
                        continue
                    elif device_type == AudioDeviceType.OUTPUT and not is_output:
                        continue
                    
                    device_dev_type = AudioDeviceType.BOTH if is_input and is_output else (
                        AudioDeviceType.INPUT if is_input else AudioDeviceType.OUTPUT
                    )
                    
                    is_default = (i == default_input["index"]) or (i == default_output["index"])
                    
                    device = AudioDevice(
                        index=i,
                        name=info["name"],
                        device_type=device_dev_type,
                        channels=max(info.get("maxInputChannels", 0), info.get("maxOutputChannels", 0)),
                        sample_rate=int(info.get("defaultSampleRate", self.SAMPLE_RATE)),
                        is_default=is_default
                    )
                    devices.append(device)
                except Exception as e:
                    log.warning(f"Error getting device info for index {i}: {e}")
        
        except Exception as e:
            log.error(f"✗ Error getting devices: {e}")
        
        return devices
    
    def get_default_input_device(self) -> Optional[AudioDevice]:
        """Get default input device."""
        try:
            if not self.pa:
                return None
            info = self.pa.get_default_input_device_info()
            return AudioDevice(
                index=int(info["index"]),
                name=info["name"],
                device_type=AudioDeviceType.INPUT,
                channels=info.get("maxInputChannels", 1),
                sample_rate=int(info.get("defaultSampleRate", self.SAMPLE_RATE)),
                is_default=True
            )
        except Exception as e:
            log.error(f"✗ Error getting default input device: {e}")
            return None
    
    def get_default_output_device(self) -> Optional[AudioDevice]:
        """Get default output device."""
        try:
            if not self.pa:
                return None
            info = self.pa.get_default_output_device_info()
            return AudioDevice(
                index=int(info["index"]),
                name=info["name"],
                device_type=AudioDeviceType.OUTPUT,
                channels=info.get("maxOutputChannels", 1),
                sample_rate=int(info.get("defaultSampleRate", self.SAMPLE_RATE)),
                is_default=True
            )
        except Exception as e:
            log.error(f"✗ Error getting default output device: {e}")
            return None
    
    def start_recording(
        self,
        device_index: Optional[int] = None,
        on_chunk: Optional[Callable[[bytes], None]] = None,
        duration: Optional[float] = None
    ) -> threading.Thread:
        """
        Start recording from microphone.
        
        Args:
            device_index: Index of input device (uses default if None)
            on_chunk: Callback function called with each audio chunk
            duration: Recording duration in seconds (None for infinite)
            
        Returns:
            Recording thread
        """
        if not self.pa:
            log.error("PyAudio not initialized")
            return None
        
        def record_thread():
            try:
                stream = self.pa.open(
                    format=pyaudio.paInt16,
                    channels=self.CHANNELS,
                    rate=self.SAMPLE_RATE,
                    input=True,
                    input_device_index=device_index,
                    frames_per_buffer=self.CHUNK_SIZE,
                    start=False
                )
                stream.start_stream()
                log.info(f"🎤 Started recording from device {device_index or 'default'}")
                
                recorded_data = []
                start_time = None
                if duration:
                    import time
                    start_time = time.time()
                
                while True:
                    data = stream.read(self.CHUNK_SIZE, exception_on_overflow=False)
                    recorded_data.append(data)
                    
                    if on_chunk:
                        on_chunk(data)
                    
                    if duration and start_time:
                        import time
                        if time.time() - start_time > duration:
                            break
                
                stream.stop_stream()
                stream.close()
                log.info("✓ Recording stopped")
                
                return recorded_data
            except Exception as e:
                log.error(f"✗ Recording error: {e}")
                return None
        
        thread = threading.Thread(target=record_thread, daemon=True)
        thread.start()
        return thread
    
    def play_audio(
        self,
        audio_data: bytes,
        device_index: Optional[int] = None,
        sample_rate: int = SAMPLE_RATE
    ) -> bool:
        """
        Play audio data through speaker.
        
        Args:
            audio_data: Audio data in bytes
            device_index: Index of output device (uses default if None)
            sample_rate: Sample rate of audio data
            
        Returns:
            True if playback successful
        """
        if not self.pa:
            log.error("PyAudio not initialized")
            return False
        
        try:
            stream = self.pa.open(
                format=pyaudio.paInt16,
                channels=self.CHANNELS,
                rate=sample_rate,
                output=True,
                output_device_index=device_index,
                start=False
            )
            stream.start_stream()
            log.info(f"🔊 Started playback on device {device_index or 'default'}")
            
            stream.write(audio_data)
            stream.stop_stream()
            stream.close()
            
            log.info("✓ Playback completed")
            return True
        except Exception as e:
            log.error(f"✗ Playback error: {e}")
            return False
    
    def play_audio_stream(
        self,
        audio_queue: queue.Queue,
        device_index: Optional[int] = None,
        sample_rate: int = SAMPLE_RATE,
        channels: int = 1
    ) -> threading.Thread:
        """
        Play audio from a queue in real-time.
        
        Args:
            audio_queue: Queue containing audio chunks
            device_index: Index of output device
            sample_rate: Sample rate of audio data
            channels: Number of audio channels (1=mono, 2=stereo)
            
        Returns:
            Playback thread
        """
        if not self.pa:
            log.error("PyAudio not initialized")
            return None
        
        def playback_thread():
            try:
                stream = self.pa.open(
                    format=pyaudio.paInt16,
                    channels=channels,
                    rate=sample_rate,
                    output=True,
                    output_device_index=device_index,
                    start=False
                )
                stream.start_stream()
                log.info(f"🔊 Started stream playback on device {device_index or 'default'}")
                
                while True:
                    try:
                        chunk = audio_queue.get(timeout=1.0)
                        if chunk is None:  # Sentinel value to stop
                            break
                        stream.write(chunk)
                    except queue.Empty:
                        continue
                
                stream.stop_stream()
                stream.close()
                log.info("✓ Stream playback stopped")
            except Exception as e:
                log.error(f"✗ Stream playback error: {e}")
        
        thread = threading.Thread(target=playback_thread, daemon=True)
        thread.start()
        return thread
    
    def cleanup(self):
        """Cleanup audio resources."""
        if self.pa:
            self.pa.terminate()
            log.info("✓ PyAudio terminated")


# Global audio service instance
_audio_service: Optional[AudioService] = None


def get_audio_service() -> AudioService:
    """Get or create the global audio service instance."""
    global _audio_service
    if _audio_service is None:
        _audio_service = AudioService()
    return _audio_service
