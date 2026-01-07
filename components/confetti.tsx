"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef, useEffect, useState } from "react"
import * as THREE from "three"

const COUNT = 200
const GRAVITY = -2.5
const TERMINAL_VELOCITY = -2.0
const SPREAD_XZ = 4
const SPAWN_Y = 6
const DESPAWN_Y = -3.0
const GROUND_Y = -2.0 // Base of the pedestal (local 0 is offset, but pedestal is at -2.0)

type Particle = {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  rotationSpeed: THREE.Vector3
  color: THREE.Color
  landed: boolean
  scale: number
  stoppedAt?: THREE.Matrix4 // Store final matrix if landed
}

const COLORS = [
  "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"
]

export function Confetti({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { scene } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  // Create randomized particles
  const particles = useMemo(() => {
    const temp: Particle[] = []
    for (let i = 0; i < COUNT; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * SPREAD_XZ,
        SPAWN_Y + Math.random() * 5, // Spread vertically so they don't all fall at once
        (Math.random() - 0.5) * SPREAD_XZ
      )
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * -1 - 0.5,
        (Math.random() - 0.5) * 0.5
      )
      const rotation = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )
      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
      const color = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)])

      temp.push({
        position,
        velocity,
        rotation,
        rotationSpeed,
        color,
        landed: false,
        scale: 0.05 + Math.random() * 0.03
      })
    }
    return temp
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Raycasting helper
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), [])
  const raycastOrigin = useMemo(() => new THREE.Vector3(), [])

  // Reset particles if active toggles to true (optional, but good for replayability)
  useEffect(() => {
    if (active) {
      // Reset logic if needed, or just let them fall if they were paused
      // Current logic spawns them high up, so they just fall.
      // However, if we want them to re-rain, we might need to reset positions.
      // For now, let's assume one-shot or continuous rain.
      // If "active" is true, we simulate.
    }
  }, [active])

  const [interactables, setInteractables] = useState<THREE.Object3D[]>([])

  useEffect(() => {
    if (active) {
      const list: THREE.Object3D[] = []
      scene.traverse((obj) => {
        if (meshRef.current && obj.uuid !== meshRef.current.uuid && (obj as THREE.Mesh).isMesh) {
          if (obj.visible) list.push(obj)
        }
      })
      setInteractables(list)
    }
  }, [active, scene])

  useFrame((state, delta) => {
    if (!active || !meshRef.current) return

    // Limit delta to avoid huge jumps
    const dt = Math.min(delta, 0.1)

    particles.forEach((p, i) => {
      if (p.landed) {
        // Just update matrix for landed particles (though they shouldn't move, we need to keep setting it if we dynamic)
        // Actually, InstancedMesh needs matrix update only if changed.
        // But here we rebuild all matrices every frame for simplicity unless we optimize partial updates.
        // Optimization: We re-set the matrix every frame in the loop below.
      } else {
        // Gravity
        p.velocity.y += GRAVITY * dt
        p.velocity.y = Math.max(p.velocity.y, TERMINAL_VELOCITY) // terminal velocity cap? technically min since negative
        // Actually gravity makes it more negative. Terminal velocity is negative limit.
        // p.velocity.y = Math.max(p.velocity.y, -5) 

        // Apply drag/air resistance to X/Z
        p.velocity.x *= 0.98
        p.velocity.z *= 0.98

        // Calculate next position
        const nextPos = p.position.clone().addScaledVector(p.velocity, dt)

        // Rotation
        p.rotation.x += p.rotationSpeed.x * dt
        p.rotation.y += p.rotationSpeed.y * dt
        p.rotation.z += p.rotationSpeed.z * dt

        // Raycast
        // We cast a ray from current position to next position to see if we hit something.
        // Direction is normalized velocity. distance is travel length.
        const dPos = nextPos.clone().sub(p.position)
        const travelDist = dPos.length()

        if (travelDist > 0.00001) {
          raycaster.set(p.position, dPos.normalize())
          raycaster.far = travelDist

          // Check scene objects
          const intersects = raycaster.intersectObjects(interactables, false)

          if (intersects.length > 0) {
            // Hit something!
            const hit = intersects[0]
            p.position.copy(hit.point)
            p.landed = true
            // Align slightly to normal? Confetti usually lays flat-ish.
            // Let's just stop it there for now.
            // Maybe offset slightly so it doesn't z-fight
            p.position.addScaledVector(hit.face?.normal || new THREE.Vector3(0, 1, 0), 0.01)

            // Make it lay flat on the surface
            // Simple approach: lookAt normal
            if (hit.face) {
              dummy.position.copy(p.position)
              dummy.lookAt(p.position.clone().add(hit.face.normal))
              // Random rotation around the normal
              dummy.rotateZ(Math.random() * Math.PI * 2)

              // Extract rotation to particle
              p.rotation.copy(dummy.rotation)
            }

          } else {
            // Check ground plane
            if (nextPos.y < GROUND_Y) {
              p.position.set(nextPos.x, GROUND_Y + 0.01, nextPos.z)
              p.landed = true
              p.rotation.x = -Math.PI / 2 // Flat on ground
              p.rotation.z = Math.random() * Math.PI * 2
            } else {
              p.position.copy(nextPos)
            }
          }
        } else {
          p.position.copy(nextPos)
        }

        // Wrap around if it falls too far without hitting anything (safety)
        if (p.position.y < DESPAWN_Y && !p.landed) {
          // Reset to top to keep raining? 
          // "make confetti rain down". Continuous? 
          // "When fully polished" implies an event.
          // Usually confetti lands and stays. 
          // If we want it to rain *for a while*, we recycle.
          // Let's recycle for now if active is true.
          p.position.set(
            (Math.random() - 0.5) * SPREAD_XZ,
            SPAWN_Y,
            (Math.random() - 0.5) * SPREAD_XZ
          )
          p.velocity.set(0, 0, 0) // Reset velocity
          p.velocity.add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * -1 - 0.5,
            (Math.random() - 0.5) * 0.5
          ))
        }
      }

      // Update Instance
      dummy.position.copy(p.position)
      dummy.rotation.copy(p.rotation)
      dummy.scale.set(p.scale, p.scale, p.scale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Set colors once on mount (or particle init)
  // Since we use logic inside useFrame that might assume color is static
  // we just need to set it to attribute.
  // InstancedMesh setColorAt
  useEffect(() => {
    if (!meshRef.current) return
    particles.forEach((p, i) => {
      meshRef.current!.setColorAt(i, p.color)
    })
    meshRef.current.instanceColor!.needsUpdate = true
  }, [particles])


  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 0.5]} />
      <meshStandardMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  )
}
