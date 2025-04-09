"use client";
import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";

export function Polishable({ children }: { children: React.ReactNode; }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const roughnessMapRef = useRef<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isPolishing = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { raycaster, camera, gl, get } = useThree();

  // Initialize the roughness map
  useEffect(() => {
    // Create a canvas for the roughness map
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    canvasRef.current = canvas;

    const context = canvas.getContext("2d");
    if (!context) return;
    contextRef.current = context;

    // Fill with medium roughness (gray color)
    context.fillStyle = "#808080"; // Medium gray for medium roughness
    context.fillRect(0, 0, canvas.width, canvas.height);
    // Add some spots
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      drawPolishingSpot(x, y, Math.random() * 20 + 5, `hsla(0, 0%, ${Math.random() * 100}%, 0.2)`);
    }

    // Create the texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    roughnessMapRef.current = texture;

    setIsInitialized(true);
  }, []);

  function drawPolishingSpot(canvasX: number, canvasY: number, radius = 50, color = "rgba(32, 32, 32, 0.2)") {
    const context = contextRef.current;
    if (!context) return;
    context.save();
    context.translate(canvasX, canvasY);
    context.scale(0.2, 1); // TO COUNTERACT UNEQUAL UVS
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawPolishingSpotWrapped(canvasX: number, canvasY: number, radius = 50, color = "rgba(32, 32, 32, 0.2)") {
    // Wrap to avoid seams. There will still be ugliness at the poles, but no hard edge running between the poles.
    for (let xRepetition = -1; xRepetition <= 1; xRepetition++) {
      for (let yRepetition = -1; yRepetition <= 1; yRepetition++) {
        drawPolishingSpot(canvasX + xRepetition * canvasRef.current!.width, canvasY + yRepetition * canvasRef.current!.height, radius, color);
      }
    }
  }

  // Handle mouse events
  useEffect(() => {
    if (!gl.domElement) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (getUV(event)) {
        isPolishing.current = true;
        // @ts-ignore
        get().controls.enabled = false;
        polish(event);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isPolishing.current) {
        polish(event);
      }
    };

    const handleMouseUp = () => {
      isPolishing.current = false;
      // @ts-ignore
      get().controls.enabled = true;
    };

    const getUV = (event: MouseEvent) => {
      if (!meshRef.current || !contextRef.current || !canvasRef.current) return;

      // Check for intersections
      const intersects = raycaster.intersectObject(meshRef.current);
      if (intersects.length > 0) {
        const uv = intersects[0].uv;
        if (!uv) return;
        return uv;
      }
      return null;
    };

    const polish = (event: MouseEvent) => {
      if (!meshRef.current || !contextRef.current || !canvasRef.current) return;
      const uv = getUV(event);
      if (uv) {

        // Convert UV to canvas coordinates
        const canvasX = Math.floor(uv.x * canvasRef.current.width);
        const canvasY = Math.floor((1 - uv.y) * canvasRef.current.height);

        // Draw a polishing spot (darker = less rough)
        drawPolishingSpotWrapped(canvasX, canvasY);

        // Update the texture
        if (roughnessMapRef.current) {
          roughnessMapRef.current.needsUpdate = true;
        }
      }
    };

    gl.domElement.addEventListener("mousedown", handleMouseDown);
    gl.domElement.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      gl.domElement.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gl, raycaster, camera]);

  // Create material with the roughness map
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#cc6600",
      metalness: 1,
      roughnessMap: roughnessMapRef.current,
      roughness: 1,
    });
  }, [isInitialized]);

  // Slowly rotate the object
  useFrame((_: unknown, delta: number) => {
    if (meshRef.current && !isPolishing.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      {children}
    </mesh>
  );
}
