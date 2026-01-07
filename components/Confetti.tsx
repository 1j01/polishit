"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef, useEffect, useState } from "react"
import * as THREE from "three"

const COUNT = 200
const GRAVITY = -2.5
const TERMINAL_VELOCITY = -5.0
const SPREAD_XZ = 4
const SPAWN_Y = 6
const GROUND_Y = -3.0 // Base of the pedestal (local 0 is offset, but pedestal is at -2.0, geometry varies)

type Particle = {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  rotationSpeed: THREE.Vector3
  color: THREE.Color
  landed: boolean
  scale: number
  parent: THREE.Object3D | null
  offsetMatrix: THREE.Matrix4 | null
}

const COLORS = [
  "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"
]

// Reusable objects to minimize GC
const _dummy = new THREE.Object3D()
const _nextPos = new THREE.Vector3()
const _rayDir = new THREE.Vector3()
const _raycaster = new THREE.Raycaster()
const _quaternion = new THREE.Quaternion()
const _scale = new THREE.Vector3()

export function Confetti({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { scene } = useThree()

  const [interactables, setInteractables] = useState<THREE.Object3D[]>([])

  useEffect(() => {
    if (active) {
      const list: THREE.Object3D[] = []
      scene.traverse((obj) => {
        // Tagged objects only (low-poly collider or pedestal parts)
        if (obj.userData.confettiTarget) {
          list.push(obj)
        }
      })
      setInteractables(list)
    }
  }, [active, scene])

  // Create randomized particles
  const particles = useMemo(() => {
    const temp: Particle[] = []
    for (let i = 0; i < COUNT; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * SPREAD_XZ,
        SPAWN_Y + Math.random() * 5,
        (Math.random() - 0.5) * SPREAD_XZ
      )
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * -1 - 0.5,
        (Math.random() - 0.5) * 3
      )
      const rotation = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )
      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )
      const color = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)])

      temp.push({
        position,
        velocity,
        rotation,
        rotationSpeed,
        color,
        landed: false,
        scale: 0.15 + Math.random() * 0.1, // Bigger confetti
        parent: null,
        offsetMatrix: null
      })
    }
    return temp
  }, [])

  useFrame((state, delta) => {
    if (!active || !meshRef.current) return

    // Limit delta to avoid huge jumps
    const dt = Math.min(delta, 0.1)

    particles.forEach((p, i) => {
      // If landed, we stick to the object if possible
      if (p.landed) {
        if (p.parent && p.offsetMatrix) {
          // Update position relative to parent
          _dummy.matrix.copy(p.parent.matrixWorld).multiply(p.offsetMatrix)
          _dummy.matrix.decompose(p.position, _quaternion, _scale)
          p.rotation.setFromQuaternion(_quaternion)
        }
      } else {
        // Gravity
        p.velocity.y += GRAVITY * dt
        p.velocity.y = Math.max(p.velocity.y, TERMINAL_VELOCITY)

        // Apply drag
        p.velocity.x *= 0.99
        p.velocity.z *= 0.99

        // Calculate next position
        _nextPos.copy(p.position).addScaledVector(p.velocity, dt)

        // Rotation
        p.rotation.x += p.rotationSpeed.x * dt
        p.rotation.y += p.rotationSpeed.y * dt
        p.rotation.z += p.rotationSpeed.z * dt

        // Raycast
        _rayDir.copy(_nextPos).sub(p.position)
        const travelDist = _rayDir.length()

        if (travelDist > 0.00001) {
          _raycaster.set(p.position, _rayDir.normalize())
          _raycaster.far = travelDist

          // Optimization: Use interactables list which should contain ONLY low-poly proxies and simples meshes
          const intersects = _raycaster.intersectObjects(interactables, false)

          if (intersects.length > 0) {
            const hit = intersects[0]
            p.position.copy(hit.point)
            p.landed = true
            // Offset slightly to avoid z-fighting
            p.position.addScaledVector(hit.face?.normal || new THREE.Vector3(0, 1, 0), 0.01)

            // Align to surface
            if (hit.face) {
              _dummy.position.copy(p.position)
              _dummy.lookAt(p.position.clone().add(hit.face.normal))
              _dummy.rotateZ(Math.random() * Math.PI * 2)
              p.rotation.copy(_dummy.rotation)
            }

            // Calculate parent offset
            p.parent = hit.object
            _dummy.position.copy(p.position)
            _dummy.rotation.copy(p.rotation)
            _dummy.scale.set(1, 1, 1) // Store transform without scale
            _dummy.updateMatrix()

            p.offsetMatrix = hit.object.matrixWorld.clone().invert().multiply(_dummy.matrix)

          } else {
            // Check ground plane at Y = -2.0
            if (_nextPos.y < GROUND_Y) {
              p.position.set(_nextPos.x, GROUND_Y + 0.01, _nextPos.z)
              p.landed = true
              p.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2)
              p.parent = null
              p.offsetMatrix = null
            } else {
              p.position.copy(_nextPos)
            }
          }
        } else {
          p.position.copy(_nextPos)
        }
      }

      // Update Instance
      _dummy.position.copy(p.position)
      _dummy.rotation.copy(p.rotation)
      _dummy.scale.set(p.scale, p.scale, p.scale)
      _dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, _dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  useEffect(() => {
    if (!meshRef.current) return
    particles.forEach((p, i) => {
      meshRef.current!.setColorAt(i, p.color)
    })
    meshRef.current.instanceColor!.needsUpdate = true
  }, [particles])


  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false} visible={active}>
      <planeGeometry args={[1, 0.5]} />
      <meshStandardMaterial side={THREE.DoubleSide} metalness={0.8} roughness={0.2} />
    </instancedMesh>
  )
}
