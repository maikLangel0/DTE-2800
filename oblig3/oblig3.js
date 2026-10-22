import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";
import { getOrThrow } from "../base/lib/utility-functions";
import { createCustomGround } from "./groundMesh";
import { loadTexSRGB } from "./texLoadWrapper";
import { createMainSceneLights } from "./mainSceneLights";

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

  const animations = {
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

  const { mainDirectionalLight, mainPointLight, mainAmbientLight } = createMainSceneLights();

  const grassTexture = await loadTexSRGB(ctx, '../../base/textures/grassTexture.png');
  const groundUniforms = {
    "ratio": { value: 0.80 },
    "movingGrassOffset": { value: animations.movingGrassOffset },
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
  const { ground, lightOverlay } = await createCustomGround({
    groundSize: GROUND_SIZE,
    uniforms: groundUniforms,
    vertexShader: getOrThrow(document.getElementById("grassVertShader")?.textContent),
    fragmentShader: getOrThrow(document.getElementById("grassFragShader")?.textContent),
  });

  // ---------- METAL CUBE
  const metalnessTexture = await loadTexSRGB(ctx, '../../base/textures/metalnessTexture500x500.jpg');
  const qb = ctx.geometries.get("basicCube");
  const qbMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f9f9f,
    metalness: 1.0,
    metalnessMap: metalnessTexture,
  });
  const basicCube = new THREE.Mesh(qb, qbMaterial);
  basicCube.castShadow = true;
  basicCube.name = "basicCube";
  basicCube.translateY(10);

  // ---------- WHEEL
  const wheelCylinderHeight = 3;
  const wheel = new THREE.Group();
  wheel.name = "wheel1";
  
  const wheelRimTexture = await loadTexSRGB(ctx, '../../base/textures/tireRim.jpg');
  const sideFaceTexture = await loadTexSRGB(ctx, '../../base/textures/tireSideFace.png');
  
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
  wheel.position.set(5, 5, 5);
  
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

    animations.movingGrassOffset.x = Math.sin(totalTime) / (7 * GROUND_SIZE);
    animations.movingGrassOffset.y = Math.cos(totalTime) / (11 * GROUND_SIZE);
  })

  ctx.setObjectInScene(ground);
  ctx.setObjectInScene(lightOverlay);
  ctx.setObjectInScene(mainPointLight);
  ctx.setObjectInScene(mainAmbientLight);
  ctx.setObjectInScene(mainDirectionalLight);

  ctx.setObjectInScene(basicCube);
  ctx.setObjectInScene(wheel);

  ctx.startRender();
}
