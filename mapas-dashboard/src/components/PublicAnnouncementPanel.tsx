"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, AlertTriangle, AlertCircle, Trash2, Clock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { AudioStreamingPanel } from "./AudioStreamingPanel"

interface Announcement {
    id?: string
    message: string
    announcement_type: "emergency" | "general"
    triggered_by: string
    created_at: string
}

const PREDEFINED_ANNOUNCEMENTS = [
    {
        id: "evacuation",
        label: "Evacuation Alert",
        message: "Please evacuate immediately",
        type: "emergency" as const
    },
    {
        id: "danger-zone",
        label: "Danger Zone",
        message: "Danger in the area. Clear the zone immediately",
        type: "emergency" as const
    },
    {
        id: "all-clear",
        label: "All Clear",
        message: "All clear. You may resume normal operations",
        type: "general" as const
    },
    {
        id: "area-restricted",
        label: "Area Restricted",
        message: "This area is restricted. Do not enter",
        type: "emergency" as const
    },
]

export function PublicAnnouncementPanel() {
    const [customMessage, setCustomMessage] = React.useState("")
    const [announcementType, setAnnouncementType] = React.useState<"emergency" | "general">("general")
    const [isLoading, setIsLoading] = React.useState(false)
    const [isClearingAll, setIsClearingAll] = React.useState(false)
    const [announcements, setAnnouncements] = React.useState<Announcement[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = React.useState(true)
    const [selectedFilter, setSelectedFilter] = React.useState<"all" | "emergency" | "general">("all")
    const [clearDialogOpen, setClearDialogOpen] = React.useState(false)
    const [showHistory, setShowHistory] = React.useState(true)

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
    
    // Test function to verify DELETE requests work
    const testDeleteRequest = React.useCallback(async () => {
        try {
            console.log("🧪 Testing DELETE request...")
            const response = await fetch(`${API_BASE}/test-delete`, {
                method: "DELETE"
            })
            console.log(`🧪 Test DELETE response status: ${response.status}`)
            const result = await response.text()
            console.log(`🧪 Test DELETE response: ${result}`)
        } catch (error) {
            console.error("🧪 Test DELETE failed:", error)
        }
    }, [API_BASE])

    const loadAnnouncements = React.useCallback(async () => {
        setIsLoadingHistory(true)
        try {
            let endpoint = `${API_BASE}/announcements`
            if (selectedFilter !== "all") {
                endpoint = `${API_BASE}/announcements/type/${selectedFilter}`
            }

            const response = await fetch(endpoint)
            if (response.ok) {
                const data = await response.json()
                setAnnouncements(data)
            } else {
                setAnnouncements([])
            }
        } catch (error) {
            console.error("Failed to load announcements:", error)
            setAnnouncements([])
        } finally {
            setIsLoadingHistory(false)
        }
    }, [selectedFilter, API_BASE])

    // Load announcement history on mount
    React.useEffect(() => {
        loadAnnouncements()
        // Test DELETE request on component mount
        testDeleteRequest()
    }, [loadAnnouncements, testDeleteRequest])

    const broadcastAnnouncement = async (message: string, type: "emergency" | "general") => {
        setIsLoading(true)
        try {
            const payload = {
                message,
                announcement_type: type,
                triggered_by: "operator"
            }

            console.log("Sending broadcast request to:", `${API_BASE}/announcements/broadcast`)
            console.log("Payload:", payload)

            const response = await fetch(`${API_BASE}/announcements/broadcast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            console.log("Response status:", response.status)
            const result = await response.json()
            console.log("Response body:", result)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${result.detail || result.message || 'Unknown error'}`)
            }

            
            toast.success(`${type === "emergency" ? "🚨 EMERGENCY" : "📢 ANNOUNCEMENT"} Broadcasted`, {
                description: message
            })

            setCustomMessage("")
            setAnnouncementType("general")
            
            // Save log to operation logs
            try {
                const logLevel = type === "emergency" ? "critical" : "info"
                const logMessage = type === "emergency" ? `EMERGENCY: ${message}` : `General: ${message}`
                await fetch(`${API_BASE}/logs/create?operation_type=public_announcement&level=${logLevel}&message=${encodeURIComponent(logMessage)}`, {
                    method: "POST"
                })
            } catch (logError) {
                console.error("Failed to save log:", logError)
            }
            
            // Reload history
            await loadAnnouncements()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error"
            console.error("Broadcast failed:", error)
            toast.error("Failed to broadcast announcement", {
                description: errorMessage
            })
        } finally {
            setIsLoading(false)
        }
    }

    const deleteAnnouncement = async (id: string) => {
        try {
            console.log(`🗑️  Attempting to delete announcement: ${id}`)
            const deleteUrl = `${API_BASE}/announcements/${id}`
            console.log(`📍 DELETE URL: ${deleteUrl}`)
            
            const response = await fetch(deleteUrl, {
                method: "DELETE"
            })
            
            console.log(`📊 Response status: ${response.status}`)
            const responseText = await response.text()
            console.log(`📝 Response body: ${responseText}`)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`)
            }

            toast.success("Announcement deleted")
            // Update local state
            setAnnouncements(announcements.filter(a => a.id !== id))
            // Reload from database to ensure consistency
            await loadAnnouncements()
        } catch (error) {
            console.error(`❌ Delete failed:`, error)
            toast.error("Failed to delete announcement", {
                description: error instanceof Error ? error.message : "Unknown error"
            })
        }
    }

    const clearAllAnnouncements = async () => {
        setIsClearingAll(true)
        try {
            // First, fetch ALL announcements (regardless of current filter)
            const allResponse = await fetch(`${API_BASE}/announcements`)
            if (!allResponse.ok) {
                throw new Error(`Failed to fetch all announcements: ${allResponse.status}`)
            }
            const allAnnouncements = await allResponse.json()
            
            let deletedCount = 0
            const errors: string[] = []
            
            console.log(`Starting deletion of ${allAnnouncements.length} announcements`)
            console.log("All announcements data:", allAnnouncements.map((a: any) => ({ id: a.id, message: a.message?.substring(0, 30) })))
            
            // Delete each announcement sequentially
            for (const announcement of allAnnouncements) {
                console.log(`Processing announcement:`, { id: announcement.id, hasId: !!announcement.id })
                
                if (announcement.id) {
                    try {
                        const deleteUrl = `${API_BASE}/announcements/${announcement.id}`
                        console.log(`🗑️  Sending DELETE to: ${deleteUrl}`)
                        
                        const response = await fetch(deleteUrl, {
                            method: "DELETE"
                        })
                        
                        console.log(`📊 Response for ${announcement.id}: ${response.status}`)
                        
                        if (response.ok) {
                            const result = await response.json()
                            console.log(`✓ Successfully deleted: ${announcement.id}`, result)
                            deletedCount++
                        } else {
                            const errorText = await response.text()
                            console.error(`✗ Failed to delete ${announcement.id}: ${response.status} - ${errorText}`)
                            errors.push(`${announcement.id}`)
                        }
                    } catch (error) {
                        console.error(`✗ Error deleting ${announcement.id}:`, error)
                        errors.push(`${announcement.id}`)
                    }
                } else {
                    console.warn(`❌ Skipping announcement without id:`, announcement)
                }
            }
            
            console.log(`Deletion complete: ${deletedCount} deleted, ${errors.length} failed`)
            
            // Only clear UI after all deletions are confirmed
            if (deletedCount > 0) {
                setAnnouncements([])
                setClearDialogOpen(false)
                toast.success(`Deleted ${deletedCount} announcement${deletedCount !== 1 ? 's' : ''}`, {
                    description: errors.length > 0 ? `${errors.length} failed to delete` : "All announcements permanently deleted from database"
                })
                // Reload to ensure state is in sync with database
                await loadAnnouncements()
            } else if (errors.length > 0) {
                toast.error("Failed to delete announcements", {
                    description: `${errors.length} item(s) could not be deleted from database`
                })
            }
        } catch (error) {
            console.error("Error clearing announcements:", error)
            toast.error("Failed to clear announcements", {
                description: error instanceof Error ? error.message : "Unknown error"
            })
        } finally {
            setIsClearingAll(false)
        }
    }

    const handleClearAll = async () => {
        console.log("🗑️ Clear All button clicked")
        try {
            await clearAllAnnouncements()
        } catch (error) {
            console.error("❌ Clear All error:", error)
        }
    }

    const handleCustomBroadcast = async () => {
        if (!customMessage.trim()) {
            toast.error("Message is required")
            return
        }

        await broadcastAnnouncement(customMessage, announcementType)
    }

    const handlePredefinedBroadcast = async (announcement: typeof PREDEFINED_ANNOUNCEMENTS[0]) => {
        await broadcastAnnouncement(announcement.message, announcement.type)
    }

    const formatTime = (isoDate: string) => {
        return new Date(isoDate).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })
    }

    return (
        <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-6 pr-4">
                {/* Broadcast Section */}
                <Card className="bg-slate-950 border-slate-950 flex-shrink-0">
                <CardHeader>
                    <CardTitle className="text-slate-100">Public Announcement System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Custom Message Input */}
                    <div className="space-y-2">
                        <Label htmlFor="custom-msg" className="text-slate-300">Custom Message</Label>
                        <div className="flex gap-2">
                            <Input
                                id="custom-msg"
                                placeholder="Enter announcement message..."
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                disabled={isLoading}
                                className="bg-slate-950 border-slate-900 text-slate-200"
                                maxLength={500}
                            />
                            <Select value={announcementType} onValueChange={(value: any) => setAnnouncementType(value)}>
                                <SelectTrigger className="w-[140px] bg-slate-950 border-slate-900 text-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-900">
                                    <SelectItem value="general" className="text-slate-100">General</SelectItem>
                                    <SelectItem value="emergency" className="text-slate-100">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-xs text-slate-500">
                            {customMessage.length}/500 characters
                        </div>
                    </div>

                    {/* Broadcast Button */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={!customMessage.trim() || isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Send className="mr-2 h-4 w-4" />
                                Broadcast
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-950 border-slate-950 max-w-md w-full">
                            <AlertDialogHeader className="w-full">
                                <AlertDialogTitle className="text-slate-100">
                                    Confirm Broadcast
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="text-slate-400 overflow-x-hidden space-y-2 min-w-0">
                                        <div className="min-w-0">
                                            <span className="block text-slate-300 mb-1">Message:</span>
                                            <span className="block text-slate-200 break-words whitespace-pre-wrap bg-slate-950 p-2 rounded border border-slate-900 overflow-x-hidden">
                                                {customMessage}
                                            </span>
                                        </div>
                                        <span className="block">Type: <Badge className={announcementType === "emergency" ? "bg-red-600" : "bg-blue-600"}>
                                            {announcementType.toUpperCase()}
                                        </Badge></span>
                                        <span className="text-yellow-400 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                            This message will be broadcast through all speakers
                                        </span>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="w-full">
                                <AlertDialogCancel className="bg-slate-950 text-slate-200 border-slate-900">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCustomBroadcast}
                                    className={announcementType === "emergency" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                                >
                                    Broadcast Now
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Predefined Announcements */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Quick Announcements</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {PREDEFINED_ANNOUNCEMENTS.map((announce) => (
                                <AlertDialog key={announce.id}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`justify-start text-left h-auto ${
                                                announce.type === "emergency"
                                                    ? "border-red-600 text-red-400 hover:bg-red-950"
                                                    : "border-blue-600 text-blue-400 hover:bg-blue-950"
                                            }`}
                                            disabled={isLoading}
                                        >
                                            {announce.type === "emergency" && <AlertTriangle className="mr-2 h-4 w-4" />}
                                            <span className="text-xs">{announce.label}</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-slate-950 border-slate-950 max-w-md w-full">
                                        <AlertDialogHeader className="w-full">
                                            <AlertDialogTitle className="text-slate-100">
                                                Confirm Broadcast
                                            </AlertDialogTitle>
                                            <AlertDialogDescription asChild>
                                                <div className="text-slate-400 overflow-x-hidden space-y-2 min-w-0">
                                                    <div className="min-w-0">
                                                        <span className="block text-slate-300 mb-1">Message:</span>
                                                        <span className="block text-slate-200 break-words whitespace-pre-wrap bg-slate-950 p-2 rounded border border-slate-900 overflow-x-hidden">
                                                            {announce.message}
                                                        </span>
                                                    </div>
                                                    <span className="block">Type: <Badge className={announce.type === "emergency" ? "bg-red-600" : "bg-blue-600"}>
                                                        {announce.type.toUpperCase()}
                                                    </Badge></span>
                                                </div>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="w-full">
                                            <AlertDialogCancel className="bg-slate-950 text-slate-200 border-slate-900">
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handlePredefinedBroadcast(announce)}
                                                className={announce.type === "emergency" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                                            >
                                                Broadcast
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* History Section */}
            {showHistory && (
            <Card className="bg-slate-950 border-slate-950 flex-shrink-0">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-slate-100">
                            <Clock className="h-5 w-5" />
                            Broadcast History
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowHistory(false)}
                                className="h-8 w-8 p-0"
                                title="Hide history"
                            >
                                <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-300" />
                            </Button>
                            <Select value={selectedFilter} onValueChange={(value: any) => setSelectedFilter(value)}>
                                <SelectTrigger className="w-[120px] bg-slate-950 border-slate-900 text-slate-200 text-xs h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-900">
                                    <SelectItem value="all" className="text-slate-100">All</SelectItem>
                                    <SelectItem value="emergency" className="text-slate-100">Emergency</SelectItem>
                                    <SelectItem value="general" className="text-slate-100">General</SelectItem>
                                </SelectContent>
                            </Select>
                            {announcements.length > 0 && (
                                <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-red-600 text-red-400 hover:bg-red-950"
                                            disabled={isClearingAll}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            {isClearingAll ? "Clearing..." : "Clear All"}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-slate-950 border-slate-950 max-w-md w-full">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-slate-100">
                                                Clear All Announcements?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-slate-400">
                                                This will permanently delete all {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} from the history. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-slate-950 text-slate-200 border-slate-900" disabled={isClearingAll}>
                                                Cancel
                                            </AlertDialogCancel>
                                            <Button
                                                onClick={handleClearAll}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                disabled={isClearingAll}
                                            >
                                                {isClearingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {isClearingAll ? "Deleting..." : "Delete All"}
                                            </Button>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <p>No announcements yet</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-2">
                                {announcements.map((announcement) => (
                                    <div
                                        key={announcement.id || announcement.created_at}
                                        className={`p-3 rounded-lg border ${
                                            announcement.announcement_type === "emergency"
                                                ? "bg-red-950 border-red-700"
                                                : "bg-slate-950 border-slate-900"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge
                                                        className={announcement.announcement_type === "emergency" ? "bg-red-600" : "bg-blue-600"}
                                                        variant="default"
                                                    >
                                                        {announcement.announcement_type === "emergency" ? "🚨" : "📢"} {announcement.announcement_type.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">
                                                        {formatTime(announcement.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-200 break-words">
                                                    {announcement.message}
                                                </p>
                                            </div>
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    try {
                                                        if (announcement.id) {
                                                            console.log(`🗑️ Delete button clicked for: ${announcement.id}`)
                                                            await deleteAnnouncement(announcement.id)
                                                        } else {
                                                            console.warn("❌ No announcement ID found")
                                                        }
                                                    } catch (error) {
                                                        console.error("❌ Delete button error:", error)
                                                    }
                                                }}
                                                className="p-1 hover:bg-slate-900 rounded transition-colors flex-shrink-0"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
            )}

            {/* Show History Button */}
            {!showHistory && (
                <Button
                    onClick={() => setShowHistory(true)}
                    variant="outline"
                    className="flex items-center gap-2 border-slate-900 text-slate-300 hover:bg-slate-950"
                >
                    <Eye className="h-4 w-4" />
                    Show Broadcast History
                </Button>
            )}

            {/* Audio Streaming Section */}
            <Card className="bg-slate-950 border-slate-950 flex-shrink-0">
                <AudioStreamingPanel />
            </Card>
            </div>
        </ScrollArea>
    )
}
