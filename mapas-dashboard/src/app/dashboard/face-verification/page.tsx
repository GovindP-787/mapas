"use client"

import { CustomerFaceEnrollment } from "@/components/CustomerFaceEnrollment"

export default function FaceVerificationPage() {
    return (
        <div className="h-full">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                    Face Verification System
                </h1>
                <p className="text-slate-400 mt-2">
                    Enroll customers and verify their identity through face recognition for secure food delivery operations.
                </p>
            </div>
            
            <CustomerFaceEnrollment />
        </div>
    )
}