"use client"

import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Plane,
    Utensils,
    Megaphone,
    Battery,
    Wifi,
    Wind,
    Thermometer,
    Weight,
    Ruler,
    Clock,
    Radio,
    ShieldCheck,
    Cpu,
    Camera,
    MapPin,
    Activity,
    Zap,
    Eye,
} from "lucide-react"

const drones = [
    {
        id: "DR-ALPHA-01",
        name: "MAS",
        fullName: "Mothership Autonomous System",
        role: "Heavy-Lift · Command & Carrier",
        status: "online" as const,
        statusLabel: "ONLINE · READY",
        icon: Utensils,
        accentColor: "sky",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dotClass: "bg-emerald-500",
        description:
            "MAS (Mothership Autonomous System) is the heavy-lift primary drone that acts as the command centre and carrier for the entire MAPAS operation. Powered by the NVIDIA Jetson Nano Orin, it handles high-level AI tasks on-board — including Face Recognition for verified delivery, Drowning Detection, and Public Announcements via its onboard PA system. MAS transports the smaller FPV drone (PAS) to the mission site to preserve PAS's battery, then autonomously coordinates the overall mission while PAS is deployed. It also handles high-volume tasks such as agriculture spraying thanks to its high-payload capacity.",
        specs: [
            { icon: Weight,       label: "Max Payload",      value: "2.5 kg" },
            { icon: Ruler,        label: "Wingspan",         value: "680 mm" },
            { icon: Battery,      label: "Flight Time",      value: "~32 min" },
            { icon: Zap,          label: "Max Speed",        value: "65 km/h" },
            { icon: Wind,         label: "Wind Tolerance",   value: "≤ 8 m/s" },
            { icon: Thermometer,  label: "Operating Temp",   value: "-10 °C → 45 °C" },
            { icon: MapPin,       label: "Max Range",        value: "6 km (LOS)" },
            { icon: Activity,     label: "Service Ceiling",  value: "120 m AGL" },
        ],
        systems: [
            { icon: Cpu,         label: "AI Processor",        value: "NVIDIA Jetson Nano Orin" },
            { icon: Camera,      label: "Vision / Face ID",     value: "InsightFace · 720p" },
            { icon: Eye,         label: "Drowning Detection",   value: "CV model on Jetson" },
            { icon: Megaphone,   label: "PA System",            value: "pyttsx3 / ElevenLabs TTS" },
            { icon: Radio,       label: "Data Link",            value: "915 MHz + Wi-Fi 6" },
            { icon: ShieldCheck, label: "Safety",              value: "Geo-fence · Kill-switch" },
        ],
        missions: ["OP-FD-001", "OP-PAS-003"],
        firmwareVersion: "MAS-FW v3.2.1",
        lastMaintenance: "2026-02-18",
        totalFlightHours: "214 h",
    },
    {
        id: "DR-BETA-04",
        name: "PAS",
        fullName: "Piloted Aircraft System (FPV Drone)",
        role: "Scout · Rapid Response · Life-Finder",
        status: "standby" as const,
        statusLabel: "DOCKED · STANDBY",
        icon: Megaphone,
        accentColor: "violet",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dotClass: "bg-amber-500",
        description:
            "PAS (Piloted Aircraft System) is the agile, high-speed FPV drone that docks to the Mothership (MAS) during transit. It stays powered down while attached to MAS, preserving its full battery for the critical last-mile mission. Once MAS reaches altitude, PAS is released and piloted manually by a human operator into disaster zones, collapsed buildings, or narrow spaces where the large MAS cannot fly. Its low-latency video feed and high manoeuvrability make it the primary life-finding and close-quarters inspection asset in the MAPAS fleet.",
        specs: [
            { icon: Weight,       label: "Max Payload",        value: "0.5 kg" },
            { icon: Ruler,        label: "Frame Size",          value: "5\" FPV class" },
            { icon: Battery,      label: "Flight Time",         value: "~12 min (full throttle)" },
            { icon: Zap,          label: "Max Speed",           value: "120 km/h" },
            { icon: Wind,         label: "Wind Tolerance",      value: "≤ 5 m/s" },
            { icon: Thermometer,  label: "Operating Temp",      value: "-5 °C → 40 °C" },
            { icon: MapPin,       label: "Deployment Mode",     value: "Released from MAS at altitude" },
            { icon: Activity,     label: "Control Latency",     value: "< 20 ms" },
        ],
        systems: [
            { icon: Cpu,         label: "Flight Stack",         value: "Betaflight F7 FC" },
            { icon: Camera,      label: "FPV Camera",           value: "1080p · 120° FOV · low-latency" },
            { icon: Radio,       label: "Video TX",             value: "DJI O3 / Analog 5.8 GHz" },
            { icon: Wifi,        label: "RC Link",              value: "ExpressLRS 2.4 GHz" },
            { icon: Battery,     label: "Power",                value: "6S LiPo · preserved while docked" },
            { icon: ShieldCheck, label: "Fail-safe",            value: "Auto-disarm · pilot override" },
        ],
        missions: ["OP-SCOUT-001", "OP-SAR-002"],
        firmwareVersion: "PAS-FW v2.8.0",
        lastMaintenance: "2026-02-25",
        totalFlightHours: "138 h",
    },
]

