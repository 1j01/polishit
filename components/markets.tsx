"use client"

import * as THREE from 'three'
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { FunctionCurve3 } from '@/lib/FunctionCurve3'

export function Monitor() {
  const textureRef = useRef<THREE.CanvasTexture>(null!)
  const canvas = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    return canvas
  }, [])

  // const chartData = useMemo(() => {
  //   return new Float32Array(1024)
  //   return Array.from({ length: 100 }, (_, i) => Math.sin(i / 10) * 50 + 50)
  // }, [])
  // const chartBounds = useMemo(() => {
  //   return {
  //     xMin: 0,
  //     xMax: 100,
  //     yMin: 0,
  //     yMax: 100,
  //   }
  // }, [])

  // TODO: handle state in react way (doesn't matter much, and this was easier to think about, when deciding what state I want)
  const chartData: number[] = []
  let t = 0
  let y = 0

  useFrame(() => {
    const context = canvas.getContext('2d')
    if (!context) return null

    // Update chart data
    // TODO: slow down the update rate
    t += 0.01
    y += (Math.random() - 0.5) * 2 + 0.1
    chartData.push(y)
    if (chartData.length > 100) {
      chartData.shift()
    }
    const chartBounds = {
      xMin: 0,
      xMax: 100,
      yMin: Math.min(...chartData),
      yMax: Math.max(...chartData),
    }

    context.fillStyle = 'black'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = 'red'
    context.lineWidth = 3
    context.beginPath()
    for (let i = 0; i < chartData.length; i++) {
      const x = (i / chartData.length) * canvas.width
      const y = ((chartData[i] - chartBounds.yMin) / (chartBounds.yMax - chartBounds.yMin)) * canvas.height
      if (i === 0) {
        context.moveTo(x, y)
      } else {
        context.lineTo(x, y)
      }
    }
    context.stroke()

    textureRef.current.needsUpdate = true
  })

  return (
    <mesh position={[-2, 4, 0]} rotation={[0, Math.PI / 2, 0]} scale={[17, 10, 1]}>
      <planeGeometry />
      <meshBasicMaterial toneMapped={false}>
        <canvasTexture attach="map" args={[canvas]} colorSpace={THREE.SRGBColorSpace} ref={textureRef} />
      </meshBasicMaterial>
    </mesh>
  )
}

// export function PlummetingLine({ pointsCount = 100, speed = 0.5 }) {
//   const lineRef = useRef()
//   const progressRef = useRef(0)

//   // Generate a plummeting line shape (x increases, y sharply decreases)
//   const curve = useMemo(() => {
//     const pts = []
//     for (let i = 0; i < pointsCount; i++) {
//       const x = (i / pointsCount) * 10
//       const y = -Math.pow(i / pointsCount, 2) * 5 // parabola-like drop
//       pts.push(new THREE.Vector3(x, y, 0))
//     }
//     return new THREE.CatmullRomCurve3(pts)
//   }, [pointsCount])

//   const totalLength = curve.getLength()
//   const geometry = useMemo(() => new THREE.BufferGeometry(), [])

//   useFrame((state, delta) => {
//     progressRef.current += delta * speed
//     const visibleLength = Math.min(progressRef.current, 1) * totalLength

//     const sampledPoints = curve.getPoints(pointsCount)
//     const visiblePoints = []

//     let currentLength = 0
//     for (let i = 1; i < sampledPoints.length; i++) {
//       const segmentLength = sampledPoints[i - 1].distanceTo(sampledPoints[i])
//       if (currentLength + segmentLength > visibleLength) break
//       visiblePoints.push(sampledPoints[i])
//       currentLength += segmentLength
//     }

//     geometry.setFromPoints(visiblePoints)
//     lineRef.current.geometry = geometry
//   })

//   return (
//     <group>
//       <mesh position={[0, 0, 0]}>
//         <planeGeometry args={[12, 6]} />
//         <meshBasicMaterial color="#222" side={THREE.DoubleSide} />
//       </mesh>
//       <line ref={lineRef}>
//         <bufferGeometry />
//         <lineBasicMaterial color="red" linewidth={2} />
//       </line>
//     </group>
//   )
// }


// export function PlummetingLine({ pointsCount = 100, speed = 0.5 }) {

//   const lineGeometry = useMemo(() => {
//     const segments = 100

//     const curve = new FunctionCurve3((t, optionalTarget) => {
//       optionalTarget ??= new THREE.Vector3()

//       const x = (t) * 10
//       const y = -Math.pow(t, 2) * 5 // parabola-like drop
//       const z = 0 // flat line

//       return optionalTarget.set(x, y, z)
//     })

//     return new THREE.TubeGeometry(curve, segments, 0.1, 3, false)

//   }, [])
//   return (
//     <mesh>
//       <primitive object={lineGeometry} />
//       <meshBasicMaterial color="red" />
//     </mesh>
//   )

// }

// export function PlummetingLine({ width = 512, height = 256 }) {
//   const canvasRef = useRef<HTMLCanvasElement>(null!)
//   const textureRef = useRef<THREE.CanvasTexture>(null!)
//   const ctxRef = useRef<CanvasRenderingContext2D>(null!)
//   const progressRef = useRef(0)

