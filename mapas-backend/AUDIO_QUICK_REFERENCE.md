# Real-Time Audio Streaming - Quick Reference

## Installation Checklist

- [ ] PyAudio installed (`python install_pyaudio.bat` on Windows)
- [ ] Backend dependencies updated (`pip install -r requirements.txt`)
- [ ] Backend restarted with new audio endpoints
- [ ] Frontend has AudioStreamingPanel (auto-included in PublicAnnouncementPanel)
- [ ] `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [ ] Test suite passing (`python test_audio_streaming.py`)

## API Quick Reference

### REST Endpoints

```bash
# Get available audio devices
GET /audio/devices

# Response:
{
  "status": "success",
  "input_devices": [
    {"index": 0, "name": "Microphone", "is_default": true},
    ...
  ],
  "output_devices": [
    {"index": 0, "name": "Speakers", "is_default": true},
    ...
  ]
}
```

### WebSocket Endpoints

```
ws://localhost:8000/ws/audio/broadcast-mic
  → Bidirectional audio broadcasting
  → Clients send recording, server broadcasts

ws://localhost:8000/ws/audio/record
  → Server sends microphone stream to client
  → Remote monitoring of mic input
```

### Message Format

```json
{
  "type": "audio_chunk",
  "data": "<base64-encoded-raw-audio>",
  "timestamp": "2026-02-20T14:30:00Z"
}
```

## Component Usage

### Using AudioStreamingPanel

```tsx
import { AudioStreamingPanel } from '@/components/AudioStreamingPanel'

export function MyPage() {
    return <AudioStreamingPanel />
}
```

### Using useAudioStream Hook

```tsx
import { useAudioStream } from '@/lib/useAudioStream'

export function MyComponent() {
    const {
        isConnected,
        isRecording,
        connectBroadcast,
        startMicStream,
        stopMicStream,
        setVolume,
        disconnect
    } = useAudioStream({
        onStatusChange: (status) => console.log(status),
        onError: (error) => console.error(error)
    })
    
    return (
        <button onClick={() => connectBroadcast('http://localhost:8000')}>
            {isConnected ? 'Disconnect' : 'Connect'}
        </button>
    )
}
```

## Backend Usage

### Get Audio Service

```python
from services.audio_service import get_audio_service

audio_service = get_audio_service()
```

### List Devices

```python
# Input devices
input_devices = audio_service.get_devices("input")
for device in input_devices:
    print(f"[{device.index}] {device.name}")

# Output devices
output_devices = audio_service.get_devices("output")
```

### Record from Microphone

```python
def on_chunk(data: bytes):
    print(f"Recorded {len(data)} bytes")

# Start recording
thread = audio_service.start_recording(
    device_index=None,  # Use default
    on_chunk=on_chunk,
    duration=10  # Optional: 10 seconds
)

# Recording continues in background thread
# Thread automatically stops after duration or when requested
```

### Play Audio

```python
# Single playback
audio_service.play_audio(audio_bytes, sample_rate=16000)

# Stream playback
import queue
playback_queue = queue.Queue()

# Start playback thread
thread = audio_service.play_audio_stream(playback_queue)

# Queue audio chunks
playback_queue.put(audio_chunk_1)
playback_queue.put(audio_chunk_2)

# Signal end
playback_queue.put(None)  # Stops playback thread
```

## Audio Specifications

| Property | Value |
|----------|-------|
| Format | PCM 16-bit signed |
| Sample Rate | 16,000 Hz (16 kHz) |
| Channels | 1 (Mono) |
| Chunk Size | 1,024 samples (~64ms) |
| Bit Rate (Raw) | 256 KB/s |
| Bit Rate (WebSocket) | ~340 KB/s (with overhead) |

## File Locations

```
Backend:
├── services/audio_service.py          ← Core service
├── main.py                            ← WebSocket endpoints
├── models.py                          ← Data models
├── AUDIO_STREAMING_GUIDE.md          ← Technical reference
├── AUDIO_IMPLEMENTATION_GUIDE.md     ← Practical guide
├── install_pyaudio.bat               ← Auto-install
└── test_audio_streaming.py           ← Test suite

