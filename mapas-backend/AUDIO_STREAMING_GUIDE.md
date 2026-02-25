# Real-Time Audio Streaming System

This document describes the real-time audio streaming implementation for the MAPAS Public Announcement System.

## Overview

The audio streaming system enables real-time, bidirectional audio communication:
- **Microphone Input**: Stream audio from system microphone or custom input devices
- **Speaker Output**: Play received audio through system speakers or custom output devices
- **Real-time Broadcasting**: Audio is streamed to all connected clients simultaneously
- **Extensible Architecture**: Designed for easy integration with custom audio hardware

## Architecture

### Backend Components

#### 1. **Audio Service** (`services/audio_service.py`)

The core audio service handles device management and audio I/O operations.

**Key Classes:**
- `AudioService`: Main service managing audio operations
- `AudioDevice`: Data class representing audio device information
- `AudioDeviceType`: Enum for input/output/both device types

**Key Methods:**
```python
# Device Management
get_devices(device_type: AudioDeviceType) -> List[AudioDevice]
get_default_input_device() -> Optional[AudioDevice]
get_default_output_device() -> Optional[AudioDevice]

# Recording
start_recording(device_index, on_chunk, duration) -> threading.Thread

# Playback
play_audio(audio_data, device_index, sample_rate) -> bool
play_audio_stream(audio_queue, device_index, sample_rate) -> threading.Thread
```

**Usage:**
```python
from services.audio_service import get_audio_service

audio_service = get_audio_service()

# List devices
devices = audio_service.get_devices("input")
for device in devices:
    print(f"[{device.index}] {device.name} - {device.channels} channels")

# Record from microphone
def on_chunk(data: bytes):
    print(f"Recorded chunk: {len(data)} bytes")

thread = audio_service.start_recording(
    device_index=None,  # Use default
    on_chunk=on_chunk,
    duration=10  # 10 seconds
)

# Play audio
audio_service.play_audio(audio_bytes, sample_rate=16000)
```

#### 2. **WebSocket Endpoints** (`main.py`)

**REST Endpoints:**
```
GET /audio/devices
```
Returns available audio input/output devices and default selections.

**WebSocket Endpoints:**

##### `/ws/audio/broadcast-mic`
Bidirectional audio streaming for live broadcasts.
- Clients send audio chunks from microphone
- Device broadcasts to all connected clients
- All clients receive and play audio simultaneously

**Message Format:**
```json
{
    "type": "audio_chunk",
    "data": "<base64-encoded-audio-data>",
    "timestamp": "2026-02-20T14:30:00"
}
```

##### `/ws/audio/record`
Stream microphone input to remote clients.
- Captures audio from system microphone
- Sends chunks to connected clients
- Useful for remote monitoring

**Connection Manager:**
The `AudioConnectionManager` class handles WebSocket connection pooling and message broadcasting.

### Frontend Components

#### 1. **useAudioStream Hook** (`lib/useAudioStream.ts`)

Custom React hook for audio streaming functionality.

**State:**
```typescript
isConnected: boolean      // WebSocket connection status
isRecording: boolean      // Recording active flag
isPlaying: boolean        // Audio playback status
error: string | null      // Error message
devices: AudioDevices     // Available devices
```

**Methods:**
```typescript
fetchAudioDevices(apiUrl: string)
  // Fetch available audio devices from backend

connectBroadcast(apiUrl: string)
  // Establish WebSocket connection for broadcasting

startMicStream()
  // Start capturing microphone input and streaming

stopMicStream()
  // Stop microphone capture

playAudioChunk(audioBuffer: ArrayBuffer)
  // Queue and play audio data

setVolume(level: number)
  // Set output volume (0.0 - 1.0)

disconnect()
  // Close WebSocket and cleanup resources
```

**Usage:**
```typescript
const {
    isConnected,
    isRecording,
    connectBroadcast,
    startMicStream,
    stopMicStream,
    setVolume
} = useAudioStream({
    onStatusChange: (status) => console.log(status),
    onError: (error) => console.error(error)
});

// Connect to broadcast
await connectBroadcast('http://localhost:8000');

// Start streaming microphone
await startMicStream();

// Set volume
setVolume(0.7);

// Stop and cleanup
stopMicStream();
```

#### 2. **AudioStreamingPanel Component** (`components/AudioStreamingPanel.tsx`)

UI component for audio streaming controls.

**Features:**
- Device selection display
- Connect/Disconnect controls
- Record/Stop microphone controls
- Volume slider
- Real-time status indicators
- Error handling and notifications

**Integration:**
The component is automatically included in the PublicAnnouncementPanel.

## How It Works

### Broadcast Flow

1. **Connection Phase:**
   - User clicks "Connect to Broadcast"
   - Frontend establishes WebSocket connection to `/ws/audio/broadcast-mic`
   - Server confirms connection and allocates resources

