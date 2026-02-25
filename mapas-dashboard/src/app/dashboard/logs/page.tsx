"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Info, AlertTriangle, Package, Megaphone, Camera, Settings, RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from "recharts"

type LogLevel = "info" | "warning" | "critical"
type OperationType = "all" | "food_delivery" | "public_announcement" | "face_verification" | "system"

interface OperationLog {
    _id?: string
    operation_type: string
    level: LogLevel
    message: string
    timestamp: string
}

const OPERATION_TYPES: { value: OperationType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "all", label: "All Logs", icon: <Settings size={14} />, color: "text-slate-400" },
    { value: "food_delivery", label: "Food Delivery", icon: <Package size={14} />, color: "text-blue-400" },
    { value: "public_announcement", label: "Public Announcements", icon: <Megaphone size={14} />, color: "text-purple-400" },
    { value: "face_verification", label: "Face Verification", icon: <Camera size={14} />, color: "text-green-400" },
    { value: "system", label: "System", icon: <Settings size={14} />, color: "text-amber-400" },
]

const logDistConfig = {
    info: { label: "Info", color: "hsl(210 80% 60%)" },
    warning: { label: "Warn", color: "hsl(38 90% 60%)" },
    critical: { label: "Crit", color: "hsl(0 75% 55%)" },
} satisfies ChartConfig

const distColors: Record<string, string> = {
    info: "#60a5fa",
    warning: "#fbbf24",
    critical: "#ef4444",
}

