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
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent rounded-lg blur-2xl pointer-events-none"></div>
            <Card className="bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 border-slate-950/50 text-slate-100 relative z-10 h-full hover:border-slate-900/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-sm font-medium text-slate-300">
                            Mission Overview
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-[11px] mt-0.5">
                            Active fleet · Auto mode
                        </CardDescription>
                    </div>
                    <div className="p-2 bg-sky-500/20 rounded-xl border border-sky-500/20">
                        <Rocket className="h-4 w-4 text-sky-400" />
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="flex items-center gap-4">
                        {/* Radial progress chart */}
                        <ChartContainer config={missionConfig} className="w-[100px] h-[100px] flex-shrink-0">
                            <RadialBarChart
                                cx="50%" cy="50%"
                                innerRadius="65%" outerRadius="100%"
                                startAngle={90} endAngle={-270}
                                data={missionProgress}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                <RadialBar
                                    dataKey="progress"
                                    background={{ fill: "rgba(100,116,139,0.15)" }}
                                    cornerRadius={8}
                                    fill="var(--color-progress)"
                                />
                                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                                    className="fill-slate-100 text-lg font-bold" fontSize={18} fontWeight={700}
                                    fill="#f1f5f9">68%</text>
                                <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle"
                                    fontSize={9} fill="#64748b">COMPLETE</text>
                            </RadialBarChart>
                        </ChartContainer>

                        {/* Right side info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-100">Drone 1</span>
                                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 text-[10px]">
                                    ● AUTO MODE
                                </Badge>
                            </div>
                            <Separator className="bg-slate-950/50" />
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { icon: <Users size={12} className="text-blue-400" />, label: "Deployed", value: "3 Drones", color: "text-blue-300" },
                                    { icon: <Box size={12} className="text-purple-400" />, label: "Payload", value: "Med Kit", color: "text-purple-300" },
                                    { icon: <Clock size={12} className="text-cyan-400" />, label: "Uptime", value: "42:15", color: "text-cyan-300" },
                                ].map((item) => (
                                    <div key={item.label} className="flex flex-col p-2 rounded-lg bg-slate-950/40 border border-slate-950/40 hover:bg-slate-950/60 transition-all duration-300">
                                        <div className="flex items-center gap-1 mb-1">
                                            {item.icon}
                                            <span className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</span>
                                        </div>
                                        <span className={`text-xs font-mono font-semibold ${item.color}`}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Fleet status mini bar */}
                    <div className="mt-4 flex items-center gap-2">
                        <TrendingUp size={12} className="text-slate-500 flex-shrink-0" />
                        <div className="flex-1 flex gap-1">
                            {[
                                { label: "Drone 1", active: true },
                                { label: "Drone 2", active: true },
                                { label: "Drone 3", active: false },
                            ].map((d) => (
                                <div key={d.label} className="flex-1 flex flex-col gap-1">
                                    <div className={`h-1.5 rounded-full ${d.active ? "bg-cyan-500" : "bg-slate-950"}`}></div>
                                    <span className="text-[9px] text-slate-500 text-center">{d.label}</span>
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
