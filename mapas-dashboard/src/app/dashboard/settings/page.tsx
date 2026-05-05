"use client"

import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Server,
    UserCheck,
    Mic,
    Monitor,
    Save,
    RotateCcw,
    CheckCircle2,
    Wifi,
    WifiOff,
    Sparkles,
    Eye,
    EyeOff,
    FlaskConical,
} from "lucide-react"

export default function SettingsPage() {
    const readSetting = (key: string, fallback: string) => {
        if (typeof window === "undefined") {
            return fallback
        }
        return localStorage.getItem(key) ?? fallback
    }

    // System & Connectivity
    const [apiUrl, setApiUrl] = useState(() => readSetting("settings_apiUrl", "http://localhost:8002"))
    const [autoReconnect, setAutoReconnect] = useState(() => readSetting("settings_autoReconnect", "true") === "true")
    const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "failed">("idle")

    // Face Verification
    const [confidenceThreshold, setConfidenceThreshold] = useState(() => Number(readSetting("settings_confidenceThreshold", "75")))
    const [maxEnrollPhotos, setMaxEnrollPhotos] = useState(() => Number(readSetting("settings_maxEnrollPhotos", "5")))

    // Audio / Announcements
    const [ttsLanguage, setTtsLanguage] = useState(() => readSetting("settings_ttsLanguage", "en"))
    const [audioVolume, setAudioVolume] = useState(() => Number(readSetting("settings_audioVolume", "80")))

    // UI Preferences
    const [refreshInterval, setRefreshInterval] = useState(() => Number(readSetting("settings_refreshInterval", "5")))
    const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">(() => readSetting("settings_unitSystem", "metric") as "metric" | "imperial")

    // ElevenLabs
    const [elEngine, setElEngine] = useState<"pyttsx3" | "elevenlabs">(() => readSetting("settings_elEngine", "pyttsx3") as "pyttsx3" | "elevenlabs")
    const [elApiKey, setElApiKey] = useState(() => readSetting("settings_elApiKey", ""))
    const [elVoiceId, setElVoiceId] = useState(() => readSetting("settings_elVoiceId", "21m00Tcm4TlvDq8ikWAM"))
    const [elModelId, setElModelId] = useState(() => readSetting("settings_elModelId", "eleven_multilingual_v2"))
    const [elStability, setElStability] = useState(() => Number(readSetting("settings_elStability", "50")))
    const [elSimilarity, setElSimilarity] = useState(() => Number(readSetting("settings_elSimilarity", "75")))
    const [showApiKey, setShowApiKey] = useState(false)
    const [elTestStatus, setElTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle")
    const [elStatusMessage, setElStatusMessage] = useState("")

    const [saved, setSaved] = useState(false)

    async function testConnection() {
        setConnectionStatus("testing")
        try {
            const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(4000) })
            setConnectionStatus(res.ok ? "success" : "failed")
        } catch {
            setConnectionStatus("failed")
        }
        setTimeout(() => setConnectionStatus("idle"), 3000)
    }

    async function handleSave() {
        // Persist to localStorage for cross-component use
        localStorage.setItem("settings_apiUrl", apiUrl)
        localStorage.setItem("settings_autoReconnect", String(autoReconnect))
        localStorage.setItem("settings_confidenceThreshold", String(confidenceThreshold))
        localStorage.setItem("settings_maxEnrollPhotos", String(maxEnrollPhotos))
        localStorage.setItem("settings_ttsLanguage", ttsLanguage)
        localStorage.setItem("settings_audioVolume", String(audioVolume))
        localStorage.setItem("settings_refreshInterval", String(refreshInterval))
        localStorage.setItem("settings_unitSystem", unitSystem)
        localStorage.setItem("settings_elEngine", elEngine)
        localStorage.setItem("settings_elApiKey", elApiKey)
        localStorage.setItem("settings_elVoiceId", elVoiceId)
        localStorage.setItem("settings_elModelId", elModelId)
        localStorage.setItem("settings_elStability", String(elStability))
        localStorage.setItem("settings_elSimilarity", String(elSimilarity))

        // Push ElevenLabs config to backend
        try {
            const res = await fetch(`${apiUrl}/settings/tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    engine: elEngine,
                    api_key: elApiKey || undefined,
                    voice_id: elVoiceId,
                    model_id: elModelId,
                    stability: elStability / 100,
                    similarity_boost: elSimilarity / 100,
                    language: ttsLanguage,
                }),
            })
            const data = (await res.json()) as { status?: string; message?: string }
            if (!res.ok || data.status === "error") {
                setSaved(false)
                setElStatusMessage(data.message ?? "Failed to save TTS settings on backend.")
                return
            }
        } catch { /* backend may not be running */ }

        setSaved(true)
        setElStatusMessage("")
        setTimeout(() => setSaved(false), 2500)
    }

    async function testElevenLabs() {
        setElTestStatus("testing")
        setElStatusMessage("")
        try {
            const res = await fetch(`${apiUrl}/settings/tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    engine: elEngine,
                    api_key: elApiKey || undefined,
                    voice_id: elVoiceId,
                    model_id: elModelId,
                    stability: elStability / 100,
                    similarity_boost: elSimilarity / 100,
                }),
            })
            if (res.ok) {
                // Trigger a TTS test on the backend
                const testRes = await fetch(`${apiUrl}/tts-test`)
                const testData = (await testRes.json()) as { status?: string; message?: string }
                if (testRes.ok && testData.status === "ok") {
                    setElTestStatus("success")
                    setElStatusMessage(testData.message ?? "Voice test started.")
                } else {
                    setElTestStatus("failed")
                    setElStatusMessage(testData.message ?? "Voice test failed.")
                }
            } else {
                setElTestStatus("failed")
                setElStatusMessage("Failed to push TTS settings to backend.")
            }
        } catch {
            setElTestStatus("failed")
            setElStatusMessage("Could not connect to backend.")
        }
        setTimeout(() => setElTestStatus("idle"), 3000)
    }

    function handleReset() {
        setApiUrl("http://localhost:8002")
        setAutoReconnect(true)
        setConfidenceThreshold(75)
        setMaxEnrollPhotos(5)
        setTtsLanguage("en")
        setAudioVolume(80)
        setRefreshInterval(5)
        setUnitSystem("metric")
        setElEngine("pyttsx3")
        setElApiKey("")
        setElVoiceId("21m00Tcm4TlvDq8ikWAM")
        setElModelId("eleven_multilingual_v2")
        setElStability(50)
        setElSimilarity(75)
        setElStatusMessage("")
    }

    return (
        <div className="flex-1 p-6 space-y-8 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-100">Settings</h1>
                <p className="text-slate-400 mt-2">Configure system behaviour, thresholds, and UI preferences.</p>
            </div>

            <Separator className="bg-slate-900" />

            {/* System & Connectivity */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300">
                    <Server size={18} className="text-sky-400" />
                    <h2 className="text-lg font-semibold">System &amp; Connectivity</h2>
                </div>

                <Card className="bg-slate-950 border-slate-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Backend API URL</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Used by face verification, announcements, and audio streaming.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <Input
                                value={apiUrl}
                                onChange={e => setApiUrl(e.target.value)}
                                className="bg-slate-900 border-slate-800 text-slate-100 font-mono text-sm flex-1"
                                placeholder="http://localhost:8002"
                            />
                            <Button
                                variant="outline"
                                onClick={testConnection}
                                disabled={connectionStatus === "testing"}
                                className="border-slate-800 text-slate-300 hover:bg-slate-900 shrink-0"
                            >
                                {connectionStatus === "testing" ? (
                                    <span className="flex items-center gap-2"><Wifi size={14} className="animate-pulse" /> Testing…</span>
                                ) : connectionStatus === "success" ? (
                                    <span className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={14} /> Connected</span>
                                ) : connectionStatus === "failed" ? (
                                    <span className="flex items-center gap-2 text-rose-400"><WifiOff size={14} /> Failed</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Wifi size={14} /> Test</span>
                                )}
                            </Button>
                        </div>

                        {/* Auto-reconnect toggle */}
                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-md px-4 py-3">
                            <div>
                                <p className="text-sm text-slate-200">Auto-reconnect on disconnect</p>
                                <p className="text-xs text-slate-500 mt-0.5">Automatically retry the connection if the backend goes offline.</p>
                            </div>
                            <button
                                onClick={() => setAutoReconnect(v => !v)}
                                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none ${autoReconnect ? "bg-sky-500" : "bg-slate-700"}`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${autoReconnect ? "translate-x-5" : "translate-x-0.5"}`}
                                />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Face Verification */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300">
                    <UserCheck size={18} className="text-sky-400" />
                    <h2 className="text-lg font-semibold">Face Verification</h2>
                </div>

                <Card className="bg-slate-950 border-slate-900">
                    <CardContent className="pt-5 space-y-6">
                        {/* Confidence threshold */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm">Confidence Threshold</Label>
                                <Badge variant="outline" className="font-mono border-sky-500/30 text-sky-400">
                                    {confidenceThreshold}%
                                </Badge>
                            </div>
                            <input
                                type="range"
                                min={50}
                                max={99}
                                value={confidenceThreshold}
                                onChange={e => setConfidenceThreshold(Number(e.target.value))}
                                className="w-full accent-sky-500"
                            />
                            <p className="text-xs text-slate-500">
                                Minimum match score required to approve a face. Higher = stricter.
                            </p>
                        </div>

                        {/* Max enroll photos */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">Max Enrolment Photos per Customer</Label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={maxEnrollPhotos}
                                onChange={e => setMaxEnrollPhotos(Number(e.target.value))}
                                className="bg-slate-900 border-slate-800 text-slate-100 w-32"
                            />
                            <p className="text-xs text-slate-500">How many reference photos to store per customer.</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Audio / Announcements */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300">
                    <Mic size={18} className="text-sky-400" />
                    <h2 className="text-lg font-semibold">Audio &amp; Announcements</h2>
                </div>

                <Card className="bg-slate-950 border-slate-900">
                    <CardContent className="pt-5 space-y-6">
                        {/* TTS language */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">Default TTS Language</Label>
                            <select
                                value={ttsLanguage}
                                onChange={e => setTtsLanguage(e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-md px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="zh">Chinese</option>
                                <option value="ar">Arabic</option>
                            </select>
                            <p className="text-xs text-slate-500">Language used by the public announcement TTS engine.</p>
                        </div>

                        {/* Volume */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm">Announcement Volume</Label>
                                <Badge variant="outline" className="font-mono border-sky-500/30 text-sky-400">
                                    {audioVolume}%
                                </Badge>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={audioVolume}
                                onChange={e => setAudioVolume(Number(e.target.value))}
                                className="w-full accent-sky-500"
                            />
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ElevenLabs */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300">
                    <Sparkles size={18} className="text-sky-400" />
                    <h2 className="text-lg font-semibold">ElevenLabs Voice</h2>
                    <Badge variant="outline" className="ml-2 border-violet-500/30 text-violet-400 text-[10px] tracking-widest font-mono">
                        CLOUD TTS
                    </Badge>
                </div>

                <Card className="bg-slate-950 border-slate-900">
                    <CardContent className="pt-5 space-y-6">

                        {/* Engine toggle */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">TTS Provider</Label>
                            <div className="flex gap-2">
                                {(["pyttsx3", "elevenlabs"] as const).map(e => (
                                    <button
                                        key={e}
                                        onClick={() => setElEngine(e)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                                            elEngine === e
                                                ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                        }`}
                                    >
                                        {e === "elevenlabs" ? "ElevenLabs (cloud)" : "pyttsx3 (offline)"}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500">Switch between the offline robot voice and ElevenLabs human-quality voices.</p>
                        </div>

                        {/* API Key */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">ElevenLabs API Key</Label>
                            <div className="flex gap-2">
                                <Input
                                    type={showApiKey ? "text" : "password"}
                                    value={elApiKey}
                                    onChange={e => setElApiKey(e.target.value)}
                                    placeholder="sk_…"
                                    className="bg-slate-900 border-slate-800 text-slate-100 font-mono text-sm flex-1"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowApiKey(v => !v)}
                                    className="border-slate-800 text-slate-400 hover:bg-slate-900 shrink-0"
                                >
                                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                                Get your key at{" "}
                                <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">elevenlabs.io</a>.
                                It&apos;s free for ~10k chars/month.
                            </p>
                        </div>

                        {/* Voice selector */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">Voice</Label>
                            <select
                                value={elVoiceId}
                                onChange={e => setElVoiceId(e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="21m00Tcm4TlvDq8ikWAM">Rachel (calm, female)</option>
                                <option value="EXAVITQu4vr4xnSDxMaL">Bella (warm, female)</option>
                                <option value="LcfcDJNUP1GQjkzn1xUU">Emily (soft, female)</option>
                                <option value="MF3mGyEYCl7XYWbV9V6O">Elli (young, female)</option>
                                <option value="ErXwobaYiN019PkySvjV">Antoni (well-rounded, male)</option>
                                <option value="TxGEqnHWrfWFTfGW9XjX">Josh (deep, male)</option>
                                <option value="pNInz6obpgDQGcFmaJgB">Adam (deep, male)</option>
                                <option value="yoZ06aMxZJJ28mfd3POQ">Sam (raspy, male)</option>
                                <option value="VR6AewLTigWG4xSOukaG">Arnold (crisp, male)</option>
                                <option value="IKne3meq5aSn9XLyUdCD">Charlie (casual, male)</option>
                            </select>
                            <p className="text-xs text-slate-500">Pick a preset, or paste any custom ElevenLabs Voice ID below.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">Custom Voice ID</Label>
                            <Input
                                value={elVoiceId}
                                onChange={e => setElVoiceId(e.target.value.trim())}
                                placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                                className="bg-slate-900 border-slate-800 text-slate-100 font-mono text-sm"
                            />
                            <p className="text-xs text-slate-500">Use this for cloned/custom voices from your ElevenLabs dashboard.</p>
                        </div>

                        {/* Model */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">Model</Label>
                            <select
                                value={elModelId}
                                onChange={e => setElModelId(e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="eleven_multilingual_v2">Multilingual v2 (best quality)</option>
                                <option value="eleven_monolingual_v1">Monolingual v1 (English only, faster)</option>
                                <option value="eleven_turbo_v2">Turbo v2 (low latency)</option>
                                <option value="eleven_turbo_v2_5">Turbo v2.5 (lowest latency)</option>
                            </select>
                        </div>

                        {/* Stability */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm">Stability</Label>
                                <Badge variant="outline" className="font-mono border-sky-500/30 text-sky-400">{elStability}%</Badge>
                            </div>
                            <input type="range" min={0} max={100} value={elStability}
                                onChange={e => setElStability(Number(e.target.value))}
                                className="w-full accent-sky-500" />
                            <p className="text-xs text-slate-500">Higher = more consistent, lower = more expressive.</p>
                        </div>

                        {/* Similarity Boost */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm">Similarity Boost</Label>
                                <Badge variant="outline" className="font-mono border-sky-500/30 text-sky-400">{elSimilarity}%</Badge>
                            </div>
                            <input type="range" min={0} max={100} value={elSimilarity}
                                onChange={e => setElSimilarity(Number(e.target.value))}
                                className="w-full accent-sky-500" />
                            <p className="text-xs text-slate-500">Higher = closer to the original voice.</p>
                        </div>

                        {/* Test button */}
                        <Button
                            variant="outline"
                            onClick={testElevenLabs}
                            disabled={elTestStatus === "testing" || (elEngine === "elevenlabs" && !elApiKey)}
                            className="border-slate-800 text-slate-300 hover:bg-slate-900"
                        >
                            {elTestStatus === "testing" ? (
                                <span className="flex items-center gap-2"><FlaskConical size={14} className="animate-pulse" /> Testing…</span>
                            ) : elTestStatus === "success" ? (
                                <span className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={14} /> Voice working!</span>
                            ) : elTestStatus === "failed" ? (
                                <span className="flex items-center gap-2 text-rose-400"><WifiOff size={14} /> Failed – check API key</span>
                            ) : (
                                <span className="flex items-center gap-2"><FlaskConical size={14} /> Test Voice</span>
                            )}
                        </Button>
                        {elStatusMessage && (
                            <p className={`text-xs ${elTestStatus === "failed" ? "text-rose-400" : "text-slate-400"}`}>
                                {elStatusMessage}
                            </p>
                        )}

                    </CardContent>
                </Card>
            </section>

            {/* UI Preferences */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300">
                    <Monitor size={18} className="text-sky-400" />
                    <h2 className="text-lg font-semibold">UI Preferences</h2>
                </div>

                <Card className="bg-slate-950 border-slate-900">
                    <CardContent className="pt-5 space-y-6">
                        {/* Refresh interval */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">Dashboard Refresh Interval (seconds)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={60}
                                value={refreshInterval}
                                onChange={e => setRefreshInterval(Number(e.target.value))}
                                className="bg-slate-900 border-slate-800 text-slate-100 w-32"
                            />
                            <p className="text-xs text-slate-500">How often telemetry and alert panels auto-refresh.</p>
                        </div>

                        {/* Unit system */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">Unit System</Label>
                            <div className="flex gap-2">
                                {(["metric", "imperial"] as const).map(unit => (
                                    <button
                                        key={unit}
                                        onClick={() => setUnitSystem(unit)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors capitalize ${
                                            unitSystem === unit
                                                ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                        }`}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500">Affects speed, distance, and altitude readings.</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Separator className="bg-slate-900" />

            {/* Action bar */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={handleSave}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-6"
                >
                    {saved ? (
                        <span className="flex items-center gap-2"><CheckCircle2 size={14} /> Saved</span>
                    ) : (
                        <span className="flex items-center gap-2"><Save size={14} /> Save Changes</span>
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleReset}
                    className="border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                >
                    <RotateCcw size={14} className="mr-2" />
                    Reset to Defaults
                </Button>
            </div>
        </div>
    )
}
