"use client"

import { useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, PerformanceMonitor } from "@react-three/drei"
import { Polishable } from "./Polishable"
import { makeTurdGeometry } from "../lib/turd-geometry"
import { Monitor, PlummetingLine } from "./markets"
import { YouTubeEmbed } from "./youtube"

export default function PolishingSimulator() {
  const [degraded, setDegraded] = useState(false)
  const [polish, setPolish] = useState(0)
  const turdGeometry = useMemo(makeTurdGeometry, [])
  const maxPolishable = 0.173 // approximate. not all surface is accessible. probably a good reason to use a proper 3D model instead of a procedural one.

  function onPlayerReady(event: YT.PlayerEvent) {
    event.target.playVideo()
  }

  let done = false
  function onPlayerStateChange(event: YT.PlayerEvent) {
    console.log(event.data, event.target)
    if (event.data == YT.PlayerState.PLAYING && !done) {
      setTimeout(() => {
        event.target.pauseVideo()
        event.target.seekTo(0, true)
        event.target.playVideo()
      }, 6000)
      done = true
    }
  }

  return (<>
    <div style={{ position: "absolute", top: 0, left: 0, padding: "1rem" }}>
      <div style={{ fontSize: "2rem" }}>Polish: {(polish / maxPolishable * 100).toFixed(0)}%</div>
      <div style={{ fontSize: "0.9rem" }}>{degraded ? "Some visual effects have been disabled for performance." : ""}</div>
    </div>
    <div style={{ position: "absolute", bottom: 0, left: 0, padding: "1rem" }}>
      <YouTubeEmbed
        height='390'
        width='640'
        videoId='zBflZLStKQg'
        playerVars={{
          'playsinline': 1
        }}
        events={{
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }}
      />
    </div>
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <Polishable onPolish={setPolish}>
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
  </>)
}
