"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Info, AlertTriangle, Package, Megaphone, Camera, Settings, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, Cell } from "recharts"

type LogLevel = "info" | "warning" | "critical"

interface OperationLog {
    _id?: string
    operation_type: string
    level: LogLevel
    message: string
    timestamp: string
}

type OperationType = "all" | "food_delivery" | "public_announcement" | "face_verification" | "system"

const OPERATION_TYPES: { value: OperationType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "all", label: "All", icon: <Settings size={12} />, color: "text-slate-400" },
    { value: "food_delivery", label: "Food", icon: <Package size={12} />, color: "text-blue-400" },
    { value: "public_announcement", label: "PA", icon: <Megaphone size={12} />, color: "text-purple-400" },
    { value: "face_verification", label: "Face", icon: <Camera size={12} />, color: "text-green-400" },
    { value: "system", label: "Sys", icon: <Settings size={12} />, color: "text-amber-400" },
]

const mockLogs: OperationLog[] = [
    { _id: "1", operation_type: "system", level: "info", message: "System startup initiated", timestamp: "2026-02-17T10:00:00.000Z" },
    { _id: "2", operation_type: "system", level: "info", message: "All systems operational", timestamp: "2026-02-17T10:00:01.000Z" },
]

const logDistConfig = {
    info: { label: "Info", color: "hsl(210 80% 60%)" },
    warning: { label: "Warn", color: "hsl(38 90% 60%)" },
    critical: { label: "Crit", color: "hsl(0 75% 55%)" },
} satisfies ChartConfig