const statusDot: Record<string, string> = {
    online:  "bg-emerald-500",
    standby: "bg-amber-500",
    offline: "bg-slate-500",
}

export default function DroneFleetPage() {
    return (
        <div className="flex-1 p-6 space-y-10 max-w-6xl">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-100">Drone Fleet</h1>
                <p className="text-slate-400 mt-2">
                    Full specifications and operational profiles for all MAPAS drones.
                </p>
            </div>

            {/* Fleet summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Drones",    value: "2" },
                    { label: "MAS Online · PAS Docked", value: "1 + 1" },
                    { label: "Combined Flight", value: "352 h" },
                    { label: "Active Missions", value: "4" },
                ].map(item => (
                    <Card key={item.label} className="bg-slate-950 border-slate-900">
                        <CardContent className="pt-4 pb-3">
                            <p className="text-2xl font-bold text-slate-100">{item.value}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Separator className="bg-slate-900" />

            {/* Drone cards */}
            <div className="space-y-10">
                {drones.map((drone) => (
                    <section key={drone.id} className="space-y-6">
                        {/* --- Drone header --- */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 text-${drone.accentColor}-400`}>
                                <drone.icon size={28} />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-2xl font-bold text-slate-100">{drone.name}</h2>
                                    <span className="text-slate-500 text-sm font-normal">— {drone.fullName}</span>
                                    <Badge variant="outline" className={`uppercase text-[10px] tracking-widest font-mono ${drone.badgeClass}`}>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${drone.dotClass}`} />
                                        {drone.statusLabel}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{drone.id}</span>
                                    <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{drone.firmwareVersion}</span>
                                    <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Role: {drone.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-slate-800 pl-4">
                            {drone.description}
                        </p>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Performance specs */}
                            <Card className="bg-slate-950 border-slate-900">
                                <CardHeader className="pb-3 border-b border-slate-900">
                                    <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                        <Activity size={14} className="text-sky-400" />
                                        Performance Specifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {drone.specs.map(spec => (
                                            <div key={spec.label} className="flex items-start gap-2 bg-slate-900 rounded-lg p-3 border border-slate-800">
                                                <spec.icon size={14} className="text-slate-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{spec.label}</p>
                                                    <p className="text-sm font-medium text-slate-200 mt-0.5">{spec.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Onboard systems */}
                            <Card className="bg-slate-950 border-slate-900">
                                <CardHeader className="pb-3 border-b border-slate-900">
                                    <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                        <Cpu size={14} className="text-sky-400" />
                                        Onboard Systems
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-2">
                                    {drone.systems.map(sys => (
                                        <div key={sys.label} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2.5 border border-slate-800">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <sys.icon size={14} className="text-slate-500 shrink-0" />
                                                <span className="text-xs">{sys.label}</span>
                                            </div>
                                            <span className="text-xs font-medium text-slate-200 text-right max-w-[55%]">{sys.value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Footer stats */}
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Clock size={12} />
                                Last maintenance: <span className="text-slate-300 font-medium">{drone.lastMaintenance}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Plane size={12} />
                                Total flight hours: <span className="text-slate-300 font-medium">{drone.totalFlightHours}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Activity size={12} />
                                Assigned missions: {drone.missions.map(m => (
                                    <span key={m} className="font-mono text-sky-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 ml-1">{m}</span>
                                ))}
                            </span>
                        </div>

                        {drone !== drones[drones.length - 1] && <Separator className="bg-slate-900" />}
                    </section>
                ))}
            </div>
        </div>
    )
}
