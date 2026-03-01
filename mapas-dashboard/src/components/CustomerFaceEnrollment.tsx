"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { 
    Loader2, 
    Plus, 
    Upload, 
    Trash2, 
    Users, 
    Camera, 
    CheckCircle, 
    AlertCircle,
    User,
    Eye,
    X
} from "lucide-react"
import { toast } from "sonner"

interface Customer {
    id: string
    name: string
    phone?: string
    face_embedding?: string
    enrollment_date: string
    is_active: boolean
}

interface VerificationResult {
    status: string
    customer_id?: string
    customer_name?: string
    similarity_score?: number
    message?: string
}

export function CustomerFaceEnrollment() {
    const [customers, setCustomers] = React.useState<Customer[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [isLoadingCustomers, setIsLoadingCustomers] = React.useState(true)
    const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("")
    const [isVerifying, setIsVerifying] = React.useState(false)
    const [verificationResult, setVerificationResult] = React.useState<VerificationResult | null>(null)

    // Enrollment form state
    const [enrollmentForm, setEnrollmentForm] = React.useState({
        name: "",
        phone: ""
    })
    
    // Face upload state
    const [selectedFiles, setSelectedFiles] = React.useState<Record<string, File>>({})
    const [uploadingCustomerId, setUploadingCustomerId] = React.useState<string | null>(null)

    // Image preview state
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [previewOpen, setPreviewOpen] = React.useState(false)
    const [previewName, setPreviewName] = React.useState<string>("")
    
    // Camera verification state
    const [cameraActive, setCameraActive] = React.useState(false)
    const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null)
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"

    React.useEffect(() => {
        loadCustomers()
    }, [])

    const loadCustomers = async () => {
        setIsLoadingCustomers(true)
        try {
            const response = await fetch(`${API_BASE}/face-customers`)
            if (response.ok) {
                const data = await response.json()
                const loadedCustomers = data.customers || []
                setCustomers(loadedCustomers)
                
                // Reset selected customer if they no longer have face enrollment
                const newEnrolledCustomers = loadedCustomers.filter((c: Customer) => c.face_embedding)
                if (selectedCustomerId && !newEnrolledCustomers.find((c: Customer) => c.id === selectedCustomerId)) {
                    setSelectedCustomerId("")
                    setVerificationResult(null)
                }
            }
        } catch (error) {
            console.error("Failed to load customers:", error)
            toast.error("Failed to load customers")
        } finally {
            setIsLoadingCustomers(false)
        }
    }

    const enrollCustomer = async () => {
        if (!enrollmentForm.name.trim()) {
            toast.error("Customer name is required")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`${API_BASE}/customers/enroll`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: enrollmentForm.name,
                    phone: enrollmentForm.phone || null
                })
            })

            if (response.ok) {
                const result = await response.json()
                toast.success(`Customer ${enrollmentForm.name} enrolled successfully`)
                setEnrollmentForm({ name: "", phone: "" })
                await loadCustomers()
            } else {
                const error = await response.json()
                throw new Error(error.detail || "Enrollment failed")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Enrollment failed")
        } finally {
            setIsLoading(false)
        }
    }

    const openPreview = (customerId: string, customerName: string) => {
        const file = selectedFiles[customerId]
        if (!file) return
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        setPreviewName(customerName)
        setPreviewOpen(true)
    }

    const closePreview = () => {
        setPreviewOpen(false)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
    }

    const uploadFace = async (customerId: string) => {
        const selectedFile = selectedFiles[customerId]
        if (!selectedFile) {
            toast.error("Please select a face image")
            return
        }

        setUploadingCustomerId(customerId)
        try {
            const formData = new FormData()
            formData.append("face_image", selectedFile)

            const response = await fetch(`${API_BASE}/customers/${customerId}/upload-face`, {
                method: "POST",
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                if (result.status === "SUCCESS") {
                    toast.success("Face uploaded and enrolled successfully")
                    setSelectedFiles(prev => { const next = { ...prev }; delete next[customerId]; return next })
                    await loadCustomers() // Refresh customer list to show updated status
                } else {
                    toast.error(result.message || "Face upload failed. No face detected in image.")
                }
            } else {
                const error = await response.json()
                throw new Error(error.message || error.detail || "Face upload failed")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Face upload failed")
        } finally {
            setUploadingCustomerId(null)
        }
    }

    const deleteCustomer = async (customerId: string) => {
        try {
            const response = await fetch(`${API_BASE}/customers/${customerId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                toast.success("Customer deleted successfully")
                await loadCustomers()
                if (selectedCustomerId === customerId) {
                    setSelectedCustomerId("")
                }
            } else {
                const error = await response.json()
                throw new Error(error.detail || "Delete failed")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Delete failed")
        }
    }

    // Camera functions for live verification
    const startCamera = async () => {
        try {
            console.log("Starting camera...")
            
            // The video element should always be available now
            if (!videoRef.current) {
                console.error("Video element still not available - this should not happen")
                toast.error("Camera setup error. Please refresh the page.")
                return
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user"
                }
            })
            
            console.log("Got camera stream:", stream)
            setCameraStream(stream)
            setCameraActive(true) // Set active first to show video element
            
            console.log("Setting video srcObject")
            videoRef.current.srcObject = stream
            
            // Wait a bit for the stream to be ready
            await new Promise(resolve => setTimeout(resolve, 100))
            
            try {
                await videoRef.current.play()
                console.log("Video playing successfully")
            } catch (playError) {
                console.warn("Video play failed, but continuing:", playError)
            }
            
            setVerificationResult(null)
            toast.success("Camera started successfully")
        } catch (error) {
            console.error("Camera startup error:", error)
            setCameraActive(false) // Reset on error
            toast.error("Failed to access camera. Please check permissions.")
        }
    }

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        
        setCameraActive(false)
        setVerificationResult(null)
        toast.info("Camera stopped")
    }

    const captureAndVerify = async () => {
        if (!selectedCustomerId) {
            toast.error("Please select a customer to verify against")
            return
        }

        if (!videoRef.current || !canvasRef.current) {
            toast.error("Camera not ready")
            return
        }

        if (!cameraActive || !cameraStream) {
            toast.error("Camera is not active")
            return
        }

        setIsVerifying(true)
        try {
            // Capture frame from video
            const canvas = canvasRef.current
            const video = videoRef.current
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
                throw new Error("Could not get canvas context")
            }

            // Ensure video is ready
            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                throw new Error("Video not ready for capture")
            }

            // Draw current video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            // Convert canvas to blob
            const blob = await new Promise<Blob | null>(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8)
            })

            if (!blob) {
                throw new Error("Failed to capture image")
            }

            console.log("Captured image blob size:", blob.size)

            // Send to verification API
            const formData = new FormData()
            formData.append("face_image", blob, "camera_capture.jpg")

            console.log("Sending verification request to:", `${API_BASE}/customers/${selectedCustomerId}/verify`)

            const response = await fetch(`${API_BASE}/customers/${selectedCustomerId}/verify`, {
                method: "POST", 
                body: formData
            })

            console.log("Verification response status:", response.status)
            const responseText = await response.text()
            console.log("Verification response:", responseText)

            if (response.ok) {
                const result = JSON.parse(responseText)
                setVerificationResult(result)
                
                if (result.status === "VERIFIED") {
                    toast.success(`✅ Identity Verified: ${result.customer_name || 'Customer'}`)
                } else {
                    toast.error(`❌ Identity Not Verified: ${result.message}`)
                }
            } else {
                let error
                try {
                    error = JSON.parse(responseText)
                } catch {
                    error = { detail: responseText || "Verification failed" }
                }
                throw new Error(error.detail || "Verification failed")
            }
        } catch (error) {
            console.error("Verification error:", error)
            toast.error(error instanceof Error ? error.message : "Verification failed")
        } finally {
            setIsVerifying(false)
        }
    }

    // Cleanup camera on unmount
    React.useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [cameraStream])

    const formatDate = (isoDate: string) => {
        return new Date(isoDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const enrolledCustomers = customers.filter(c => c.face_embedding)
    const unenrolledCustomers = customers.filter(c => !c.face_embedding)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Customer Enrollment & Management */}
            <div className="flex flex-col gap-6">
                {/* Enrollment Form */}
                <Card className="bg-slate-950 border-slate-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-100">
                            <Plus className="h-5 w-5" />
                            Enroll New Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-300">Customer Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter customer name..."
                                value={enrollmentForm.name}
                                onChange={(e) => setEnrollmentForm(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-slate-950 border-slate-900 text-slate-200"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-300">Phone (Optional)</Label>
                            <Input
                                id="phone"
                                placeholder="Enter phone number..."
                                value={enrollmentForm.phone}
                                onChange={(e) => setEnrollmentForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="bg-slate-950 border-slate-900 text-slate-200"
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            onClick={enrollCustomer}
                            disabled={isLoading || !enrollmentForm.name.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <User className="mr-2 h-4 w-4" />
                            Enroll Customer
                        </Button>
                    </CardContent>
                </Card>

                {/* Customer List */}
                <Card className="bg-slate-950 border-slate-950 flex-1 min-h-0 flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-100">
                            <Users className="h-5 w-5" />
                            Customer Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        {isLoadingCustomers ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <p>No customers enrolled yet</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4">
                                    {/* Enrolled Customers */}
                                    {enrolledCustomers.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-green-400 mb-2">
                                                ✅ Face Enrolled ({enrolledCustomers.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {enrolledCustomers.map((customer) => (
                                                    <div
                                                        key={customer.id}
                                                        className="p-3 rounded-lg border bg-green-950 border-green-700"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                                                    <span className="font-medium text-slate-200">{customer.name}</span>
                                                                </div>
                                                                {customer.phone && (
                                                                    <p className="text-xs text-slate-400">{customer.phone}</p>
                                                                )}
                                                                <p className="text-xs text-slate-500">
                                                                    Enrolled: {formatDate(customer.enrollment_date)}
                                                                </p>
                                                            </div>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="p-1 hover:bg-slate-900 rounded transition-colors">
                                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="bg-slate-950 border-slate-950">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="text-slate-100">Delete Customer</AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-slate-400">
                                                                            Are you sure you want to delete {customer.name}? This will remove their face enrollment.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="bg-slate-950 text-slate-200 border-slate-900">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteCustomer(customer.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Unenrolled Customers */}
                                    {unenrolledCustomers.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-orange-400 mb-2">
                                                📸 Awaiting Face Upload ({unenrolledCustomers.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {unenrolledCustomers.map((customer) => (
                                                    <div
                                                        key={customer.id}
                                                        className="p-3 rounded-lg border bg-orange-950 border-orange-700"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <AlertCircle className="h-4 w-4 text-orange-400" />
                                                                    <span className="font-medium text-slate-200">{customer.name}</span>
                                                                </div>
                                                                {customer.phone && (
                                                                    <p className="text-xs text-slate-400 mb-2">{customer.phone}</p>
                                                                )}
                                                                <div className="space-y-2">
                                                                    <div className="flex gap-2 items-center flex-wrap">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0]
                                                                                if (file) {
                                                                                    setSelectedFiles(prev => ({ ...prev, [customer.id]: file }))
                                                                                } else {
                                                                                    setSelectedFiles(prev => { const next = { ...prev }; delete next[customer.id]; return next })
                                                                                }
                                                                            }}
                                                                            className="hidden"
                                                                            id={`face-upload-${customer.id}`}
                                                                        />
                                                                        <label
                                                                            htmlFor={`face-upload-${customer.id}`}
                                                                            className="cursor-pointer text-xs px-2 py-1 bg-slate-950 border border-slate-600 rounded hover:bg-slate-900 text-slate-200"
                                                                        >
                                                                            {selectedFiles[customer.id] ? selectedFiles[customer.id].name.length > 18 ? selectedFiles[customer.id].name.slice(0, 16) + "…" : selectedFiles[customer.id].name : "Choose Image"}
                                                                        </label>
                                                                        {selectedFiles[customer.id] && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => openPreview(customer.id, customer.name)}
                                                                                className="h-6 text-xs px-2 text-sky-400 hover:text-sky-300 hover:bg-slate-900"
                                                                                title="Preview image"
                                                                            >
                                                                                <Eye className="h-3 w-3 mr-1" /> Preview
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => uploadFace(customer.id)}
                                                                            disabled={!selectedFiles[customer.id] || uploadingCustomerId === customer.id}
                                                                            className="h-6 text-xs bg-orange-600 hover:bg-orange-700"
                                                                        >
                                                                            {uploadingCustomerId === customer.id ? (
                                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                            ) : (
                                                                                <Upload className="h-3 w-3" />
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="p-1 hover:bg-slate-900 rounded transition-colors">
                                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="bg-slate-950 border-slate-950">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="text-slate-100">Delete Customer</AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-slate-400">
                                                                            Are you sure you want to delete {customer.name}?
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="bg-slate-950 text-slate-200 border-slate-900">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteCustomer(customer.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Face Verification */}
            <Card className="bg-slate-950 border-slate-950">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                        <Camera className="h-5 w-5" />
                        Face Verification
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadCustomers}
                            className="ml-auto bg-slate-950 border-slate-600 text-slate-300 hover:bg-slate-900 text-xs"
                        >
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Select Customer to Verify</Label>
                        {enrolledCustomers.length > 0 ? (
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger className="bg-slate-950 border-slate-900 text-slate-200">
                                    <SelectValue placeholder="Choose customer..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-900">
                                    {enrolledCustomers.map((customer) => (
                                        <SelectItem 
                                            key={customer.id} 
                                            value={customer.id} 
                                            className="text-slate-100 hover:bg-slate-900 focus:bg-slate-900"
                                        >
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="p-3 bg-slate-950 border border-slate-900 rounded-md text-slate-400 text-sm">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-400" />
                                    <span>No customers with enrolled faces available</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Upload face images in the "📸 Awaiting Face Upload" section first
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="text-center">
                            <Label className="text-slate-300 block mb-2">Live Camera Verification</Label>
                            
                            {/* Always render video element for ref availability */}
                            <div className="relative bg-black rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    controls={false}
                                    className={`w-full h-64 object-cover ${
                                        cameraActive ? 'block' : 'hidden'
                                    }`}
                                    onLoadedMetadata={() => {
                                        console.log("Video metadata loaded")
                                    }}
                                    onError={(e) => {
                                        console.error("Video error:", e)
                                    }}
                                    onCanPlay={() => {
                                        console.log("Video can play")
                                    }}
                                />
                                
                                {/* Show placeholder when camera is not active */}
                                {!cameraActive && (
                                    <div className="flex items-center justify-center h-64 bg-slate-950 border-2 border-dashed border-slate-600">
                                        <div className="text-center text-slate-400">
                                            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Camera not active</p>
                                            <p className="text-xs opacity-75">Click "Start Camera" to begin</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Camera active overlays */}
                                {cameraActive && (
                                    <>
                                        <div className="absolute inset-0 border-2 border-dashed border-green-400 opacity-50 pointer-events-none" />
                                        
                                        {/* Status indicator */}
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 rounded text-green-400 text-xs font-mono">
                                            ● LIVE
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <canvas
                                ref={canvasRef}
                                className="hidden"
                                width={640}
                                height={480}
                            />
                            
                            <div className="flex gap-2 justify-center mt-3">
                                {!cameraActive ? (
                                    <Button
                                        onClick={startCamera}
                                        disabled={!selectedCustomerId || isVerifying}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Start Camera
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={captureAndVerify}
                                            disabled={isVerifying}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Camera className="mr-2 h-4 w-4" />
                                            Capture & Verify
                                        </Button>
                                        
                                        <Button
                                            onClick={stopCamera}
                                            variant="outline"
                                            className="bg-slate-950 border-slate-600 text-slate-300 hover:bg-slate-900"
                                        >
                                            Stop Camera
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {verificationResult && (
                        <div className={`p-4 rounded-lg border ${
                            verificationResult.status === "VERIFIED"
                                ? "bg-green-950 border-green-700"
                                : "bg-red-950 border-red-700"
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {verificationResult.status === "VERIFIED" ? (
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-400" />
                                )}
                                <span className={`font-semibold ${
                                    verificationResult.status === "VERIFIED" ? "text-green-400" : "text-red-400"
                                }`}>
                                    {verificationResult.status === "VERIFIED" ? "VERIFIED" : "NOT VERIFIED"}
                                </span>
                            </div>
                            <p className="text-slate-200 text-sm">{verificationResult.message}</p>
                            {verificationResult.similarity_score && (
                                <p className="text-slate-400 text-xs mt-1">
                                    Similarity: {(verificationResult.similarity_score * 100).toFixed(1)}%
                                </p>
                            )}
                        </div>
                    )}

                    {enrolledCustomers.length === 0 && (
                        <div className="p-4 rounded-lg border border-slate-900 bg-slate-950">
                            <p className="text-slate-400 text-sm text-center">
                                No customers with enrolled faces available for verification.
                                Please enroll customers and upload their face images first.
                            </p>
                        </div>
                    )}

                    {selectedCustomerId && !cameraActive && enrolledCustomers.length > 0 && (
                        <div className="p-3 bg-blue-950 border border-blue-700 rounded-md text-blue-300 text-sm text-center">
                            <Camera className="h-4 w-4 inline mr-1" />
                            Click "Start Camera" to begin live face verification
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Image Preview Modal */}
            {previewOpen && previewUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={closePreview}
                >
                    <div
                        className="relative bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-4 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-200 font-semibold text-sm flex items-center gap-2">
                                <Eye className="h-4 w-4 text-sky-400" />
                                Preview — {previewName}
                            </span>
                            <button
                                onClick={closePreview}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt={`Face image for ${previewName}`}
                            className="w-full rounded-lg object-contain max-h-80 border border-slate-800"
                        />
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Click outside or ✕ to close
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}