# Real-Time Audio Streaming Implementation Guide

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 16+
- Windows/Linux/macOS with audio device support
- PyAudio library (for server-side audio I/O)

### Installation

#### 1. Backend Setup

```bash
cd mapas-backend

# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS

# Install PyAudio (may require special handling)
python install_pyaudio.bat  # Windows automated setup

# Or manual installation
pip install pipwin
pipwin install pyaudio  # Windows

# Linux
sudo apt-get install portaudio19-dev
pip install pyaudio

# macOS
brew install portaudio
pip install pyaudio

# Verify installation
python -c "import pyaudio; print('PyAudio working!')"
```

#### 2. Update Requirements

The updated `requirements.txt` already includes:
- `PyAudio==0.2.13` - Audio device I/O
- `websockets==12.0` - WebSocket support

Install all dependencies:
```bash
pip install -r requirements.txt
```

#### 3. Frontend Setup

The AudioStreamingPanel is already integrated into PublicAnnouncementPanel. No additional npm packages needed.

Restart the development server:
```bash
cd mapas-dashboard
npm run dev
```

### Verification

#### Test 1: Backend Health Check

```bash
cd mapas-backend
python -c "from services.audio_service import get_audio_service; as_ = get_audio_service(); print(as_.get_devices('input'))"
```

#### Test 2: API Endpoint Test

```bash
curl http://localhost:8000/audio/devices
```

#### Test 3: Full System Test

```bash
cd mapas-backend
python test_audio_streaming.py http://localhost:8000
```

## Usage Guide

### For End Users

#### Using the Audio Streaming Panel

1. **Navigate to Dashboard**
   - Open the dashboard in your browser
   - Go to "Public Announcement System" tab

2. **Connect to Broadcast Stream**
   - Click the blue "Connect to Broadcast" button
   - You'll see a green "CONNECTED" badge appear
   - This establishes the WebSocket connection

3. **Select Input/Output Devices**
   - The UI displays your default microphone and speaker
   - To use different devices, they must be selected at the OS level

4. **Start Streaming**
   - Click "Start Streaming" to begin capturing microphone
   - A browser permission dialog may appear - allow microphone access
   - The badge changes to "STREAMING" with pulsing indicator
   - All audio captured will be broadcast to other connected clients

5. **Adjust Volume**
   - Use the volume slider to control playback volume
   - Range: 0 (mute) to 100 (full volume)

6. **Stop Streaming**
   - Click "Stop Streaming" to stop microphone capture
   - Click "Disconnect" to close the broadcast connection

### For Developers

#### Adding Audio Streaming to Your Component

```typescript
// In your component file
import { useAudioStream } from '@/lib/useAudioStream'
import { AudioStreamingPanel } from '@/components/AudioStreamingPanel'

export function MyComponent() {
    const {
        isConnected,
        isRecording,
        connectBroadcast,
        startMicStream,
        stopMicStream,
        disconnect
    } = useAudioStream()
    
    // Use the hook directly for custom implementation
    return (
        <div>
            {/* Custom implementation or use AudioStreamingPanel */}
            <AudioStreamingPanel />
        </div>
    )
}
```

#### Custom WebSocket Implementation

```typescript
// Direct WebSocket usage for advanced scenarios
async function setupAudioStream() {
    const wsUrl = 'ws://localhost:8000/ws/audio/broadcast-mic'
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
        console.log('Connected to audio stream')
    }
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === 'audio_chunk') {
            // Decode and play audio
            const audioData = atob(message.data)
            // ... playback logic
        }
    }
    
    ws.sends(JSON.stringify({
        type: 'audio_chunk',
        data: base64EncodedAudio,
        timestamp: new Date().toISOString()
    }))
}
```

#### Accessing Backend Audio Service

```python
from services.audio_service import get_audio_service

audio_service = get_audio_service()

# Get available devices
input_devices = audio_service.get_devices("input")
output_devices = audio_service.get_devices("output")

# Get defaults
default_input = audio_service.get_default_input_device()
default_output = audio_service.get_default_output_device()

# Record audio
def on_chunk(data: bytes):
    print(f"Recorded {len(data)} bytes")

recording_thread = audio_service.start_recording(
    device_index=default_input.index,
    on_chunk=on_chunk,
    duration=10  # 10 seconds
)

# Play audio
success = audio_service.play_audio(
    audio_bytes,
    device_index=default_output.index,
    sample_rate=16000
)
```

