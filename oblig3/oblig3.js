import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";
import { basicDirectionalLight } from "../base/threeHelpers/helpers";
import { getOrThrow } from "../base/lib/utility-functions";
import { createCustomGround } from "./groundMesh";
import { loadTexSRGB } from "./texLoadWrapper";

const CANVAS_HEIGHT = window.innerHeight;
const CANVAS_WIDTH = window.innerWidth;

const GROUND_SIZE = 200;

export const main = async () => {
  const dirLightWorldPosBuffer = new THREE.Vector3();
  const dirLightTargetWorldPosBuffer = new THREE.Vector3();

  const animations = {
    movingGrassOffset: new THREE.Vector2(0, 0),
  };

  const ctx = new BasicAppContext({
    canvasId: "canvas",
    fpsId: "fps",
    height: CANVAS_HEIGHT,
    width: CANVAS_WIDTH,
    fov: 60,
  }).camPosition(0, 20, 0);
  ctx.renderer.setClearColor(0xADD8E6);

  const mainCameraControls = new OrbitControls(ctx.camera, ctx.renderer.domElement);

  const grassTexture = await loadTexSRGB(ctx, '../../base/textures/newGrassTexture.png');
  const grassNormal = await loadTexSRGB(ctx, '../../base/textures/grassNormal.png');

  const directionalLight = basicDirectionalLight({
    color: 0xffffff,
    intensity: 1,
    position: [0, 80, 0],
    lookAt: [0, 0, 0],
    shadowMapSize: 2048,
    shadowCameraBounds: 60,
  });
  directionalLight.name = "mainDirectionalLight";

  const ambientLight = new THREE.AmbientLight(0x0f0f0f, 2);
  ambientLight.name = "ambientLight";

  const pointLight = new THREE.PointLight(0xffffff, 1, 0, 1.7);
  pointLight.name = "pointLight";
  pointLight.translateY(10);

  const groundUniforms = {
    "ratio": { value: 0.85 },
    "movingGrassOffset": { value: animations.movingGrassOffset },
    "ambientLightColor": { value: [...ambientLight.color, 1.0] },
    "ambientLightIntensity": { value: ambientLight.intensity },
    "directionalLightColor": { value: [...directionalLight.color, 1.0] },
    "directionalLightIntensity": { value: directionalLight.intensity },
    "directionalLightDirection": { value: new THREE.Vector3() },
    "pointLightColor": { value: [...pointLight.color, 1.0] },
    "pointLightIntensity": { value: pointLight.intensity },
    "pointLightWorldPosition": { value: new THREE.Vector3() },
    "groundWorldPosition": { value: new THREE.Vector3() },
    "cameraWorldPosition": { value: new THREE.Vector3() },
    "texRepeat": { value: 10 },
    "steadyGrass": { value: grassTexture },
    "movingGrass": { value: grassTexture },
    "grassNormal": { value: grassNormal }
  };
  const [ground, groundShadow] = await createCustomGround({
    groundSize: GROUND_SIZE,
    uniforms: groundUniforms,
    vertexShader: getOrThrow(document.getElementById("grassVertShader")?.textContent),
    fragmentShader: getOrThrow(document.getElementById("grassFragShader")?.textContent),
  });

  ctx.setAnimationLoop((self) => {
    const totalTime = self.fpsInfo.totalTime;
    const dt = self.fpsInfo.dt;

    // ---------- UPDATES ----------
    self.fpsInfo.showFps();
    mainCameraControls.update(dt);
    self.keyManager.handleEvents();

    // ---------- POPULATING BUFFERS AND UNIFORMS ----------
    self.camera.getWorldPosition(groundUniforms.cameraWorldPosition.value);
    ground.getWorldPosition(groundUniforms.groundWorldPosition.value);
    pointLight.getWorldPosition(groundUniforms.pointLightWorldPosition.value);
    directionalLight.getWorldPosition(dirLightWorldPosBuffer);
    directionalLight.target.getWorldPosition(dirLightTargetWorldPosBuffer);

    groundUniforms.directionalLightDirection.value.copy(
      dirLightWorldPosBuffer
        .sub(dirLightTargetWorldPosBuffer)
        .normalize()
    )

    // ---------- ANIMATIONS ----------

    animations.movingGrassOffset.x = Math.sin(totalTime) / (7 * GROUND_SIZE);
    animations.movingGrassOffset.y = Math.cos(totalTime) / (11 * GROUND_SIZE);
  })

  ctx.setObjectInScene(directionalLight);
  ctx.setObjectInScene(ambientLight);
  ctx.setObjectInScene(pointLight);
  ctx.setObjectInScene(ground);
  ctx.setObjectInScene(groundShadow);

  ctx.startRender();
}
