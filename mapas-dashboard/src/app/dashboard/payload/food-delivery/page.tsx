"use client"

import { useState } from "react"
import { LatchControlPanel } from "@/components/LatchControlPanel"
import { FaceVerificationModal } from "@/components/FaceVerificationModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, MapPin, Box, Battery, Gauge, Ruler, Signal, Search, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

// Mock customer data
const MOCK_CUSTOMERS = [
    {
        id: 1,
        name: "Forward Base Delta",
        orderId: "#RAT-SUP-882",
        coordinates: "34.4211° N, 112.1832° W",
        status: "pending",
        contents: "MRE Rations (Type C) x20",
        eta: "12 mins"
    },
    {
        id: 2,
        name: "Eastern Outpost Alpha",
        orderId: "#RAT-SUP-883",
        coordinates: "34.5122° N, 112.2945° W",
        status: "pending",
        contents: "Medical Supplies Kit x5",
        eta: "18 mins"
    },
    {
        id: 3,
        name: "Northern Command Center",
        orderId: "#RAT-SUP-884",
        coordinates: "34.6333° N, 112.0876° W",
        status: "in-transit",
        contents: "Water Containers (5L) x30",
        eta: "8 mins"
    },
    {
        id: 4,
        name: "Central Supply Hub",
        orderId: "#RAT-SUP-885",
        coordinates: "34.3456° N, 112.3210° W",
        status: "pending",
        contents: "Ammunition Box x10",
        eta: "25 mins"
    },
    {
        id: 5,
        name: "Southern Defense Post",
        orderId: "#RAT-SUP-886",
        coordinates: "34.2111° N, 112.1555° W",
        status: "delivered",
        contents: "Communication Equipment x3",
        eta: "-"
    }
]

