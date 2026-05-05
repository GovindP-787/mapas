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
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-950 bg-black/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <div className="flex items-center gap-4">
                <MobileSidebar />
                <div className="hidden md:flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-slate-200">System Online</span>
                </div>
                <Separator orientation="vertical" className="hidden md:block h-6 bg-slate-950" />
                <div className="hidden md:flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Active Mission</span>
                    <span className="text-sm font-semibold text-sky-400">{activeMission}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Status Indicators */}
                <div className="flex items-center gap-3 bg-black/50 rounded-lg px-3 py-1.5 border border-slate-950">
                    <div className={cn("flex items-center gap-1.5", gpsLock ? "text-emerald-400" : "text-amber-500")}>
                        <MapPin size={16} />
                        <span className="text-xs font-mono font-medium">GPS LOCK</span>
                    </div>
                    <Separator orientation="vertical" className="h-4 bg-slate-950" />
                    <div className={cn("flex items-center gap-1.5", batteryLevel < 20 ? "text-red-500" : "text-emerald-400")}>
                        <Battery size={16} />
                        <span className="text-xs font-mono font-medium">{batteryLevel}%</span>
                    </div>
                    <Separator orientation="vertical" className="h-4 bg-slate-950" />
                    <div className={cn("flex items-center gap-1.5 text-slate-400")}>
                        <Wifi size={16} />
                        <span className="text-xs font-mono font-medium">5.8G</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isLaunching}
                    className="border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 font-medium tracking-wide min-w-[130px]"
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Launching...
                        </>
                    ) : (
                        "Open Launcher"
                    )}
                </Button>

                <Button variant="outline" size="icon" className="text-slate-400 border-slate-950 hover:bg-slate-950 hover:text-sky-400">
                    <Bell size={18} />
                </Button>

                <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="border-slate-950 bg-black/50 text-slate-300 hover:bg-slate-950 hover:text-white hover:border-slate-900 font-medium tracking-wide"
                >
                    <LogOut size={16} className="mr-2" />
                    Logout
                </Button>
            </div>
        </header>
    )
}
