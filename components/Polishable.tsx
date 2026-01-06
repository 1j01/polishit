"use client"

import { useThree, useFrame } from "@react-three/fiber"
import { useRef, useState, useEffect, useMemo } from "react"
import * as THREE from "three"

export function Polishable({ children, onPolish }: { children: React.ReactNode, onPolish: (value: number) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const roughnessMapRef = useRef<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isPolishing = useRef(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { camera, gl, controls } = useThree((state) => ({
    camera: state.camera,
    gl: state.gl,
    controls: state.controls as unknown as { enabled: boolean } | null
  }))

  useEffect(() => {
    // Dipose texture on unmount
    return () => {
      if (roughnessMapRef.current) {
        roughnessMapRef.current.dispose()
      }
    }
  }, [])

  // Initialize the roughness map
  useEffect(() => {
    // Create a canvas for the roughness map
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    canvasRef.current = canvas

    const context = canvas.getContext("2d")
    if (!context) return
    contextRef.current = context

    // Fill with medium roughness (gray color)
    context.fillStyle = "#808080" // Medium gray for medium roughness
    context.fillRect(0, 0, canvas.width, canvas.height)
    // Add some spots
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      drawPolishingSpot(x, y, Math.random() * 20 + 5, `hsla(0, 0%, ${Math.random() * 100}%, 0.2)`)
    }

    // Create the texture
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    roughnessMapRef.current = texture

    setIsInitialized(true)
  }, [])

  function drawPolishingSpot(canvasX: number, canvasY: number, radius = 50, color = "rgba(32, 32, 32, 0.2)") {
    const context = contextRef.current
    if (!context) return
    context.save()
    context.translate(canvasX, canvasY)
    context.scale(0.2, 1) // TO COUNTERACT UNEQUAL UVS
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, "transparent")

    context.fillStyle = gradient
    context.beginPath()
    context.arc(0, 0, radius, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  function drawPolishingSpotWrapped(canvasX: number, canvasY: number, radius = 50, color = "rgba(32, 32, 32, 0.2)") {
    // Wrap to avoid seams. There will still be ugliness at the poles, but no hard edge running between the poles.
    for (let xRepetition = -1; xRepetition <= 1; xRepetition++) {
      for (let yRepetition = -1; yRepetition <= 1; yRepetition++) {
        drawPolishingSpot(canvasX + xRepetition * canvasRef.current!.width, canvasY + yRepetition * canvasRef.current!.height, radius, color)
      }
    }
  }

  function measurePolish() {
    // Could optimize by storing measures for buckets and only updating the ones that change
    // Could improve by using a less binary measure (but would still probably want to ignore roughness values above a certain threshold)
    // (and probably use that threshold as the bottom of the scale, i.e. make things that just pass it be near 0)
    const context = contextRef.current
    if (!context) return 0

    // Get the image data from the canvas
    const imageData = context.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    const data = imageData.data

    // Count the number of pixels that pass a threshold
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 80) {
        count++
      }
    }

    return count / (data.length / 4)
  }

  const polish = (uv: THREE.Vector2) => {
    if (!contextRef.current || !canvasRef.current) return

    // Convert UV to canvas coordinates
    const canvasX = Math.floor(uv.x * canvasRef.current.width)
    const canvasY = Math.floor((1 - uv.y) * canvasRef.current.height)

    // Draw a polishing spot (darker = less rough)
    drawPolishingSpotWrapped(canvasX, canvasY)

    // Update the texture
    if (roughnessMapRef.current) {
      roughnessMapRef.current.needsUpdate = true
    }

    // Measure the polish (throttled/chance based to avoid heavy readback every frame)
    // For now, let's just do it. Optimization: doing readback is slow (CPU-GPU sync). 
    // Ideally we'd mirror the state in JS or use a compute shader, but for this simpler app:
    if (Math.random() < 0.1) { // Simple stochastic throttling
      const polishValue = measurePolish()
      if (onPolish) {
        onPolish(polishValue)
      }
    }
  }

  // Handle pointer events via R3F events on the mesh instead of global DOM listeners

  // Create material with the roughness map
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#cc6600",
      metalness: 1,
      roughnessMap: roughnessMapRef.current,
      roughness: 1,
    })
  }, [isInitialized])

  // Slowly rotate the object
  useFrame((_: unknown, delta: number) => {
    if (meshRef.current && !isPolishing.current) {
      meshRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <mesh
      ref={meshRef}
      material={material}
      onPointerDown={(e) => {
        e.stopPropagation()
        // @ts-ignore
        e.target.setPointerCapture(e.pointerId)
        if (controls) controls.enabled = false
        isPolishing.current = true
        if (e.uv) polish(e.uv)
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        // @ts-ignore
        e.target.releasePointerCapture(e.pointerId)
        if (controls) controls.enabled = true
        isPolishing.current = false
      }}
      onPointerMove={(e) => {
        if (isPolishing.current && e.uv) {
          e.stopPropagation()
          polish(e.uv)
        }
      }}
    >
      {children}
    </mesh>
  )
}
