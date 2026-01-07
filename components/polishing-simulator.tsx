"use client"

import { useMemo, useState, useRef, Suspense, useEffect, memo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, PerformanceMonitor, Text, MeshReflectorMaterial } from "@react-three/drei"
import * as THREE from "three"
import { ClientOnly } from "react-client-only"

import { Polishable } from "./Polishable"
import { makeTurdGeometry } from "../lib/turd-geometry"
import { Monitor } from "./markets"
import { ShareDialog } from "./share-dialog"
import { Button } from "@/components/ui/button"
import { DEFAULT_PLAQUE_TITLE, DEFAULT_PLAQUE_SUBTITLE } from "@/lib/constants"

function Pedestal({
  degraded = false,
  title = DEFAULT_PLAQUE_TITLE,
  subtitle = DEFAULT_PLAQUE_SUBTITLE,
  baseWidth = 3.0,
  columnHeight = 1.4
}) {
  const group = useRef<THREE.Group>(null)
  const currentOpacity = useRef(0)

  // Configure geometric ratios relative to baseWidth
  const dims = useMemo(() => {
    const bottomBase = { h: 0.2, rTop: baseWidth, rBot: baseWidth * 1.066 }
    const transitionBase = { h: 0.2, rTop: baseWidth * 0.866, rBot: baseWidth * 0.966 }
    const column = { h: columnHeight, rTop: baseWidth * 0.8, rBot: baseWidth * 0.866 }
    const capFlair = { h: 0.15, rTop: baseWidth * 0.933, rBot: baseWidth * 0.8 }
    const capTop = { h: 0.1, rTop: baseWidth, rBot: baseWidth }

    // Calculate vertical positions (stacking upwards from 0)
    let y = 0
    const posBottomBase = y + bottomBase.h / 2; y += bottomBase.h
    const posTransition = y + transitionBase.h / 2; y += transitionBase.h
    const posColumn = y + column.h / 2; y += column.h
    const posCapFlair = y + capFlair.h / 2; y += capFlair.h
    const posCapTop = y + capTop.h / 2; y += capTop.h
    const totalHeight = y

    // Label positioning (approx 60% up the column)
    const labelY = posColumn + (column.h * 0.15)
    const labelZ = (column.rBot + column.rTop) / 2 * 0.707 * 1.05 // slightly in front of the face

    // Offset everything so the top surface is at a known height (e.g. 0)
    // Then we can position the group. But to keep existing logic working, 
    // let's offset so the "top" matches the internal logic we had or adaptable.
    // Previous: Group @ -2.0, Top @ 1.05. World Top @ -0.95.
    // Let's make local top = 1.05 (arbitrary, but minimizes change).
    // Offset = 1.05 - totalHeight.
    const offset = 1.05 - totalHeight

    return {
      bottomBase, posBottomBase: posBottomBase + offset,
      transitionBase, posTransition: posTransition + offset,
      column, posColumn: posColumn + offset,
      capFlair, posCapFlair: posCapFlair + offset,
      capTop, posCapTop: posCapTop + offset,
      labelY: labelY + offset,
      labelZ,
      topSurfaceY: totalHeight + offset
    }
  }, [baseWidth, columnHeight])

  useFrame(({ camera }, delta) => {
    if (!group.current) return
    const targetOpacity = Math.max(0, Math.min(1, (camera.position.y + 0.5) * 1.5))

    const maxSpeed = 2.5
    const diff = targetOpacity - currentOpacity.current
    currentOpacity.current += Math.sign(diff) * Math.min(Math.abs(diff), maxSpeed * delta)
    const opacity = currentOpacity.current

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
    <group ref={group} position={[0, -2.0, 0]}>
      {/* Base Bottom */}
      <mesh position={[0, dims.posBottomBase, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[dims.bottomBase.rTop, dims.bottomBase.rBot, dims.bottomBase.h, 4]} />
        <meshStandardMaterial color="#222" roughness={0.6} flatShading />
      </mesh>

      {/* Base Transition */}
      <mesh position={[0, dims.posTransition, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[dims.transitionBase.rTop, dims.transitionBase.rBot, dims.transitionBase.h, 4]} />
        <meshStandardMaterial color="#222" roughness={0.6} flatShading />
      </mesh>

      {/* Column */}
      <mesh position={[0, dims.posColumn, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[dims.column.rTop, dims.column.rBot, dims.column.h, 4]} />
        <meshStandardMaterial color="#222" roughness={0.6} flatShading />
      </mesh>

      {/* Cap Flair */}
      <mesh position={[0, dims.posCapFlair, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[dims.capFlair.rTop, dims.capFlair.rBot, dims.capFlair.h, 4]} />
        <meshStandardMaterial color="#222" roughness={0.6} flatShading />
      </mesh>

      {/* Cap Top */}
      <mesh position={[0, dims.posCapTop, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[dims.capTop.rTop, dims.capTop.rBot, dims.capTop.h, 4]} />
        <meshStandardMaterial color="#111" roughness={0.4} flatShading />
      </mesh>

      {/* Reflector */}
      {!degraded && (
        <mesh position={[0, dims.topSurfaceY + 0.001, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <circleGeometry args={[dims.capTop.rTop, 4]} />
          {/* @ts-ignore */}
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={40}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#151515"
            metalness={0.5}
            mirror={0.5}
          />
        </mesh>
      )}

      {/* Label Group */}
      <group position={[0, dims.labelY, dims.labelZ]} rotation={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[baseWidth * 0.7, 0.35, 0.05]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>
        <Text
          position={[0, 0.06, 0.03]}
          fontSize={0.12}
          color="#000"
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
        <Text
          position={[0, -0.08, 0.03]}
          fontSize={subtitle.length > 20 ? 0.04 : 0.06}
          color="#333"
          anchorX="center"
          anchorY="middle"
        >
          {subtitle}
        </Text>
      </group>
    </group>
  )
}


const PolishingScene = memo(function PolishingScene({
  degraded,
  title,
  subtitle,
  setPolish,
  turdGeometry,
  setDegraded,
  setContextLost
}: {
  degraded: boolean
  title: string
  subtitle: string
  setPolish: (value: number) => void
  turdGeometry: THREE.BufferGeometry
  setDegraded: (value: boolean) => void
  setContextLost: (value: boolean) => void
}) {
  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault()
      setContextLost(true)
      try {
        localStorage.setItem("polishit-context-lost", "true")
      } catch (e) { /* ignore */ }
    })
    gl.domElement.addEventListener("webglcontextrestored", () => {
      setContextLost(false)
      try {
        localStorage.removeItem("polishit-context-lost")
      } catch (e) { /* ignore */ }
    })
    try {
      localStorage.removeItem("polishit-context-lost")
    } catch (e) { /* ignore */ }
  }, [setContextLost])

  return (
    <Canvas
      camera={{ position: [0, 4, 8], fov: 50 }}
      className="touch-none block"
      onCreated={handleCreated}
    >
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <Polishable onPolish={setPolish}>
        <primitive object={turdGeometry} />
      </Polishable>
      <Pedestal degraded={degraded} title={title} subtitle={subtitle} />
      <Environment preset="studio" frames={degraded ? 1 : Infinity} resolution={256} >
        {/* <Monitor position={[-2, 4, 0]} rotation={[Math.PI * 0.2, Math.PI / 2, 0]} scale={[8, 6, 1]} /> */}
        <Monitor position={[-2, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 6, 1]} />
        <Monitor position={[2, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 6, 1]} />
      </Environment>
      <PerformanceMonitor onDecline={() => setDegraded(true)} />
      {/* <ContactShadows position={[0, -3.9, 0]} opacity={0.4} scale={10} blur={2.5} far={4} /> */}
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
})

function PolishingSimulatorContent() {
  const [degraded, setDegraded] = useState(() => {
    let contextLostPreviously = false
    try {
      if (localStorage.getItem("polishit-context-lost")) {
        contextLostPreviously = true
      }
    } catch (e) { /* ignore */ }
    return contextLostPreviously
  })
  const [polish, setPolish] = useState(0)
  const [contextLost, setContextLost] = useState(false)
  const searchParams = useSearchParams()
  const title = searchParams.get("t") ?? DEFAULT_PLAQUE_TITLE
  const subtitle = searchParams.get("s") ?? DEFAULT_PLAQUE_SUBTITLE

  const turdGeometry = useMemo(makeTurdGeometry, [])
  const maxPolishable = 0.173 // approximate. not all surface is accessible. probably a good reason to use a proper 3D model instead of a procedural one.

  return (<>
    <div className="absolute top-0 left-0 w-full h-full p-4 md:p-8 pointer-events-none z-10 select-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,transparent_50%)]">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl md:text-6xl font-black mb-2 md:mb-4 text-blue-900 tracking-tighter">Polish<span className="italic text-red-600 inline-block" style={{ transform: "scaleX(1.4)", transformOrigin: "0" }}>It!</span></h1>
          <p className="mb-4 md:mb-6 text-blue-900/80 max-w-xs md:max-w-md text-sm md:text-lg leading-relaxed shadow-sm font-medium">
            Click and drag on the object to polish it.<br />
            The harder you work, the better it looks!™
          </p>
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-5xl md:text-7xl font-black text-blue-900 tracking-tighter">{(polish / maxPolishable * 100).toFixed(0)}%</span>
            <span className="text-base md:text-xl font-bold text-red-600 uppercase tracking-widest">Polished</span>
          </div>
        </div>

        <div className="pointer-events-auto">
          <ShareDialog initialTitle={title} initialSubtitle={subtitle} />
        </div>
      </div>

      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 pointer-events-auto z-[51]">
        <a
          href="https://github.com/1j01/polishit/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs md:text-sm font-medium text-blue-900/80 hover:text-blue-900 hover:underline transition-colors bg-white/50 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-lg"
        >
          Request features or report bugs
        </a>
      </div>

      <ClientOnly>
        {degraded && (
          <div className="absolute bottom-4 left-4 mt-4 text-sm text-amber-700 font-medium bg-amber-100/80 backdrop-blur inline-block px-3 py-1 rounded-full border border-amber-200/50 pointer-events-auto">
            ⚠️ Perf mode{" "}
            <button onClick={() => setDegraded(false)} className="underline hover:text-amber-900 font-bold ml-1">
              Re-enable effects?
            </button>
          </div>
        )}
        {contextLost && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-auto select-text">
            <div className="text-center p-8 bg-white rounded-xl shadow-2xl border border-red-100 max-w-md mx-4">
              <h2 className="text-2xl font-black text-red-600 mb-2">Graphics Context Lost</h2>
              <p className="text-gray-600 mb-6">The graphics driver has crashed or was reset. Please reload the page to continue polishing.</p>
              <Button onClick={() => window.location.reload()}>Reload Page</Button>
            </div>
          </div>
        )}
        <PolishingScene
          degraded={degraded}
          title={title}
          subtitle={subtitle}
          setPolish={setPolish}
          turdGeometry={turdGeometry}
          setDegraded={setDegraded}
          setContextLost={setContextLost}
        />
      </ClientOnly >
    </div>
  </>)
}

export default function PolishingSimulator() {
  return (
    <Suspense fallback={null}>
      <PolishingSimulatorContent />
    </Suspense>
  )
}
