import { auth } from "@/auth"
import { existsSync } from "fs"
import { execFileSync, spawn } from "child_process"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const defaultWindowsPaths = [
  "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\QGroundControl\\QGroundControl.lnk",
  "C:\\Program Files\\QGroundControl\\QGroundControl.exe",
  "C:\\Program Files (x86)\\QGroundControl\\QGroundControl.exe",
  "C:\\Users\\Public\\QGroundControl\\QGroundControl.exe",
]

function getCandidatePaths(): string[] {
  const customPath = process.env.QGROUNDCONTROL_PATH?.trim()
  return customPath ? [customPath, ...defaultWindowsPaths] : defaultWindowsPaths
}

function resolveExecutablePath(): string | null {
  for (const path of getCandidatePaths()) {
    if (existsSync(path)) {
      return path
    }
  }
  return null
}

function launchDetached(executablePath: string): void {
  // QGroundControl is a Qt application that actively calls foreground/focus native APIs on load.
  // We use cmd start /min to request minimized state, but the app itself may override it.
  const child = spawn("cmd.exe", ["/c", "start", "", "/min", executablePath], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  })

  child.unref()
}

function isQGroundControlRunning(): boolean {
  try {
    const output = execFileSync(
      "tasklist",
      ["/FI", "IMAGENAME eq QGroundControl.exe", "/FO", "CSV", "/NH"],
      { encoding: "utf8" }
    )

    return output.toLowerCase().includes("qgroundcontrol.exe")
  } catch {
    return false
  }
}

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (process.platform !== "win32") {
    return NextResponse.json(
      { error: "QGroundControl auto-launch is currently configured only for Windows." },
      { status: 400 }
    )
  }

  const executablePath = resolveExecutablePath()
  if (!executablePath) {
    return NextResponse.json(
      {
        error:
          "QGroundControl executable not found. Set QGROUNDCONTROL_PATH in your environment if installed in a custom location.",
      },
      { status: 404 }
    )
  }

  if (isQGroundControlRunning()) {
    return NextResponse.json({ ok: true, alreadyRunning: true })
  }

  try {
    launchDetached(executablePath)
    return NextResponse.json({ ok: true, path: executablePath })
  } catch {
    return NextResponse.json(
      { error: "Failed to launch QGroundControl process." },
      { status: 500 }
    )
  }
}