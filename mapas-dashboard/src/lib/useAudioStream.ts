/**
 * Custom hook for real-time audio streaming via WebSocket.
 *
 * Pipeline (send side):
 *   Browser mic → AudioContext (16 kHz, mono) → AudioWorklet (pcm-processor.js)
 *   → Int16 PCM ArrayBuffer → WebSocket binary frame → Server
 *
 * Pipeline (receive side):
 *   Server → WebSocket binary frame → Int16 PCM ArrayBuffer
 *   → Float32 AudioBuffer → AudioContext scheduler → Speakers
 *
 * Format: Int16 PCM · 16 000 Hz · mono
 *   • No base64, no WebM container → zero transcoding overhead
 *   • ~2 KB / message, ~64 ms / chunk, ~31 msg/s
 *   • Directly compatible with PyAudio paInt16 and future USB amplifiers
 */

import { useRef, useState, useCallback, useEffect } from 'react';

const SAMPLE_RATE = 16_000; // Hz — must match pcm-processor.js contract

interface UseAudioStreamOptions {
    onStatusChange?: (status: string) => void;
    onError?: (error: string) => void;
}

interface AudioDevice {
    index: number;
    name: string;
    channels: number;
    sample_rate: number;
    is_default: boolean;
}

export function useAudioStream(options: UseAudioStreamOptions = {}) {
    // ── Stable options ref (prevents stale-closure churn on every render) ─────
    const optionsRef = useRef(options);
    optionsRef.current = options; // updated synchronously — no useEffect needed

    // ── Refs ──────────────────────────────────────────────────────────────────
    const wsRef           = useRef<WebSocket | null>(null);
    const audioCtxRef     = useRef<AudioContext | null>(null);
    const workletNodeRef  = useRef<AudioWorkletNode | null>(null);
    const sourceNodeRef   = useRef<MediaStreamAudioSourceNode | null>(null);
    const silentGainRef   = useRef<GainNode | null>(null);  // keeps worklet alive
    const playGainRef     = useRef<GainNode | null>(null);  // playback volume
    const micStreamRef    = useRef<MediaStream | null>(null);
    const nextPlayTimeRef = useRef<number>(0);              // audio scheduler cursor

    // ── State ─────────────────────────────────────────────────────────────────
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying,   setIsPlaying]   = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [devices,     setDevices]     = useState<{ input: AudioDevice[]; output: AudioDevice[] }>(
        { input: [], output: [] }
    );

    // ── Audio Context (lazy, 16 kHz) ──────────────────────────────────────────
    const getAudioContext = useCallback(async (): Promise<AudioContext> => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
        }
        if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    // ── Fetch audio device list from backend ──────────────────────────────────
    const fetchAudioDevices = useCallback(async (apiUrl: string) => {
        try {
            const res = await fetch(`${apiUrl}/audio/devices?t=${Date.now()}`);
            if (!res.ok) throw new Error('Failed to fetch audio devices');
            const data = await res.json();

            if (data.status === 'pyaudio_not_available') {
                const msg = 'PyAudio not installed on server. Install with: pip install pyaudio';
                setError(msg);
                optionsRef.current.onError?.(msg);
                setDevices({ input: [], output: [] });
                return data;
            }

            setDevices({
                input:  data.input_devices  || [],
                output: data.output_devices || [],
            });
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch devices';
            setError(msg);
            optionsRef.current.onError?.(msg);
            throw e;
        }
    }, []);

    // ── Receive: play a raw Int16 PCM chunk ───────────────────────────────────
    const playPCMChunk = useCallback(async (rawBuffer: ArrayBuffer) => {
        try {
            const ctx = await getAudioContext();

            // Int16 → Float32
            const int16   = new Int16Array(rawBuffer);
            const float32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) {
                float32[i] = int16[i] / 32_768;
            }

            const audioBuf = ctx.createBuffer(1, float32.length, SAMPLE_RATE);
            audioBuf.getChannelData(0).set(float32);

            if (!playGainRef.current) {
                playGainRef.current = ctx.createGain();
                playGainRef.current.gain.value = 0.8;
                playGainRef.current.connect(ctx.destination);
            }

            const source = ctx.createBufferSource();
            source.buffer = audioBuf;
            source.connect(playGainRef.current);

            // Schedule immediately after previous chunk (no gaps, no overlap)
            const now     = ctx.currentTime;
            const startAt = Math.max(now + 0.010, nextPlayTimeRef.current);
            source.start(startAt);
            nextPlayTimeRef.current = startAt + audioBuf.duration;

            setIsPlaying(true);
            source.onended = () => {
                if (nextPlayTimeRef.current <= (audioCtxRef.current?.currentTime ?? 0)) {
                    setIsPlaying(false);
                }
            };
        } catch (e) {
            console.error('Error playing PCM chunk:', e);
        }
    }, [getAudioContext]);

    // ── Connect WebSocket ─────────────────────────────────────────────────────
    const connectBroadcast = useCallback(async (apiUrl: string) => {
        try {
            const health = await fetch(`${apiUrl}/ping`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000),
            });
            if (!health.ok) throw new Error(`Backend returned ${health.status}`);

            const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/audio/broadcast-mic';
            const ws    = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer'; // receive binary as ArrayBuffer (not Blob)

            const connectionTimeout = setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    const msg = 'WebSocket connection timeout (5 s)';
                    setError(msg);
                    optionsRef.current.onError?.(msg);
                    ws.close();
                }
            }, 5000);

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                setIsConnected(true);
                setError(null);
                optionsRef.current.onStatusChange?.('connected');
                console.log('✅ Connected to PCM broadcast stream');
            };

            ws.onmessage = (event) => {
                if (event.data instanceof ArrayBuffer) {
                    // Raw Int16 PCM relayed from another broadcaster
                    playPCMChunk(event.data);
                } else {
                    // JSON status / error / control frame
                    try {
                        const msg = JSON.parse(event.data as string);
                        if (msg.type === 'status') {
                            console.log('📊 Status:', msg.message);
                            optionsRef.current.onStatusChange?.(msg.status || '');
                        } else if (msg.type === 'error') {
                            const errMsg = msg.message || 'Audio stream error';
                            setError(errMsg);
                            optionsRef.current.onError?.(errMsg);
                        }
                    } catch (e) {
                        console.error('Error parsing WS message:', e);
                    }
                }
            };

            ws.onerror = () => {
                clearTimeout(connectionTimeout);
                const msg = 'WebSocket connection failed. Backend may have crashed or port is blocked.';
                setError(msg);
                optionsRef.current.onError?.(msg);
            };

            ws.onclose = (event) => {
                clearTimeout(connectionTimeout);
                setIsConnected(false);
                setIsRecording(false);
                optionsRef.current.onStatusChange?.('disconnected');
                console.log(`🔌 WS closed: code=${event.code} reason=${event.reason || 'none'}`);
            };

            wsRef.current = ws;
            return ws;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to connect';
            setError(msg);
            optionsRef.current.onError?.(msg);
            throw e;
        }
    }, [playPCMChunk]);

    // ── Start microphone → AudioWorklet → WebSocket ───────────────────────────
    const startMicStream = useCallback(async () => {
        try {
            const ctx = await getAudioContext();

            // Load the worklet module (idempotent — browser caches it)
            await ctx.audioWorklet.addModule('/pcm-processor.js');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl:  true,
                    channelCount:     1,
                    sampleRate:       SAMPLE_RATE,
                },
            });
            micStreamRef.current = stream;

            const source = ctx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;

            const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
            workletNodeRef.current = worklet;

            // Forward each Int16 chunk to the WebSocket as a raw binary frame
            worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(e.data);
                }
            };

            // source → worklet (capture pipeline)
            source.connect(worklet);

            // worklet → silent gain → destination
            // (Web Audio API requires audio graph to reach destination to stay active)
            if (!silentGainRef.current) {
                silentGainRef.current = ctx.createGain();
                silentGainRef.current.gain.value = 0; // no local echo
                silentGainRef.current.connect(ctx.destination);
            }
            worklet.connect(silentGainRef.current);

            setIsRecording(true);
            optionsRef.current.onStatusChange?.('recording');
            console.log('🎤 PCM mic stream started (16 kHz · mono · Int16)');
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to access microphone';
            setError(msg);
            optionsRef.current.onError?.(msg);
            throw e;
        }
    }, [getAudioContext]);

    // ── Stop microphone ───────────────────────────────────────────────────────
    const stopMicStream = useCallback(() => {
        workletNodeRef.current?.disconnect();
        workletNodeRef.current = null;
        sourceNodeRef.current?.disconnect();
        sourceNodeRef.current = null;
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
        setIsRecording(false);
        optionsRef.current.onStatusChange?.('stopped');
        console.log('⏹️ PCM mic stream stopped');
    }, []);

    // ── Playback volume ───────────────────────────────────────────────────────
    const setVolume = useCallback((level: number) => {
        if (playGainRef.current) {
            playGainRef.current.gain.value = Math.max(0, Math.min(1, level));
        }
    }, []);

    // ── Disconnect ────────────────────────────────────────────────────────────
    const disconnect = useCallback(() => {
        stopMicStream();
        wsRef.current?.close();
        wsRef.current = null;
        setIsConnected(false);
    }, [stopMicStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { disconnect(); };
    }, [disconnect]);

    return {
        isConnected,
        isRecording,
        isPlaying,
        error,
        devices,
        fetchAudioDevices,
        connectBroadcast,
        startMicStream,
        stopMicStream,
        setVolume,
        disconnect,
    };
}