#### Creating Custom Endpoints

```python
from fastapi import FastAPI, WebSocket
from services.audio_service import get_audio_service
import base64
import json

app = FastAPI()
audio_service = get_audio_service()

@app.get("/audio/devices/input")
async def get_input_devices():
    """Get only input devices."""
    devices = audio_service.get_devices("input")
    return [{
        "index": d.index,
        "name": d.name,
        "channels": d.channels,
        "is_default": d.is_default
    } for d in devices]

@app.websocket("/ws/audio/custom")
async def websocket_custom_audio(websocket: WebSocket):
    """Custom audio streaming endpoint."""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "playback":
                # Decode audio
                audio_bytes = base64.b64decode(message.get("data", ""))
                # Play audio
                audio_service.play_audio(audio_bytes)
                
                # Send confirmation
                await websocket.send_json({
                    "type": "status",
                    "status": "played",
                    "bytes": len(audio_bytes)
                })
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await websocket.close()
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│             Frontend (React/Next.js)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │   AudioStreamingPanel Component              │  │
│  │  - Connect/Disconnect buttons                │  │
│  │  - Device selection display                  │  │
│  │  - Record/Playback controls                  │  │
│  └──────────────────────────────────────────────┘  │
│                     ↓                               │
│  ┌──────────────────────────────────────────────┐  │
│  │   useAudioStream Hook                        │  │
│  │  - WebSocket management                      │  │
│  │  - Microphone capture (Web Audio API)        │  │
│  │  - Audio playback (Audio Context)            │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
                        ↓ (WebSocket)
┌─────────────────────────────────────────────────────┐
│              Backend (FastAPI/Python)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  WebSocket Endpoints                         │  │
│  │  - /ws/audio/broadcast-mic: Bidirectional   │  │
│  │  - /ws/audio/record: Microphone stream      │  │
│  │  - /audio/devices: Device enumeration       │  │
│  └──────────────────────────────────────────────┘  │
│                     ↓                               │
│  ┌──────────────────────────────────────────────┐  │
│  │   AudioService (services/audio_service.py)  │  │
│  │  - Device enumeration                        │  │
│  │  - Recording from microphone                 │  │
│  │  - Playback to speakers                      │  │
│  │  - Stream management                         │  │
│  └──────────────────────────────────────────────┘  │
│                     ↓                               │
│  ┌──────────────────────────────────────────────┐  │
│  │   PyAudio Library                            │  │
│  │  - Microphone I/O                            │  │
│  │  - Speaker I/O                               │  │
│  │  - Device enumeration                        │  │
│  └──────────────────────────────────────────────┘  │
│                     ↓                               │
│  ┌──────────────────────────────────────────────┐  │
│  │   PortAudio (System Audio Subsystem)         │  │
│  │  - DirectSound (Windows)                     │  │
│  │  - ALSA/PulseAudio (Linux)                   │  │
│  │  - CoreAudio (macOS)                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### Broadcasting Scenario

```
User 1                    Server                   User 2
   │                        │                        │
   ├─ Connect ─────────────→│                        │
   │                        │←─ Connection OK ──────>│
   ├─ Start Recording ──────→│                        │
   │                        │                        │
   ├─ Audio Chunk 1 ───────→│                        │
   │  (base64)              ├─ Broadcast ───────────>│
   │                        │     (User 2 plays)     │
   │                        │                        │
   ├─ Audio Chunk 2 ───────→│                        │
   │  (base64)              ├─ Broadcast ───────────>│
   │                        │     (User 2 plays)     │
   │                        │                        │
   └─ Stop Recording ──────→│                        │
                            └─ Disconnect ─────────→│