Frontend:
├── lib/useAudioStream.ts             ← Custom hook
└── components/AudioStreamingPanel.tsx ← UI Component
```

## Common Tasks

### Connect, Stream, and Play

```typescript
const {
    connectBroadcast,
    startMicStream,
    stopMicStream
} = useAudioStream()

// Connect
await connectBroadcast('http://localhost:8000')

// Start streaming
await startMicStream()

// Later...
stopMicStream()
```

### Find Custom Device

```python
from services.audio_service import get_audio_service

audio_service = get_audio_service()
devices = audio_service.get_devices("input")

# Find device by name
target = next((d for d in devices if "USB" in d.name), None)
if target:
    print(f"Found: {target.name} at index {target.index}")
```

### Custom WebSocket Handler

```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/custom")
async def ws_custom(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process audio or command
            await websocket.send_json({"status": "ok"})
    except WebSocketDisconnect:
        pass
```

## Debugging

### Check Backend Health

```bash
# Test API
curl http://localhost:8000/audio/devices

# Check logs for audio errors
grep "audio_service" backend.log

# Test WebSocket
python -c "
import asyncio
import websockets
async def test():
    async with websockets.connect('ws://localhost:8000/ws/audio/broadcast-mic') as ws:
        print(await ws.recv())
asyncio.run(test())
"
```

### Browser Console

```javascript
// Check WebSocket state
console.log(ws.readyState) // 0=closed, 1=open, 2=closing, 3=closed

// Monitor audio playback
console.log(audioContext.state) // running/suspended

// Check microphone access
navigator.mediaDevices.getUserMedia({audio: true})
    .then(stream => console.log('✓ Microphone access'))
    .catch(e => console.error('✗ No mic:', e))
```

## Test Commands

```bash
# Run full test suite
python test_audio_streaming.py

# Test specific API
curl -s http://localhost:8000/audio/devices | jq .

# Monitor backend logs
tail -f logs/mapas.backend.log | grep audio

# Check device count
python -c "
from services.audio_service import get_audio_service
as_ = get_audio_service()
print(f'Input: {len(as_.get_devices(\"input\"))}')
print(f'Output: {len(as_.get_devices(\"output\"))}')
"
```

## Performance Tips

1. **Lower Latency**
   - Reduce chunk size (smaller = faster but more overhead)
   - Use local network only
   - Close other audio apps

2. **Higher Quality**
   - Increase sample rate (limited by hardware)
   - Use larger chunks (better compression potential)
   - Add audio compression codec (future)

3. **Multiple Streams**
   - Monitor CPU (each stream ~2-5%)
   - Monitor bandwidth (each stream ~256 KB/s)
   - Monitor memory (each stream ~2-5 MB)

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| PyAudio import fails | Run `python install_pyaudio.bat` |
| No devices found | Check audio drivers, restart OS |
| No microphone permission | Check browser settings + OS settings |
| WebSocket won't connect | Verify backend running, check firewall |
| Audio cuts out | Check network, reduce streams, check CPU |
| High latency | Use local network, close other apps |

## Next Steps

1. ✅ Start using AudioStreamingPanel in UI
2. ✅ Test with test_audio_streaming.py
3. ⬜ Integrate into emergency broadcast workflow
4. ⬜ Add custom device integration
5. ⬜ Consider audio compression for efficiency
6. ⬜ Plan mobile app integration

## Resources

- **Technical Docs**: AUDIO_STREAMING_GUIDE.md
- **Implementation Guide**: AUDIO_IMPLEMENTATION_GUIDE.md
- **API Docs**: http://localhost:8000/docs
- **Test Suite**: test_audio_streaming.py
- **PyAudio Docs**: https://people.csail.mit.edu/hubert/pyaudio/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

**Questions?** Check the documentation files or run tests to debug!
