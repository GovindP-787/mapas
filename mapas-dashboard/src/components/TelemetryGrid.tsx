"use client"

import * as React from "react"
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Gauge, Wind, Zap, Thermometer, Signal, Compass, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

// --- Simulated live data seed ---
function generateCombinedData(points = 20) {
    return Array.from({ length: points }, (_, i) => ({
        t: i,
        altitude: Math.round(Math.max(0, 120 + (Math.random() - 0.5) * 30)),
        speed: Math.round(Math.max(0, 14 + (Math.random() - 0.5) * 6) * 10) / 10,
        battery: Math.round(Math.max(0, 92 + (Math.random() - 0.5) * 4)),
    }))
}

const areaChartConfig = {
    altitude: { label: "Altitude", color: "hsl(190 80% 55%)" },
    speed: { label: "Speed", color: "hsl(240 70% 65%)" },
    battery: { label: "Battery", color: "hsl(145 60% 50%)" },
} satisfies ChartConfig

// --- Radial stat card ---
interface StatRadialProps {
    label: string
    value: number
    max: number
    unit: string
    color: string
    icon: React.ReactNode
    iconBg: string
    iconColor: string
}

function StatRadial({ label, value, max, unit, color, icon, iconBg, iconColor }: StatRadialProps) {
    const pct = Math.round((value / max) * 100)
    const radialData = [{ value: pct }]

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner transition-all hover:bg-white/[0.03] group/stat">
            {/* Radial mini-gauge */}
            <div className="relative w-14 h-14 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="100%"
                        barSize={6}
                        startAngle={90}
                        endAngle={-270}
                        data={radialData}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        {/* track */}
                        <RadialBar dataKey="value" background={{ fill: "rgba(255,255,255,0.05)" }} cornerRadius={10} fill={color} />
                    </RadialBarChart>
                </ResponsiveContainer>
                {/* Icon overlay */}
                <div className={cn("absolute inset-0 flex items-center justify-center rounded-full drop-shadow-[0_0_8px_currentColor]", iconBg)}>
                    <div className={iconColor}>{icon}</div>
                </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</p>
                <div className="flex items-baseline gap-1.5">
                    <p className="text-xl font-mono font-bold text-white leading-none tracking-tight">
                        {value}
                    </p>
                    <span className="text-xs text-slate-500 font-medium">{unit}</span>
                </div>
            </div>
            {/* Subtle glow pct */}
            <span className="text-[10px] font-mono text-slate-500 group-hover/stat:text-white transition-colors">{pct}%</span>
        </div>
    )
}

export function TelemetryPanel() {
    // Generate random data once on the client to avoid SSR/client hydration mismatch
    const [combinedData] = React.useState(() => generateCombinedData())

    return (
        <div className="relative h-full group">
            {/* Soft Ambient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <Card className="bg-slate-950/60 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 text-slate-100 h-full relative z-10 transition-all duration-500 hover:border-white/[0.12] rounded-2xl flex flex-col overflow-hidden">
                {/* Subtle highlight overlay */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

                <CardHeader className="pb-4 pt-6 px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-inner">
                                <Activity className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                            </div>
                            <div>
                                <CardTitle className="text-[15px] font-bold text-white tracking-tight">
                                    Live Telemetry
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-400 tracking-wide font-medium">
                                    System performance & metrics
                                </CardDescription>
                            </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.05] flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold tracking-widest leading-none">LIVE</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-6 px-6 pb-6 pt-0">
                    {/* Area chart */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner transition-all hover:bg-white/[0.03]">
                        <ChartContainer config={areaChartConfig} className="h-[160px] w-full">
                            <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradAlt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-altitude)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--color-altitude)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradSpeed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-speed)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-speed)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradBattery" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-battery)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-battery)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="t" hide />
                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
                                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                <Area
                                    type="monotone"
                                    dataKey="altitude"
                                    stroke="var(--color-altitude)"
                                    strokeWidth={2}
                                    fill="url(#gradAlt)"
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-altitude)" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="speed"
                                    stroke="var(--color-speed)"
                                    strokeWidth={2}
                                    fill="url(#gradSpeed)"
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-speed)" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="battery"
                                    stroke="var(--color-battery)"
                                    strokeWidth={2}
                                    fill="url(#gradBattery)"
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-battery)" }}
                                />
                            </AreaChart>
                        </ChartContainer>

                        {/* Legend pills */}
                        <div className="flex items-center justify-center gap-4 mt-4">
                            {[
                                { key: "altitude", label: "Altitude", color: "bg-cyan-400", glow: "shadow-[0_0_8px_rgba(34,211,238,0.5)]" },
                                { key: "speed", label: "Speed", color: "bg-indigo-400", glow: "shadow-[0_0_8px_rgba(129,140,248,0.5)]" },
                                { key: "battery", label: "Battery", color: "bg-emerald-400", glow: "shadow-[0_0_8px_rgba(52,211,153,0.5)]" },
                            ].map((s) => (
                                <div key={s.key} className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
                                    <div className={cn("w-2 h-2 rounded-full", s.color, s.glow)}></div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Radial stat rows (Bento Grid) */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatRadial label="Altitude" value={120} max={500} unit="m"
                            color="#22d3ee" icon={<Gauge size={14} />} iconBg="" iconColor="text-cyan-400" />
                        <StatRadial label="Speed" value={14} max={25} unit="m/s"
                            color="#818cf8" icon={<Wind size={14} />} iconBg="" iconColor="text-indigo-400" />
                        <StatRadial label="Heading" value={340} max={360} unit="°"
                            color="#94a3b8" icon={<Compass size={14} />} iconBg="" iconColor="text-slate-400" />
                        <StatRadial label="Battery" value={24.2} max={26} unit="V"
                            color="#34d399" icon={<Zap size={14} />} iconBg="" iconColor="text-emerald-400" />
                        <StatRadial label="Signal" value={92} max={100} unit="%"
                            color="#e879f9" icon={<Signal size={14} />} iconBg="" iconColor="text-fuchsia-400" />
                        <StatRadial label="Temp" value={42} max={80} unit="°C"
                            color="#fbbf24" icon={<Thermometer size={14} />} iconBg="" iconColor="text-amber-400" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
