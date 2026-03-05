"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Stars } from "@react-three/drei"
import * as THREE from "three"

// ─────────────────────────────────────────────────────────────
// Propeller pair — two crossed blades that spin around Y axis
// ─────────────────────────────────────────────────────────────
function Propeller({ direction = 1 }: { direction?: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * direction * 20
  })

  const bladeMat = (
    <meshStandardMaterial
      color="#7dd3fc"
      emissive="#38bdf8"
      emissiveIntensity={0.7}
      metalness={0.95}
      roughness={0.05}
      transparent
      opacity={0.88}
    />
  )

  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.54, 0.017, 0.07]} />
        {bladeMat}
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.54, 0.017, 0.07]} />
        {bladeMat}
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// One arm + motor housing + propeller
// ─────────────────────────────────────────────────────────────
function DroneArm({
  angle,
  ledColor,
  propDir,
}: {
  angle: number
  ledColor: string
  propDir: number
}) {
  return (
    <group rotation={[0, angle, 0]}>
      {/* Carbon-tube arm */}
      <mesh position={[0.95, 0, 0]}>
        <boxGeometry args={[1.5, 0.065, 0.13]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Motor housing cylinder */}
      <mesh position={[1.73, 0.07, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.18, 20]} />
        <meshStandardMaterial
          color="#0c1a2e"
          emissive={ledColor}
          emissiveIntensity={1.0}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>

      {/* Motor bell cap */}
      <mesh position={[1.73, 0.17, 0]}>
        <cylinderGeometry args={[0.11, 0.15, 0.07, 20]} />
        <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* LED point light per arm */}
      <pointLight
        position={[1.73, 0.07, 0]}
        color={ledColor}
        intensity={1.4}
        distance={2.0}
      />

      {/* Propeller blades */}
      <group position={[1.73, 0.23, 0]}>
        <Propeller direction={propDir} />
      </group>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// Expanding scan / radar rings that pulse outward
// ─────────────────────────────────────────────────────────────
function ScanRings() {
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const mat1 = useRef<THREE.MeshBasicMaterial>(null)
  const mat2 = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p1 = (t * 0.38) % 1
    const p2 = ((t * 0.38 + 0.5) % 1)

    if (ring1.current) ring1.current.scale.set(p1 * 5 + 0.4, 1, p1 * 5 + 0.4)
    if (mat1.current) mat1.current.opacity = (1 - p1) * 0.55

    if (ring2.current) ring2.current.scale.set(p2 * 5 + 0.4, 1, p2 * 5 + 0.4)
    if (mat2.current) mat2.current.opacity = (1 - p2) * 0.55
  })

  const ringGeo = <ringGeometry args={[0.8, 1.02, 72]} />

  return (
    <>
      <mesh ref={ring1} position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {ringGeo}
        <meshBasicMaterial
          ref={mat1}
          color="#38bdf8"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring2} position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {ringGeo}
        <meshBasicMaterial
          ref={mat2}
          color="#38bdf8"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Landing gear — 4 thin struts below the chassis
// ─────────────────────────────────────────────────────────────
function LandingGear() {
  const positions: [number, number, number][] = [
    [0.45, -0.22, 0.45],
    [-0.45, -0.22, 0.45],
    [0.45, -0.22, -0.45],
    [-0.45, -0.22, -0.45],
  ]
  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.22, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}
      {/* Skid rails */}
      <mesh position={[0, -0.33, 0.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.95, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.33, -0.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.95, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
      </mesh>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Core drone body (chassis + dome + camera + all arms)
// ─────────────────────────────────────────────────────────────
function DroneBody() {
  const bodyRef = useRef<THREE.Group>(null)
  const cameraRef = useRef<THREE.Mesh>(null)
  const topRingRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Very slow ambient yaw sway
    if (bodyRef.current) {
      bodyRef.current.rotation.y = Math.sin(t * 0.25) * 0.12
    }
    // Camera LED blink
    if (cameraRef.current) {
      const mat = cameraRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.9 + Math.sin(t * 2.8) * 0.5
    }
    // Top ring subtle pulse
    if (topRingRef.current) {
      const mat = topRingRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.35 + Math.sin(t * 1.5) * 0.15
    }
  })

  return (
    <group ref={bodyRef}>
      {/* ── MAIN CHASSIS ──────────────────────────────────── */}
      {/* Hexagonal outer body */}
      <mesh>
        <cylinderGeometry args={[0.63, 0.69, 0.24, 8]} />
        <meshStandardMaterial
          color="#0c1a2e"
          emissive="#0369a1"
          emissiveIntensity={0.18}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {/* Top accent ring */}
      <mesh ref={topRingRef} position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.53, 0.59, 0.05, 8]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#38bdf8"
          emissiveIntensity={0.4}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Jetson compute dome */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.27, 0.38, 0.15, 16]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive="#7c3aed"
          emissiveIntensity={0.3}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Jetson dome top cap */}
      <mesh position={[0, 0.27, 0]}>
        <sphereGeometry args={[0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive="#7c3aed"
          emissiveIntensity={0.15}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Belly plate */}
      <mesh position={[0, -0.13, 0]}>
        <cylinderGeometry args={[0.5, 0.52, 0.04, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Camera gimbal sphere */}
      <mesh ref={cameraRef} position={[0, -0.18, 0.26]}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshStandardMaterial
          color="#000"
          emissive="#f97316"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Status LED — front */}
      <mesh position={[0.0, 0.14, 0.58]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial
          color="#fff"
          emissive="#22d3ee"
          emissiveIntensity={3}
        />
      </mesh>

      {/* Central glow light */}
      <pointLight position={[0, 0.1, 0]} color="#38bdf8" intensity={1.8} distance={3.5} />

      {/* ── 4 ARMS ────────────────────────────────────────── */}
      <DroneArm angle={Math.PI * 0.25}  ledColor="#22d3ee" propDir={ 1} />
      <DroneArm angle={Math.PI * 0.75}  ledColor="#f97316" propDir={-1} />
      <DroneArm angle={Math.PI * 1.25}  ledColor="#22d3ee" propDir={ 1} />
      <DroneArm angle={Math.PI * 1.75}  ledColor="#f97316" propDir={-1} />

      {/* ── LANDING GEAR ──────────────────────────────────── */}
      <LandingGear />

      {/* ── SCAN RINGS ────────────────────────────────────── */}
      <ScanRings />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// Scene lighting + composition
// ─────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      {/* Ambient fill — cold sky blue */}
      <ambientLight intensity={0.35} color="#0ea5e9" />

      {/* Key light — cool white from front-top */}
      <directionalLight position={[3, 6, 5]} intensity={2.0} color="#e0f2fe" />

      {/* Rim light — purple from behind */}
      <pointLight position={[-4, 3, -3]} color="#7c3aed" intensity={1.0} distance={12} />

      {/* Ground bounce — subtle cyan from below */}
      <pointLight position={[0, -3, 0]} color="#0ea5e9" intensity={0.5} distance={6} />

      {/* Floating drone with gentle bob + rotation */}
      <Float speed={1.6} rotationIntensity={0.22} floatIntensity={0.65}>
        <DroneBody />
      </Float>

      {/* Distant star field */}
      <Stars
        radius={55}
        depth={25}
        count={500}
        factor={2.2}
        saturation={0.2}
        fade
        speed={0.4}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Exported component — Canvas with transparent background
// ─────────────────────────────────────────────────────────────
export default function HeroDrone3D() {
  return (
    <Canvas
      camera={{ position: [0, 2.0, 5.0], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <Scene />
    </Canvas>
  )
}
