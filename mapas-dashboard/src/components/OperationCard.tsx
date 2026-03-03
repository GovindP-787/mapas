
"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Shield } from "lucide-react"
import Link from "next/link"

interface OperationCardProps {
    operation: {
        id: string
        name: string
        droneId: string
        status: "ready" | "standby" | "unavailable"
        safetyCheck: boolean
        icon: any
        slug?: string
        href?: string
    }
}

export function OperationCard({ operation }: OperationCardProps) {
    const statusConfig = {
        ready: {
            badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            label: "READY",
            icon: CheckCircle2
        },
        standby: {
            badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            label: "STANDBY",
            icon: AlertTriangle
        },
        unavailable: {
            badge: "bg-slate-500/10 text-slate-500 border-slate-500/20",
            label: "UNAVAILABLE",
            icon: XCircle
        }
    }

    const config = statusConfig[operation.status]
    const StatusIcon = config.icon
    
    const operationPageUrl = operation.href ?? `/dashboard/payload/${operation.slug || operation.id.toLowerCase()}`

    return (
        <Card className="bg-slate-950 border-slate-950 hover:border-slate-900 transition-colors cursor-pointer group">
            <CardHeader className="flex flex-row items-start justify-between pb-3 border-b border-slate-950">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-slate-950 text-sky-400 border border-slate-900 group-hover:bg-slate-900">
                            <operation.icon size={20} />
                        </div>
                        <CardTitle className="text-base font-bold text-slate-200">{operation.name}</CardTitle>
                    </div>
                    <p className="text-xs font-mono text-slate-500 ml-11">{operation.id}</p>
                </div>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-3">
                {/* Drone Assignment */}
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Assigned Drone:</span>
                    <span className="font-mono text-sky-400 bg-slate-950 px-2 py-1 rounded border border-slate-950">{operation.droneId}</span>
                </div>

                {/* Readiness Status */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <Badge variant="outline" className={`uppercase text-[10px] tracking-widest font-mono ${config.badge}`}>
                        <StatusIcon size={12} className="mr-1" />
                        {config.label}
                    </Badge>
                </div>

                {/* Safety Indicator */}
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-950">
                    <Shield size={14} className={operation.safetyCheck ? "text-emerald-500" : "text-rose-500"} />
                    <span className="text-xs text-slate-500">Safety:</span>
                    <span className={`text-xs font-mono ml-auto ${operation.safetyCheck ? "text-emerald-400" : "text-rose-400"}`}>
                        {operation.safetyCheck ? "CLEARED" : "FAILED"}
                    </span>
                </div>
            </CardContent>
            
            <CardFooter className="border-t border-slate-950 pt-3">
                <Link href={operationPageUrl} className="w-full">
                    <Button className="w-full bg-slate-950 hover:bg-sky-900 text-slate-200 border border-slate-900 hover:border-sky-600 transition-colors group/btn">
                        View Details
                        <ArrowRight size={14} className="ml-2" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
