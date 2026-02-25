"use client"

import * as React from "react"
import { Sidebar } from "@/components/Sidebar"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    return (
        <div className="flex h-screen w-full bg-black text-slate-100 overflow-hidden">
            {/* Sidebar for Desktop */}
            <div className="hidden md:block h-full transition-all duration-300">
                <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-auto p-6 transition-all">
                    {children}
                </main>
            </div>
        </div>
    )
}
