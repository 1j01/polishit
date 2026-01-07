"use client"

import { useMemo, useState, useRef, Suspense, useEffect, memo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, PerformanceMonitor } from "@react-three/drei"
import * as THREE from "three"

import { Polishable } from "./Polishable"
import { makeTurdGeometry } from "../lib/turd-geometry"
import { Monitor } from "./markets"
import { ShareDialog } from "./share-dialog"
import { InfoDialog } from "./info-dialog"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { DEFAULT_PLAQUE_TITLE, DEFAULT_PLAQUE_SUBTITLE } from "@/lib/constants"
import { Confetti } from "./Confetti"
import { useToast } from "@/hooks/use-toast"
import { Pedestal } from "./Pedestal"

const PolishingScene = memo(function PolishingScene({
  degraded,
  relaxedPerformance,
  title,
  subtitle,
  setPolish,
  turdGeometry,
  setDegraded,
  setContextLost,
  confettiActive
}: {
  degraded: boolean
  relaxedPerformance: number
  title: string
  subtitle: string
  setPolish: (value: number, pointerType: string) => void
  turdGeometry: THREE.BufferGeometry
  setDegraded: (value: boolean) => void
  setContextLost: (value: boolean) => void
  confettiActive: boolean
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
      <Confetti active={confettiActive} />
      <Environment preset="studio" frames={degraded ? 1 : Infinity} resolution={256} >
        {/* <Monitor position={[-2, 4, 0]} rotation={[Math.PI * 0.2, Math.PI / 2, 0]} scale={[8, 6, 1]} /> */}
        <Monitor position={[-2, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 6, 1]} />
        <Monitor position={[2, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 6, 1]} />
      </Environment>
      <PerformanceMonitor
        onDecline={() => setDegraded(true)}
        // onChange={(event) => console.log("perf change", event)}
        bounds={(refresh) => relaxedPerformance ? [30 - relaxedPerformance * 10, 50] : (refresh > 90 ? [50, 90] : [50, 60])}
      />
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
  const { toast } = useToast()
  const [degraded, setDegraded] = useState(() => {
    let contextLostPreviously = false
    try {
      if (localStorage.getItem("polishit-context-lost")) {
        contextLostPreviously = true
      }
    } catch (e) { /* ignore */ }
    return contextLostPreviously
  })
  const [relaxedPerformance, setRelaxedPerformance] = useState(0)
  const [polish, setPolish] = useState(0)
  const [contextLost, setContextLost] = useState(false)
  const searchParams = useSearchParams()
  const title = searchParams.get("t") ?? DEFAULT_PLAQUE_TITLE
  const subtitle = searchParams.get("s") ?? DEFAULT_PLAQUE_SUBTITLE

  const maxPolishable = 0.173 // approximate. not all surface is accessible. probably a good reason to use a proper 3D model instead of a procedural one.
  const interactionStats = useRef({ touch: 0, total: 0 })
  const hasPolishedScreenToastShown = useRef(false)

  const handlePolish = useCallback((value: number, pointerType: string) => {
    setPolish(value)

    if (pointerType === "touch" || pointerType === "mouse" || pointerType === "pen") {
      interactionStats.current.total++
      if (pointerType === "touch") {
        interactionStats.current.touch++
      }
    }

    if (value >= maxPolishable && !hasPolishedScreenToastShown.current) {
      if (interactionStats.current.touch / interactionStats.current.total > 0.5) {
        hasPolishedScreenToastShown.current = true
        toast({
          title: "Now polish your screen!",
          description: "Or clean off the \"polishing compound\" you used.",
          duration: 5000,
        })
      }
    }
  }, [toast])

  const turdGeometry = useMemo(makeTurdGeometry, [])
  useEffect(() => {
    return () => turdGeometry.dispose()
  }, [turdGeometry])

  return (<>
    <div className="absolute top-0 left-0 w-full h-full p-4 md:p-8 pointer-events-none z-10 select-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,transparent_50%)]">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl md:text-6xl font-black mb-2 md:mb-4 text-blue-900 tracking-tighter">Polish<span className="italic text-red-600 inline-block" style={{ transform: "scaleX(1.4)", transformOrigin: "0" }}>It!</span></h1>
          <p className="mb-4 md:mb-6 text-blue-900/80 max-w-xs md:max-w-md text-sm md:text-lg leading-relaxed shadow-sm font-medium">
            Click and drag to polish.<br />
            The harder you work, the better it looks!™
          </p>
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-5xl md:text-7xl font-black text-blue-900 tracking-tighter">{(polish / maxPolishable * 100).toFixed(0)}%</span>
            <span className="text-base md:text-xl font-bold text-red-600 uppercase tracking-widest">Polished</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <InfoDialog />
          <ShareDialog initialTitle={title} initialSubtitle={subtitle} />
        </div>
      </div>

      <div className="absolute bottom-4 right-2 md:bottom-6 md:right-6 pointer-events-auto z-[51]">
        <a
          href="https://github.com/1j01/polishit/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs md:text-sm font-medium text-blue-900/80 hover:text-blue-900 hover:underline transition-colors bg-white/50 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-lg"
        >
          Feedback?
        </a>
      </div>

      <ClientOnly>
        {degraded && (
          <div className="absolute bottom-3 left-2 mt-4 text-sm text-amber-700 font-medium bg-amber-100/80 backdrop-blur inline-block px-3 py-1 rounded-full border border-amber-200/50 pointer-events-auto">
            ⚠️ Perf mode{" "}
            <button onClick={() => { setDegraded(false); setRelaxedPerformance(relaxedPerformance + 1) }} className="underline hover:text-amber-900 font-bold ml-1">
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
        <Toaster />
      </ClientOnly>
    </div>
    <ClientOnly>
      <PolishingScene
        degraded={degraded}
        relaxedPerformance={relaxedPerformance}
        title={title}
        subtitle={subtitle}
        setPolish={handlePolish}
        turdGeometry={turdGeometry}
        setDegraded={setDegraded}
        setContextLost={setContextLost}
        confettiActive={polish >= maxPolishable || (typeof window !== "undefined" && window.location.hash.includes("huzzah"))}

      />
    </ClientOnly>
  </>)
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])
  if (!isClient) {
    return null
  }
  return <>{children}</>
}

export default function PolishingSimulator() {
  return (
    <Suspense fallback={null}>
      <PolishingSimulatorContent />
    </Suspense>
  )
}
