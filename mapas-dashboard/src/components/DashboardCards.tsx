"use client"

import * as React from "react"
import {
    Rocket,
    Users,
    Box,
    Clock,
    UserCheck,
    Target,
    ArrowDownCircle,
    TrendingUp,
    Zap,
    Navigation,
    BatteryMedium,
    Radio,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    BarChart,
    Bar,
    XAxis,
    Cell,
} from "recharts"

// --- Mission progress radial ---
const missionConfig = {
    progress: { label: "Progress", color: "hsl(190 80% 55%)" },
} satisfies ChartConfig

const missionProgress = [{ progress: 68 }]

export function MissionOverviewCard() {
    return (
        <div className="relative h-full">
            {/* Multi-layer ambient glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 via-sky-500/8 to-indigo-500/10 rounded-2xl blur-xl pointer-events-none"></div>

            <Card className="relative z-10 h-full overflow-hidden text-slate-100 border-0 bg-slate-950/95"
                style={{ boxShadow: "0 0 0 1px rgba(6,182,212,0.14), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(148,163,184,0.04)" }}>

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent"></div>

                {/* Subtle dot-grid background */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
                    style={{ backgroundImage: "radial-gradient(rgba(148,163,184,0.8) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                </div>

                <CardContent className="relative z-10 p-5 h-full flex flex-col gap-4">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500/40 rounded-xl blur-md"></div>
                                <div className="relative p-2.5 bg-gradient-to-br from-cyan-500/25 to-sky-600/15 rounded-xl border border-cyan-500/35"
                                    style={{ boxShadow: "0 4px 12px rgba(6,182,212,0.2)" }}>
                                    <Rocket className="h-5 w-5 text-cyan-400" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-[15px] font-bold text-slate-100 tracking-tight">Mission Overview</h2>
                                    <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] px-1.5 py-0"
                                        style={{ boxShadow: "0 0 8px rgba(52,211,153,0.15)" }}>
                                        ● LIVE
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-mono tracking-wider">OPS-2024-ALPHA · AUTO MODE</p>
                            </div>
                        </div>
                        {/* Elapsed timer */}
                        <div className="text-right px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">Elapsed</p>
                            <p className="text-xl font-black font-mono text-cyan-400 tabular-nums leading-tight"
                                style={{ textShadow: "0 0 12px rgba(6,182,212,0.5)" }}>42:15</p>
                        </div>
                    </div>

                    {/* ── Progress + Phases ── */}
                    <div className="flex gap-5 items-stretch">
                        {/* Radial chart */}
                        <div className="relative flex-shrink-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-cyan-500/8 rounded-full blur-2xl"></div>
                            <ChartContainer config={missionConfig} className="w-[116px] h-[116px]">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="80%"
                                    startAngle={90} endAngle={-270} data={missionProgress}>
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar dataKey="progress"
                                        background={{ fill: "rgba(15,23,42,0.9)" }}
                                        cornerRadius={10}
                                        fill="var(--color-progress)" />
                                    <text x="50%" y="41%" textAnchor="middle" dominantBaseline="middle"
                                        fontSize={24} fontWeight={900} fill="#f1f5f9">68%</text>
                                    <text x="50%" y="59%" textAnchor="middle" dominantBaseline="middle"
                                        fontSize={8.5} fill="#06b6d4" letterSpacing={2}>COMPLETE</text>
                                </RadialBarChart>
                            </ChartContainer>
                        </div>

                        {/* Mission phases */}
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Mission Phases</p>
                            <div className="space-y-2">
                                {[
                                    { label: "Launch & Ascent", status: "done", pct: 100 },
                                    { label: "Navigation", status: "done", pct: 100 },
                                    { label: "Target Approach", status: "active", pct: 68 },
                                    { label: "Payload Drop & RTB", status: "pending", pct: 0 },
                                ].map((phase) => (
                                    <div key={phase.label} className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                            phase.status === "done"
                                                ? "bg-emerald-400"
                                                : phase.status === "active"
                                                ? "bg-cyan-400 animate-pulse"
                                                : "bg-slate-700"
                                        }`} style={phase.status === "active" ? { boxShadow: "0 0 6px rgba(34,211,238,0.8)" } : {}}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-[3px]">
                                                <span className={`text-[11px] truncate leading-tight ${
                                                    phase.status === "done"
                                                        ? "text-slate-600 line-through"
                                                        : phase.status === "active"
                                                        ? "text-slate-200 font-semibold"
                                                        : "text-slate-700"
                                                }`}>{phase.label}</span>
                                                {phase.status === "active" && (
                                                    <span className="text-[10px] text-cyan-400 font-mono font-bold ml-2 flex-shrink-0">
                                                        {phase.pct}%
                                                    </span>
                                                )}
                                                {phase.status === "done" && (
                                                    <span className="text-[10px] text-emerald-500 ml-2 flex-shrink-0">✓</span>
                                                )}
                                            </div>
                                            <div className="h-[3px] rounded-full bg-slate-800/80 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-700 ${
                                                    phase.status === "done"
                                                        ? "bg-emerald-500/60"
                                                        : phase.status === "active"
                                                        ? "bg-gradient-to-r from-cyan-500 to-sky-400"
                                                        : "bg-transparent"
                                                }`} style={{ width: `${phase.pct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Divider ── */}
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-800/70 to-transparent flex-shrink-0"></div>

                    {/* ── Fleet Status ── */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                                <Users size={10} className="text-slate-500" />
                                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Fleet Status</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                                    style={{ boxShadow: "0 0 5px rgba(52,211,153,0.7)" }}></div>
                                <span className="text-[10px] text-slate-500 font-mono">2/3 ACTIVE</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: "DR-01", status: "active", battery: 74, alt: "120m", role: "Lead", signal: 95 },
                                { id: "DR-02", status: "active", battery: 58, alt: "118m", role: "Wing", signal: 87 },
                                { id: "DR-03", status: "idle",   battery: 91, alt: "0m",   role: "Standby", signal: 100 },
                            ].map((drone) => (
                                <div key={drone.id}
                                    className={`relative p-2.5 rounded-xl border transition-all duration-300 overflow-hidden ${
                                        drone.status === "active"
                                            ? "bg-slate-900/70 border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-900/90"
                                            : "bg-slate-900/30 border-slate-800/40"
                                    }`}
                                    style={drone.status === "active" ? { boxShadow: "inset 0 1px 0 rgba(148,163,184,0.04)" } : {}}>

                                    {/* Active glow strip */}
                                    {drone.status === "active" && (
                                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
                                    )}

                                    {/* Drone ID + status dot */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[12px] font-black font-mono text-slate-100 tracking-tight">{drone.id}</span>
                                        <div className={`w-2 h-2 rounded-full ${
                                            drone.status === "active"
                                                ? "bg-emerald-400 animate-pulse"
                                                : "bg-slate-600"
                                        }`} style={drone.status === "active" ? { boxShadow: "0 0 6px rgba(52,211,153,0.7)" } : {}}></div>
                                    </div>

                                    {/* Role badge */}
                                    <div className="mb-2">
                                        <span className={`text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                                            drone.role === "Lead"
                                                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                                                : drone.role === "Wing"
                                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                                : "bg-slate-800/60 text-slate-500 border border-slate-700/40"
                                        }`}>{drone.role}</span>
                                    </div>

                                    {/* Battery bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <BatteryMedium size={9} className="text-slate-600" />
                                            <span className={`text-[10px] font-mono font-bold ${
                                                drone.battery > 60 ? "text-emerald-400" : drone.battery > 30 ? "text-amber-400" : "text-rose-400"
                                            }`}>{drone.battery}%</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${
                                                drone.battery > 60 ? "bg-emerald-500" : drone.battery > 30 ? "bg-amber-500" : "bg-rose-500"
                                            }`} style={{ width: `${drone.battery}%` }}></div>
                                        </div>

                                        {/* Altitude */}
                                        <div className="flex items-center justify-between">
                                            <Navigation size={8} className="text-slate-600" />
                                            <span className="text-[9px] font-mono text-slate-400">{drone.alt}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

// --- AI system performance data ---
const systemChartConfig = {
    confidence: { label: "Confidence", color: "hsl(240 70% 65%)" },
} satisfies ChartConfig

const systemData = [
    { name: "Det", confidence: 97 },
    { name: "Track", confidence: 89 },
    { name: "Drop", confidence: 0 },
]

const systemColors = ["#818cf8", "#34d399", "#fbbf24"]

export function AIStatusCard() {
    return (
        <div className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent rounded-lg blur-2xl pointer-events-none"></div>
            <Card className="bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 border-slate-950/50 text-slate-100 relative z-10 h-full hover:border-slate-900/50 transition-all duration-300 flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">
                        AI & Payload Systems
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-[11px]">
                        Subsystem confidence scores
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-3 pt-0">
                    {/* Bar chart */}
                    <ChartContainer config={systemChartConfig} className="h-[90px] w-full">
                        <BarChart data={systemData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={20}>
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="confidence" radius={[4, 4, 0, 0]}>
                                {systemData.map((_, idx) => (
                                    <Cell key={idx} fill={systemColors[idx]} fillOpacity={systemData[idx].confidence === 0 ? 0.3 : 0.85} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>

                    <Separator className="bg-slate-950/40" />

                    {/* Status rows */}
                    {[
                        {
                            icon: <UserCheck className="h-4 w-4 text-indigo-400" />,
                            bg: "bg-indigo-500/15 border-indigo-500/20",
                            label: "Face Detection",
                            sub: "97% confidence",
                            badge: { text: "● ACTIVE", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
                        },
                        {
                            icon: <Target className="h-4 w-4 text-rose-400" />,
                            bg: "bg-rose-500/15 border-rose-500/20",
                            label: "Object Tracking",
                            sub: "89% confidence",
                            badge: { text: "● ACTIVE", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
                        },
                        {
                            icon: <ArrowDownCircle className="h-4 w-4 text-amber-400" />,
                            bg: "bg-amber-500/15 border-amber-500/20",
                            label: "Drop Mechanism",
                            sub: "Awaiting command",
                            badge: { text: "◆ LOCKED", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
                        },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/30 border border-slate-950/30 hover:bg-slate-950/50 hover:border-slate-900/40 transition-all duration-300">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg border ${item.bg}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-200">{item.label}</p>
                                    <p className="text-[10px] text-slate-500">{item.sub}</p>
                                </div>
                            </div>
                            <Badge className={`text-[10px] border ${item.badge.cls}`}>
                                {item.badge.text}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
