"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    LayoutDashboard,
    Plane,
    Activity,
    Box,
    FileText,
    Settings,
    Menu,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    UserCheck
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
}

const sidebarNavItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Drone Fleet",
        href: "/dashboard/fleet",
        icon: Plane,
    },
    {
        title: "Live Telemetry",
        href: "/dashboard/telemetry",
        icon: Activity,
    },
    {
        title: "Payload Control",
        href: "/dashboard/payload",
        icon: Box,
    },
    {
        title: "Public Announcements",
        href: "/dashboard/payload/public-announcement",
        icon: Megaphone,
    },
    {
        title: "Face Verification",
        href: "/dashboard/face-verification",
        icon: UserCheck,
    },
    {
        title: "Logs & Alerts",
        href: "/dashboard/logs",
        icon: FileText,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

export function Sidebar({ className, isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div
            className={cn(
                "relative flex flex-col border-r bg-black text-slate-100 transition-all duration-300",
                isCollapsed ? "w-16" : "w-64",
                className
            )}
        >
            <div className="flex h-16 items-center justify-between px-4">
                {!isCollapsed && (
                    <h1 className="text-xl font-bold tracking-tight text-sky-400">
                        MAPAS
                    </h1>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-950"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </Button>
            </div>
            <Separator className="bg-slate-950" />
            <ScrollArea className="flex-1 py-4">
                <nav className="grid gap-1 px-2">
                    {sidebarNavItems.map((item, index) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-950 hover:text-sky-400",
                                    isActive ? "bg-slate-950 text-sky-400" : "text-slate-400",
                                    isCollapsed && "justify-center px-2"
                                )}
                            >
                                <item.icon size={20} />
                                {!isCollapsed && <span>{item.title}</span>}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>

            {!isCollapsed && (
                <div className="p-4 text-xs text-slate-500 border-t border-slate-950">
                    <p>System Ver 2.4.0</p>
                    <p>Connected to 3 Drones</p>
                </div>
            )}
        </div>
    )
}

export function MobileSidebar() {
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-black p-0 text-slate-100 border-r-slate-950">
                <div className="flex h-16 items-center px-6 border-b border-slate-950">
                    <h1 className="text-xl font-bold tracking-tight text-sky-400">MAPAS</h1>
                </div>
                <ScrollArea className="flex-1 py-4">
                    <nav className="grid gap-1 px-4">
                        {sidebarNavItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:text-sky-400 hover:bg-slate-950"
                            >
                                <item.icon size={20} />
                                <span>{item.title}</span>
                            </Link>
                        ))}
                    </nav>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
