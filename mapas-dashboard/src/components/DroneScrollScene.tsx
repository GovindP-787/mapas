"use client"

import { useRef, useEffect, useMemo, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, ContactShadows } from "@react-three/drei"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import * as THREE from "three"

gsap.registerPlugin(ScrollTrigger)

// ─── Module-level proxy: mutated by GSAP, read by useFrame every tick ────────
const PROXY = {
  droneX:     1.4,  // hero: center-right
  droneY:     0.2,  // hero: visible from frame 1
  droneZ:     0,
  rotX:       0,
  rotY:       -0.4,
  rotZ:       0,
  pkgY:       0,
  pkgOpacity: 0,
  fov:        50,
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────
const ARM_DATA: { pos: [number, number, number]; rotY: number }[] = [
  { pos: [ 0.46, 0, -0.46], rotY: -Math.PI / 4 },
  { pos: [-0.46, 0, -0.46], rotY:  Math.PI / 4 },
  { pos: [ 0.46, 0,  0.46], rotY:  Math.PI / 4 },
  { pos: [-0.46, 0,  0.46], rotY: -Math.PI / 4 },
]

const MOTOR_POS: [number, number, number][] = [
  [ 0.82, 0.06, -0.82],
  [-0.82, 0.06, -0.82],
  [ 0.82, 0.06,  0.82],
  [-0.82, 0.06,  0.82],
]

// ─── Propeller blade ──────────────────────────────────────────────────────────
function Blade({ angle }: { angle: number }) {
  return (
    <mesh rotation={[0, angle, 0.04]}>
      <boxGeometry args={[0.56, 0.014, 0.09]} />
      <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.85} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── Motor + always-spinning propeller ───────────────────────────────────────
function Motor({ pos, dir = 1 }: { pos: [number, number, number]; dir?: 1 | -1 }) {
  const spin = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    spin.current.rotation.y += dt * 30 * dir
  })
  return (
    <group position={pos}>
      <mesh>
        <cylinderGeometry args={[0.092, 0.082, 0.11, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.95} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.03, 8]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} />
      </mesh>
      <group ref={spin} position={[0, 0.09, 0]}>
        <Blade angle={0} />
        <Blade angle={Math.PI / 2} />
      </group>
    </group>
  )
}

// ─── Full drone model ─────────────────────────────────────────────────────────
function DroneModel() {
  const root    = useRef<THREE.Group>(null!)
  const pkgMesh = useRef<THREE.Mesh>(null!)
  const wireMesh= useRef<THREE.Mesh>(null!)
  const sensor  = useRef<THREE.Mesh>(null!)
  const clock   = useRef(0)

  const pkgMat  = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#0ea5e9", roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0,
  }), [])
  const wireMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#475569", transparent: true, opacity: 0,
  }), [])

  useFrame((_, dt) => {
    clock.current += dt
    const t = clock.current
    const p = PROXY

    root.current.position.set(
      p.droneX,
      p.droneY + Math.sin(t * 1.3) * 0.08,
      p.droneZ,
    )
    root.current.rotation.set(p.rotX, p.rotY + t * 0.12, p.rotZ)

    pkgMesh.current.position.y  = -0.58 + p.pkgY
    wireMesh.current.position.y = -0.38 + p.pkgY * 0.5
    pkgMat.opacity               = p.pkgOpacity
    wireMat.opacity              = p.pkgOpacity

    if (sensor.current) {
      const pulse = (Math.sin(t * 4) * 0.5 + 0.5) * 2 + 0.8
      ;(sensor.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse
    }
  })

  return (
    <group ref={root}>
      {/* Body frame */}
      <mesh castShadow>
        <boxGeometry args={[0.92, 0.16, 0.92]} />
        <meshStandardMaterial color="#0a1628" roughness={0.12} metalness={0.92} />
      </mesh>

      {/* Carbon top plate */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.7, 0.035, 0.7]} />
        <meshStandardMaterial color="#111827" roughness={0.05} metalness={0.98} />
      </mesh>

      {/* Jetson Orin housing */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.5, 0.09, 0.38]} />
        <meshStandardMaterial color="#0c1929" roughness={0.25} metalness={0.6} />
      </mesh>

      {/* Cyan LED strip */}
      <mesh position={[0, 0.198, -0.1]}>
        <boxGeometry args={[0.18, 0.008, 0.06]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={8} />
      </mesh>

      {/* Vent grilles */}
      {[-0.14, -0.07, 0, 0.07, 0.14].map((z, i) => (
        <mesh key={i} position={[0, 0.19, z]}>
          <boxGeometry args={[0.38, 0.004, 0.009]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
      ))}

      {/* Camera gimbal housing */}
      <mesh position={[0, -0.02, -0.52]}>
        <boxGeometry args={[0.24, 0.18, 0.16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.15} metalness={0.85} />
      </mesh>

      {/* Lens ring */}
      <mesh position={[0, -0.02, -0.61]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.065, 0.012, 12, 24]} />
        <meshStandardMaterial color="#334155" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Pulsing sensor lens */}
      <mesh ref={sensor} position={[0, -0.02, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.048, 24]} />
        <meshStandardMaterial
          color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2}
          roughness={0.05} transparent opacity={0.9}
        />
      </mesh>

      {/* Arms */}
      {ARM_DATA.map(({ pos, rotY }, i) => (
        <mesh key={i} position={pos} rotation={[0, rotY, 0]} castShadow>
          <boxGeometry args={[0.065, 0.055, 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.9} />
        </mesh>
      ))}

      {/* Motors + propellers */}
      {MOTOR_POS.map((pos, i) => (
        <Motor key={i} pos={pos} dir={i % 2 === 0 ? 1 : -1} />
      ))}

      {/* Status LEDs */}
      {([
        [[ 0.06, 0.08, -0.41], "#f97316"],
        [[-0.06, 0.08, -0.41], "#22c55e"],
        [[ 0,    0.08,  0.42], "#ef4444"],
        [[ 0,    0.22,  0   ], "#fb923c"],
      ] as [[number, number, number], string][]).map(([p, c], i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={10} />
        </mesh>
      ))}

      {/* Landing gear legs */}
      {([[-0.38, 0.38], [0.38, 0.38], [-0.38, -0.38], [0.38, -0.38]] as [number,number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, -0.2, z]}>
          <cylinderGeometry args={[0.013, 0.013, 0.28, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.8} />
        </mesh>
      ))}

      {/* Skid bars */}
      {([-0.38, 0.38] as number[]).map((z, i) => (
        <mesh key={i} position={[0, -0.34, z]}>
          <boxGeometry args={[0.82, 0.013, 0.038]} />
          <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.8} />
        </mesh>
      ))}

      {/* Tether wire */}
      <mesh ref={wireMesh} position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.24, 6]} />
        <primitive object={wireMat} attach="material" />
      </mesh>

      {/* Delivery package */}
      <mesh ref={pkgMesh} position={[0, -0.58, 0]}>
        <boxGeometry args={[0.3, 0.24, 0.3]} />
        <primitive object={pkgMat} attach="material" />
      </mesh>
    </group>
  )
}

