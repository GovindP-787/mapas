import { NextResponse } from "next/server"
import { recoverOperatorPassword } from "@/lib/operator-store"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      newPassword?: string
      clearanceCode?: string
    }

    const email = body.email?.trim()
    const newPassword = body.newPassword?.trim()
    const clearanceCode = body.clearanceCode?.trim()

    if (!email || !newPassword || !clearanceCode) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }

    const operator = await recoverOperatorPassword({
      email,
      newPassword,
      clearanceCode,
    })

    return NextResponse.json({ ok: true, operator }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR"

    if (message === "INVALID_CLEARANCE") {
      return NextResponse.json({ error: "Invalid clearance code." }, { status: 403 })
    }

    if (message === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ error: "No operator account found for this email." }, { status: 404 })
    }

    return NextResponse.json({ error: "Failed to recover password." }, { status: 500 })
  }
}
