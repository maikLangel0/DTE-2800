import * as THREE from "three";

/**@returns {THREE.BufferGeometry} */
export function createSquareGeometry() {
  const geometry = new THREE.BufferGeometry();

  const vertices = new Float32Array([
    -1.0, -1.0,  0.0, // v0
     1.0, -1.0,  0.0, // v1
     1.0,  1.0,  0.0, // v2
    -1.0,  1.0,  0.0, // v3
  ]);
  const indices = [
    0, 1, 2,
    2, 3, 0,
  ];
  const uvs = new Float32Array([
    0.0, 0.0, // v0: bottom left
    1.0, 0.0, // v1: bottom right
    1.0, 1.0, // v2: top right
    0.0, 1.0, // v3: top left
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  return geometry;
}
