"use client"

import { OperationCard } from "@/components/OperationCard"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, LifeBuoy, Utensils, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

export default function PayloadOperationsPage() {
    const operations = [
        {
            id: "OP-FD-001",
            name: "Food Delivery",
            droneId: "DR-ALPHA-01",
            status: "ready" as const,
            safetyCheck: true,
            icon: Utensils,
            slug: "food-delivery",
            href: "/dashboard/face-verification"
        },
        {
            id: "OP-PAS-003",
            name: "Public Announcement System",
            droneId: "DR-BETA-04",
            status: "standby" as const,
            safetyCheck: true,
            icon: Mic,
            slug: "public-announcement"
        },
        {
            id: "OP-LB-009",
            name: "Lifebuoy Deployment",
            droneId: "DR-GAMMA-02",
            status: "unavailable" as const,
            safetyCheck: false,
            icon: LifeBuoy,
            slug: "lifebuoy-deployment"
        }
    ]

    // Calculate status counts
    const statusCounts = {
        ready: operations.filter(op => op.status === "ready").length,
        standby: operations.filter(op => op.status === "standby").length,
        unavailable: operations.filter(op => op.status === "unavailable").length
    }

    return (
        <div className="flex-1 p-6 space-y-8">
            {/* Header Section */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-100">Payload Operations Hub</h1>
                <p className="text-slate-400 mt-2">Manage and monitor all available mission operations and their readiness status.</p>
            </div>

            <Separator className="bg-slate-950" />

            {/* Status Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-950 border-slate-950">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-slate-400">Ready</CardTitle>
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-100">{statusCounts.ready}</div>
                        <p className="text-xs text-slate-500 mt-1">Operations available</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-950 border-slate-950">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-slate-400">Standby</CardTitle>
                            <AlertTriangle size={18} className="text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-100">{statusCounts.standby}</div>
                        <p className="text-xs text-slate-500 mt-1">On standby status</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-950 border-slate-950">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-slate-400">Unavailable</CardTitle>
                            <XCircle size={18} className="text-slate-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-100">{statusCounts.unavailable}</div>
                        <p className="text-xs text-slate-500 mt-1">Currently unavailable</p>
                    </CardContent>
                </Card>
            </div>

            {/* Operations Grid */}
            <div>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-200">Available Operations</h2>
                    <p className="text-sm text-slate-500">Click any operation card to view details and manage deployment</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {operations.map((op) => (
                        <OperationCard key={op.id} operation={op} />
                    ))}
                </div>
            </div>
        </div>
    )
}