export default function LogsPage() {
    const [selectedOperation, setSelectedOperation] = React.useState<OperationType>("all")
    const [logs, setLogs] = React.useState<OperationLog[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isClient, setIsClient] = React.useState(false)
    const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
    const [search, setSearch] = React.useState("")

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

    const loadLogs = React.useCallback(async () => {
        setIsLoading(true)
        try {
            let endpoint = `${API_BASE}/logs/all?limit=200`
            if (selectedOperation !== "all") {
                endpoint = `${API_BASE}/logs/operation/${selectedOperation}?limit=200`
            }
            const response = await fetch(endpoint)
            if (response.ok) {
                const data = await response.json()
                setLogs(Array.isArray(data) ? data : [])
                setLastUpdated(new Date())
            }
        } catch (error) {
            console.error("Failed to load logs:", error)
        } finally {
            setIsLoading(false)
        }
    }, [selectedOperation, API_BASE])

    React.useEffect(() => {
        setIsClient(true)
        loadLogs()
        const interval = setInterval(loadLogs, 15000)
        return () => clearInterval(interval)
    }, [loadLogs])

    const filteredLogs = React.useMemo(() => {
        if (!search.trim()) return logs
        const q = search.toLowerCase()
        return logs.filter(l =>
            l.message.toLowerCase().includes(q) ||
            l.operation_type.toLowerCase().includes(q) ||
            l.level.toLowerCase().includes(q)
        )
    }, [logs, search])

    const distribution = React.useMemo(() => {
        const counts = { info: 0, warning: 0, critical: 0 }
        logs.forEach((l) => { counts[l.level] = (counts[l.level] || 0) + 1 })
        return [
            { name: "Info", count: counts.info, key: "info" },
            { name: "Warn", count: counts.warning, key: "warning" },
            { name: "Crit", count: counts.critical, key: "critical" },
        ]
    }, [logs])

    const getLevelStyles = (level: LogLevel) => {
        switch (level) {
            case "critical": return "bg-red-950/25 border-red-900/35 text-red-300"
            case "warning": return "bg-amber-950/25 border-amber-900/35 text-amber-300"
            default: return "bg-blue-950/15 border-blue-900/20 text-blue-300"
        }
    }

    const getLevelIcon = (level: LogLevel) => {
        switch (level) {
            case "info": return <Info size={13} className="text-blue-400" />
            case "warning": return <AlertTriangle size={13} className="text-amber-400" />
            case "critical": return <AlertCircle size={13} className="text-red-500" />
        }
    }

    const getLevelBadge = (level: LogLevel) => {
        switch (level) {
            case "critical": return "bg-red-500/15 text-red-300 border-red-500/30"
            case "warning": return "bg-amber-500/15 text-amber-300 border-amber-500/30"
            default: return "bg-blue-500/15 text-blue-300 border-blue-500/30"
        }
    }

    const getOperationColor = (op: string) => {
        return OPERATION_TYPES.find(o => o.value === op)?.color || "text-slate-400"
    }

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            {/* Header row */}
            <div className="flex items-start justify-between gap-4 relative z-10">
                <div>
                    <h1 className="text-xl font-semibold text-slate-100">Operation Logs</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {logs.length} total events
                        {lastUpdated && isClient && (
                            <span className="ml-2 text-slate-600">· Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={loadLogs}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-950 transition-all duration-200 disabled:opacity-40 text-xs font-medium"
                >
                    <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {[
                    { label: "Total Events", value: logs.length, color: "text-slate-200", bg: "from-slate-950/50 to-slate-950/50", border: "border-slate-900/50" },
                    { label: "Info", value: distribution[0].count, color: "text-blue-300", bg: "from-blue-950/30 to-slate-950/50", border: "border-blue-900/30" },
                    { label: "Warnings", value: distribution[1].count, color: "text-amber-300", bg: "from-amber-950/30 to-slate-950/50", border: "border-amber-900/30" },
                    { label: "Critical", value: distribution[2].count, color: "text-red-300", bg: "from-red-950/30 to-slate-950/50", border: "border-red-900/30" },
                ].map((stat) => (
                    <Card key={stat.label} className={`bg-gradient-to-br ${stat.bg} border ${stat.border} text-slate-100`}>
                        <CardContent className="pt-4 pb-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main log card */}
            <Card className="bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 border-slate-900/50 text-slate-100 flex-1 flex flex-col relative z-10 min-h-0">
                <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search messages, types, levels..."
                                className="pl-8 h-8 text-xs bg-slate-950/50 border-slate-900/50 text-slate-200 placeholder:text-slate-600 focus:border-slate-500"
                            />
                        </div>

                        {/* Distribution mini chart */}
                        <ChartContainer config={logDistConfig} className="w-[80px] h-[32px] flex-shrink-0">
                            <BarChart data={distribution} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={16}>
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

                    {/* Filter tabs */}
                    <div className="flex gap-1 p-1 rounded-xl bg-slate-950/50 border border-slate-900/40 mt-3">
                        {OPERATION_TYPES.map((op) => (
                            <button
                                key={op.value}
                                onClick={() => setSelectedOperation(op.value)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 flex-1 justify-center",
                                    selectedOperation === op.value
                                        ? "bg-slate-900 text-slate-100 shadow-sm"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
                                )}
                            >
                                <span className={selectedOperation === op.value ? "text-slate-200" : op.color}>
                                    {op.icon}
                                </span>
                                <span className="hidden sm:inline">{op.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Level legend */}
                    <div className="flex items-center gap-4 mt-2">
                        {[
                            { key: "info", label: "Info", dot: "bg-blue-400" },
                            { key: "warning", label: "Warning", dot: "bg-amber-400" },
                            { key: "critical", label: "Critical", dot: "bg-red-400" },
                        ].map((l) => (
                            <span key={l.key} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className={cn("w-2 h-2 rounded-full", l.dot)} />
                                {l.label} ({distribution.find(d => d.key === l.key)?.count ?? 0})
                            </span>
                        ))}
                        {search && (
                            <span className="ml-auto text-[11px] text-slate-500">
                                {filteredLogs.length} result{filteredLogs.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 min-h-0">
                    {isLoading && logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full gap-2">
                            <RefreshCw size={16} className="animate-spin text-slate-500" />
                            <span className="text-slate-400 text-sm">Loading logs...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <Info size={22} className="text-slate-600" />
                            <span className="text-slate-500 text-sm">{search ? "No logs match your search" : "No logs available"}</span>
                        </div>
                    ) : (
                        <ScrollArea className="h-full w-full">
                            <div className="px-4 pb-4 space-y-1.5">
                                {filteredLogs.map((log) => {
                                    const timestamp = isClient
                                        ? new Date(log.timestamp).toLocaleString("en-US", {
                                            month: "short",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })
                                        : "--"

                                    return (
                                        <div
                                            key={log._id || `${log.timestamp}-${log.message}`}
                                            className={cn(
                                                "flex items-start gap-3 px-3 py-3 rounded-xl border transition-all duration-200 hover:brightness-110",
                                                getLevelStyles(log.level)
                                            )}
                                        >
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getLevelIcon(log.level)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge className={cn("text-[10px] px-2 py-0 border font-mono uppercase tracking-wide", getOperationColor(log.operation_type), "bg-slate-950/60 border-slate-900/40")}>
                                                        {log.operation_type.replace(/_/g, " ")}
                                                    </Badge>
                                                    <Badge className={cn("text-[10px] px-2 py-0 border", getLevelBadge(log.level))}>
                                                        {log.level}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-500 font-mono ml-auto flex-shrink-0">{timestamp}</span>
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
