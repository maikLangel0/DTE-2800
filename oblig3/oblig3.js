import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";
import { getOrThrow } from "../base/lib/utility-functions";
import { createCustomGround, createFallbackTexture, createMainSceneLights, loadTexSRGB, loadVideoTexture } from "./oblig3helpers";

const CANVAS_HEIGHT = window.innerHeight;
const CANVAS_WIDTH = window.innerWidth;

const GROUND_SIZE = 200;

export const main = async () => {
  const buffers = {
    cameraWorldPos: new THREE.Vector3(),
    groundWorldPos: new THREE.Vector3(),

    mainPointLightWorldPos: new THREE.Vector3(),

    mainDirLightWorldPos: new THREE.Vector3(),
    mainDirLightDirection: new THREE.Vector3(),
    mainDirLightTargetWorldPos: new THREE.Vector3(),
  }

  const mainAnimations = {
    movingGrassOffset: new THREE.Vector2(0, 0),
  };

  const ctx = new BasicAppContext({
    canvasId: "canvas",
    fpsId: "fps",
    height: CANVAS_HEIGHT,
    width: CANVAS_WIDTH,
    fov: 60,
  }).camPosition(20, 20, 20);
  ctx.renderer.setClearColor(0xADD8E6);

  const mainCameraControls = new OrbitControls(ctx.camera, ctx.renderer.domElement);

  // ---------- ALL TEXTURES INITIALIZED ----------
  const {
    videoHandle: howToVideoHandle,
    texture: howToVideoTexture
  } = loadVideoTexture('../../base/videos/howTo.webm');

  const fallbackTexture = createFallbackTexture();
  const grassTexture = await loadTexSRGB(ctx, '../../base/textures/newGrassTexture.png');
  const wheelRimTexture = await loadTexSRGB(ctx, '../../base/textures/tireRim.jpg');
  const sideFaceTexture = await loadTexSRGB(ctx, '../../base/textures/tireSideFace.png');
  const metalnessTexture = await loadTexSRGB(ctx, '../../base/textures/metalnessTexture500x500.jpg');
  const shatterAlphaMap = await ctx.loadTexture('../../base/textures/shatterAlphaMapInverted.png');
  shatterAlphaMap.colorSpace = THREE.NoColorSpace;
  // ---------- MAIN SCENE LIGHTS ----------
  const {
    mainDirectionalLight,
    mainPointLight,
    mainAmbientLight
  } = createMainSceneLights();

  // ---------- GROUND ----------
  const groundUniforms = {
    "ratio": { value: 0.80 },
    "movingGrassOffset": { value: mainAnimations.movingGrassOffset },
    "ambientLightColor": { value: [...mainAmbientLight.color, 1.0] },
    "ambientLightIntensity": { value: mainAmbientLight.intensity },
    "directionalLightColor": { value: [...mainDirectionalLight.color, 1.0] },
    "directionalLightIntensity": { value: mainDirectionalLight.intensity },
    "directionalLightDirection": { value: buffers.mainDirLightDirection },
    "pointLightColor": { value: [...mainPointLight.color, 1.0] },
    "pointLightIntensity": { value: mainPointLight.intensity },
    "pointLightWorldPosition": { value: buffers.mainPointLightWorldPos },
    "groundWorldPosition": { value: buffers.groundWorldPos },
    "cameraWorldPosition": { value: buffers.cameraWorldPos },
    "texRepeat": { value: 10 },
    "steadyGrass": { value: grassTexture },
    "movingGrass": { value: grassTexture },
  };
  const {
    ground,
    lightOverlay
  } = createCustomGround({
    groundSize: GROUND_SIZE,
    uniforms: groundUniforms,
    vertexShader: getOrThrow(document.getElementById("grassVertShader")?.textContent),
    fragmentShader: getOrThrow(document.getElementById("grassFragShader")?.textContent),
  });

  // ---------- METAL CUBE
  const qb = ctx.geometries.get("basicCube");
  const qbMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f9f9f,
    metalness: 1.0,
    metalnessMap: metalnessTexture,
    alphaMap: shatterAlphaMap,
    transparent: true,
    side: THREE.DoubleSide
  })
  const qbVideoMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f9f9f,
    metalness: 1.0,
    metalnessMap: metalnessTexture,
    map: howToVideoTexture,
    side: THREE.DoubleSide
  });
  const basicCube = new THREE.Mesh(qb, [
    qbVideoMaterial, qbMaterial, qbMaterial,
    qbMaterial,      qbMaterial, qbMaterial
  ]);
  basicCube.castShadow = true;
  basicCube.name = "basicCube";
  basicCube.translateY(10);

  // ---------- WHEEL
  const wheelCylinderHeight = 3;
  const wheel = new THREE.Group();
  wheel.name = "wheel1";

  const rimGeometry = new THREE.CylinderGeometry(5, 5, wheelCylinderHeight, 20, 20, true);
  const rimMaterial = new THREE.MeshStandardMaterial({ map: wheelRimTexture });
  const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
  rimMesh.name = "wheel1Rim";
  rimMesh.castShadow = true;
  rimMesh.rotateX(Math.PI / 2);

  const sideFaceGeometry = new THREE.CircleGeometry(5, 20);
  const sideFaceMaterial = new THREE.MeshStandardMaterial({ map: sideFaceTexture });

  const sideFaceFrontMesh = new THREE.Mesh(sideFaceGeometry, sideFaceMaterial);
  sideFaceFrontMesh.name = "wheel1FrontFace";
  sideFaceFrontMesh.castShadow = true;
  sideFaceFrontMesh.translateZ(wheelCylinderHeight / 2);

  const sideFaceBackMesh = new THREE.Mesh(sideFaceGeometry, sideFaceMaterial);
  sideFaceBackMesh.name = "wheel1BackFace";
  sideFaceBackMesh.castShadow = true;
  sideFaceBackMesh.translateZ(-wheelCylinderHeight / 2);
  sideFaceBackMesh.rotateY(Math.PI)

  wheel.add(rimMesh);
  wheel.add(sideFaceFrontMesh);
  wheel.add(sideFaceBackMesh);
  wheel.position.set(-7.5, 5, -7.5);

  // ---------- EXTRUDE GEOMETRY EXAMPLE
  const extrudeLength = 2;
  const extrudeHeight = 8;
  const halfExtrudeLength = extrudeLength / 2;
  const halfExtrudeHeight = extrudeHeight / 2;

  const extrudePoints = [
    new THREE.Vector2(-halfExtrudeLength, -halfExtrudeHeight),
    new THREE.Vector2(-halfExtrudeLength,  halfExtrudeHeight),
    new THREE.Vector2(halfExtrudeLength,   halfExtrudeHeight),
    new THREE.Vector2(halfExtrudeLength,  -halfExtrudeHeight),
    new THREE.Vector2(-halfExtrudeLength, -halfExtrudeHeight),
  ]

  const extrudeShape = new THREE.Shape(extrudePoints);
  const extrudeGeometry = new THREE.ExtrudeGeometry(extrudeShape, { bevelThickness: 0.4, bevelSize: 1.0});
  const extrudeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
  const extrudeMesh = new THREE.Mesh(extrudeGeometry, extrudeMaterial);
  extrudeMesh.name = "extrudeMesh";
  extrudeMesh.castShadow = true;

  extrudeMesh.position.set(-7, halfExtrudeHeight, 5);

  // ---------- THE ANIMATIONLOOP ----------
  ctx.setAnimationLoop((self) => {
    const totalTime = self.fpsInfo.totalTime;
    const dt = self.fpsInfo.dt;

    // ---------- UPDATES ----------
    self.fpsInfo.showFps();
    mainCameraControls.update(dt);
    self.keyManager.handleEvents();

    // ---------- POPULATING BUFFERS ----------
    self.camera.getWorldPosition(buffers.cameraWorldPos);
    ground.getWorldPosition(buffers.groundWorldPos);
    mainPointLight.getWorldPosition(buffers.mainPointLightWorldPos);

    mainDirectionalLight.getWorldPosition(buffers.mainDirLightWorldPos);
    mainDirectionalLight.target.getWorldPosition(buffers.mainDirLightTargetWorldPos);

    const mainDirLightDirection = buffers.mainDirLightWorldPos.clone().sub(buffers.mainDirLightTargetWorldPos);
    groundUniforms.directionalLightDirection.value.copy(mainDirLightDirection);

    // ---------- ANIMATIONS ----------
    mainAnimations.movingGrassOffset.x = Math.sin(totalTime) / (7 * GROUND_SIZE);
    mainAnimations.movingGrassOffset.y = Math.cos(totalTime) / (11 * GROUND_SIZE);
  })

  ctx.setObjectInScene(ground);
  ctx.setObjectInScene(lightOverlay);
  ctx.setObjectInScene(mainPointLight);
  ctx.setObjectInScene(mainAmbientLight);
  ctx.setObjectInScene(mainDirectionalLight);

  ctx.setObjectInScene(basicCube);
  ctx.setObjectInScene(wheel);
  ctx.setObjectInScene(extrudeMesh)

  howToVideoHandle.muted = true;
  ctx.startRender();
}