export default function FoodDeliveryPage() {
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [verificationModalOpen, setVerificationModalOpen] = useState(false)
    const [customerVerified, setCustomerVerified] = useState(false)
    const [verificationConfidence, setVerificationConfidence] = useState(0)

    const selectedCustomer = MOCK_CUSTOMERS.find(c => c.id === selectedCustomerId) || null

    const handleVerificationComplete = (customerId: string, confidence: number) => {
        setCustomerVerified(true)
        setVerificationConfidence(confidence)
        setVerificationModalOpen(false)
        console.log(`✅ Customer ${customerId} verified with confidence: ${confidence}`)
    }

    const handleVerificationModalClose = () => {
        setVerificationModalOpen(false)
    }

    const handleRequestRelease = () => {
        if (!customerVerified) {
            setVerificationModalOpen(true)
        }
    }

    // Filter customers based on search
    const filteredCustomers = MOCK_CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-amber-500/10 text-amber-500 border-amber-500/20"
            case "in-transit":
                return "bg-sky-500/10 text-sky-500 border-sky-500/20"
            case "delivered":
                return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            default:
                return "bg-slate-500/10 text-slate-500 border-slate-500/20"
        }
    }

    const getStatusLabel = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")
    }

    return (
        <div className="flex-1 p-6 space-y-6 bg-slate-950">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/payload">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-sky-400 hover:bg-slate-950">
                            <ChevronLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Food Delivery Operation</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">LIVE</span>
                        </div>
                        <p className="text-sm text-slate-500 font-mono">ID: OP-FD-001 • DRONE: DR-ALPHA-01</p>
                    </div>
                </div>

                {/* Face Verification Button */}
                <Link href="/dashboard/face-verification">
                    <Button className="bg-sky-600 hover:bg-sky-700 text-white">
                        <Camera size={16} className="mr-2" />
                        Face Verification
                    </Button>
                </Link>
            </div>

            <Separator className="bg-slate-950" />

            {/* Two-Panel Layout */}
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">

                {/* LEFT PANEL - Customer Queue (30%) */}
                <div className="col-span-3 flex flex-col space-y-4">
                    <Card className="bg-slate-950 border-slate-950">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Customer Queue</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <Input
                                    placeholder="Search customer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-slate-950 border-slate-950 text-slate-200 text-xs"
                                />
                            </div>

                            {/* Scrollable Customer Table */}
                            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-4">No customers found</p>
                                ) : (
                                    filteredCustomers.map(customer => (
                                        <div
                                            key={customer.id}
                                            onClick={() => setSelectedCustomerId(customer.id)}
                                            className={`p-3 rounded border cursor-pointer transition-all ${
                                                selectedCustomerId === customer.id
                                                    ? "bg-sky-500/10 border-sky-500/30"
                                                    : "bg-slate-950 border-slate-950 hover:border-slate-900"
                                            }`}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-xs font-mono text-slate-300 truncate">{customer.name}</p>
                                                    <Badge variant="outline" className={`text-[10px] shrink-0 ${getStatusColor(customer.status)}`}>
                                                        {getStatusLabel(customer.status)}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-mono">{customer.orderId}</p>
                                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <MapPin size={10} />
                                                    {customer.coordinates}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT PANEL - Delivery Workspace (70%) */}
                <div className="col-span-9 space-y-6 flex flex-col">
                    {/* Delivery Information */}
                    <Card className="bg-slate-950 border-slate-950">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Delivery Manifest</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {selectedCustomer ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Customer</p>
                                        <p className="text-sm text-slate-200 font-medium">{selectedCustomer.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Order ID</p>
                                        <p className="text-sm text-sky-400 font-mono">{selectedCustomer.orderId}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                                            <MapPin size={12} />
                                            <span>Drop Coordinates</span>
                                        </div>
                                        <p className="text-xs font-mono text-slate-300">{selectedCustomer.coordinates}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Delivery Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                selectedCustomer.status === "pending" ? "bg-amber-500" :
                                                selectedCustomer.status === "in-transit" ? "bg-sky-500" :
                                                "bg-emerald-500"
                                            }`}></div>
                                            <span className="text-xs font-mono">{getStatusLabel(selectedCustomer.status)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-xs text-slate-500">Contents</p>
                                        <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-950">
                                            <Box size={14} className="text-amber-500" />
                                            <span className="text-xs text-slate-300">{selectedCustomer.contents}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Est. Arrival Time</p>
                                        <p className="text-xs font-mono text-sky-400">{selectedCustomer.eta}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-8 text-center">
                                    <p className="text-slate-500 text-sm">No delivery mission selected.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Drone Status & Camera Feed Grid */}
                    <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
                        {/* Drone Telemetry */}
                        <Card className="bg-slate-950 border-slate-950 col-span-1 flex flex-col">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Drone Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1 overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Drone ID</span>
                                    <span className="text-sky-400 font-mono font-bold text-xs">DR-ALPHA-01</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Battery size={14} />
                                            <span className="text-sm">Battery</span>
                                        </div>
                                        <span className="text-emerald-400 font-mono font-bold text-xs">82%</span>
                                    </div>
                                    <div className="w-full bg-slate-950 rounded h-2 border border-slate-950">
                                        <div className="h-full bg-emerald-500/70 rounded" style={{ width: "82%" }}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Ruler size={14} />
                                        <span className="text-sm">Altitude</span>
                                    </div>
                                    <span className="text-slate-200 font-mono text-xs">45m</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Gauge size={14} />
                                        <span className="text-sm">Speed</span>
                                    </div>
                                    <span className="text-slate-200 font-mono text-xs">0.2 m/s</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">GPS Lock</span>
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        RTK FIX
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Link Quality</span>
                                    <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-500 border-sky-500/20">
                                        STABLE
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Camera Feed */}
                        <Card className="bg-black border-slate-950 col-span-1 flex flex-col overflow-hidden relative">
                            <div className="absolute top-4 left-4 z-10 flex gap-2">
                                <Badge className="bg-red-500 text-white border-none rounded-sm text-[10px]">LIVE</Badge>
                                <Badge className="bg-black/50 text-slate-300 border-slate-900 backdrop-blur-sm font-mono text-[10px]">CAM-01</Badge>
                            </div>

                            <div className="absolute inset-0 pointer-events-none opacity-20">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/50 rounded-full"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full"></div>
                                <div className="absolute top-0 bottom-0 left-1/2 border-l border-white/20"></div>
                                <div className="absolute left-0 right-0 top-1/2 border-t border-white/20"></div>
                            </div>

                            <div className="w-full h-full flex items-center justify-center bg-slate-950/50">
                                <div className="text-center space-y-2">
                                    <Signal className="text-slate-900 mx-auto" size={32} />
                                    <p className="text-slate-500 font-mono text-xs">Camera Feed</p>
                                    <p className="text-slate-900 text-[10px]">Demo Placeholder Only</p>
                                </div>
                            </div>
                        </Card>

                        {/* Latch Control */}
                        <div className="col-span-1">
                            <LatchControlPanel
                                selectedCustomer={selectedCustomer}
                                droneAltitude={45}
                                droneSpeed={0.2}
                                gpsLocked={true}
                                customerVerified={customerVerified}
                                verificationConfidence={verificationConfidence}
                                onRequestRelease={handleRequestRelease}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Face Verification Modal */}
            {selectedCustomer && (
                <FaceVerificationModal
                    isOpen={verificationModalOpen}
                    customerId={selectedCustomer.id.toString()}
                    customerName={selectedCustomer.name}
                    onVerified={handleVerificationComplete}
                    onClosed={handleVerificationModalClose}
                />
            )}
        </div>
    )
}
