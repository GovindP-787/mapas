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
import { Gauge, Wind, Zap, Thermometer, Signal, Compass } from "lucide-react"
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
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-950/40 hover:bg-slate-950/60 hover:border-slate-900/50 transition-all duration-300">
            {/* Radial mini-gauge */}
            <div className="relative w-12 h-12 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="100%"
                        barSize={5}
                        startAngle={90}
                        endAngle={-270}
                        data={radialData}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        {/* track */}
                        <RadialBar dataKey="value" background={{ fill: "rgba(100,116,139,0.2)" }} cornerRadius={10} fill={color} />
                    </RadialBarChart>
                </ResponsiveContainer>
                {/* Icon overlay */}
                <div className={cn("absolute inset-0 flex items-center justify-center rounded-full", iconBg)}>
                    <div className={iconColor}>{icon}</div>
                </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{label}</p>
                <p className="text-base font-mono font-bold text-slate-100 leading-tight">
                    {value}<span className="text-xs text-slate-500 ml-0.5">{unit}</span>
                </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{pct}%</span>
        </div>
    )
}

export function TelemetryPanel() {
    // Generate random data once on the client to avoid SSR/client hydration mismatch
    const [combinedData] = React.useState(() => generateCombinedData())

    return (
        <div className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent rounded-lg blur-3xl pointer-events-none"></div>
            <Card className="bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 border-slate-950/50 text-slate-100 h-full relative z-10 hover:border-slate-900/50 transition-all duration-300 flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium text-slate-300">
                                Live Telemetry
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-[11px] mt-0.5">
                                Altitude · Speed · Battery — last 20 samples
                            </CardDescription>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            LIVE
                        </span>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4 pb-4">
                    {/* Area chart */}
                    <ChartContainer config={areaChartConfig} className="h-[140px] w-full">
                        <AreaChart data={combinedData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradAlt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-altitude)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-altitude)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradSpeed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-speed)" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="var(--color-speed)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradBattery" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-battery)" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="var(--color-battery)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                            <XAxis dataKey="t" hide />
                            <YAxis tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Area
                                type="monotone"
                                dataKey="altitude"
                                stroke="var(--color-altitude)"
                                strokeWidth={1.5}
                                fill="url(#gradAlt)"
                                dot={false}
                                activeDot={{ r: 3 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="speed"
                                stroke="var(--color-speed)"
                                strokeWidth={1.5}
                                fill="url(#gradSpeed)"
                                dot={false}
                                activeDot={{ r: 3 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="battery"
                                stroke="var(--color-battery)"
                                strokeWidth={1.5}
                                fill="url(#gradBattery)"
                                dot={false}
                                activeDot={{ r: 3 }}
                            />
                        </AreaChart>
                    </ChartContainer>

                    {/* Legend pills */}
                    <div className="flex items-center gap-3 flex-wrap -mt-2">
                        {[
                            { key: "altitude", label: "Alt", color: "bg-cyan-400" },
                            { key: "speed", label: "Spd", color: "bg-indigo-400" },
                            { key: "battery", label: "Bat", color: "bg-emerald-400" },
                        ].map((s) => (
                            <span key={s.key} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span className={cn("w-2 h-2 rounded-full", s.color)}></span>
                                {s.label}
                            </span>
                        ))}
                    </div>

                    {/* Radial stat rows */}
                    <div className="grid grid-cols-2 gap-2">
                        <StatRadial label="Altitude" value={120} max={500} unit="m"
                            color="#22d3ee" icon={<Gauge size={12} />} iconBg="" iconColor="text-cyan-400" />
                        <StatRadial label="Speed" value={14} max={25} unit="m/s"
                            color="#818cf8" icon={<Wind size={12} />} iconBg="" iconColor="text-indigo-400" />
                        <StatRadial label="Heading" value={340} max={360} unit="°"
                            color="#94a3b8" icon={<Compass size={12} />} iconBg="" iconColor="text-slate-400" />
                        <StatRadial label="Battery" value={24.2} max={26} unit="V"
                            color="#34d399" icon={<Zap size={12} />} iconBg="" iconColor="text-emerald-400" />
                        <StatRadial label="Signal" value={92} max={100} unit="%"
                            color="#4ade80" icon={<Signal size={12} />} iconBg="" iconColor="text-green-400" />
                        <StatRadial label="Temp" value={42} max={80} unit="°C"
                            color="#fbbf24" icon={<Thermometer size={12} />} iconBg="" iconColor="text-amber-400" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