export function AlertsPanel() {
    const [selectedOperation, setSelectedOperation] = React.useState<OperationType>("all")
    const [logs, setLogs] = React.useState<OperationLog[]>(mockLogs)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isClient, setIsClient] = React.useState(false)
    const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

    const loadLogs = React.useCallback(async () => {
        setIsLoading(true)
        try {
            let endpoint = `${API_BASE}/logs/all?limit=100`
            if (selectedOperation !== "all") {
                endpoint = `${API_BASE}/logs/operation/${selectedOperation}?limit=100`
            }

            const response = await fetch(endpoint)
            if (response.ok) {
                const data = await response.json()
                setLogs(Array.isArray(data) ? data : mockLogs)
                setLastUpdated(new Date())
            }
        } catch (error) {
            console.error("Failed to load logs:", error)
            setLogs(mockLogs)
        } finally {
            setIsLoading(false)
        }
    }, [selectedOperation, API_BASE])

    React.useEffect(() => {
        setIsClient(true)
        loadLogs()
        // Auto-refresh every 15s
        const interval = setInterval(loadLogs, 15000)
        return () => clearInterval(interval)
    }, [loadLogs])

    // Compute distribution for mini chart
    const distribution = React.useMemo(() => {
        const counts = { info: 0, warning: 0, critical: 0 }
        logs.forEach((l) => { counts[l.level] = (counts[l.level] || 0) + 1 })
        return [
            { name: "Info", count: counts.info, key: "info" },
            { name: "Warn", count: counts.warning, key: "warning" },
            { name: "Crit", count: counts.critical, key: "critical" },
        ]
    }, [logs])

    const distColors: Record<string, string> = {
        info: "#60a5fa",
        warning: "#fbbf24",
        critical: "#ef4444",
    }

    const getLevelStyles = (level: LogLevel) => {
        switch (level) {
            case "critical": return "bg-red-950/25 border-red-900/35 text-red-300"
            case "warning": return "bg-amber-950/25 border-amber-900/35 text-amber-300"
            default: return "bg-blue-950/15 border-blue-900/20 text-blue-300"
        }
    }

    const getLevelIcon = (level: LogLevel) => {
        switch (level) {
            case "info": return <Info size={12} className="text-blue-400" />
            case "warning": return <AlertTriangle size={12} className="text-amber-400" />
            case "critical": return <AlertCircle size={12} className="text-red-500" />
        }
    }

    const getOperationColor = (operationType: string) => {
        const op = OPERATION_TYPES.find(o => o.value === operationType)
        return op?.color || "text-slate-400"
    }

    return (
        <div className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent rounded-lg blur-3xl pointer-events-none"></div>
            <Card className="bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 border-slate-950/50 text-slate-100 h-full flex flex-col relative z-10 hover:border-slate-900/50 transition-all duration-300">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <CardTitle className="text-sm font-medium text-slate-300">
                                Operation Logs
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-[11px] mt-0.5">
                                {logs.length} event{logs.length !== 1 ? "s" : ""} captured
                                {lastUpdated && isClient && (
                                    <span className="ml-2 text-slate-600">· {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                                )}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={loadLogs}
                                disabled={isLoading}
                                className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-950/40 text-slate-500 hover:text-slate-300 hover:bg-slate-950/50 transition-all duration-200 disabled:opacity-40"
                            >
                                <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                            </button>
                        {/* Mini distribution chart */}
                        <ChartContainer config={logDistConfig} className="w-[72px] h-[36px] flex-shrink-0">
                            <BarChart data={distribution} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={14}>
                                <XAxis dataKey="name" hide />
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                                    {distribution.map((d) => (
                                        <Cell key={d.key} fill={distColors[d.key]} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                        </div>
                    </div>
                </CardHeader>

                {/* Tab Navigation */}
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/50 border border-slate-950/40">
                        {OPERATION_TYPES.map((op) => (
                            <button
                                key={op.value}
                                onClick={() => setSelectedOperation(op.value)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 flex-1 justify-center",
                                    selectedOperation === op.value
                                        ? "bg-slate-950 text-slate-100 shadow-sm"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-950/40"
                                )}
                            >
                                <span className={selectedOperation === op.value ? "text-slate-200" : op.color}>
                                    {op.icon}
                                </span>
                                {op.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Log level legend pills */}
                <div className="px-4 pb-2 flex items-center gap-3">
                    {[
                        { key: "info", label: "Info", dot: "bg-blue-400" },
                        { key: "warning", label: "Warn", dot: "bg-amber-400" },
                        { key: "critical", label: "Crit", dot: "bg-red-400" },
                    ].map((l) => (
                        <span key={l.key} className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span className={cn("w-1.5 h-1.5 rounded-full", l.dot)}></span>
                            {l.label} ({distribution.find(d => d.key === l.key)?.count ?? 0})
                        </span>
                    ))}
                </div>

                {/* Logs Content */}
                <CardContent className="flex-1 p-0 min-h-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <span className="relative flex h-3 w-3 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-50"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
                            </span>
                            <span className="text-slate-400 text-sm">Loading...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <Info size={20} className="text-slate-600" />
                            <span className="text-slate-500 text-sm">No logs available</span>
                        </div>
                    ) : (
                        <ScrollArea className="h-[320px] w-full px-4 pb-4">
                            <div className="space-y-1.5">
                                {logs.map((log) => {
                                    const timestamp = isClient
                                        ? new Date(log.timestamp).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit"
                                        })
                                        : "--:--:--"

                                    return (
                                        <div
                                            key={log._id || `${log.timestamp}-${log.message}`}
                                            className={cn(
                                                "flex items-start gap-2.5 text-sm px-3 py-2.5 rounded-xl border transition-all duration-200 hover:brightness-110",
                                                getLevelStyles(log.level)
                                            )}
                                        >
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getLevelIcon(log.level)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Badge className={cn("text-[9px] px-1.5 py-0 border bg-slate-900/60 text-slate-300 border-slate-600/30 font-mono uppercase tracking-wide", getOperationColor(log.operation_type))}>
                                                        {log.operation_type.replace("_", " ")}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-500 font-mono ml-auto">{timestamp}</span>
                                                </div>
                                                <p className="text-xs break-words leading-relaxed">{log.message}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
