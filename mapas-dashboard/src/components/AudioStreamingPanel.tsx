"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mic, MicOff, Volume2, VolumeX, Radio, PhoneOff } from "lucide-react"
import { toast } from "sonner"
import { useAudioStream } from "@/lib/useAudioStream"

export function AudioStreamingPanel() {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    
    const {
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
        disconnect
    } = useAudioStream({
        onStatusChange: (status) => {
            console.log('Audio status:', status)
        },
        onError: (error) => {
            toast.error('Audio Error', { description: error })
        }
    })

    const volumeRef = React.useRef<HTMLInputElement>(null)
    const [isInitializing, setIsInitializing] = React.useState(false)
    const [connectionStatus, setConnectionStatus] = React.useState<"idle" | "connecting" | "connected" | "streaming">("idle")

    // Initialize and fetch devices on mount only
    React.useEffect(() => {
        let isMounted = true
        
        const init = async () => {
            try {
                setIsInitializing(true)
                
                // Fetch devices using the hook's method (will update devices state)
                await fetchAudioDevices(API_BASE)
                
                if (!isMounted) return
                
                console.log("✓ Audio devices initialized")
            } catch (error) {
                if (!isMounted) return
                console.error("Failed to initialize audio devices:", error)
            } finally {
                if (isMounted) {
                    setIsInitializing(false)
                }
            }
        }
        
        init()
        
        // Cleanup function to prevent state updates after unmount
        return () => {
            isMounted = false
        }
    }, [API_BASE, fetchAudioDevices])

    const handleConnect = async () => {
        try {
            setConnectionStatus("connecting")
            await connectBroadcast(API_BASE)
            setConnectionStatus("connected")
            toast.success("Connected to broadcast stream")
        } catch (error) {
            setConnectionStatus("idle")
            const errorMsg = error instanceof Error ? error.message : "Failed to connect"
            toast.error("Connection Failed", { description: errorMsg })
        }
    }

    const handleStartRecording = async () => {
        try {
            if (!isConnected) {
                toast.error("Not connected", { description: "Connect to broadcast stream first" })
                return
            }
            setConnectionStatus("streaming")
            await startMicStream()
            toast.success("Microphone streaming started")
        } catch (error) {
            setConnectionStatus("connected")
            const errorMsg = error instanceof Error ? error.message : "Failed to start recording"
            toast.error("Recording Error", { description: errorMsg })
        }
    }

    const handleStopRecording = () => {
        stopMicStream()
        setConnectionStatus("connected")
        toast.success("Microphone streaming stopped")
    }

    const handleDisconnect = () => {
        disconnect()
        setConnectionStatus("idle")
        toast.success("Disconnected from broadcast stream")
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const level = parseFloat(e.target.value)
        setVolume(level)
    }

    return (
        <Card className="w-full bg-slate-950 border-slate-950">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-slate-100">
                            <Radio className="h-5 w-5" />
                            Real-Time Audio Broadcasting
                        </CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                            Stream audio from microphone to connected speakers in real-time
                        </p>
                    </div>
                    <Badge variant="outline" className={`${
                        isConnected ? 'bg-green-900 text-green-300 border-green-700' : 'bg-slate-950 text-slate-300 border-slate-900'
                    }`}>
                        {connectionStatus === "streaming" && <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            STREAMING
                        </span>}
                        {connectionStatus === "connected" && <span className="flex items-center gap-1 text-blue-300">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                            CONNECTED
                        </span>}
                        {connectionStatus === "connecting" && <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            CONNECTING
                        </span>}
                        {connectionStatus === "idle" && <span className="text-slate-300">DISCONNECTED</span>}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 bg-slate-950">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-950 border border-red-800 rounded-md p-4 space-y-2">
                        <p className="text-red-200 text-sm font-semibold">❌ {error}</p>
                        {error.includes('PyAudio') && (
                            <div className="text-red-300 text-xs mt-2 space-y-1">
                                <p>To fix this issue, run on the backend:</p>
                                <code className="bg-red-900 px-2 py-1 rounded block font-mono text-red-200">
                                    pip install pyaudio
                                </code>
                                <p>Or on Windows (automated):</p>
                                <code className="bg-red-900 px-2 py-1 rounded block font-mono text-red-200">
                                    python install_pyaudio.bat
                                </code>
                            </div>
                        )}
                    </div>
                )}

                {/* Connection Status */}
                {isInitializing ? (
                    <div className="flex items-center justify-center py-8 text-slate-300">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span>Initializing audio devices...</span>
                    </div>
                ) : (
                    <>
                        {/* PyAudio Not Available Message */}
                        {devices.input.length === 0 && devices.output.length === 0 && !error && (
                            <div className="bg-yellow-950 border border-yellow-800 rounded-md p-4">
                                <p className="text-yellow-200 text-sm font-semibold">⚠️ Audio devices not found</p>
                                <p className="text-yellow-300 text-xs mt-2">
                                    Make sure PyAudio is installed on the backend. Run: <code className="bg-yellow-900 px-1 rounded text-yellow-200">pip install pyaudio</code>
                                </p>
                            </div>
                        )}
                        
                        {/* Devices Info */}
                        {(devices.input.length > 0 || devices.output.length > 0) && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-950 border border-slate-900 p-3 rounded">
                                    <p className="font-semibold text-slate-200">🎤 Microphone Input</p>
                                    <p className="text-slate-400 mt-1 text-xs">
                                        {devices.input.length > 0
                                            ? devices.input.find(d => d.is_default)?.name || devices.input[0].name
                                            : "No devices found"}
                                    </p>
                                </div>
                            <div className="bg-slate-950 border border-slate-900 p-3 rounded">
                                <p className="font-semibold text-slate-200">🔊 Speaker Output</p>
                                <p className="text-slate-400 mt-1 text-xs">
                                    {devices.output.length > 0
                                        ? devices.output.find(d => d.is_default)?.name || devices.output[0].name
                                        : "No devices found"}
                                </p>
                            </div>
                        </div>
                        )}

                        {/* Control Buttons */}
                        {(devices.input.length > 0 || devices.output.length > 0) && (
                        <div className="space-y-3">
                            {/* Connection */}
                            <div className="flex gap-2">
                                {!isConnected ? (
                                    <Button
                                        onClick={handleConnect}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        disabled={isInitializing}
                                    >
                                        <Radio className="h-4 w-4 mr-2" />
                                        Connect to Broadcast
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleDisconnect}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                    >
                                        <PhoneOff className="h-4 w-4 mr-2" />
                                        Disconnect
                                    </Button>
                                )}
                            </div>

                            {/* Microphone Control */}
                            <div className="flex gap-2">
                                {isConnected && !isRecording && (
                                    <Button
                                        onClick={handleStartRecording}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        <Mic className="h-4 w-4 mr-2" />
                                        Start Streaming
                                    </Button>
                                )}
                                {isRecording && (
                                    <Button
                                        onClick={handleStopRecording}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                                    >
                                        <MicOff className="h-4 w-4 mr-2" />
                                        Stop Streaming
                                    </Button>
                                )}
                                {!isConnected && (
                                    <Button
                                        disabled
                                        className="flex-1 bg-slate-900 text-slate-500 cursor-not-allowed"
                                    >
                                        <Mic className="h-4 w-4 mr-2" />
                                        Connect First
                                    </Button>
                                )}
                            </div>
                        </div>
                        )}

                        {/* Volume Control */}
                        {isConnected && (
                            <div className="space-y-2 bg-slate-950 border border-slate-900 p-3 rounded">
                                <label className="text-sm font-semibold text-slate-200">
                                    🔉 Speaker Volume
                                </label>
                                <div className="flex items-center gap-3">
                                    <VolumeX className="h-4 w-4 text-slate-400" />
                                    <input
                                        ref={volumeRef}
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        defaultValue="0.7"
                                        onChange={handleVolumeChange}
                                        className="flex-1 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <Volume2 className="h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        )}

                        {/* Status Messages */}
                        <div className="bg-slate-950 border border-blue-900/50 rounded-md p-4 space-y-2">
                            <p className="text-sm font-semibold text-blue-300">ℹ️ How it works:</p>
                            <ul className="text-sm text-slate-300 space-y-1 ml-4 list-disc">
                                <li>Click "Connect to Broadcast" to establish connection</li>
                                <li>Click "Start Streaming" to capture microphone input</li>
                                <li>Audio is sent to all connected clients in real-time</li>
                                <li>Use volume slider to adjust playback level</li>
                                <li>Supports integration with custom mic/speaker devices</li>
                            </ul>
                        </div>

                        {/* Recording Status */}
                        {isRecording && (
                            <div className="bg-green-950 border border-green-800 rounded-md p-4">
                                <p className="text-green-200 text-sm font-semibold">
                                    🎤 Microphone is active and streaming audio
                                </p>
                            </div>
                        )}

                        {isPlaying && (
                            <div className="bg-green-950 border border-green-800 rounded-md p-4">
                                <p className="text-green-200 text-sm font-semibold">
                                    🔊 Receiving and playing audio from stream
                                </p>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
