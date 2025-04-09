"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei"
import * as THREE from "three"

export default function PolishingSimulator() {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <Polishable>
        <sphereGeometry args={[1.5, 64, 64]} />
      </Polishable>
      <Environment preset="studio" />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2.5} far={4} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={3}
        maxDistance={6}
      />
    </Canvas>
  )
}

function Polishable({ children }: { children: React.ReactNode }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const roughnessMapRef = useRef<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isPolishing = useRef(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { raycaster, camera, gl } = useThree()

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

    // Create the texture
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    roughnessMapRef.current = texture

    setIsInitialized(true)
  }, [])

  // Handle mouse events
  useEffect(() => {
    if (!gl.domElement) return

    const handleMouseDown = (event: MouseEvent) => {
      isPolishing.current = true
      polish(event)
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isPolishing.current) {
        polish(event)
      }
    }

    const handleMouseUp = () => {
      isPolishing.current = false
    }

    const polish = (event: MouseEvent) => {
      if (!meshRef.current || !contextRef.current || !canvasRef.current) return

      // Get mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Update the raycaster
      raycaster.setFromCamera({ x, y }, camera)

      // Check for intersections
      const intersects = raycaster.intersectObject(meshRef.current)
      if (intersects.length > 0) {
        const uv = intersects[0].uv
        if (!uv) return

        // Convert UV to canvas coordinates
        const canvasX = Math.floor(uv.x * canvasRef.current.width)
        const canvasY = Math.floor((1 - uv.y) * canvasRef.current.height)

        // Draw a polishing spot (darker = less rough)
        // drawPolishingSpot(canvasX, canvasY)
        // Wrap to avoid seams. There will still be ugliness at the poles, but no hard edge running between the poles.
        for (let xRepetition = -1; xRepetition <= 1; xRepetition++) {
          for (let yRepetition = -1; yRepetition <= 1; yRepetition++) {
            drawPolishingSpot(canvasX + xRepetition * canvasRef.current.width, canvasY + yRepetition * canvasRef.current.height)
          }
        }

        // Update the texture
        if (roughnessMapRef.current) {
          roughnessMapRef.current.needsUpdate = true
        }
      }

      function drawPolishingSpot(canvasX: number, canvasY: number) {
        const context = contextRef.current
        if (!context) return
        const radius = 30
        const gradient = context.createRadialGradient(canvasX, canvasY, 0, canvasX, canvasY, radius)
        gradient.addColorStop(0, "rgba(32, 32, 32, 0.2)") // Very dark gray for very low roughness
        gradient.addColorStop(1, "transparent")

        context.fillStyle = gradient
        context.globalCompositeOperation = "multiply"
        context.beginPath()
        context.arc(canvasX, canvasY, radius, 0, Math.PI * 2)
        context.fill()
      }
    }

    gl.domElement.addEventListener("mousedown", handleMouseDown)
    gl.domElement.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      gl.domElement.removeEventListener("mousedown", handleMouseDown)
      gl.domElement.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
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

  // Slowly rotate the object
  useFrame((_, delta) => {
    if (meshRef.current && !isPolishing.current) {
      meshRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <mesh ref={meshRef} material={material}>
      {children}
    </mesh>
  )
}
