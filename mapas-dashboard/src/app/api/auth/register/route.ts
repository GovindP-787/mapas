import { NextResponse } from "next/server"
import { registerOperator } from "@/lib/operator-store"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      email?: string
      password?: string
      clearanceCode?: string
    }

    const name = body.name?.trim()
    const email = body.email?.trim()
    const password = body.password?.trim()
    const clearanceCode = body.clearanceCode?.trim()

    if (!name || !email || !password || !clearanceCode) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }

    const operator = await registerOperator({ name, email, password, clearanceCode })
    return NextResponse.json({ ok: true, operator }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR"

    if (message === "INVALID_CLEARANCE") {
      return NextResponse.json({ error: "Invalid clearance code." }, { status: 403 })
    }

    if (message === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create account." }, { status: 500 })
  }
}
