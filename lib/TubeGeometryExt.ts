// Taken from https://discourse.threejs.org/t/extended-tubegeometry/80539

import * as THREE from 'three';
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export class TubeGeometryExt extends THREE.BufferGeometry {
  constructor(
    path: THREE.Curve<THREE.Vector3> = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(1, 1, 0)
    ),
    tubularSegments = 64,
    radius = 1,
    radialSegments = 8,
    closed = false,
    capped = false,
    RGenerator = function (i: number, j: number) {
      return 1;
    }
  ) {
    super();

    this.type = "TubeGeometry";

    this.parameters = {
      path: path,
      tubularSegments: tubularSegments,
      radius: radius,
      radialSegments: radialSegments,
      closed: closed,
      capped: closed == true ? false : capped,
      RGenerator: RGenerator
    };

    const frames = path.computeFrenetFrames(tubularSegments, closed);

    // expose internals

    this.tangents = frames.tangents;
    this.normals = frames.normals;
    this.binormals = frames.binormals;

    // helper variables

    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const uv = new THREE.Vector2();
    let P = new THREE.Vector3();

    // buffer

    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indices);
    this.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    this.computeVertexNormals();
    
    // correct seam normals
    let n1 = new THREE.Vector3();
    let n2 = new THREE.Vector3();
    let n = new THREE.Vector3();
    let nor = this.attributes.normal;
    for(let i = 0; i <= tubularSegments; i++){
      let idx1 = i * (radialSegments + 1);
      let idx2 = i * (radialSegments + 1) + radialSegments;
      
      n1.fromBufferAttribute(nor, idx1);
      n2.fromBufferAttribute(nor, idx2);
      
      n.addVectors(n1, n2).multiplyScalar(0.5).normalize();
      
      nor.setXYZ(idx1, n.x, n.y, n.z);
      nor.setXYZ(idx2, n.x, n.y, n.z);
    }
    //////////////////////
    
    if (this.parameters.capped == true){
      
      this.copy(mergeGeometries([
        this,
        getCap(0, 0),
        getCap(this.parameters.tubularSegments + 1, 1)
      ], true))  
    }
    

    // functions
    
    function getCap(segmentIndex: number, t: number){
      
      let startIdx = segmentIndex * (radialSegments);
      let endIdx = (segmentIndex + 1) * (radialSegments);
      let verticesPart = t > 0 ? vertices.slice( -( radialSegments + 1 ) * 3) : vertices.slice( 0, (radialSegments + 1) * 3 );
      
      let positions = [
        ...path.getPointAt(t),
        ...verticesPart
      ];
      
      
      let capG = new THREE.BufferGeometry();
      capG.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      
      let uvs = [0.5, 0.5];
      for(let iUV = 0; iUV <= radialSegments; iUV++){
        let a = (iUV / radialSegments) * Math.PI * 2;
        uvs.push(
          Math.cos(a) * 0.5 + 0.5,
          Math.sin(a) * 0.5 + 0.5
        );
      }
      capG.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));      
      
      let indices = Array.from({length: radialSegments}, (_, idx) => {
        return [0, idx + 1, idx + 2];
      }).flat();
      
      if (segmentIndex != 0) {indices = indices.reverse()}
      capG.setIndex(indices);
      capG.computeVertexNormals();
      
      return capG;
    }

    function generateBufferData() {
      for (let i = 0; i < tubularSegments; i++) {
        generateSegment(i);
      }

      generateSegment(closed === false ? tubularSegments : 0);

      generateUVs();

      generateIndices();
    }

    function generateSegment(i: number) {
      P = path.getPointAt(i / tubularSegments, P);

      const N = frames.normals[i];
      const B = frames.binormals[i];

      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;

        const sin = Math.sin(v);
        const cos = -Math.cos(v);

        let rScale = RGenerator(i / tubularSegments, v);

        normal.x = cos * N.x + sin * B.x;
        normal.y = cos * N.y + sin * B.y;
        normal.z = cos * N.z + sin * B.z;
        normal.normalize();
        normals.push(normal.x, normal.y, normal.z);

        vertex.x = P.x + radius * rScale * normal.x;
        vertex.y = P.y + radius * rScale * normal.y;
        vertex.z = P.z + radius * rScale * normal.z;
        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    function generateIndices() {
      for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1);
          const b = (radialSegments + 1) * j + (i - 1);
          const c = (radialSegments + 1) * j + i;
          const d = (radialSegments + 1) * (j - 1) + i;

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }
    }

    function generateUVs() {
      for (let i = 0; i <= tubularSegments; i++) {
        for (let j = 0; j <= radialSegments; j++) {
          uv.x = i / tubularSegments;
          uv.y = j / radialSegments;

          uvs.push(uv.x, uv.y);
        }
      }
    }
  }
}
// Example usage
  // let radiusCurve = new THREE.CatmullRomCurve3(
  //   Array.from({ length: 30 }, (_, idx) => {
  //     let r = (Math.random() * 0.75 + 0.25) * 1.5;
  //     r = idx == 0 || idx == 29 ? 0 : r; 
  //     return new THREE.Vector3(idx, r, 0);
  //   })
  // );

  // let tubeCurve = new THREE.CatmullRomCurve3(
  //     Array.from({ length: 5 }, () => {
  //       return new THREE.Vector3().randomDirection().multiplyScalar(5);
  //     }),
  //     true,
  //     "catmullrom",
  //     1
  //   );

  // let g = new TubeGeometryExt(
  //   tubeCurve,
  //   1000,
  //   Math.random() * 0.75 + 0.25,
  //   100,
  //   false,
  //   false,
    
  //   function (i, j) { // [0..1], [0..2PI]
  //     let r = radiusCurve.getPoint(i).y;
  //     let swaying = Math.sin(Math.PI * 2 * 10 * i) * Math.PI;
  //     r *= (Math.sin(j * 5 + swaying) * 0.5 + 0.5) + 0.5;
  //     return r;
  //   }
  //   /**/
  // );
  // let m = new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(Math.random(), 1, 0.5), wireframe: false });
  // let o = new THREE.Mesh(g, m);
  // scene.add(o);
