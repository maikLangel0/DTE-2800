import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";
import { clamp, getOrThrow } from "../base/lib/utility-functions";
import { createCustomGround, createFallbackTexture, createMainSceneLights, loadTexSRGB, loadVideoTexture } from "./oblig3helpers";
import { addTmpExamples } from "./_tmp";
import { Transformer } from "./transformer";

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
  }).camPosition(0, 20, 50);
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
  const wheelSideTexture = await loadTexSRGB(ctx, '../../base/textures/tireSideFace.png');
  const metalnessTexture = await loadTexSRGB(ctx, '../../base/textures/metalnessTexture500x500.jpg');
  const shatterAlphaMap = await ctx.loadTexture('../../base/textures/shatterAlphaMapInverted.png');
  const circleAlphaMap = await ctx.loadTexture('../../base/textures/blackCircle.jpg');
  shatterAlphaMap.colorSpace = THREE.NoColorSpace;
  circleAlphaMap.colorSpace = THREE.NoColorSpace;

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

  // ---------- ALL TMP EXAMPLES ----------
  const tmpBs = await addTmpExamples(ctx);
  tmpBs.position.setY(-20);

  // ---------- START OF TRANSFORMER ----------
  const tf = new Transformer("me", {
    chestVideoTexture: howToVideoTexture,
    circleAlphaMap,
    fallbackTexture,
    wheelRimTexture,
    wheelSideTexture,
    metalnessTexture,
    shatterAlphaMap,
  })

  // ---------- THE ANIMATIONLOOP ----------
  ctx.setAnimationLoop((self) => {
    const totalTime = self.fpsInfo.totalTime;
    const dt = self.fpsInfo.dt;

    // ---------- UPDATES
    self.fpsInfo.showFps();
    mainCameraControls.update(dt);
    self.keyManager.handleEvents(dt);

    // ---------- POPULATING BUFFERS
    self.camera.getWorldPosition(buffers.cameraWorldPos);
    ground.getWorldPosition(buffers.groundWorldPos);
    mainPointLight.getWorldPosition(buffers.mainPointLightWorldPos);

    mainDirectionalLight.getWorldPosition(buffers.mainDirLightWorldPos);
    mainDirectionalLight.target.getWorldPosition(buffers.mainDirLightTargetWorldPos);

    const mainDirLightDirection = buffers.mainDirLightWorldPos.clone().sub(buffers.mainDirLightTargetWorldPos);
    groundUniforms.directionalLightDirection.value.copy(mainDirLightDirection);

    // ---------- ANIMATIONS
    mainAnimations.movingGrassOffset.x = Math.sin(totalTime) / (7 * GROUND_SIZE);
    mainAnimations.movingGrassOffset.y = Math.cos(totalTime) / (11 * GROUND_SIZE);

    tf.neck.rotation.set(0, tf.animations.neckRotY.currRot, 0);
    tf.head.rotation.set(0, tf.animations.headRotY.currRot, 0);

  })


  // ---------- INPUT HANDLING ----------
  const neckAnim = tf.animations.neckRotY;
  const headAnim = tf.animations.headRotY;

  const neckGuiHandle = ctx.lilGui.add(neckAnim, 'currRot')
    .min(neckAnim.min)
    .max(neckAnim.max)
    .step(neckAnim.step)
    .name("Neck Rotation");

  const headGuiHandle = ctx.lilGui.add(headAnim, 'currRot')
    .min(headAnim.min)
    .max(headAnim.max)
    .step(headAnim.step)
    .name("Head Rotation");

  ctx.keyManager.setHoldEventOn('ArrowLeft', (dt) => {
    neckAnim.currRot = clamp(neckAnim.currRot + 1 * dt, neckAnim.min, neckAnim.max)
    headAnim.currRot = clamp(headAnim.currRot + 1 * dt, headAnim.min, headAnim.max)

    neckGuiHandle.updateDisplay();
    headGuiHandle.updateDisplay();
  }).setHoldEventOn('ArrowRight', (dt) => {
    neckAnim.currRot = clamp(neckAnim.currRot - 1 * dt, neckAnim.min, neckAnim.max)
    headAnim.currRot = clamp(headAnim.currRot - 1 * dt, headAnim.min, headAnim.max)

    neckGuiHandle.updateDisplay();
    headGuiHandle.updateDisplay();
  }).setPressEventOn('KeyL', () => {
    tf.neck.position.setY((tf.dimentions.torso.h - tf.dimentions.neck.h) / 2);
  }).setPressEventOn('KeyO', () => {
    tf.neck.position.setY((tf.dimentions.torso.h + tf.dimentions.neck.h) / 2);
  })

  // ---------- ADD TO SCENE N RENDER ----------
  ctx.addToScene(ground);
  ctx.addToScene(lightOverlay);
  ctx.addToScene(mainPointLight);
  ctx.addToScene(mainAmbientLight);
  ctx.addToScene(mainDirectionalLight);

  ctx.addToScene(tmpBs);

  ctx.addToScene(tf.self);

  ctx.startRender();
}
