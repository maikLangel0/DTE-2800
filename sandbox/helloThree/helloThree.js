import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DirectionalLightHelper } from 'three/src/helpers/DirectionalLightHelper.js';
import { BasicAppContext } from "../../base/threeHelpers/basicAppContext.js";
import { basicDirectionalLight, degreeToRad, lilGuiControllerByName } from "../../base/threeHelpers/helpers.js";

const CANVAS_HEIGHT = window.innerHeight - 20;
const CANVAS_WIDTH = window.innerWidth - 40;

const scratchVec3 = new THREE.Vector3();

// ---------- ALL ANIMATIONS ----------
const animations = {
  brownCubeScale: 1,
  brownCubeParams: {min: 0, max: 1, step: 0.05},
  blueCubeScale: 1,
  blueCubeParams: {min: 0, max: 1, step: 0.05},
}

export const main = async () => {
  // ---------- APPCONTEXT ----------
  const ctx = new BasicAppContext(
    {
      canvasId: "canvas",
      fpsId: "fps",
      height: CANVAS_HEIGHT,
      width: CANVAS_WIDTH,
      fov: 60
    }
  ).setFallbackTexturePath('../../base/textures/debugempty.png')

  // ---------- MAIN CAMERA CONTROLS ----------
  const mainCamControls = new OrbitControls(ctx.camera, ctx.renderer.domElement);
  mainCamControls.target.set(0, 0, 0);

  // ---------- TEXTURES ----------
  const grassTexture = await ctx.loadTexture(
    '../../base/textures/grassTexture.png',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    }
  );

  // ---------- MATERIALS N GEOMETRIES ----------
  ctx.materials.set(
    "grassStandard",
    new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: grassTexture })
  );

  // ---------- LIGHTS ----------
  const ambientLight = new THREE.AmbientLight(0x0f0f0f, 1);
  ambientLight.name = "ambientLight";

  const directionalLight = basicDirectionalLight({
    color: 0x808080,
    intensity: 5,
    position: [0, 100, 0],
    lookAt: [0, 0, 0],
    shadowMapSize: 2048,
    shadowCameraBounds: 60,
  });
  directionalLight.name = "directionalLight";

  const pointLight = new THREE.PointLight(0xffffff, 1000, 0, 1.7);
  pointLight.name = "pointLight";
  pointLight.translateY(10);

  const directionalLightHelper = new DirectionalLightHelper(directionalLight, 5, new THREE.Color());
  directionalLightHelper.name = "dirLightHelp";
  directionalLightHelper.visible = false;

  // ---------- MESHES ----------
  const groundGeometry = ctx.geometries.get("ground");
  const basicCubeGeometry = ctx.geometries.get("basicCube");

  const brownPhongMaterial = ctx.materials.get("brownPhong");
  const blueLambertMaterial = ctx.materials.get("blueLambertTransparent");
  const grassStandardMaterial = ctx.materials.get("grassStandard");

  const cube = new THREE.Mesh(basicCubeGeometry, brownPhongMaterial);
  cube.name = "brownCube";
  cube.position.x = 10;
  cube.receiveShadow = true;
  cube.castShadow = true;

  const cube2 = new THREE.Mesh(basicCubeGeometry, blueLambertMaterial);
  cube2.name = "blueCube";
  cube2.position.x = -10;
  cube2.receiveShadow = true;
  cube2.castShadow = false;

  const ground = new THREE.Mesh(groundGeometry, grassStandardMaterial);
  ground.name = "ground";
  ground.rotateX(degreeToRad(-90));
  ground.scale.set(50, 50, 1);
  ground.receiveShadow = true;

  const cubeGroup = new THREE.Group();
  cubeGroup.name = "twoCubes";
  cubeGroup.translateY(10);
  cubeGroup.add(cube);
  cubeGroup.add(cube2);

  // ---------- ANIMATIONLOOP ----------
  ctx.setAnimationLoop((self) => {
    const totalTime = self.fpsInfo.totalTime;
    const dt = self.fpsInfo.dt;

    self.fpsInfo.showFps();
    mainCamControls.update(dt);
    self.keyManager.handleEvents();

    const timeAsDegrees = totalTime % 360;

    const cubeGroup = self.getObjectInScene("twoCubes");

    const blueCube = self.getObjectInScene("blueCube");
    const brownCube = self.getObjectInScene("brownCube");
    const pointLight = self.getObjectInScene("pointLight");

    brownCube.scale.setScalar(animations.brownCubeScale);
    blueCube.scale.setScalar(animations.blueCubeScale);

    cubeGroup.position.y = 20 + 10 * Math.sin(timeAsDegrees);
    cubeGroup.rotation.y += dt;

    pointLight.position.y = 20 + 10 * Math.sin(timeAsDegrees + degreeToRad(90));

    brownCube.rotation.x += dt * 0.4;
    brownCube.rotation.y += dt * 0.2;
    brownCube.rotation.z += dt * 0.6;

    blueCube.rotation.x += dt * 0.4;
    blueCube.rotation.y += dt * 0.2;
    blueCube.rotation.z += dt * 0.6;

    blueCube.scale.x = 1 + Math.sin(timeAsDegrees + degreeToRad(90));

    cube.getWorldPosition(scratchVec3);

    console.log(`POS: ${scratchVec3.x, scratchVec3.y, scratchVec3.z} | TOTALTIME: ${totalTime}`);
  })

  ctx.setOnResize((camera, renderer) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  });

  // ---------- INPUT HANDLING ----------
  ctx.lilGui.title("animations");
  ctx.lilGui.add(animations, 'brownCubeScale')
    .min(animations.brownCubeParams.min)
    .max(animations.brownCubeParams.max)
    .step(animations.brownCubeParams.step)
    .name("brown cube scale");

  ctx.lilGui.add(animations, 'blueCubeScale')
    .min(animations.blueCubeParams.min)
    .max(animations.blueCubeParams.max)
    .step(animations.blueCubeParams.step)
    .name("blue cube scale");

  // Just to show I can do it like this:
  const brownCubeControllerHandle = lilGuiControllerByName(ctx.lilGui, "brown cube scale");
  const blueCubeControllerHandle = lilGuiControllerByName(ctx.lilGui, "blue cube scale");

  ctx.keyManager.setEventOn('KeyW', (dt) => {
    let res = animations.brownCubeScale + dt;
    if (res > animations.brownCubeParams.max) res = animations.brownCubeParams.max;

    animations.brownCubeScale = Math.min(
      animations.brownCubeScale + dt,
      animations.brownCubeParams.max
    );
    
    brownCubeControllerHandle.updateDisplay();

  }).setEventOn('KeyS', (dt) => {
    let res = animations.brownCubeScale - dt;
    if (res < animations.brownCubeParams.min) res = animations.brownCubeParams.min;

    animations.brownCubeScale = res;
    brownCubeControllerHandle.updateDisplay();

  }).setEventOn('KeyA', (dt) => {
    let res = animations.blueCubeScale + dt;
    if (res > animations.blueCubeParams.max) res = animations.blueCubeParams.max;

    animations.blueCubeScale = res;
    blueCubeControllerHandle.updateDisplay();

  }).setEventOn('KeyD', (dt) => {
    let res = animations.blueCubeScale - dt;
    if (res < animations.blueCubeParams.min) res = animations.blueCubeParams.min;

    animations.blueCubeScale = res;
    blueCubeControllerHandle.updateDisplay();
  })

  // ---------- ADD ALL TO SCENE ----------
  ctx.setObjectInScene(directionalLight);
  ctx.setObjectInScene(directionalLightHelper);
  ctx.setObjectInScene(pointLight);
  ctx.setObjectInScene(ambientLight);
  ctx.setObjectInScene(cubeGroup);
  ctx.setObjectInScene(ground);

  ctx.startRender();
}
