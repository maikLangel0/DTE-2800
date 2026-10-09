import * as THREE from "three";
import { BasicAppContext } from "../../base/threeHelpers/basicAppContext.js";
import { GeometryMap, LightMap, MaterialMap } from "../../base/threeHelpers/utilMaps.js";

const CANVAS_HEIGHT = window.innerHeight - 20;
const CANVAS_WIDTH = window.innerWidth - 40;

const ctx = new BasicAppContext({
  canvasId: "canvas",
  height: CANVAS_HEIGHT,
  width: CANVAS_WIDTH,
  fov: 60
})
ctx.setAnimationLoop((scene, totaltime, dt) => {
  const cube = scene.getObjectByName("brownCube");
  if (cube === undefined) return;

  cube.rotation.x += dt;
  cube.rotation.y += dt * 2;

  cube.getWorldPosition(posBuffer);
  console.log(`POS: ${posBuffer.x} | TOTALTIME ${totaltime}`);
})

const materials = new MaterialMap([
  { label: "brownPhong", value: new THREE.MeshPhongMaterial({ color: 0xac430c }) },
  { label: "blueLine", value: new THREE.LineBasicMaterial({ color: 0x0000ff }) },
]);

const geometries = new GeometryMap([
  { label: "basicCube", value: new THREE.BoxGeometry(10, 10, 10) }
]);

const lights = new LightMap([
  { label: "ambient", value: new THREE.AmbientLight(0x0f0f0f, 0.2) },
  { label: "directional", value: new THREE.DirectionalLight(0x808080, 0.8) },
  { label: "point", value: new THREE.PointLight(0xffffff, 2) },
])

const posBuffer = new THREE.Vector3();

export const main = () => {
  const cube = new THREE.Mesh(geometries.get("basicCube"), materials.get("brownPhong"));

  lights.get("directional").position.set(6, 5, 5);
  lights.get("point").position.set(6, 5, 5);

  ctx.setLightsFromLightsMap(lights);
  ctx.setMesh("brownCube", cube);

  ctx.initScene();
  ctx.startRender();
}


// ----- UNUSED BUT KEWL -----

/**
 * @param {THREE.Scene} scene
 * @param {number} size
 * @param {number} color
 * @returns {THREE.Mesh}
 */
const basicCube = (scene, size, color) => {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshPhongMaterial({ color: color });

  const cube = new THREE.Mesh(geometry, material)

  scene.add(cube);

  return cube;
}

/**
 * @param {number} length
 * @returns {THREE.Line}
 */
const addSumLines = (length) => {
  /**@type {THREE.Vector3[]} */
  const points = [];
  points.push(new THREE.Vector3(-length, 0, 0));
  points.push(new THREE.Vector3(0, length, 0));
  points.push(new THREE.Vector3(length, 0, 0));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, materials.get("blueLine"));

  return line;
}
