"use client"

import { useMemo, useRef, useLayoutEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const CONFETTI_COUNT = 200
const COLORS = ["#FFD700", "#C0C0C0", "#CD7F32", "#E13023", "#3B82F6"] // Gold, Silver, Bronze, Red, Blue

export function Confetti({ isExploding = false }: { isExploding?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // Particle state
  // [x, y, z, vx, vy, vz, rotX, rotY, rotZ, vRotX, vRotY, vRotZ, scale, stuck]
  // Stored in a single Float32Array for performance, though object array is readable.
  // Let's use objects for easier logic management since 200 is small.
  // Actually, refs are better to avoid re-renders.

  const particles = useMemo(() => {
    return new Array(CONFETTI_COUNT).fill(0).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 10 + 5, // Start high
        (Math.random() - 0.5) * 6
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        Math.random() * -0.1 - 0.05,
        (Math.random() - 0.5) * 0.05
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ),
      color: new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]),
      scale: Math.random() * 0.5 + 0.5,
      stuck: false,
      active: false, // Wait for explosion signal
      delay: Math.random() * 2 // Random start delay
    }))
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    if (meshRef.current) {
      particles.forEach((particle, i) => {
        meshRef.current?.setColorAt(i, particle.color)
      })
      meshRef.current.instanceColor!.needsUpdate = true
    }
  }, [particles])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // If exploding, activate particles over time
    // If not exploding, we do nothing or reset? 
    // Assuming once true, it stays true or we just handle the "flutter down" phase.

    particles.forEach((particle, i) => {
      // Activation logic
      if (isExploding && !particle.active) {
        particle.delay -= delta
        if (particle.delay <= 0) {
          particle.active = true
        }
      }

      if (particle.active && !particle.stuck) {
        // Physics
        particle.position.add(particle.velocity)
        particle.rotation.x += particle.rotationSpeed.x
        particle.rotation.y += particle.rotationSpeed.y
        particle.rotation.z += particle.rotationSpeed.z

        // Flutter/Air resistance effect
        particle.velocity.y += Math.sin(state.clock.elapsedTime * 10 + i) * 0.002 // Add slight lift/flutter
        particle.velocity.x += Math.sin(state.clock.elapsedTime * 5 + i) * 0.001

        // Gravity approximation for terminal velocity
        if (particle.velocity.y > -0.15) particle.velocity.y -= 0.005

        // Collision Geometry Checks
        const { x, y, z } = particle.position

        // 1. Floor check (Pedestal top approx -0.95, let's say -0.9 for visual "on top")
        if (y < -0.9) {
          // Check if it's within the pedestal radius approx 3.0?
          // Pedestal baseWidth is 3.0.
          // Let's just catch anything low enough as "ground"
          particle.stuck = true
          particle.position.y = -0.9 // Snap to surface
        }

        // 2. Turd Object Check
        // Approximate cone: height 2, radius ~1.5 tapering to 0. 
        // y range [0, 2]
        if (y > 0 && y < 2.2) {
          // Calculate approx radius at this height
          // The spiral goes out to 1.5. Tube radius is ~0.45 (0.9 diameter is arg to TubeGeometry? No, radius is 0.9 * scale... wait.
          // TubeGeometryExt(curve, segments, 0.9, ...) -> 0.9 is radius.
          // Actually let's look at makeTurdGeometry: `new TubeGeometryExt(..., 0.9, ...)`
          // So tube radius is 0.9.
          // Spiral radius is 1.5 * (1-t).
          // So max extent is 1.5 + 0.9 = 2.4 at bottom.
          // min extent is 0 + 0.9? No, scale function reduces thickness.
          // `(t) => Math.pow(1 - t, 0.3) * Math.pow(t, 0.12)`

          // Simplified collision volume: 
          // A cone from (0,0,0) radius 2.0 to (0,2.5,0) radius 0.5
          const heightFactor = y / 2.2
          const maxRadiusAtHeight = 2.0 * (1 - heightFactor * 0.8) // loose approximation

          const distXZ = Math.sqrt(x * x + z * z)
          if (distXZ < maxRadiusAtHeight && distXZ > maxRadiusAtHeight - 1.0) {
            // Hit the surface (roughly)
            // We only want to stick if we are "close" to the surface, maybe just random chance to stick if inside?
            // Or simple check: if we are inside the volume, snap to "surface" and stick?
            // Let's just stick if we intersect the volume.
            // To prevent particles getting stuck inside, we can push them out or just stop them.
            particle.stuck = true
          }
        }
      }

      // Update Matrix
      dummy.position.copy(particle.position)
      dummy.rotation.copy(particle.rotation)
      dummy.scale.setScalar(particle.scale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Material: Shiny metal
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI_COUNT]} castShadow receiveShadow>
      <planeGeometry args={[0.1, 0.1]} />
      <meshStandardMaterial
        roughness={0.1}
        metalness={0.8}
        side={THREE.DoubleSide}
        toneMapped={false}
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  )
}