```

### Audio Format

- **Encoding**: PCM 16-bit signed integer
- **Sample Rate**: 16,000 Hz (16 kHz)
- **Channels**: 1 (Mono)
- **Chunk Size**: 1,024 samples (~64ms)
- **Transmission**: Base64-encoded in JSON messages

## Performance Metrics

### Bandwidth Usage

```
Raw PCM Audio:
16,000 samples/sec × 2 bytes/sample × 1 channel = 32,000 bytes/sec
= ~256 KB/min = ~15.4 MB/hour

In WebSocket (JSON):
+ Base64 encoding: ~33% overhead
+ JSON wrapper: ~2% overhead
Total: ~35% overhead
= ~255 KB/min actual transmission

Recommended:
- 1-2 concurrent streams: <1 Mbps
- 5+ concurrent streams: Need bandwidth management
```

### Latency

- **Microphone capture**: ~512 samples = ~32ms
- **Base64 encoding**: ~1-2ms
- **WebSocket transmission**: 10-100ms (network dependent)
- **Decoding and playback**: ~1ms
- **Total end-to-end**: ~50-150ms (typical local network)

### System Resources

```
Per Stream:
- Memory: ~2-5 MB (buffers)
- CPU: ~2-5% (one core)
- Network: 256 KB/sec per stream

Server with 10 concurrent streams:
- Memory: ~50 MB
- CPU: ~20-30% (on one core, multithreaded)
- Network: 2.5 Mbps
```

## Troubleshooting Guide

### Issue: "No microphone permission"

**Solution:**
1. Check browser permissions:
   - Firefox/Chrome/Edge: Settings → Privacy → Microphone
   - Reload the page and allow microphone access
2. Check OS permissions:
   - Windows: Settings → Privacy → Microphone
   - Linux: Check PulseAudio/ALSA settings
   - macOS: System Preferences → Security & Privacy → Microphone

### Issue: "PyAudio not available"

**Solution:**
```bash
# Windows - Use pre-built wheel
python install_pyaudio.bat

# Or manually
pip install pipwin
pipwin install pyaudio

# Verify
python -c "import pyaudio; print('OK')"
```

### Issue: Audio crackle or distortion

**Solution:**
1. Check microphone levels (use system mixer)
2. Close other audio applications
3. Reduce concurrent streams
4. Check network latency: `ping server`

### Issue: WebSocket connection refused

**Solution:**
1. Verify backend is running: `http://localhost:8000/docs`
2. Check firewall settings
3. Verify API_URL is correct: `echo $NEXT_PUBLIC_API_URL`
4. Check browser console for detailed error

### Issue: Audio plays but cuts out

**Solution:**
1. Check buffer size: May need adjustment in audio_service.py
2. Monitor server CPU usage
3. Check network bandwidth
4. Reduce chunk frequency

## Future Enhancements

### Phase 2: Audio Compression
- [ ] Opus codec support (30:1 compression)
- [ ] Adaptive bitrate
- [ ] Network-aware quality adjustment

### Phase 3: Advanced Features
- [ ] Voice activity detection
- [ ] Noise suppression
- [ ] Audio effects (EQ, reverb)
- [ ] Recording to file
- [ ] Multi-channel support (stereo)

### Phase 4: Hardware Integration
- [ ] Custom USB device support
- [ ] Network audio devices
- [ ] Professional audio interfaces
- [ ] Machine learning voice enhancement

### Phase 5: Mobile Support
- [ ] React Native implementation
- [ ] iOS/Android apps
- [ ] Mobile-optimized audio settings

## Support & Resources

### Documentation
- Backend: [AUDIO_STREAMING_GUIDE.md](./AUDIO_STREAMING_GUIDE.md)
- API Docs: http://localhost:8000/docs (when running)

### Testing
- Test Suite: `python test_audio_streaming.py`
- Manual Testing: Use browser DevTools console

### Issues & Debugging
- Enable debug logging: Set `DEBUG=1` before running
- Check backend logs: Look for `[mapas.audio]` entries
- Check browser console for frontend errors

### External Resources
- PyAudio Docs: https://people.csail.mit.edu/hubert/pyaudio/
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- WebSocket Docs: https://fastapi.tiangolo.com/advanced/websockets/
