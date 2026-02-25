"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plane, Lock, Mail, User, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AuthForms() {
    // TRUE = Login Mode
    // FALSE = Signup Mode
    const [isLogin, setIsLogin] = React.useState(true)
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        toast.success("Authentication Successful", {
            description: isLogin
                ? "Welcome back, Commander."
                : "Account created. Awaiting clearance.",
        })

        setTimeout(() => {
            router.push("/dashboard")
        }, 800)
    }

    return (
        <div className="
      relative
      w-full
      max-w-screen-2xl
      h-[760px]
      bg-slate-950
      rounded-2xl
      shadow-2xl
      overflow-hidden
      border border-slate-950
    ">

            {/* ---------------- LOGIN FORM (LEFT / 60%) ---------------- */}
            <div className={cn(
                "absolute top-0 left-0 w-full md:w-[60%] h-full flex items-center justify-center p-10 md:p-14 transition-all duration-700 bg-slate-950 z-10",
                isLogin ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-sky-400">
                            Welcome Back
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Enter your credentials to access mission control.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Email</Label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    required
                                    placeholder="pilot@mapas.com"
                                    className="pl-9 bg-slate-950 border-slate-950"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Password</Label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9 bg-slate-950 border-slate-950"
                                />
                            </div>
                        </div>
                    </div>

                    <Button className="w-full bg-sky-600 hover:bg-sky-500 font-semibold">
                        Sign In
                    </Button>

                    <div className="md:hidden pt-4 border-t border-slate-950 text-center">
                        <p className="text-sm text-slate-400 mb-2">New here?</p>
                        <Button
                            variant="outline"
                            onClick={() => setIsLogin(false)}
                            className="w-full"
                        >
                            Create Account
                        </Button>
                    </div>
                </form>
            </div>

            {/* ---------------- SIGNUP FORM (RIGHT / 60%) ---------------- */}
            <div className={cn(
                "absolute top-0 right-0 w-full md:w-[60%] h-full flex items-center justify-center p-10 md:p-14 transition-all duration-700 bg-slate-950 z-10",
                !isLogin ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-emerald-400">
                            Initialize Account
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Register a new operator ID for the MAPAS system.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <div className="relative mt-1">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    required
                                    placeholder="John Doe"
                                    className="pl-9 bg-slate-950 border-slate-950"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Email</Label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    required
                                    placeholder="operator@mapas.com"
                                    className="pl-9 bg-slate-950 border-slate-950"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Clearance Code</Label>
                            <div className="relative mt-1">
                                <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    required
                                    type="password"
                                    placeholder="SECRET-KEY"
                                    className="pl-9 bg-slate-950 border-slate-950"
                                />
                            </div>
                        </div>
                    </div>

                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold">
                        Create Account
                    </Button>

                    <div className="md:hidden pt-4 border-t border-slate-950 text-center">
                        <p className="text-sm text-slate-400 mb-2">
                            Already have an account?
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setIsLogin(true)}
                            className="w-full"
                        >
                            Sign In
                        </Button>
                    </div>
                </form>
            </div>

            {/* ---------------- SLIDING OVERLAY (40%) ---------------- */}
            <div className={cn(
                "hidden md:block absolute top-0 left-0 w-[40%] h-full z-20 transition-transform duration-700 ease-in-out overflow-hidden shadow-2xl",
                isLogin ? "translate-x-[150%]" : "translate-x-0"
            )}>
                <div className="relative w-full h-full bg-slate-1000">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-black" />
                    <div className="absolute inset-0 bg-sky-900/20" />

                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-12 text-slate-100">

                        {/* Overlay → Signup */}
                        <div className={cn(
                            "absolute flex flex-col items-center gap-6 transition-all duration-700",
                            isLogin ? "opacity-100 translate-x-0" : "opacity-0 translate-x-16 pointer-events-none"
                        )}>
                            <Plane size={44} className="text-emerald-400" />
                            <h3 className="text-3xl font-bold">New Operator?</h3>
                            <p className="text-slate-300 max-w-xs">
                                Join the MAPAS autonomous fleet network.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsLogin(false)}
                                className="border-emerald-400 text-emerald-300 hover:bg-emerald-500/20"
                            >
                                Request Access
                            </Button>
                        </div>

                        {/* Overlay → Login */}
                        <div className={cn(
                            "absolute flex flex-col items-center gap-6 transition-all duration-700",
                            !isLogin ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-16 pointer-events-none"
                        )}>
                            <Lock size={44} className="text-sky-400" />
                            <h3 className="text-3xl font-bold">Already Active?</h3>
                            <p className="text-slate-300 max-w-xs">
                                Authenticate with your existing credentials.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsLogin(true)}
                                className="border-sky-400 text-sky-300 hover:bg-sky-500/20"
                            >
                                Authenticate
                            </Button>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    )
}
