"use client"

import * as React from "react"
import {
    Wifi,
    MapPin,
    Battery,
    Bell,
    LogOut,
    Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MobileSidebar } from "./Sidebar"

export function TopBar() {
    const router = useRouter()
    const [isLaunching, setIsLaunching] = React.useState(false)

    // Mock system status - in real app, this would come from context/store
    const systemStatus = "Online" // Online, Degraded, Offline
    const activeMission = "Drone 1"
    const batteryLevel = 82
    const gpsLock = true

    return (
        <header className="sticky top-0 z-40 flex h-18 w-full items-center justify-between border-b border-white/[0.08] bg-slate-950/60 px-6 backdrop-blur-2xl shadow-lg">
            <div className="flex items-center gap-6">
                <MobileSidebar />
                <div className="hidden md:flex items-center gap-3 bg-black/40 border border-white/[0.05] shadow-inner px-3 py-1.5 rounded-lg">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    </span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">System <span className="text-emerald-400">Online</span></span>
                </div>
                <Separator orientation="vertical" className="hidden md:block h-6 bg-white/[0.1]" />
                <div className="hidden md:flex flex-col justify-center">
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Active Mission</span>
                    <span className="text-sm font-bold text-white tracking-tight drop-shadow-md">{activeMission}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Status Indicators */}
                <div className="flex items-center gap-4 bg-black/40 shadow-inner rounded-xl px-4 py-2 border border-white/[0.05]">
                    
                    <div className={cn("flex items-center gap-1.5", batteryLevel < 20 ? "text-red-400" : "text-emerald-400")}>
                        <Battery size={14} className={batteryLevel < 20 ? "drop-shadow-[0_0_5px_rgba(248,113,113,0.6)]" : "drop-shadow-[0_0_5px_rgba(52,211,153,0.6)]"}/>
                        <span className="text-[11px] font-mono font-bold tracking-wider">{batteryLevel}%</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isLaunching}
                    className="border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 to-cyan-500/5 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 font-bold tracking-wide min-w-[140px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_15px_rgba(6,182,212,0.2)] rounded-lg"
                    onClick={async () => {
                        setIsLaunching(true)
                        try {
                            await fetch("/api/system/launch-qgroundcontrol", { method: "POST" })
                            // Add an artificial delay to show a loading state 
                            // as QGroundControl can take a few seconds to start
                            setTimeout(() => setIsLaunching(false), 4000)
                        } catch {
                            setIsLaunching(false)
                        }
                    }}
                >
                    {isLaunching ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-300" />
                            Launching...
                        </>
                    ) : (
                        "Open Launcher"
                    )}
                </Button>

                <Button variant="outline" size="icon" className="text-slate-400 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:text-white transition-all shadow-inner rounded-lg">
                    <Bell size={16} />
                </Button>

                <Button
                    variant="default"
                    onClick={() => router.push("/")}
                    className="border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold tracking-wide transition-all shadow-inner rounded-lg"
                >
                    <LogOut size={14} className="mr-2" />
                    Logout
                </Button>
            </div>
        </header>
    )
}
