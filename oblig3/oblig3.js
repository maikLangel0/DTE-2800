import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";
import { basicDirectionalLight } from "../base/threeHelpers/helpers";
import { createSquareGeometry } from "../base/threeHelpers/geometryFunctions";
import { getOrThrow } from "../base/lib/utility-functions";

const CANVAS_HEIGHT = window.innerHeight;
const CANVAS_WIDTH = window.innerWidth;

export const main = async () => {
  const grassVertShader = getOrThrow(document.getElementById("grassVertShader")?.textContent);
  const grassFragShader = getOrThrow(document.getElementById("grassFragShader")?.textContent);

  const camPosBuffer = new THREE.Vector3();
  const dirLightPosBuffer = new THREE.Vector3();

  const animations = {
    movingGrassOffset: new THREE.Vector2(100, 0),
  };

  const ctx = new BasicAppContext({
    canvasId: "canvas",
    fpsId: "fps",
    height: CANVAS_HEIGHT,
    width: CANVAS_WIDTH,
    fov: 60,
  }).camPosition(0, 20, 0);
  ctx.camera.getWorldPosition(camPosBuffer);

  const mainCameraControls = new OrbitControls(ctx.camera, ctx.renderer.domElement);

  /**@type {THREE.Texture<HTMLImageElement>} */
  const grassTexture = await ctx.loadTexture(
    '../../base/textures/newGrassTexture.png',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    }
  );
  const grassNormal = await ctx.loadTexture(
    '../../base/textures/grassNormal.png',
    (normal) => {
      normal.colorSpace = THREE.SRGBColorSpace;
      normal.wrapS = THREE.RepeatWrapping;
      normal.wrapT = THREE.RepeatWrapping;
    }
  )

  const directionalLight = basicDirectionalLight({
    color: 0xffffff,
    intensity: 3,
    position: [0, 100, 0],
    lookAt: [0, 0, 0],
    shadowMapSize: 2048,
    shadowCameraBounds: 60,
  });
  directionalLight.name = "mainDirectionalLight";
  directionalLight.getWorldPosition(dirLightPosBuffer);

  const ambientLight = new THREE.AmbientLight(0x0f0f0f, 2);
  ambientLight.name = "ambientLight";

  const groundGeometry = createSquareGeometry();
  const grassCustomMaterial = new THREE.ShaderMaterial({
    uniforms: {
      "ratio": { value: 0.85 },
      "movingGrassOffset": { value: animations.movingGrassOffset },
      "ambientLightColor": { value: [...ambientLight.color, 1.0] },
      "directionalLightColor": { value: [directionalLight.color, 1.0] },
      "modelMatrix": { value: new THREE.Matrix4() },
      "texRepeat":   { value: 10 },
      "camPosition": { value: camPosBuffer },
      "directionalLightPosition": { value: dirLightPosBuffer },
      "steadyGrass": { value: grassTexture },
      "movingGrass": { value: grassTexture },
      "grassNormal": { value: grassNormal }
    },
    fragmentShader: grassFragShader,
    vertexShader: grassVertShader,
    glslVersion: THREE.GLSL3,
    transparent: true,
    side: THREE.DoubleSide,
  })

  const ground = new THREE.Mesh(groundGeometry, grassCustomMaterial);
  ground.name = "ground";
  ground.rotateX(Math.PI / 2);
  ground.scale.set(200, 200, 1);
  ground.receiveShadow = true;

  ctx.setAnimationLoop((self) => {
    const totalTime = self.fpsInfo.totalTime;
    const dt = self.fpsInfo.dt;

    self.fpsInfo.showFps();
    mainCameraControls.update(dt);
    self.keyManager.handleEvents();

    animations.movingGrassOffset.x = Math.sin(totalTime * Math.PI / 7) / 51;
    animations.movingGrassOffset.y = Math.sin(totalTime * Math.PI / 5) / 67;
  })

  ctx.setObjectInScene(directionalLight);
  ctx.setObjectInScene(ambientLight);
  ctx.setObjectInScene(ground);

  ctx.startRender();
}
