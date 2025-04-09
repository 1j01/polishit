"use client"

import { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei"
import { Polishable } from "./Polishable"
import { makeTurdGeometry } from "./turd-geometry"
import { Monitor, PlummetingLine } from "./markets"

export default function PolishingSimulator() {
  const turdGeometry = useMemo(makeTurdGeometry, [])
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <Polishable>
        <primitive object={turdGeometry} />
      </Polishable>
      <PlummetingLine />
      <Monitor />
      <Environment preset="studio" />
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
