"use client"

import { useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, PerformanceMonitor } from "@react-three/drei"
import { Polishable } from "./Polishable"
import { makeTurdGeometry } from "../lib/turd-geometry"
import { Monitor } from "./markets"

export default function PolishingSimulator() {
  const [degraded, setDegraded] = useState(false)
  const [polish, setPolish] = useState(0)
  const turdGeometry = useMemo(makeTurdGeometry, [])
  const maxPolishable = 0.173 // approximate. not all surface is accessible. probably a good reason to use a proper 3D model instead of a procedural one.
  return (<>
    <div className="absolute top-0 left-0 w-full h-full p-8 pointer-events-none z-10 select-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,transparent_50%)]">
      <h1 className="text-6xl font-black mb-4 text-blue-900 tracking-tighter">Polish<span className="italic text-red-600">It!</span></h1>
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
      <Environment preset="studio" frames={degraded ? 1 : Infinity} resolution={256} >
        {/* <Monitor position={[-2, 4, 0]} rotation={[Math.PI * 0.2, Math.PI / 2, 0]} scale={[8, 6, 1]} /> */}
        <Monitor position={[-2, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 6, 1]} />
        <Monitor position={[2, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 6, 1]} />
      </Environment>
      <PerformanceMonitor onDecline={() => setDegraded(true)} />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2.5} far={4} />
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