2. **Recording Phase:**
   - User clicks "Start Streaming"
   - Frontend requests microphone access via Web Audio API
   - Browser MediaRecorder captures audio chunks
   - Chunks are base64-encoded and sent via WebSocket

3. **Broadcasting Phase:**
   - Server receives audio chunks from client
   - Audio is forwarded to all other connected clients
   - Each client decodes and plays the audio
   - All speakers play synchronized audio

4. **Disconnect Phase:**
   - User clicks "Stop Streaming" or "Disconnect"
   - MediaRecorder stops and microphone access is released
   - WebSocket closes gracefully
   - Audio playback queues are emptied

## Extending for Custom Hardware

The system is designed to be easily extended for custom microphone and speaker devices.

### Adding Custom Input Devices

#### Option 1: Network Audio Input (HTTP/WebSocket)

Create a custom audio service that streams from remote device:

```python
# services/custom_input_service.py
import asyncio
import websockets
from typing import Callable

class NetworkAudioInput:
    """Receive audio from remote microphone device via WebSocket."""
    
    def __init__(self, device_url: str):
        self.device_url = device_url
        self.on_chunk: Optional[Callable] = None
    
    async def connect_and_stream(self):
        """Connect to remote device and stream audio."""
        async with websockets.connect(self.device_url) as websocket:
            while True:
                message = await websocket.recv()
                if self.on_chunk:
                    self.on_chunk(message)
    
    def set_on_chunk_callback(self, callback: Callable):
        """Set callback for audio chunks."""
        self.on_chunk = callback
```

Usage in endpoint:
```python
@app.websocket("/ws/audio/custom-input")
async def websocket_custom_input(websocket: WebSocket):
    """Stream from custom input device."""
    await audio_manager.connect(websocket)
    
    custom_input = NetworkAudioInput("ws://custom-device:8080/stream")
    
    async def on_chunk(chunk):
        await audio_manager.broadcast({
            "type": "audio_chunk",
            "data": base64.b64encode(chunk).decode()
        })
    
    custom_input.set_on_chunk_callback(on_chunk)
    # ... handle streaming
```

#### Option 2: Direct Device Access (PyAudio Extension)

Extend the AudioService for custom devices:

```python
# services/audio_service.py - Add to AudioService class

def get_custom_device_by_name(self, name: str) -> Optional[AudioDevice]:
    """Find device by partial name match."""
    devices = self.get_devices("input")
    return next((d for d in devices if name.lower() in d.name.lower()), None)

def start_recording_from_device(
    self,
    device_name: str,
    on_chunk: Callable[[bytes], None]
) -> threading.Thread:
    """Record from custom device by name."""
    device = self.get_custom_device_by_name(device_name)
    if not device:
        raise ValueError(f"Device not found: {device_name}")
    
    return self.start_recording(
        device_index=device.index,
        on_chunk=on_chunk
    )
```

#### Option 3: USB/Hardware Device Connection

For USB microphones or specialized audio hardware:

```python
# services/usb_audio_service.py
import pyaudio
from dataclasses import dataclass

@dataclass
class USBDeviceConfig:
    """Configuration for USB audio device."""
    vendor_id: str
    product_id: str
    sample_rate: int = 16000
    channels: int = 1
    chunk_size: int = 1024

class USBAudioService:
    """Handle USB audio devices with custom configuration."""
    
    def __init__(self, config: USBDeviceConfig):
        self.config = config
        self.pa = pyaudio.PyAudio()
    
    def find_usb_device(self) -> Optional[int]:
        """Find connected USB device by vendor/product ID."""
        # Implementation depends on device enumeration method
        device_count = self.pa.get_device_count()
        for i in range(device_count):
            info = self.pa.get_device_info_by_index(i)
            # Match against USB device identifiers
            if self._matches_device(info):
                return i
        return None
    
    def _matches_device(self, device_info: dict) -> bool:
        """Check if device matches configured IDs."""
        name = device_info.get('name', '')
        # Implement vendor/product matching logic
        return True
    
    def stream_audio(self, callback: Callable):
        """Stream audio from USB device."""
        device_index = self.find_usb_device()
        if device_index is None:
            raise RuntimeError("USB device not found")
        
        # Similar to start_recording but with USB device
```

### Adding Custom Output Devices

#### Option 1: Network Audio Output

```python
# services/custom_output_service.py
import asyncio
import websockets
import base64

class NetworkAudioOutput:
    """Send audio to remote speaker device via WebSocket."""
    
    def __init__(self, device_url: str):
        self.device_url = device_url
        self.websocket = None
    
    async def connect(self):
        """Connect to remote speaker device."""
        self.websocket = await websockets.connect(self.device_url)
    
    async def play_audio(self, audio_data: bytes):
        """Send audio data to remote device."""
        if not self.websocket:
            raise RuntimeError("Not connected to device")
        
        message = {
            "type": "audio_chunk",
            "data": base64.b64encode(audio_data).decode()
        }
        await self.websocket.send(json.dumps(message))
    
    async def disconnect(self):
        """Close connection."""
        if self.websocket:
            await self.websocket.close()
```

