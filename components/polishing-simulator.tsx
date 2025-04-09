"use client"

import { useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, PerformanceMonitor } from "@react-three/drei"
import { Polishable } from "./Polishable"
import { makeTurdGeometry } from "../lib/turd-geometry"
import { Monitor, PlummetingLine } from "./markets"

export default function PolishingSimulator() {
  const [degraded, setDegraded] = useState(false)
  const turdGeometry = useMemo(makeTurdGeometry, [])
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <Polishable>
        <primitive object={turdGeometry} />
      </Polishable>
      <Environment preset="studio" frames={degraded ? 1 : Infinity} resolution={256} >
        <PlummetingLine />
        <Monitor />
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
  )
}
