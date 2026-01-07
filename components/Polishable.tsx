"use client"

import { useThree, useFrame } from "@react-three/fiber"
import { useRef, useState, useEffect, useMemo } from "react"
import * as THREE from "three"

export function Polishable({ children, onPolish }: { children: React.ReactNode, onPolish: (value: number, pointerType: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const roughnessMapRef = useRef<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isPolishing = useRef(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { raycaster, camera, gl, get } = useThree()

  // Initialize the roughness map
  useEffect(() => {
    // Create a canvas for the roughness map
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    canvasRef.current = canvas

    const context = canvas.getContext("2d", { willReadFrequently: true })
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

    return () => {
      texture.dispose()
    }
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

    return count / data.length
  }

  // Handle pointer events
  useEffect(() => {
    if (!gl.domElement) return

    const handlePointerDown = (event: PointerEvent) => {
      if (getUV(event)) {
        isPolishing.current = true
        // @ts-ignore
        get().controls.enabled = false
        gl.domElement.setPointerCapture(event.pointerId)
        polish(event)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isPolishing.current) {
        polish(event)
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (isPolishing.current) {
        isPolishing.current = false
        // @ts-ignore
        get().controls.enabled = true
        gl.domElement.releasePointerCapture(event.pointerId)
      }
    }

    const getUV = (event: PointerEvent) => {
      if (!meshRef.current || !contextRef.current || !canvasRef.current) return

      // Update raycaster with pointer position
      // Normally this is updated automatically, but since we're using pointer events instead of
      // r3f's built-in event system, we need to manually update the raycaster
      // especially for touch events where the pointer always jumps when you touch the screen
      // (without this it'll be left at where you last lifted your finger)
      // TODO: investigate using r3f's event system
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

      // Check for intersections
      const intersects = raycaster.intersectObject(meshRef.current)
      if (intersects.length > 0) {
        const uv = intersects[0].uv
        if (!uv) return
        return uv
      }
      return null
    }

    const polish = (event: PointerEvent) => {
      if (!meshRef.current || !contextRef.current || !canvasRef.current) return
      const uv = getUV(event)
      if (uv) {

        // Convert UV to canvas coordinates
        const canvasX = Math.floor(uv.x * canvasRef.current.width)
        const canvasY = Math.floor((1 - uv.y) * canvasRef.current.height)

        // Draw a polishing spot (darker = less rough)
        drawPolishingSpotWrapped(canvasX, canvasY)

        // Update the texture
        if (roughnessMapRef.current) {
          roughnessMapRef.current.needsUpdate = true
        }

        // Measure the polish
        const polishValue = measurePolish()
        if (onPolish) {
          onPolish(polishValue, event.pointerType)
        }
      }
    }

    gl.domElement.addEventListener("pointerdown", handlePointerDown)
    gl.domElement.addEventListener("pointermove", handlePointerMove)
    gl.domElement.addEventListener("pointerup", handlePointerUp)
    gl.domElement.addEventListener("pointercancel", handlePointerUp)

    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown)
      gl.domElement.removeEventListener("pointermove", handlePointerMove)
      gl.domElement.removeEventListener("pointerup", handlePointerUp)
      gl.domElement.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [gl, raycaster, camera])

  // Create material with the roughness map
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#cc6600",
      metalness: 1,
      roughnessMap: roughnessMapRef.current,
      roughness: 1,
    })
  }, [isInitialized])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  // Slowly rotate the object
  useFrame((_: unknown, delta: number) => {
    if (meshRef.current && !isPolishing.current) {
      meshRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <mesh ref={meshRef} material={material} userData={{ confettiTarget: true }}>
      {children}
    </mesh>
  )
}
