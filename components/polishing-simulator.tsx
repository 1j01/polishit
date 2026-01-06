"use client"

import { useMemo, useState, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, PerformanceMonitor, Text } from "@react-three/drei"
import * as THREE from "three"
import { Polishable } from "./Polishable"
import { makeTurdGeometry } from "../lib/turd-geometry"
import { Monitor } from "./markets"

function Pedestal() {
  const group = useRef<THREE.Group>(null)

  useFrame(({ camera }) => {
    if (!group.current) return
    const opacity = Math.max(0, Math.min(1, (camera.position.y + 0.5) * 1.5))
    group.current.visible = opacity > 0

    group.current.traverse((child: any) => {
      if (child.isMesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat: any) => {
          if (mat) {
            mat.transparent = true
            mat.opacity = opacity
          }
        })
      }
    })
  })

  return (
    <group ref={group} position={[0, -3.0, 0]}>
      <mesh position={[0, -1.8, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.5, 1.6, 0.4, 4]} />
        <meshStandardMaterial color="#222" roughness={0.6} flatShading />
      </mesh>

      <mesh position={[0, -1.4, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.0, 1.45, 0.4, 4]} />
        <meshStandardMaterial color="#222" roughness={0.6} flatShading />
      </mesh>

      <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.9, 1.0, 2.8, 4]} />
        <meshStandardMaterial color="#222" roughness={0.6} flatShading />
      </mesh>

      <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.4, 0.9, 0.3, 4]} />
        <meshStandardMaterial color="#222" roughness={0.6} flatShading />
      </mesh>

      <mesh position={[0, 2.0, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.2, 4]} />
        <meshStandardMaterial color="#111" roughness={0.4} flatShading />
      </mesh>

      <group position={[0, 0.5, 0.68]} rotation={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>
        <Text
          position={[0, 0.08, 0.03]}
          fontSize={0.12}
          color="#000"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#d4af37"
        >
          No. 2
        </Text>
        <Text
          position={[0, -0.1, 0.03]}
          fontSize={0.06}
          color="#333"
          anchorX="center"
          anchorY="middle"
        >
          Do Your Duty
        </Text>
      </group>
    </group>
  )
}

export default function PolishingSimulator() {
  const [degraded, setDegraded] = useState(false)
  const [polish, setPolish] = useState(0)
  const turdGeometry = useMemo(makeTurdGeometry, [])
  const maxPolishable = 0.173 // approximate. not all surface is accessible. probably a good reason to use a proper 3D model instead of a procedural one.
  return (<>
    <div className="absolute top-0 left-0 w-full h-full p-8 pointer-events-none z-10 select-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,transparent_50%)]">
      <h1 className="text-6xl font-black mb-4 text-blue-900 tracking-tighter">Polish<span className="italic text-red-600 inline-block" style={{ transform: "scaleX(1.4)", transformOrigin: "0" }}>It!</span></h1>
      <p className="mb-6 text-blue-900/80 max-w-md text-lg leading-relaxed shadow-sm font-medium">
        Click and drag on the object to polish it. The more you polish an area, the shinier it becomes.
      </p>
      <div className="flex items-baseline gap-3">
        <span className="text-7xl font-black text-blue-900 tracking-tighter">{(polish / maxPolishable * 100).toFixed(0)}%</span>
        <span className="text-xl font-bold text-red-600 uppercase tracking-widest">Polished</span>
      </div>
      {degraded && (
        <div className="mt-4 text-sm text-amber-700 font-medium bg-amber-100/80 backdrop-blur inline-block px-3 py-1 rounded-full border border-amber-200/50">
          ⚠️ Some effects have been disabled for performance.
        </div>
      )}
    </div>
    <Canvas camera={{ position: [0, 4, 8], fov: 50 }} className="touch-none block">
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <Polishable onPolish={setPolish}>
        <primitive object={turdGeometry} />
      </Polishable>
      <Pedestal />
      <Environment preset="studio" frames={degraded ? 1 : Infinity} resolution={256} >
        {/* <Monitor position={[-2, 4, 0]} rotation={[Math.PI * 0.2, Math.PI / 2, 0]} scale={[8, 6, 1]} /> */}
        <Monitor position={[-2, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 6, 1]} />
        <Monitor position={[2, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 6, 1]} />
      </Environment>
      <PerformanceMonitor onDecline={() => setDegraded(true)} />
      <ContactShadows position={[0, -3.9, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={Math.PI * 0.0}
        maxPolarAngle={Math.PI * 0.8}
        minDistance={3}
        maxDistance={16}
      />
    </Canvas>
  </>)
}