#### Option 2: Extended Playback Control

```python
# services/audio_service.py - Add to AudioService

def play_audio_to_device(
    self,
    audio_data: bytes,
    device_name: str,
    sample_rate: int = SAMPLE_RATE
) -> bool:
    """Play audio to specific device by name."""
    device = self.get_custom_device_by_name(device_name)
    if not device:
        raise ValueError(f"Device not found: {device_name}")
    
    return self.play_audio(audio_data, device.index, sample_rate)

def set_playback_parameters(
    self,
    volume_level: float,
    equalization: Optional[dict] = None
):
    """Set custom playback parameters for output device."""
    # Implement EQ and volume adjustments
    pass
```

### Integration Example: Multi-Zone Audio System

```python
# Broadcast to multiple zones/rooms

class MultiZoneAudioSystem:
    """Manage audio broadcasting to multiple zones."""
    
    def __init__(self):
        self.zones = {}  # zone_name -> WebSocket connections
    
    async def register_zone(self, zone_name: str, websocket: WebSocket):
        """Register a zone for receiving audio."""
        if zone_name not in self.zones:
            self.zones[zone_name] = []
        self.zones[zone_name].append(websocket)
    
    async def broadcast_to_zone(self, zone_name: str, audio_chunk: bytes):
        """Send audio to specific zone."""
        for ws in self.zones.get(zone_name, []):
            try:
                await ws.send_json({
                    "type": "audio_chunk",
                    "data": base64.b64encode(audio_chunk).decode()
                })
            except:
                pass
    
    async def broadcast_all_zones(self, audio_chunk: bytes):
        """Broadcast audio to all zones."""
        for zone_name in self.zones:
            await self.broadcast_to_zone(zone_name, audio_chunk)

# In main.py
multi_zone_system = MultiZoneAudioSystem()

@app.websocket("/ws/audio/zone/{zone_name}")
async def websocket_zone_audio(websocket: WebSocket, zone_name: str):
    """WebSocket endpoint for zone-specific audio."""
    await multi_zone_system.register_zone(zone_name, websocket)
    # ... streaming logic
```

## Configuration

### Environment Variables

Add to `.env`:
```
AUDIO_SAMPLE_RATE=16000
AUDIO_CHUNK_SIZE=1024
AUDIO_CHANNELS=1
AUDIO_FORMAT=int16
```

Update `config.py`:
```python
class Settings(BaseSettings):
    AUDIO_SAMPLE_RATE: int = Field(default=16000)
    AUDIO_CHUNK_SIZE: int = Field(default=1024)
    AUDIO_CHANNELS: int = Field(default=1)
```

## Performance Considerations

### Latency Optimization
- **Chunk Size**: Smaller chunks = lower latency but higher overhead
- **Compression**: Consider audio compression (Opus, AAC) for better bandwidth
- **Network**: Use local networks for minimal WebSocket latency

### Bandwidth Management
- **Raw Audio**: 16kHz mono 16-bit = ~256 KB/s
- **Compressed**: With Opus codec ~24-32 KB/s
- **Streaming Count**: Monitor active connections

### Resource Management
```python
# Limit concurrent streams
MAX_CONCURRENT_STREAMS = 10
active_stream_count = 0

# Monitor queue sizes
if len(playback_queue) > 100:
    log.warning("High audio queue depth, possible lag")

# Cleanup disconnected clients
if ws in audio_manager.active_connections:
    # Verify connection is still active
    try:
        await ws.send_text('{"ping": true}')
    except:
        audio_manager.disconnect(ws)
```

## Troubleshooting

### PyAudio Installation Issues

**Windows:**
```bash
# Install pre-built wheel
pip install pipwin
pipwin install pyaudio
```

**Linux:**
```bash
sudo apt-get install portaudio19-dev
pip install pyaudio
```

**macOS:**
```bash
brew install portaudio
pip install pyaudio
```

### Common Issues

1. **"No audio devices found"**
   - Check system audio settings
   - Verify PyAudio can access audio subsystem
   - Try `python -c "import pyaudio; pa = pyaudio.PyAudio()"`

2. **WebSocket disconnections**
   - Check network connectivity
   - Monitor server load and resources
   - Implement reconnection logic on frontend

3. **Audio lag or playback issues**
   - Reduce chunk size for lower latency
   - Check bandwidth usage
   - Monitor CPU usage on both client and server

## Future Enhancements

- [ ] Audio codec support (Opus, AAC)
- [ ] Automatic audio quality adaptation
- [ ] Voice activity detection
- [ ] Audio recording to file
- [ ] Equalizer and audio effects
- [ ] Multi-channel audio support (stereo, surround)
- [ ] Hardware acceleration for encoding/decoding
- [ ] Mobile app integration
- [ ] Scheduled broadcasts
- [ ] Audio mixing for multiple speakers
