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
        <div className="relative h-full group/alerts flex flex-col">
            {/* Ambient Edge Glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/10 via-red-500/5 to-transparent rounded-3xl blur-2xl opacity-50 group-hover/alerts:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <Card className="flex-1 bg-slate-950/60 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 text-slate-100 flex flex-col relative z-10 hover:border-white/[0.12] transition-all duration-500 rounded-2xl overflow-hidden min-h-0">
                {/* Subtle highlight overlay */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>

                <CardHeader className="pb-4 pt-6 px-6 shrink-0 relative z-20">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-inner">
                                <AlertTriangle className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            </div>
                            <div>
                                <CardTitle className="text-[15px] font-bold text-white tracking-tight">
                                    Alerts & Logs
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-400 tracking-wide font-medium mt-0.5">
                                    {logs.length} event{logs.length !== 1 ? "s" : ""} captured
                                    {lastUpdated && isClient && (
                                        <span className="ml-1.5 text-slate-500">· {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                                    )}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={loadLogs}
                                    disabled={isLoading}
                                    className="p-2 rounded-lg bg-black/40 border border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200 shadow-inner disabled:opacity-40"
                                >
                                    <RefreshCw size={14} className={isLoading ? "animate-spin text-cyan-400" : ""} />
                                </button>
                                {/* Mini distribution chart inside bento box */}
                                <div className="p-1 rounded-lg bg-black/40 border border-white/[0.05] flex items-center justify-center shadow-inner h-[34px]">
                                    <ChartContainer config={logDistConfig} className="w-[60px] h-full flex-shrink-0">
                                        <BarChart data={distribution} margin={{ top: 2, right: 2, left: 2, bottom: 0 }} barSize={12}>
                                            <XAxis dataKey="name" hide />
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                            <Bar dataKey="count" radius={[4, 4, 1, 1]}>
                                    {distribution.map((d) => (
                                        <Cell key={d.key} fill={distColors[d.key]} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                        </div>
                    </div>
                    </div>
                    </div>
                </CardHeader>

                {/* Tab Navigation */}
                <div className="px-6 pb-4">
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05] shadow-inner overflow-x-auto hide-scrollbar">
                        {OPERATION_TYPES.map((op) => (
                            <button
                                key={op.value}
                                onClick={() => setSelectedOperation(op.value)}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 flex-1 min-w-16",
                                    selectedOperation === op.value
                                        ? "bg-slate-800 text-white shadow-md border border-white/10"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                                )}
                            >
                                <span className={cn("transition-colors", selectedOperation === op.value ? op.color : "text-slate-500")}>
                                    {op.icon}
                                </span>
                                {op.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Log level legend pills */}
                <div className="px-6 pb-3 flex items-center justify-center gap-5">
                    {[
                        { key: "info", label: "Info", dot: "bg-blue-400", glow: "shadow-[0_0_8px_rgba(96,165,250,0.5)]" },
                        { key: "warning", label: "Warning", dot: "bg-amber-400", glow: "shadow-[0_0_8px_rgba(251,191,36,0.5)]" },
                        { key: "critical", label: "Critical", dot: "bg-red-400", glow: "shadow-[0_0_8px_rgba(248,113,113,0.5)]" },
                    ].map((l) => (
                        <span key={l.key} className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            <span className={cn("w-2 h-2 rounded-full", l.dot, l.glow)}></span>
                            {l.label} <span className="font-mono text-slate-500 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">{distribution.find(d => d.key === l.key)?.count ?? 0}</span>
                        </span>
                    ))}
                </div>

                {/* Logs Content */}
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex border-t border-white/[0.05] items-center justify-center h-[350px]">
                            <span className="relative flex h-3 w-3 mr-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                            </span>
                            <span className="text-cyan-400/80 font-mono text-sm tracking-widest font-bold">LOADING_LOGS</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex border-t border-white/[0.05] flex-col items-center justify-center h-[350px] gap-3">
                            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                <Info size={24} className="text-slate-500" />
                            </div>
                            <span className="text-slate-500 font-mono text-sm tracking-widest uppercase">No logs available</span>
                        </div>
                    ) : (
                        <ScrollArea className="h-[350px] w-full border-t border-white/[0.05] bg-black/20">
                            <div className="space-y-[1px] p-2">
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
                                                "group/log flex items-start gap-4 text-sm px-4 py-3 transition-all duration-200 border border-transparent rounded-lg",
                                                log.level === 'critical' ? "bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/20" : 
                                                log.level === 'warning' ? "bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/20" :
                                                "hover:bg-white/[0.03] hover:border-white/[0.05]"
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-black/40 border shadow-inner",
                                                log.level === 'critical' ? "border-red-500/30" : 
                                                log.level === 'warning' ? "border-amber-500/30" :
                                                "border-blue-500/30"
                                            )}>
                                                {getLevelIcon(log.level)}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Badge variant="outline" className={cn("text-[9px] px-2 py-0 border bg-black/40 font-mono uppercase tracking-widest shadow-inner", 
                                                        log.level === 'critical' ? "border-red-500/20 text-red-400" : 
                                                        log.level === 'warning' ? "border-amber-500/20 text-amber-400" :
                                                        "border-slate-700/50 text-slate-300"
                                                    )}>
                                                        {log.operation_type.replace("_", " ")}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-500 font-mono tracking-widest ml-auto group-hover/log:text-slate-300 transition-colors drop-shadow-md">{timestamp}</span>
                                                </div>
                                                <p className={cn("text-xs font-medium leading-relaxed drop-shadow-md",
                                                    log.level === 'critical' ? "text-red-100" : 
                                                    log.level === 'warning' ? "text-amber-100" :
                                                    "text-slate-300"
                                                )}>{log.message}</p>
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
