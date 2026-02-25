"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Lock, Unlock, CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LatchControlPanelProps {
    selectedCustomer?: { id: number; name: string } | null
    droneAltitude?: number
    droneSpeed?: number
    gpsLocked?: boolean
    customerVerified?: boolean
    verificationConfidence?: number
    onRequestRelease?: () => void
}

export function LatchControlPanel({
    selectedCustomer = null,
    droneAltitude = 0,
    droneSpeed = 0,
    gpsLocked = false,
    customerVerified = false,
    verificationConfidence = 0,
    onRequestRelease = () => {}
}: LatchControlPanelProps) {
    const [latchState, setLatchState] = React.useState<"locked" | "armed" | "released">("locked")

    // Safety check calculations
    const safetyChecks = {
        missionSelected: !!selectedCustomer,
        altitude: droneAltitude >= 5 && droneAltitude <= 50,
        speed: droneSpeed <= 2,
        gps: gpsLocked,
        customerVerified: customerVerified
    }

    const allChecksPassed = Object.values(safetyChecks).every(Boolean)
    const canArm = allChecksPassed
    const canRelease = allChecksPassed && latchState === "armed"

    const handleArm = () => {
        if (!selectedCustomer) {
            toast.error("No Mission Selected", {
                description: "Select a customer delivery before arming."
            })
            return
        }
        if (canArm) {
            setLatchState("armed")
            toast.warning("Payload Latch ARMED", {
                description: "Ready for manual release. Exercise caution."
            })
        } else {
            toast.error("Safety Checks Failed", {
                description: "Verify all flight parameters before arming."
            })
        }
    }

    const handleRelease = () => {
        if (!customerVerified) {
            toast.error("Customer Verification Required", {
                description: "Please verify the customer's identity before release."
            })
            onRequestRelease()
            return
        }
        setLatchState("released")
        toast.success("Payload Released Successfully", {
            description: `Package drop confirmed. (Confidence: ${(verificationConfidence * 100).toFixed(1)}%)`
        })
    }

    const handleReset = () => {
        setLatchState("locked")
        toast.info("Latch Mechanism Reset", {
            description: "System returned to safe state."
        })
    }

    return (
        <Card className="bg-slate-950 border-slate-950 h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-slate-100">
                    <span className="text-sm">Latch Control</span>
                    <Badge variant="outline" className={
                        latchState === "locked" ? "bg-slate-500/10 text-slate-500 border-slate-500/20" :
                            latchState === "armed" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }>
                        {latchState.toUpperCase()}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">

                {/* Safety Checklist */}
                <div className="space-y-2 p-3 bg-slate-950 rounded-lg border border-slate-950">
                    <h4 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Safety Interlocks</h4>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Mission Selected</span>
                        {safetyChecks.missionSelected ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-rose-500" />}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Altitude (5-50m)</span>
                        {safetyChecks.altitude ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-rose-500" />}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Speed (≤2 m/s)</span>
                        {safetyChecks.speed ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-rose-500" />}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">GPS Lock (RTK)</span>
                        {safetyChecks.gps ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-rose-500" />}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-900">
                        <span className="text-slate-500">Customer Verified</span>
                        {safetyChecks.customerVerified ? (
                            <div className="flex items-center gap-1">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                <span className="text-emerald-400 text-[10px]">{(verificationConfidence * 100).toFixed(0)}%</span>
                            </div>
                        ) : (
                            <AlertTriangle size={14} className="text-amber-500" />
                        )}
                    </div>
                </div>

                {/* Control Action Area */}
                <div className="space-y-3 flex-1 flex flex-col justify-end">
                    {latchState === "locked" && (
                        <Button
                            className={`w-full font-mono text-xs font-bold transition-all ${
                                canArm
                                    ? "bg-amber-900 hover:bg-amber-800 text-amber-300 border border-amber-700"
                                    : "bg-slate-950 text-slate-500 border border-slate-900 cursor-not-allowed opacity-60"
                            }`}
                            onClick={handleArm}
                            disabled={!canArm}
                        >
                            <Lock size={14} className="mr-2" />
                            ARM LATCH
                        </Button>
                    )}

                    {latchState === "armed" && (
                        <div className="space-y-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={!canRelease}
                                        variant="destructive"
                                        className={`w-full font-bold tracking-wider text-xs ${
                                            canRelease
                                                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                                                : "bg-slate-950 text-slate-500 border border-slate-900 cursor-not-allowed opacity-60"
                                        }`}
                                    >
                                        <Unlock size={14} className="mr-2" />
                                        RELEASE PAYLOAD
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-950 border-slate-950 text-slate-100">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-sm">Confirm Payload Release</AlertDialogTitle>
                                        <AlertDialogDescription className="text-xs text-slate-400">
                                            This action creates a physical drop. Ensure the drop zone is clear. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="text-xs bg-slate-950 border-slate-900 hover:bg-slate-900 hover:text-slate-200">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRelease} className="text-xs bg-rose-600 hover:bg-rose-700 border-rose-600">Confirm Release</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button
                                variant="outline"
                                className="w-full border-slate-900 text-slate-400 hover:text-slate-200 text-xs"
                                onClick={handleReset}
                            >
                                DISARM / RESET
                            </Button>
                        </div>
                    )}

                    {latchState === "released" && (
                        <div className="text-center p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                            <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                            <p className="text-emerald-400 font-bold text-xs mb-3">DROP COMPLETE</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-[10px] text-slate-500 hover:text-slate-300"
                                onClick={handleReset}
                            >
                                Reset System
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
