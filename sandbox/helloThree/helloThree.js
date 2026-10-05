import * as THREE from "three";

const CANVAS_HEIGHT = window.innerHeight - 20;
const CANVAS_WIDTH = window.innerWidth - 40;

export const main = () => {
  const scene = new THREE.Scene() // <----- SCENE

  // ----- CANVAS
  /**@type {HTMLElement | null} */
  const canvas = document.getElementById("canvas")
  if (!(canvas instanceof HTMLCanvasElement)) throw Error("id of canvas in HTML is wrong.");

  canvas.height = CANVAS_HEIGHT;
  canvas.width = CANVAS_WIDTH;

  // ----- RENDERER
  const renderer = new THREE.WebGLRenderer({
    stencil: true,
    antialias: true,
    canvas: canvas,
  });
  renderer.setClearColor(0x000000);

  // ----- CAMERA
  const camera = new THREE.PerspectiveCamera(
    75,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    1000
  );
  camera.position.set(20, 20, 20);
  camera.lookAt(scene.position);

  // ----- GEOMETRIES AND MATERIALS
  const lines = addSumLines(scene, 10);
  const cube = addBasicCube(scene, 10, 0xac430c);
  scene.remove(lines);

  // ----- LIGHTS
  const ambient = new THREE.AmbientLight(0x0f0f0f, 0.2);

  const directional = new THREE.DirectionalLight(0x808080, 0.8);
  directional.position.set(6, 5, 5);

  const pointLight = new THREE.PointLight(0xffffff, 2);
  pointLight.position.set(6, 5, 5);
  
  scene.add(ambient);
  scene.add(directional);
  scene.add(pointLight);

  // ----- ANIMATION LAMBDA
  const pos = new THREE.Vector3();

  /**@param {number} time */
  const animate = (time) => {
    cube.rotation.x = time / 2000;
    cube.rotation.y = time / 1000;

    cube.getWorldPosition(pos);
    console.log(`POS: ${pos.x} | TIME ${time}`);

    lines.rotation.x = time / 2000;
    lines.rotation.y = time / 1000;

    renderer.render(scene, camera)
  }

  renderer.setAnimationLoop(animate);
}


/**
 * @param {THREE.Scene} scene
 * @param {number} length
 * @returns {THREE.Line}
 */
const addSumLines = (scene, length) => {
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });

  /**@type {THREE.Vector3[]} */
  const points = [];
  points.push(new THREE.Vector3(-length, 0, 0));
  points.push(new THREE.Vector3(0, length, 0));
  points.push(new THREE.Vector3(length, 0, 0));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);

  scene.add(line);
  return line;
}

/**
 * @param {THREE.Scene} scene
 * @param {number} size
 * @param {number} color
 * @returns {THREE.Mesh}
 */
const addBasicCube = (scene, size, color) => {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshPhongMaterial({ color: color });

  const cube = new THREE.Mesh(geometry, material)

  scene.add(cube);
  return cube;
}