// ─── Camera FOV lerp ──────────────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree()
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (Math.abs(cam.fov - PROXY.fov) > 0.01) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, PROXY.fov, 0.06)
      cam.updateProjectionMatrix()
    }
  })
  return null
}

// ─── Lighting ─────────────────────────────────────────────────────────────────
function Lights() {
  const rescueRef = useRef<THREE.PointLight>(null!)
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt
    if (rescueRef.current)
      rescueRef.current.intensity = 4 + Math.sin(t.current * 3) * 1.2
  })
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[3,  5,  4]}  color="#38bdf8" intensity={14} castShadow />
      <pointLight position={[-5, 1,  3]}  color="#f97316" intensity={6}  />
      <pointLight position={[0, -2, -3]}  color="#7c3aed" intensity={4}  />
      <pointLight ref={rescueRef} position={[0, -4, 2]} color="#fb923c" intensity={4} />
    </>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function DroneScrollScene() {
  useEffect(() => {
    // Hard-reset proxy every mount — drone starts visible in hero
    Object.assign(PROXY, {
      droneX: 1.4, droneY: 0.2, droneZ: 0,
      rotX: 0, rotY: -0.4, rotZ: 0,
      pkgY: 0, pkgOpacity: 0, fov: 50,
    })

    const triggers: ScrollTrigger[] = []

    // ── MAS section: explicit fromTo keeps start/end values always connected
    const masTL = gsap.timeline()
    masTL.fromTo(PROXY,
      { rotX: 0,        droneX:  1.4, droneY: 0.2, rotY: -0.4 },
      { rotX: Math.PI,  droneX: -1.4, droneY: 0.4, rotY: Math.PI - 0.4, ease: "power2.inOut", duration: 1 }
    )
    triggers.push(
      ScrollTrigger.create({
        trigger:   "#mas",
        start:     "top 80%",
        end:       "bottom 20%",
        scrub:     1.5,
        animation: masTL,
      })
    )

    // ── Delivery: starts where MAS ends
    const deliveryTL = gsap.timeline()
    deliveryTL
      .fromTo(PROXY,
        { rotX: Math.PI,  droneX: -1.4, rotY: Math.PI - 0.4, pkgOpacity: 0, pkgY: 0 },
        { rotX: -0.3,     droneX:  0,   rotY: -0.4,           ease: "power2.inOut", duration: 0.5 }
      )
      .fromTo(PROXY,
        { pkgOpacity: 0, pkgY: 0 },
        { pkgOpacity: 1, pkgY: -0.7, ease: "power1.inOut", duration: 0.5 }
      )
    triggers.push(
      ScrollTrigger.create({
        trigger:   "#section-delivery",
        start:     "top 80%",
        end:       "bottom 20%",
        scrub:     1.5,
        animation: deliveryTL,
      })
    )

    // ── Rescue: starts where delivery ends
    const rescueTL = gsap.timeline()
    rescueTL.fromTo(PROXY,
      { rotX: -0.3, rotY: -0.4, droneX: 0, droneZ: 0, pkgOpacity: 1, fov: 50 },
      { rotX:  0.1, rotY:  0,   droneX: 0, droneZ: 2.8, pkgOpacity: 0, fov: 28, ease: "power2.inOut", duration: 1 }
    )
    triggers.push(
      ScrollTrigger.create({
        trigger:   "#section-rescue",
        start:     "top 80%",
        end:       "bottom 20%",
        scrub:     1.5,
        animation: rescueTL,
      })
    )

    return () => {
      triggers.forEach(tr => tr.kill())
    }
  }, [])

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 1, 6], fov: 50, near: 0.1, far: 200 }}
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,                           // transparent canvas
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 2.2,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)          // fully transparent clear
        }}
        style={{ background: "transparent" }}
      >
        <CameraRig />
        <Lights />

        <DroneModel />

        {/* Contact shadow for grounding */}
        <ContactShadows
          position={[0, -2.0, 0]}
          opacity={0.45}
          scale={6}
          blur={2.8}
          far={4}
          color="#0ea5e9"
        />

        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
