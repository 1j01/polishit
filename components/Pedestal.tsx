"use client"

import { DEFAULT_PLAQUE_TITLE, DEFAULT_PLAQUE_SUBTITLE } from "@/lib/constants"
import { MeshReflectorMaterial, Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef, useMemo } from "react"
import * as THREE from "three"

function PedestalPart({ rTop, rBot, h, pos, color = "#222", roughness = 0.6 }: { rTop: number; rBot: number; h: number; pos: number; color?: string; roughness?: number }) {
  return (
    <mesh position={[0, pos, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow userData={{ confettiTarget: true }}>
      <cylinderGeometry args={[rTop, rBot, h, 4]} />
      <meshStandardMaterial color={color} roughness={roughness} flatShading />
    </mesh>
  )
}

export function Pedestal({
  degraded = false, title = DEFAULT_PLAQUE_TITLE, subtitle = DEFAULT_PLAQUE_SUBTITLE, baseWidth = 3.0, columnHeight = 1.4
}) {
  const group = useRef<THREE.Group>(null)
  const currentOpacity = useRef(0)

  // Configure geometric ratios relative to baseWidth
  const { parts, plaqueY, plaqueZ, plaqueWidth, plaqueHeight, topSurfaceY, capRadius } = useMemo(() => {
    const specs = [
      { id: "bottomBase", h: 0.2, rTop: 1.0, rBot: 1.066 },
      { id: "transitionBase", h: 0.2, rTop: 0.866, rBot: 0.966 },
      { id: "column", h: columnHeight, rTop: 0.8, rBot: 0.866 },
      { id: "capFlair", h: 0.15, rTop: 0.933, rBot: 0.8 },
      { id: "capTop", h: 0.1, rTop: 1.0, rBot: 1.0, color: "#111", roughness: 0.4 },
    ]

    let currentY = 0
    const positioned = specs.map((s) => {
      const pos = currentY + s.h / 2
      currentY += s.h
      return {
        ...s,
        rTop: s.rTop * baseWidth,
        rBot: s.rBot * baseWidth,
        pos
      }
    })

    const totalHeight = currentY
    const offset = 1.05 - totalHeight

    const parts = positioned.map(p => ({ ...p, pos: p.pos + offset }))

    const column = parts.find(p => p.id === "column")!
    const capTop = parts.find(p => p.id === "capTop")!

    const plaqueY = column.pos //+ (column.h * 0.15)

    // slightly in front of the face
    const plaqueZ = (column.rBot + column.rTop) / 2 * 0.707 * 1.05
    const plaqueWidth = column.rBot
    const plaqueHeight = Math.min(column.h * 0.8, plaqueWidth * 0.4)

    return {
      parts,
      plaqueY,
      plaqueZ,
      plaqueWidth,
      plaqueHeight,
      topSurfaceY: totalHeight + offset,
      capRadius: capTop.rTop
    }
  }, [baseWidth, columnHeight])

  useFrame(({ camera }, delta) => {
    if (!group.current) return
    const targetOpacity = Math.max(0, Math.min(1, (camera.position.y + 5) * 1.2))

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
      {parts.map(({ id, ...props }) => (
        <PedestalPart key={id} {...props} />
      ))}

      {/* Reflector */}
      {!degraded && (
        <mesh position={[0, topSurfaceY + 0.001, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <circleGeometry args={[capRadius, 4]} />
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
            mirror={0.5} />
        </mesh>
      )}

      {/* Label Group */}
      <group position={[0, plaqueY, plaqueZ]} rotation={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[plaqueWidth, plaqueHeight, 0.06]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>
        <Text
          position={[0, 0.2, 0.04]}
          fontSize={0.2}
          color="#000"
          anchorX="center"
          anchorY="middle"
          maxWidth={plaqueWidth * 0.9}
          outlineColor="#f7c524"
          outlineWidth={0.005}
          outlineOffsetY={0.005}
        >
          {title}
        </Text>
        <Text
          position={[0, -0.12, 0.04]}
          fontSize={subtitle.length > 20 ? 0.09 : 0.12}
          color="#333"
          anchorX="center"
          anchorY="middle"
          maxWidth={plaqueWidth * 0.9}
          outlineColor="#f7c524"
          outlineWidth={0.002}
          outlineOffsetY={0.004}
        >
          {subtitle}
        </Text>
      </group>
    </group>
  )
}
