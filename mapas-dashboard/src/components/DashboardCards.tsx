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
        <div className="relative h-full group">
            {/* Ambient glow that reacts to group hover */}
            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <Card className="relative z-10 h-full overflow-hidden bg-slate-950/60 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 transition-all duration-500 hover:border-white/[0.12] rounded-2xl">
                {/* Subtle Top highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

                <CardContent className="relative z-10 p-6 h-full flex flex-col gap-6">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-inner">
                                <Rocket className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 mb-1">
                                    <h2 className="text-lg font-bold text-white tracking-tight">Mission Overview</h2>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block"></span>
                                        LIVE
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-400 tracking-wide font-medium">Autonomous Target Rescue</p>
                            </div>
                        </div>
                        {/* Elapsed timer */}
                        <div className="text-right px-4 py-2 rounded-xl bg-black/40 border border-white/[0.05] flex flex-col items-end justify-center">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">Elapsed</span>
                            <span className="text-xl font-mono font-bold text-cyan-400 tracking-tight drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">42:15</span>
                        </div>
                    </div>

                    {/* ── Progress + Phases (Bento Grid Style) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
                        {/* Radial chart (takes 2 cols) */}
                        <div className="md:col-span-2 relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner transition-all hover:bg-white/[0.03]">
                            <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl blur-xl"></div>
                            <ChartContainer config={missionConfig} className="w-[120px] h-[120px] relative z-10">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="90%"
                                    startAngle={90} endAngle={-270} data={missionProgress}>
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar dataKey="progress"
                                        background={{ fill: "rgba(255,255,255,0.05)" }}
                                        cornerRadius={12}
                                        fill="var(--color-progress)" />
                                    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle"
                                        fontSize={26} fontWeight={800} fill="#ffffff">68%</text>
                                    <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle"
                                        fontSize={9} fill="#94a3b8" letterSpacing={2} fontWeight={600}>COMPLETE</text>
                                </RadialBarChart>
                            </ChartContainer>
                        </div>

                        {/* Mission phases (takes 3 cols) */}
                        <div className="md:col-span-3 flex flex-col justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner transition-all hover:bg-white/[0.03]">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 px-1">Active Phases</p>
                            <div className="space-y-3">
                                {[
                                    { label: "Launch & Ascent", status: "done", pct: 100 },
                                    { label: "Navigation", status: "done", pct: 100 },
                                    { label: "Target Approach", status: "active", pct: 68 },
                                    { label: "Payload Drop & RTB", status: "pending", pct: 0 },
                                ].map((phase) => (
                                    <div key={phase.label} className="flex items-center gap-3 px-1">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                                            phase.status === "done"
                                                ? "bg-emerald-400"
                                                : phase.status === "active"
                                                ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                                : "bg-slate-700"
                                        }`}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-xs truncate font-medium ${
                                                    phase.status === "done"
                                                        ? "text-slate-500 line-through"
                                                        : phase.status === "active"
                                                        ? "text-white"
                                                        : "text-slate-600"
                                                }`}>{phase.label}</span>
                                                {phase.status === "active" && (
                                                    <span className="text-[10px] text-cyan-400 font-mono font-bold tracking-wide">
                                                        {phase.pct}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="h-1 rounded-full bg-slate-800/50 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                    phase.status === "done"
                                                        ? "bg-emerald-500/50"
                                                        : phase.status === "active"
                                                        ? "bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                                        : "bg-transparent"
                                                }`} style={{ width: `${phase.pct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Fleet Status ── */}
                    <div className="flex flex-col flex-1 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-slate-400" />
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Fleet Status</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-mono tracking-widest border-emerald-500/30 text-emerald-400 bg-emerald-500/5 py-0">
                                2/2 DEPLOYED
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: "MAS", status: "active", battery: 74, alt: "120m", role: "Carrier", signal: 95 },
                                { id: "PAS", status: "active", battery: 100, alt: "Docked", role: "Scout", signal: 87 },
                            ].map((drone) => (
                                <div key={drone.id}
                                    className={`relative p-3 rounded-xl border transition-all duration-300 overflow-hidden group/drone cursor-default ${
                                        drone.status === "active"
                                            ? "bg-slate-900/40 border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/60"
                                            : "bg-slate-900/20 border-white/5"
                                    }`}>

                                    {/* Subtly glowing top border effect */}
                                    {drone.status === "active" && (
                                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50 group-hover/drone:opacity-100 transition-opacity"></div>
                                    )}

                                    {/* Drone Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold font-mono text-white tracking-widest">{drone.id}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]"></div>
                                            </div>
                                            <span className="text-[10px] text-cyan-400/80 font-medium uppercase tracking-wider">{drone.role}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1">
                                                <BatteryMedium size={12} className="text-slate-500" />
                                                <span className="text-xs font-mono font-bold text-white">{drone.battery}%</span>
                                            </div>
                                            <div className="w-8 h-1 rounded-full bg-slate-800 mt-1 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${
                                                    drone.battery > 60 ? "bg-emerald-400" : "bg-amber-400"
                                                }`} style={{ width: `${drone.battery}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Altitude & Signal */}
                                    <div className="flex items-center justify-between text-xs mt-auto pt-3 border-t border-white/[0.05]">
                                        <div className="flex items-center gap-1.5">
                                            <Navigation size={12} className="text-slate-500" />
                                            <span className="font-mono text-slate-300">{drone.alt}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Radio size={12} className="text-slate-500" />
                                            <span className="font-mono text-slate-300">{drone.signal}%</span>
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
        <div className="relative h-full group">
            {/* Ambient edge glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <Card className="relative z-10 h-full overflow-hidden bg-slate-950/60 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 text-slate-100 hover:border-white/[0.12] transition-all duration-500 flex flex-col rounded-2xl">
                {/* Subtle highlight overlay */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

                <CardHeader className="pb-4 pt-6 px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-inner">
                                <Zap className="h-5 w-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            </div>
                            <div>
                                <CardTitle className="text-[15px] font-bold text-white tracking-tight">
                                    AI & Payload
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-400 tracking-wide font-medium">
                                    Subsystem confidence
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-5 px-6 pb-6 pt-0">
                    {/* Bar chart wrapper (Bento box style) */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] shadow-inner transition-all hover:bg-white/[0.03]">
                        <ChartContainer config={systemChartConfig} className="h-[100px] w-full">
                            <BarChart data={systemData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={18}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={8} />
                                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                <Bar dataKey="confidence" radius={[6, 6, 2, 2]}>
                                    {systemData.map((_, idx) => (
                                        <Cell key={idx} fill={systemColors[idx]} fillOpacity={systemData[idx].confidence === 0 ? 0.3 : 1} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </div>

                    <div className="flex-1 space-y-3 mt-1">
                        {/* Status rows */}
                        {[
                            {
                                icon: <UserCheck className="h-4 w-4 text-cyan-400" />,
                                bg: "bg-cyan-500/10 border-cyan-500/20",
                                label: "Face Detection",
                                sub: "97% confidence",
                                badge: { text: "● ACTIVE", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                                fill: 97,
                                color: "bg-cyan-400",
                            },
                            {
                                icon: <Target className="h-4 w-4 text-indigo-400" />,
                                bg: "bg-indigo-500/10 border-indigo-500/20",
                                label: "Target Lock",
                                sub: "89% precision",
                                badge: { text: "● ACTIVE", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                                fill: 89,
                                color: "bg-indigo-400",
                            },
                            {
                                icon: <ArrowDownCircle className="h-4 w-4 text-amber-400" />,
                                bg: "bg-amber-500/10 border-amber-500/20",
                                label: "Payload Bay",
                                sub: "Awaiting command",
                                badge: { text: "◆ LOCKED", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
                                fill: 100,
                                color: "bg-slate-600",
                            },
                        ].map((item) => (
                            <div key={item.label} className="group/item flex flex-col p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] shadow-inner hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg border ${item.bg}`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white tracking-wide">{item.label}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${item.badge.cls} py-0 px-2`}>
                                        {item.badge.text}
                                    </Badge>
                                </div>
                                {/* Micro progress line */}
                                <div className="w-full h-[3px] rounded-full bg-slate-800/80 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${
                                        item.badge.text.includes("LOCKED") ? item.color : "bg-gradient-to-r from-transparent to-current opacity-80"
                                    } ${!item.badge.text.includes("LOCKED") ? item.color.replace('bg-', 'text-') : ''}`} style={{ width: `${item.fill}%`, ...((!item.badge.text.includes("LOCKED")) && { backgroundColor: 'currentColor' }) }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
      