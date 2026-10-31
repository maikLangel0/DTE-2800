import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";
import { getOrThrow } from "../base/lib/utility-functions";
import { createCustomGround, createFallbackTexture, createMainSceneLights, loadTexSRGB, loadVideoTexture } from "./oblig3helpers";
import { Transformer } from "./transformer";
import { SpriteBook } from "../base/threeHelpers/spriteFlipBook";

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

  const ctx = new BasicAppContext(
    {
      canvasId: "canvas",
      fpsId: "fps",
      height: CANVAS_HEIGHT,
      width: CANVAS_WIDTH,
      fov: 60,
    }
  ).camPosition(0, 40, 70);
  ctx.renderer.setClearColor(0xADD8E6);

  const mainCameraControls = new OrbitControls(ctx.camera, ctx.renderer.domElement);

  // ---------- ALL TEXTURES INITIALIZED ----------
  const {
    videoHandle: howToVideoHandle,
    texture: howToVideoTexture
  } = loadVideoTexture('../../base/videos/howTo.webm', 'howToVideo');

  const fallbackTexture = createFallbackTexture();
  const grassTexture = await loadTexSRGB(ctx, '../../base/textures/newGrassTexture.png');
  const wheelRimTexture = await loadTexSRGB(ctx, '../../base/textures/tireRim.jpg');
  const wheelSideTexture = await loadTexSRGB(ctx, '../../base/textures/tireSideFace.png');
  const metalnessTexture = await loadTexSRGB(ctx, '../../base/textures/metalnessTexture500x500.jpg');
  const smokeSpriteMap = await loadTexSRGB(ctx, '../../base/textures/smoke_spritesheet.png');
  const shatterAlphaMap = await ctx.loadTexture('../../base/textures/shatterAlphaMapInverted.png');
  const circleAlphaMap = await ctx.loadTexture('../../base/textures/blackCircle.jpg');
  const silliAlphaMap = await ctx.loadTexture('../../base/textures/silliLilAlphaTexture.png');
  smokeSpriteMap.magFilter = THREE.NearestFilter;
  shatterAlphaMap.colorSpace = THREE.NoColorSpace;
  circleAlphaMap.colorSpace = THREE.NoColorSpace;
  silliAlphaMap.colorSpace = THREE.NoColorSpace;

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

  // ---------- SMOKE SPRITEBOOK ----------
  const smokeSpriteBook = new SpriteBook(smokeSpriteMap, "smokeSprite", 5, 8);
  smokeSpriteBook.reverseIteration();
  smokeSpriteBook.sprite.scale.set(5, 5);
  smokeSpriteBook.sprite.renderOrder = 2;

  // ---------- THE TRANSFORMER ----------
  const tf = new Transformer(
    "tutorialMan",
    {
      upperArmVertexShader: getOrThrow(document.getElementById("upperArmVertShader")?.innerText),
      upperArmFragmentShader: getOrThrow(document.getElementById("upperArmFragShader")?.innerText),
    }, {
      exhaustSmokeSprite: smokeSpriteBook.sprite,
      chestVideoTexture: howToVideoTexture,
      upperArmAlphaMap: silliAlphaMap,
      circleAlphaMap,
      fallbackTexture,
      wheelRimTexture,
      wheelSideTexture,
      metalnessTexture,
      shatterAlphaMap,
    }
  )
  tf.setFPV({
    canvasId: "canvasFirstPerson",
    clearColor: 0xADD8E6,
    fov: 45,
    width: 250,
    height: 150
  })

  // ---------- THE ANIMATIONLOOP ----------
  ctx.setAnimationLoop((self) => {
    const totalTime = self.fpsInfo.totalTime;
    const dt = self.fpsInfo.dt;

    self.fpsInfo.showFps();
    self.lilGui.controllersRecursive().forEach((c) => {c.updateDisplay()})

    // ---------- EXTERNAL UPDATES
    tf.update(dt);
    smokeSpriteBook.loop(dt);
    mainCameraControls.update(dt);

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

    tf.radarRotateY(dt);
    tf.renderFPV(self.scene);
  })


  // ---------- INPUT HANDLING ----------
  const animations = tf.animations;
  const params = tf.animationParameters;
  const neckParams = params.neckRotY;
  const headParams = params.headRotY;

  const shoulderParamsX = params.shoulderRotX;
  const shoulderParamsZ = params.shoulderRotZ;

  const elbowParamsX = params.elbowRotX;
  const elbowParamsZ = params.elbowRotZ;

  const fingerParams = params.fingersRotZ;

  const hipParamsX = params.hipRotX;
  const hipParamsZ = params.hipRotZ;

  const kneeParamsX = params.kneeRotX;
  const kneeParamsZ = params.kneeRotZ;

  const neckGuiHandle = ctx.lilGui.add(animations, 'neckRotY')
    .min(neckParams.min)
    .max(neckParams.max)
    .step(neckParams.step)
    .name("Neck Rotation");

  const headGuiHandle = ctx.lilGui.add(animations, 'headRotY')
    .min(headParams.min)
    .max(headParams.max)
    .step(headParams.step)
    .name("Head Rotation");

  const leftArmGuiFolder = ctx.lilGui.addFolder('Left Arm');

  const leftShoulderXGuiHandle = leftArmGuiFolder.add(animations.leftShoulderRot, 'x')
    .min(shoulderParamsX.min)
    .max(shoulderParamsX.max)
    .step(shoulderParamsX.step)
    .name("Shoulder X Rotation")
  const leftShoulderZGuiHandle = leftArmGuiFolder.add(animations.leftShoulderRot, 'z')
    .min(shoulderParamsZ.min)
    .max(shoulderParamsZ.max)
    .step(shoulderParamsZ.step)
    .name("Shoulder Z Rotation")
  const leftElbowXGuiHandle = leftArmGuiFolder.add(animations.leftElbowRot, 'x')
    .min(elbowParamsX.min)
    .max(elbowParamsX.max)
    .step(elbowParamsX.step)
    .name("Elbow X Rotation")
  const leftElbowZGuiHandle = leftArmGuiFolder.add(animations.leftElbowRot, 'z')
    .min(elbowParamsZ.min)
    .max(elbowParamsZ.max)
    .step(elbowParamsZ.step)
    .name("Elbow Z Rotation")
  const leftHandFingersGuiHandle = leftArmGuiFolder.add(animations, 'leftFingersRotZ')
    .min(fingerParams.min)
    .max(fingerParams.max)
    .step(fingerParams.step)
    .name("Finger Pinch")

  const rightArmGuiFolder = ctx.lilGui.addFolder('Right Arm');

  const rightShoulderXGuiHandle = rightArmGuiFolder.add(animations.rightShoulderRot, 'x')
    .min(shoulderParamsX.min)
    .max(shoulderParamsX.max)
    .step(shoulderParamsX.step)
    .name("Shoulder X Rotation")
  const rightShoulderZGuiHandle = rightArmGuiFolder.add(animations.rightShoulderRot, 'z')
    .min(shoulderParamsZ.min)
    .max(shoulderParamsZ.max)
    .step(shoulderParamsZ.step)
    .name("Shoulder Z Rotation")
  const rightElbowXGuiHandle = rightArmGuiFolder.add(animations.rightElbowRot, 'x')
    .min(elbowParamsX.min)
    .max(elbowParamsX.max)
    .step(elbowParamsX.step)
    .name("Elbow X Rotation")
  const rightElbowZGuiHandle = rightArmGuiFolder.add(animations.rightElbowRot, 'z')
    .min(elbowParamsZ.min)
    .max(elbowParamsZ.max)
    .step(elbowParamsZ.step)
    .name("Elbow Z Rotation")
  const rightHandFingersGuiHandle = rightArmGuiFolder.add(animations, 'rightFingersRotZ')
    .min(fingerParams.min)
    .max(fingerParams.max)
    .step(fingerParams.step)
    .name("Finger Pinch")

  const leftLegGuiFolder = ctx.lilGui.addFolder('Left Leg');

  const leftHipXGuiHandle = leftLegGuiFolder.add(animations.leftHipRot, 'x')
    .min(hipParamsX.min)
    .max(hipParamsX.max)
    .step(hipParamsX.step)
    .name("Hip X Rotation")
  const leftHipZGuiHandle = leftLegGuiFolder.add(animations.leftHipRot, 'z')
    .min(hipParamsZ.min)
    .max(hipParamsZ.max)
    .step(hipParamsZ.step)
    .name("Hip Z Rotation")
  const leftKneeXGuiHandle = leftLegGuiFolder.add(animations.leftKneeRot, 'x')
    .min(kneeParamsX.min)
    .max(kneeParamsX.max)
    .step(kneeParamsX.step)
    .name("Knee X Rotation")
  const leftKneeZGuiHandle = leftLegGuiFolder.add(animations.leftKneeRot, 'z')
    .min(kneeParamsZ.min)
    .max(kneeParamsZ.max)
    .step(kneeParamsZ.step)
    .name("Knee Z Rotation")

  const rightLegGuiFolder = ctx.lilGui.addFolder('Right Leg');

  const rightHipXGuiHandle = rightLegGuiFolder.add(animations.rightHipRot, 'x')
    .min(hipParamsX.min)
    .max(hipParamsX.max)
    .step(hipParamsX.step)
    .name("Hip X Rotation")
  const rightHipZGuiHandle = rightLegGuiFolder.add(animations.rightHipRot, 'z')
    .min(hipParamsZ.min)
    .max(hipParamsZ.max)
    .step(hipParamsZ.step)
    .name("Hip Z Rotation")
  const rightKneeXGuiHandle = rightLegGuiFolder.add(animations.rightKneeRot, 'x')
    .min(kneeParamsX.min)
    .max(kneeParamsX.max)
    .step(kneeParamsX.step)
    .name("Knee X Rotation")
  const rightKneeZGuiHandle = rightLegGuiFolder.add(animations.rightKneeRot, 'z')
    .min(kneeParamsZ.min)
    .max(kneeParamsZ.max)
    .step(kneeParamsZ.step)
    .name("Knee Z Rotation")

  ctx.keyManager.setHoldEventOn('ArrowLeft', (dt) => {
    tf.neckRotateY(dt);
    tf.headRotateY(dt);

    neckGuiHandle.updateDisplay();
    headGuiHandle.updateDisplay();
  }
  ).setHoldEventOn('ArrowRight', (dt) => {
    tf.neckRotateY(-dt)
    tf.headRotateY(-dt);

    neckGuiHandle.updateDisplay();
    headGuiHandle.updateDisplay();
  }
  ).setHoldEventOn('KeyW', (dt) => {
    tf.rotateWheels(dt * 10);
  }
  ).setHoldEventOn('KeyS', (dt) => {
    tf.rotateWheels(-dt * 10)
  }
  ).setReleaseEventOn('KeyW', () => {
    tf.setExhaustSmokeVisibility(false); // Only way to easily turn it of :(
  }
  ).setReleaseEventOn('KeyS', () => {
    tf.setExhaustSmokeVisibility(false); // Only way to easily turn it of :(
  }
  ).setHoldEventOn('KeyA', (dt) => {
    tf.leftElbowRotateY(dt);
    tf.rightElbowRotateY(dt);
  }
  ).setHoldEventOn('KeyD', (dt) => {
    tf.leftElbowRotateY(-dt);
    tf.rightElbowRotateY(-dt);
  }
  ).setPressEventOn('KeyL', () => {
    tf.toggleHeadLights();
  }
  ).setPressEventOn('Space', () => {
    tf.tweenToggleAnimation();
  }
  ).setPressEventOn('KeyP', () => {
    tf.log();
  })

  // ---------- ADD TO SCENE N RENDER ----------
  ctx.addToScene(ground);
  ctx.addToScene(lightOverlay);
  ctx.addToScene(mainPointLight);
  ctx.addToScene(mainAmbientLight);
  ctx.addToScene(mainDirectionalLight);

  ctx.addToScene(tf.getSelf());

  ctx.startRender();
}
