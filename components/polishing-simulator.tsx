"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei"
import * as THREE from "three"
import { FunctionCurve3 } from "@/lib/FunctionCurve3"
import { TubeGeometryExt } from "@/lib/tube-geometry-ext"

export default function PolishingSimulator() {
  const spiralGeometry = useMemo(() => {
    // Note: the length of the curve creates UV distortion that has to be counteracted
    // when drawing on the roughness map (without a fancier brushing algorithm).
    const height = 2;
    const turns = 3;
    const segments = 2000;

    const curve = new FunctionCurve3((t, optionalTarget) => {
      optionalTarget ??= new THREE.Vector3();

      const radius = 1.5 * (1 - t);
      const theta = t * Math.PI * 2 * turns;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      const y = t * height;

      return optionalTarget.set(x, y, z);
    })

    return new TubeGeometryExt(curve, segments, 0.9, 8, false, false, (t) => {
      return Math.pow(1 - t, 0.3) * Math.pow(t, 0.12);
    });

  }, [])
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <Polishable>
        <primitive object={spiralGeometry} />
      </Polishable>
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
    // TODO: add some spots of higher roughness
    // eliminating unevenness will be more satisfying than just polishing,
    // especially when you have to create temporary unevenness to polish it.
    context.fillStyle = "#808080" // Medium gray for medium roughness
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Create the texture
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    roughnessMapRef.current = texture

    setIsInitialized(true)
  }, [])

  const { get } = useThree()

  // Handle mouse events
  useEffect(() => {
    if (!gl.domElement) return

    const handleMouseDown = (event: MouseEvent) => {
      if (getUV(event)) {
        isPolishing.current = true
        // @ts-ignore
        get().controls.enabled = false
        polish(event)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isPolishing.current) {
        polish(event)
      }
    }

    const handleMouseUp = () => {
      isPolishing.current = false
      // @ts-ignore
      get().controls.enabled = true
    }

    const getUV = (event: MouseEvent) => {
      if (!meshRef.current || !contextRef.current || !canvasRef.current) return

      // Get mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Update the raycaster
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

    const polish = (event: MouseEvent) => {
      if (!meshRef.current || !contextRef.current || !canvasRef.current) return
      const uv = getUV(event)
      if (uv) {

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
        context.save()
        context.translate(canvasX, canvasY)
        context.scale(0.2, 1) // TO COUNTERACT UNEQUAL UVS
        const radius = 50
        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius)
        gradient.addColorStop(0, "rgba(32, 32, 32, 0.2)") // Very dark gray for very low roughness
        gradient.addColorStop(1, "transparent")

        context.fillStyle = gradient
        context.beginPath()
        context.arc(0, 0, radius, 0, Math.PI * 2)
        context.fill()
        context.restore()
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
  useFrame((_: unknown, delta: number) => {
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
