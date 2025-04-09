"use client"

import * as THREE from "three"
import { FunctionCurve3 } from "@/lib/FunctionCurve3"
import { TubeGeometryExt } from "@/lib/tube-geometry-ext"

export function makeTurdGeometry() {
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
}
