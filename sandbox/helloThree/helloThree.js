import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DirectionalLightHelper } from 'three/src/helpers/DirectionalLightHelper.js';
import { BasicAppContext } from "../../base/threeHelpers/basicAppContext.js";
import { basicDirectionalLight, degreeToRad, lilGuiControllerByName } from "../../base/threeHelpers/helpers.js";
import { clamp } from "../../base/lib/utility-functions.js";

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

  const brownCube = new THREE.Mesh(basicCubeGeometry, brownPhongMaterial);
  brownCube.name = "brownCube";
  brownCube.position.x = 10;
  brownCube.receiveShadow = true;
  brownCube.castShadow = true;

  const blueCube = new THREE.Mesh(basicCubeGeometry, blueLambertMaterial);
  blueCube.name = "blueCube";
  blueCube.position.x = -10;
  blueCube.receiveShadow = true;
  blueCube.castShadow = false;

  const ground = new THREE.Mesh(groundGeometry, grassStandardMaterial);
  ground.name = "ground";
  ground.rotateX(degreeToRad(-90));
  ground.scale.set(50, 50, 1);
  ground.receiveShadow = true;

  const cubeGroup = new THREE.Group();
  cubeGroup.name = "twoCubes";
  cubeGroup.translateY(10);
  cubeGroup.add(brownCube);
  cubeGroup.add(blueCube);

  // ---------- ANIMATIONLOOP ----------
  ctx.setAnimationLoop((self) => {
    const totalTime = self.fpsInfo.totalTime;
    const dt = self.fpsInfo.dt;

    self.fpsInfo.showFps();
    mainCamControls.update(dt);
    self.keyManager.handleEvents();

    const timeAsDegrees = totalTime % 360;

    // Feels illegal that these can be commented out due to them not being from
    // inside this lambda-function's scope:

    // const cubeGroup = self.getObjectInScene("twoCubes");
    // const blueCube = self.getObjectInScene("blueCube");
    // const brownCube = self.getObjectInScene("brownCube");
    // const pointLight = self.getObjectInScene("pointLight");

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

    blueCube.getWorldPosition(scratchVec3);

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

  ctx.keyManager.setHoldEventOn('KeyW', (dt) => {
    animations.brownCubeScale = clamp(
      animations.brownCubeScale + dt,
      animations.brownCubeParams.min,
      animations.brownCubeParams.max
    )
    brownCubeControllerHandle.updateDisplay();

  }).setHoldEventOn('KeyS', (dt) => {
    animations.brownCubeScale = clamp(
      animations.brownCubeScale - dt,
      animations.brownCubeParams.min,
      animations.brownCubeParams.max
    )
    brownCubeControllerHandle.updateDisplay();

  }).setHoldEventOn('KeyA', (dt) => {
    animations.blueCubeScale = clamp(
      animations.blueCubeScale + dt,
      animations.blueCubeParams.min,
      animations.blueCubeParams.max
    )
    blueCubeControllerHandle.updateDisplay();

  }).setHoldEventOn('KeyD', (dt) => {
    animations.blueCubeScale = clamp(
      animations.blueCubeScale - dt,
      animations.blueCubeParams.min,
      animations.blueCubeParams.max
    )
    blueCubeControllerHandle.updateDisplay();
  })

  // ---------- ADD ALL TO SCENE ----------
  ctx.addToScene(directionalLight);
  ctx.addToScene(directionalLightHelper);
  ctx.addToScene(pointLight);
  ctx.addToScene(ambientLight);
  ctx.addToScene(cubeGroup);
  ctx.addToScene(ground);

  ctx.startRender();
}
