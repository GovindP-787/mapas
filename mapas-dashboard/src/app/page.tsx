"use client"

import { useEffect, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import Link from "next/link"
import { Orbitron, Exo_2, Share_Tech_Mono } from "next/font/google"
import dynamic from "next/dynamic"

const DroneScrollScene = dynamic(() => import("@/components/DroneScrollScene"), { ssr: false })

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
})
const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo2",
})
const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech",
})

gsap.registerPlugin(ScrollTrigger)

// --------------------------------------------------------------------------
// Inline SVG assets
// --------------------------------------------------------------------------

function DroneMothershipSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="80" y1="60" x2="30" y2="30" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      <line x1="160" y1="60" x2="210" y2="30" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="60" x2="30" y2="90" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      <line x1="160" y1="60" x2="210" y2="90" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="30" cy="30" rx="20" ry="5" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
      <ellipse cx="210" cy="30" rx="20" ry="5" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
      <ellipse cx="30" cy="90" rx="20" ry="5" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
      <ellipse cx="210" cy="90" rx="20" ry="5" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
      <rect x="75" y="45" width="90" height="30" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="120" cy="65" r="8" fill="#0ea5e9" opacity="0.8" />
      <circle cx="120" cy="65" r="4" fill="#38bdf8" />
      <circle cx="80" cy="58" r="3" fill="#f97316" />
      <circle cx="160" cy="58" r="3" fill="#22c55e" />
      <rect x="100" y="48" width="40" height="8" rx="2" fill="#7c3aed" opacity="0.6" />
      <text x="120" y="55" textAnchor="middle" fontSize="5" fill="white" fontFamily="monospace">JETSON</text>
    </svg>
  )
}

function FPVDroneSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="60" y1="40" x2="20" y2="20" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="100" y1="40" x2="140" y2="20" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="40" x2="20" y2="60" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="100" y1="40" x2="140" y2="60" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="20" cy="20" rx="15" ry="4" stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
      <ellipse cx="140" cy="20" rx="15" ry="4" stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
      <ellipse cx="20" cy="60" rx="15" ry="4" stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
      <ellipse cx="140" cy="60" rx="15" ry="4" stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
      <rect x="52" y="30" width="56" height="20" rx="6" fill="#1a0a00" stroke="#f97316" strokeWidth="1.5" />
      <rect x="62" y="34" width="14" height="12" rx="2" fill="#f97316" opacity="0.9" />
      <circle cx="69" cy="40" r="4" fill="#1a0a00" />
      <circle cx="69" cy="40" r="2" fill="#f97316" />
      <line x1="95" y1="30" x2="98" y2="20" stroke="#f97316" strokeWidth="1.5" />
      <circle cx="98" cy="19" r="2" fill="#f97316" />
    </svg>
  )
}

function ParcelSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="30" width="60" height="40" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
      <line x1="40" y1="30" x2="40" y2="70" stroke="#38bdf8" strokeWidth="1.5" opacity="0.5" />
      <line x1="10" y1="50" x2="70" y2="50" stroke="#38bdf8" strokeWidth="1.5" opacity="0.5" />
      <rect x="25" y="15" width="30" height="18" rx="3" fill="#0ea5e9" opacity="0.3" stroke="#38bdf8" strokeWidth="1.5" />
      <path d="M35 15 Q40 8 45 15" stroke="#38bdf8" strokeWidth="2" fill="none" />
      <text x="40" y="54" textAnchor="middle" fontSize="7" fill="#38bdf8" fontFamily="monospace">MAPAS</text>
      <text x="40" y="63" textAnchor="middle" fontSize="5" fill="#64748b" fontFamily="monospace">DELIVERY</text>
    </svg>
  )
}

function RadarSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#0ea5e9" strokeWidth="1" opacity="0.3" />
      <circle cx="100" cy="100" r="60" stroke="#0ea5e9" strokeWidth="1" opacity="0.3" />
      <circle cx="100" cy="100" r="30" stroke="#0ea5e9" strokeWidth="1" opacity="0.3" />
      <line x1="100" y1="10" x2="100" y2="190" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.2" />
      <line x1="10" y1="100" x2="190" y2="100" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.2" />
      <line x1="37" y1="37" x2="163" y2="163" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.2" />
      <line x1="163" y1="37" x2="37" y2="163" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.2" />
      <line x1="100" y1="100" x2="100" y2="12" stroke="#22d3ee" strokeWidth="2" opacity="0.9" />
      <circle cx="140" cy="75" r="4" fill="#f97316" opacity="0.9" className="radar-blip" />
      <circle cx="140" cy="75" r="8" fill="#f97316" opacity="0.3" className="radar-blip" />
    </svg>
  )
}

// --------------------------------------------------------------------------
// Main Landing Page
// --------------------------------------------------------------------------

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    lenis.on("scroll", ScrollTrigger.update)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
    }
  }, [])

  useGSAP(
    () => {
      // ── Hero ──────────────────────────────────────────────────
      gsap.fromTo(".hero-title",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.2 }
      )
      gsap.fromTo(".hero-sub",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.7 }
      )
      gsap.fromTo(".hero-cta",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 1.1 }
      )
      // ── MAS Section ───────────────────────────────────────────
      gsap.fromTo(".mas-text",
        { x: -80, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: ".mas-section", start: "top 70%", toggleActions: "play none none reverse" } }
      )
      gsap.fromTo(".mas-drone",
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: "back.out(1.4)", scrollTrigger: { trigger: ".mas-section", start: "top 65%", toggleActions: "play none none reverse" } }
      )
      gsap.fromTo(".mas-badge",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, scrollTrigger: { trigger: ".mas-section", start: "top 55%", toggleActions: "play none none reverse" } }
      )

      // ── PAS Section ───────────────────────────────────────────
      gsap.fromTo(".pas-left",
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".pas-section", start: "top 70%", toggleActions: "play none none reverse" } }
      )
      gsap.fromTo(".pas-right",
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".pas-section", start: "top 70%", toggleActions: "play none none reverse" } }
      )
      gsap.fromTo(".pas-fpv",
        { y: -30, opacity: 0, scale: 0.7 },
        { y: 0, opacity: 1, scale: 1, duration: 1.3, ease: "back.out(1.7)", scrollTrigger: { trigger: ".pas-section", start: "top 55%", toggleActions: "play none none reverse" } }
      )
      gsap.to(".pas-fpv", { y: -12, duration: 2, ease: "sine.inOut", yoyo: true, repeat: -1 })

      // ── Delivery Section ──────────────────────────────────────
      gsap.fromTo(".delivery-text",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: ".delivery-section", start: "top 70%", toggleActions: "play none none reverse" } }
      )
      gsap.fromTo(".delivery-parcel",
        { y: -150, opacity: 0, rotation: -15 },
        { y: 0, opacity: 1, rotation: 0, duration: 1.4, ease: "bounce.out", scrollTrigger: { trigger: ".delivery-section", start: "top 60%", toggleActions: "play none none reverse" } }
      )
      gsap.fromTo(".delivery-step",
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, stagger: 0.2, scrollTrigger: { trigger: ".delivery-section", start: "top 50%", toggleActions: "play none none reverse" } }
      )

      // ── Drowning Detection Section ────────────────────────────
      gsap.fromTo(".radar-section-text",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: ".radar-section", start: "top 70%", toggleActions: "play none none reverse" } }
      )
      gsap.to(".radar-container", {
        rotation: 360, duration: 4, ease: "none", repeat: -1, transformOrigin: "center center",
      })
    },
    { scope: containerRef }
  )

  return (
    <div
      ref={containerRef}
      className={`${orbitron.variable} ${exo2.variable} ${shareTechMono.variable} landing-page bg-black text-slate-100 overflow-x-hidden`}
    >
      {/* Fixed 3D drone background — scrolls with the page via GSAP */}
      <DroneScrollScene />
      <style>{`
        .landing-page {
          font-family: var(--font-exo2), sans-serif;
        }
        .landing-page h1,
        .landing-page h2 {
          font-family: var(--font-orbitron), sans-serif;
          letter-spacing: 0.02em;
        }
        .landing-page .font-mono,
        .landing-page [class*="tracking-widest"],
        .landing-page [class*="font-mono"] {
          font-family: var(--font-share-tech), monospace;
        }
        .landing-page .tracking-widest {
          font-family: var(--font-share-tech), monospace;
        }
      `}</style>

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/30 backdrop-blur-md border-b border-white/5">
        <span className="text-xl font-bold tracking-widest text-slate-100 uppercase">
          MAP<span className="text-sky-400">AS</span>
        </span>
        <nav className="flex items-center gap-3">
          <a href="#contact" className="text-sm text-slate-400 hover:text-slate-100 transition-colors px-4 py-1.5">
            Contact Us
          </a>
          <Link href="/login" className="text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-black px-5 py-2 rounded-md transition-colors">
            Login
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />

        <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6 max-w-4xl">
          The Future of{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            Autonomous
          </span>{" "}
          Rescue.
        </h1>
        <p className="hero-sub text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          MAPAS deploys intelligent drone systems for verified delivery, public safety broadcasts,
          and real-time drowning detection — all from a single command platform.
        </p>
        <div className="hero-cta flex flex-wrap gap-4 justify-center">
          <Link href="/login" className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-md transition-all hover:scale-105 text-sm">
            Access Mission Control
          </Link>
          <a href="#mas" className="px-8 py-3 border border-slate-700 hover:border-sky-500 text-slate-300 hover:text-sky-400 font-medium rounded-md transition-all text-sm">
            Explore the Fleet ↓
          </a>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs font-mono tracking-widest text-slate-500">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-slate-500 to-transparent" />
        </div>
      </section>

      {/* MAS SECTION */}
      <section id="mas" className="mas-section relative min-h-screen flex flex-col md:flex-row items-center justify-center gap-16 px-8 md:px-20 py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-black" />
        <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="mas-text relative z-10 max-w-lg space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-sky-400 tracking-[0.3em] uppercase border border-sky-500/30 px-3 py-1 rounded-full">
              DR-ALPHA-01
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight">
            Mothership<br />
            <span className="text-sky-400">Autonomous</span><br />
            System
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Powered by the <span className="text-slate-200 font-semibold">NVIDIA Jetson Nano Orin</span>,
            MAS is the heavy-lift command centre of every mission. It carries the PAS drone to site,
            authenticates recipients via Face ID, and broadcasts voice announcements from the sky.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["The Carrier", "Transports PAS drone to site"],
              ["The Guardian", "Face ID verified delivery"],
              ["The Voice", "Aerial PA announcements"],
              ["The Workhorse", "High-payload operations"],
            ].map(([title, desc]) => (
              <div key={title} className="mas-badge bg-slate-900 border border-slate-800 rounded-lg p-3">
                <p className="text-sky-400 text-xs font-semibold mb-1">{title}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mas-drone relative z-10 flex-shrink-0">
          <div className="absolute inset-0 bg-sky-400/10 rounded-full blur-3xl" />
          <DroneMothershipSVG className="w-64 md:w-96 drop-shadow-[0_0_40px_rgba(56,189,248,0.4)]" />
          <div className="absolute inset-[-20px] border border-sky-500/10 rounded-full animate-spin" style={{ animationDuration: "12s" }} />
          <div className="absolute inset-[-50px] border border-sky-500/5 rounded-full animate-spin" style={{ animationDuration: "20s", animationDirection: "reverse" }} />
        </div>
      </section>

      {/* PAS SECTION */}
      <section className="pas-section relative min-h-screen flex flex-col md:flex-row items-stretch overflow-hidden">
        <div className="pas-left relative flex-1 flex flex-col items-center justify-center px-10 py-32 bg-gradient-to-br from-orange-950/30 to-black">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f9731605_1px,transparent_1px),linear-gradient(to_bottom,#f9731605_1px,transparent_1px)] bg-[size:30px_30px]" />
          <div className="relative z-10 max-w-sm space-y-6">
            <span className="text-xs font-mono text-orange-400 tracking-[0.3em] border border-orange-500/30 px-3 py-1 rounded-full">
              DR-BETA-04
            </span>
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              Piloted<br />
              <span className="text-orange-400">Aircraft</span><br />
              System
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              The agile FPV scout docked inside MAS. Stays powered off during transit to preserve{" "}
              <span className="text-slate-200 font-semibold">100% battery</span> for the critical
              last-mile mission into disaster zones, collapsed buildings, and tight spaces.
            </p>
            {[
              ["The Scout", "Launches from MAS at altitude"],
              ["The Life-Finder", "Manually piloted for SAR ops"],
              ["The Power Saver", "Docked & charged in-flight"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                <div>
                  <p className="text-orange-400 text-sm font-semibold">{title}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-orange-500/30 to-transparent" />

        <div className="pas-right relative flex-1 flex flex-col items-center justify-center px-10 py-32 bg-gradient-to-bl from-black to-orange-950/20">
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="relative">
              <DroneMothershipSVG className="w-56 opacity-40" />
              <div className="pas-fpv absolute -bottom-20 left-1/2 -translate-x-1/2">
                <FPVDroneSVG className="w-44 drop-shadow-[0_0_25px_rgba(249,115,22,0.6)]" />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="text-xs font-mono text-orange-400 opacity-70">DEPLOY</div>
                  <div className="w-px h-4 bg-orange-400 opacity-50" />
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-orange-400 opacity-50" />
                </div>
              </div>
            </div>
            <p className="text-xs font-mono text-orange-400/60 tracking-widest text-center mt-24">
              MAX SPEED 120 KM/H · &lt;20ms LATENCY
            </p>
          </div>
        </div>
      </section>

      {/* DELIVERY SECTION */}
      <section id="section-delivery" className="delivery-section relative min-h-screen flex flex-col md:flex-row items-center justify-center gap-20 px-8 md:px-20 py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-cyan-950/10 to-black" />
        <div className="absolute left-1/4 top-1/2 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="delivery-parcel relative z-10 flex-shrink-0">
          <div className="absolute inset-0 bg-sky-400/10 rounded-full blur-3xl" />
          <ParcelSVG className="w-48 md:w-64 drop-shadow-[0_0_30px_rgba(14,165,233,0.5)]" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <div className="w-px h-14 bg-gradient-to-b from-sky-400/60 to-transparent" />
            <div className="text-[10px] font-mono text-sky-400/60 tracking-widest">DROP</div>
          </div>
        </div>

        <div className="delivery-text relative z-10 max-w-lg space-y-6">
          <span className="text-xs font-mono text-cyan-400 tracking-[0.3em] border border-cyan-500/30 px-3 py-1 rounded-full">
            MISSION TYPE: DELIVERY
          </span>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Verified.<br />
            <span className="text-sky-400">Autonomous.</span><br />
            Delivered.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            MAS uses real-time <span className="text-slate-200">InsightFace recognition</span> to
            authenticate the recipient before releasing medical supplies or food packages. No
            verification, no release — zero-compromise delivery security.
          </p>
          <div className="space-y-3">
            {[
              ["01", "Drone arrives at GPS-locked delivery point"],
              ["02", "Camera activates — recipient scanned in &lt;1s"],
              ["03", "Face matched against enrolled customer DB"],
              ["04", "Payload bay unlocks — package released"],
            ].map(([num, step]) => (
              <div key={num} className="delivery-step flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-3">
                <span className="text-sky-400 font-black font-mono text-lg w-8">{num}</span>
                <p className="text-slate-300 text-sm" dangerouslySetInnerHTML={{ __html: step }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DROWNING DETECTION SECTION */}
      <section id="section-rescue" className="radar-section relative min-h-screen flex flex-col md:flex-row items-center justify-center gap-20 px-8 md:px-20 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950/30 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12)_0%,transparent_70%)]" />
        <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0,100 C240,160 480,40 720,100 C960,160 1200,40 1440,100 L1440,200 L0,200 Z" fill="#0ea5e9" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-full opacity-5" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ transform: "scaleX(-1)" }}>
          <path d="M0,100 C240,160 480,40 720,100 C960,160 1200,40 1440,100 L1440,200 L0,200 Z" fill="#38bdf8" />
        </svg>

        <div className="relative z-10 flex-shrink-0">
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl scale-150" />
          <div className="radar-container">
            <RadarSVG className="w-56 md:w-80 drop-shadow-[0_0_40px_rgba(14,165,233,0.4)]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full border border-cyan-400/20 animate-ping" />
          </div>
        </div>

        <div className="radar-section-text relative z-10 max-w-lg space-y-6">
          <span className="text-xs font-mono text-blue-400 tracking-[0.3em] border border-blue-500/30 px-3 py-1 rounded-full">
            AI VISION · YOLO11
          </span>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Spot the<br />
            <span className="text-cyan-400">Unseen.</span><br />
            Save Lives.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            MAS carries a <span className="text-slate-200">YOLO11-powered drowning detection model</span> that
            continuously scans water bodies. Once a distress pattern is detected, PAS is deployed
            for close-range confirmation while MAS coordinates emergency response.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Real-time scanning", "30 fps continuous detection"],
              ["YOLO11 model", "Trained on water distress data"],
              ["< 2s alert time", "From detect to emergency signal"],
              ["Night capable", "IR + thermal assisted vision"],
            ].map(([title, desc]) => (
              <div key={title} className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-3">
                <p className="text-cyan-400 text-xs font-semibold mb-1">{title}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section id="contact" className="relative py-32 px-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-sky-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-black">
            Ready to Deploy<br />
            <span className="text-sky-400">Mission Control?</span>
          </h2>
          <p className="text-slate-400">
            Access the MAPAS dashboard to monitor your drone fleet, manage deliveries,
            broadcast announcements, and respond to emergencies in real time.
          </p>
          <Link href="/login" className="inline-block px-10 py-4 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-md transition-all hover:scale-105 text-base">
            Launch Mission Control →
          </Link>
        </div>

        {/* ── Team ─────────────────────────────────────────────────────── */}
        <div className="relative z-10 mt-20 max-w-3xl mx-auto">
          <p className="text-xs font-mono text-sky-500 tracking-[0.3em] uppercase mb-8">— Contact the Team —</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Edwin Baiju",  email: "edwinbaiju@mapas.dev"  },
              { name: "George Siby",  email: "georgesiby@mapas.dev"  },
              { name: "Govind P",     email: "govindp@mapas.dev"     },
              { name: "Ron Thomas",   email: "ronthomas@mapas.dev"   },
            ].map(({ name, email }) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="group flex flex-col gap-3 p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-sky-400 transition-colors leading-tight">
                    {name}
                  </p>
                  <p className="text-xs font-mono text-slate-500 group-hover:text-sky-500 transition-colors mt-1 break-all">
                    {email}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-16 pt-8 border-t border-slate-900 text-xs text-slate-600 font-mono">
          MAPAS · MOTHERSHIP AUTONOMOUS SYSTEM · {new Date().getFullYear()}
        </div>
      </section>

    </div>
  )
}