//   // Initialize canvas and texture
//   const texture = useMemo(() => {
//     const canvas = document.createElement('canvas')
//     canvas.width = width
//     canvas.height = height
//     const ctx = canvas.getContext('2d')!
//     ctxRef.current = ctx

//     // Initial clear (why?)
//     ctx.fillStyle = 'blue'
//     ctx.fillRect(0, 0, width, height)

//     const tex = new THREE.CanvasTexture(canvas)
//     tex.minFilter = THREE.LinearFilter
//     textureRef.current = tex
//     canvasRef.current = canvas

//     return tex
//   }, [width, height])

//   // Animation loop
//   useFrame((_, delta) => {
//     if (!ctxRef.current || !canvasRef.current) return

//     const ctx = ctxRef.current
//     ctx.fillStyle = 'red'
//     progressRef.current += delta * 60 // pixels per second
//     const maxX = Math.min(progressRef.current, width)

//     // Clear
//     ctx.fillStyle = 'black'
//     ctx.fillRect(0, 0, width, height)

//     // Grid (optional)
//     ctx.strokeStyle = '#333'
//     ctx.lineWidth = 1
//     for (let i = 0; i < width; i += 64) {
//       ctx.beginPath()
//       ctx.moveTo(i, 0)
//       ctx.lineTo(i, height)
//       ctx.stroke()
//     }

//     // Draw the plummeting red line
//     ctx.beginPath()
//     ctx.moveTo(0, height * 0.2)
//     for (let x = 1; x < maxX; x++) {
//       const t = x / width
//       const y = height * (0.2 + 0.8 * Math.pow(t, 2)) // steep drop
//       ctx.lineTo(x, y)
//     }
//     ctx.strokeStyle = 'red'
//     ctx.lineWidth = 3
//     ctx.stroke()

//     textureRef.current.needsUpdate = true
//   })

//   return (
//     <mesh >
//       <planeGeometry args={[5, 2.5]} />
//       <meshBasicMaterial map={texture} toneMapped={false} />
//     </mesh>
//   )
// }

// export function PlummetingLine() {
//   const displacementMeshRef = useRef<THREE.Mesh>(null!)

//   const canvas = useRef(document.getElementById("canvas"))
//   //set the direction the line draws in
//   //1->ltr | -1->rtl
//   let dir = -1
//   //IMPORTANT: this must be set to greater than the length
//   //of the line
//   let length = 600
//   //the speed of the line draw
//   let speed = 1

//   let progress = 0
//   let lineInterval = -1

//   const drawLineOverTime = () => {
//     const canvasHolder = canvas.current

//     if (!canvasHolder) return

//     canvasHolder.width = 1024
//     canvasHolder.height = 1024

//     const context = canvasHolder.getContext("2d")
//     if (context) {
//       context.rect(0, 0, canvasHolder.width, canvasHolder.height)
//       context.fillStyle = "black"
//       context.filter = "blur(9px)"
//       context.fill()
//     }
//     var w = canvasHolder.width,
//       h = canvasHolder.height
//     context.fillRect(0, 0, w, h)

//     //Go!
//     // context.globalCompositeOperation = "copy";
//     drawLine()
//   }

//   const drawLine = () => {
//     //this clears itself once the line is drawn
//     lineInterval = setInterval(updateLine, 1)
//   }

//   function updateLine() {
//     //define the line
//     defineLine()

//     if (progress < length) {
//       progress += speed
//       moveDash(progress, dir)

//       if (canvas.current) {
//         if (displacementMeshRef.current) {
//           const texture = new THREE.CanvasTexture(canvas.current)

//           displacementMeshRef.current.material.map = texture
//           displacementMeshRef.current.material.displacementMap = texture
//         }
//       }
//     } else {
//       clearInterval(lineInterval)
//     }
//   }

//   const defineLine = () => {
//     const canvasHolder = canvas.current
//     const context = canvasHolder.getContext("2d")
//     context.beginPath()
//     context.moveTo(100, 20)
//     context.lineTo(200, 160)
//     context.quadraticCurveTo(230, 200, 250, 120)
//     context.bezierCurveTo(290, -40, 300, 200, 400, 150)
//     context.lineTo(500, 90)
//     context.lineWidth = 5
//     context.strokeStyle = "white"
//   }

//   const moveDash = (frac, dir) => {
//     const canvasHolder = canvas.current
//     const context = canvasHolder.getContext("2d")
//     //default direction right->left
//     var dir = dir || -1
//     context.setLineDash([length])
//     context.lineDashOffset = dir * (frac + length)
//     context.stroke()
//   }

//   useEffect(() => {
//     drawLineOverTime()
//   }, [])

//   return (
//     <mesh ref={displacementMeshRef} rotate={[Math.PI / 2, 0, 0]} dispose={null}>
//       <planeGeometry args={[10, 10, 500, 500]} />
//       <meshStandardMaterial displacementScale={1.1}>
//         <canvasTexture attach="map" needsUpdate />
//         <canvasTexture attach="displacementMap" needsUpdate />
//       </meshStandardMaterial>
//     </mesh>
//   )
// };

