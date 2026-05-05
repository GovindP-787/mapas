"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plane, Lock, Mail, User, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export function AuthForms() {
    // TRUE = Login Mode
    // FALSE = Signup Mode
    const [isLogin, setIsLogin] = React.useState(true)
    const [isRecovering, setIsRecovering] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    const launchQGroundControl = React.useCallback(async () => {
        try {
            await fetch("/api/system/launch-qgroundcontrol", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })
        } catch {
            // Avoid blocking authentication flow if local app launch is unavailable.
        }
    }, [])

    const refocusBrowserWindow = React.useCallback(() => {
        // Refocus shortly after launch attempt in case native app steals focus.
        requestAnimationFrame(() => window.focus())
        setTimeout(() => window.focus(), 120)
        setTimeout(() => window.focus(), 300)
    }, [])

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const form = new FormData(e.currentTarget)
            const result = await signIn("credentials", {
                email: form.get("email") as string,
                password: form.get("password") as string,
                redirect: false,
                callbackUrl: "/dashboard",
            })

            if (!result || result.error) {
                toast.error("Access Denied", { description: "Invalid credentials." })
                return
            }

            toast.success("Authentication Successful", { description: "Welcome back." })
            router.replace(result.url ?? "/dashboard")
            router.refresh()
        } catch {
            toast.error("Authentication Error", { description: "Could not sign in. Please try again." })
        } finally {
            setLoading(false)
        }
    }

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            const form = new FormData(e.currentTarget)
            const payload = {
                name: String(form.get("name") ?? ""),
                email: String(form.get("email") ?? ""),
                password: String(form.get("password") ?? ""),
                clearanceCode: String(form.get("clearanceCode") ?? ""),
            }

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            const data = (await response.json()) as { error?: string }
            if (!response.ok) {
                toast.error("Signup Failed", {
                    description: data.error ?? "Unable to create account.",
                })
                return
            }

            const loginResult = await signIn("credentials", {
                email: payload.email,
                password: payload.password,
                redirect: false,
                callbackUrl: "/dashboard",
            })

            if (!loginResult || loginResult.error) {
                toast.success("Account Created", {
                    description: "Sign in using your new credentials.",
                })
                setIsLogin(true)
                return
            }

            toast.success("Account Created", {
                description: "Your operator account is active.",
            })
            router.replace(loginResult.url ?? "/dashboard")
            router.refresh()
        } catch {
            toast.error("Signup Error", {
                description: "Could not create account. Please try again.",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            const form = new FormData(e.currentTarget)
            const email = String(form.get("email") ?? "")
            const clearanceCode = String(form.get("clearanceCode") ?? "")
            const newPassword = String(form.get("newPassword") ?? "")
            const confirmPassword = String(form.get("confirmPassword") ?? "")

            if (newPassword !== confirmPassword) {
                toast.error("Password mismatch", {
                    description: "New password and confirmation do not match.",
                })
                return
            }

            const response = await fetch("/api/auth/recover", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    clearanceCode,
                    newPassword,
                }),
            })

            const data = (await response.json()) as { error?: string }
            if (!response.ok) {
                toast.error("Recovery failed", {
                    description: data.error ?? "Unable to reset password.",
                })
                return
            }

            toast.success("Password updated", {
                description: "Sign in with your new password.",
            })
            setIsRecovering(false)
        } catch {
            toast.error("Recovery error", {
                description: "Could not reset password. Please try again.",
            })
        } finally {
            setLoading(false)
        }
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
                <form onSubmit={isRecovering ? handleRecovery : handleLogin} className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-sky-400">
                            {isRecovering ? "Password Recovery" : "Welcome Back"}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {isRecovering
                                ? "Reset an operator password using clearance code."
                                : "Enter your credentials to access mission control."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Email</Label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    required
                                    name="email"
                                    type="email"
                                    placeholder="pilot@mapas.com"
                                    className="pl-9 bg-slate-950 border-slate-950"
                                />
                            </div>
                        </div>

                        {isRecovering ? (
                            <>
                                <div>
                                    <Label>Clearance Code</Label>
                                    <div className="relative mt-1">
                                        <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input
                                            required
                                            name="clearanceCode"
                                            type="password"
                                            placeholder="SECRET-KEY"
                                            className="pl-9 bg-slate-950 border-slate-950"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>New Password</Label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input
                                            required
                                            name="newPassword"
                                            type="password"
                                            minLength={6}
                                            placeholder="Create a new password"
                                            className="pl-9 bg-slate-950 border-slate-950"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Confirm New Password</Label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input
                                            required
                                            name="confirmPassword"
                                            type="password"
                                            minLength={6}
                                            placeholder="Re-enter new password"
                                            className="pl-9 bg-slate-950 border-slate-950"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <Label>Password</Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        required
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-9 bg-slate-950 border-slate-950"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-500 font-semibold">
                        {loading ? (isRecovering ? "Updating Password..." : "Authenticating...") : (isRecovering ? "Reset Password" : "Sign In")}
                    </Button>

                    <div className="text-center">
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => setIsRecovering((value) => !value)}
                            className="text-sky-400 hover:text-sky-300"
                        >
                            {isRecovering ? "Back to Sign In" : "Forgot password?"}
                        </Button>
                    </div>

                    <div className="md:hidden pt-4 border-t border-slate-950 text-center">
                        <p className="text-sm text-slate-400 mb-2">New here?</p>
                        <Button
                            type="button"
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
                <form onSubmit={handleSignup} className="w-full max-w-md space-y-6">
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
                                    name="name"
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
                                    name="email"
                                    type="email"
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
                                    name="clearanceCode"
                                    type="password"
                                    placeholder="SECRET-KEY"
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
                                    name="password"
                                    type="password"
                                    placeholder="Create a secure password"
                                    className="pl-9 bg-slate-950 border-slate-950"
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold">
                        {loading ? "Creating Account..." : "Create Account"}
                    </Button>

                    <div className="md:hidden pt-4 border-t border-slate-950 text-center">
                        <p className="text-sm text-slate-400 mb-2">
                            Already have an account?
                        </p>
                        <Button
                            type="button"
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
                                type="button"
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
                                type="button"
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
