import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";
import { getOrThrow } from "../base/lib/utility-functions";
import { createCustomGround, createFallbackTexture, createMainSceneLights, loadTexSRGB, loadVideoTexture } from "./oblig3helpers";
import { Transformer } from "./transformer";
import { SpriteBook } from "../base/threeHelpers/spriteFlipBook";
import { Particles } from "./particles";

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
    videoHandle: _,
    texture: howToVideoTexture
  } = loadVideoTexture('../../base/videos/howTo.webm', 'howToVideo');

  const fallbackTexture = createFallbackTexture();
  const grassTexture = await loadTexSRGB(ctx, '../../base/textures/newGrassTexture.png');
  const wheelRimTexture = await loadTexSRGB(ctx, '../../base/textures/tireRim.jpg');
  const wheelSideTexture = await loadTexSRGB(ctx, '../../base/textures/tireSideFace.png');
  const smokeSpriteMap = await loadTexSRGB(ctx, '../../base/textures/smoke_spritesheet.png');
  const metalnessTexture = await ctx.loadTexture('../../base/textures/metalnessTexture500x500.jpg');
  const shatterAlphaMap = await ctx.loadTexture('../../base/textures/shatterAlphaMapInverted.png');
  const circleAlphaMap = await ctx.loadTexture('../../base/textures/blackCircle.jpg');
  const silliAlphaMap = await ctx.loadTexture('../../base/textures/silliLilAlphaTexture.png');

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
  smokeSpriteBook.setLoopInterval(400);
  smokeSpriteBook.reverseIteration();
  smokeSpriteBook.sprite.scale.set(5, 5);
  smokeSpriteBook.sprite.renderOrder = 2;
  smokeSpriteBook.sprite.visible = false;

  // ---------- PARTICLES ----------
  const particles = new Particles({
    initialVelocity: new THREE.Vector3(5.5, 1.5, 3),
    spread: 2.5,
    particleCount: 50,
    lifetimeInMs: 2000
  });
  const pointMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  const sparks = new THREE.Points(particles.geometry, pointMaterial);
  sparks.name = "neckSparks";
  sparks.frustumCulled = false;

  // ---------- THE TRANSFORMER ----------
  const tf = new Transformer(
    "tutorialMan",
    {
      upperArmVertexShader: getOrThrow(document.getElementById("upperArmVertShader")?.innerText),
      upperArmFragmentShader: getOrThrow(document.getElementById("upperArmFragShader")?.innerText),
    }, {
      chestVideoTexture: howToVideoTexture,
      upperArmAlphaMap: silliAlphaMap,
      shatterAlphaMap,
      circleAlphaMap,
      fallbackTexture,
      wheelRimTexture,
      wheelSideTexture,
      metalnessTexture,
    }
  )
  tf.setFPV({
    canvasId: "canvasFirstPerson",
    clearColor: 0xADD8E6,
    fov: 45,
    width: 250,
    height: 150
  })
  tf.addExhaustSprite(smokeSpriteBook.sprite);
  tf.addToNeck(sparks);

  // ---------- THE ANIMATIONLOOP ----------
  ctx.setAnimationLoop((self) => {
    const totalTime = self.fpsInfo.totalTime;
    const dt = self.fpsInfo.dt;

    self.fpsInfo.showFps();
    self.lilGui.controllersRecursive().forEach((c) => {c.updateDisplay()})

    // ---------- EXTERNAL UPDATES
    tf.update();
    particles.update(dt);
    smokeSpriteBook.update(dt);
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

  const neckGuiHandle = ctx.lilGui.add(animations, 'neckRotY')
    .min(params.neckRotY.min)
    .max(params.neckRotY.max)
    .step(params.neckRotY.step)
    .name("Neck Rotation");
  const headXGuiHandle = ctx.lilGui.add(animations.headRot, 'x')
    .min(params.headRotX.min)
    .max(params.headRotX.max)
    .step(params.headRotX.step)
    .name("Head Rotation X");
  const headYGuiHandle = ctx.lilGui.add(animations.headRot, 'y')
    .min(params.headRotY.min)
    .max(params.headRotY.max)
    .step(params.headRotY.step)
    .name("Head Rotation Y");

  const leftArmGuiFolder = ctx.lilGui.addFolder('Left Arm');

  leftArmGuiFolder.add(animations.leftShoulderRot, 'x')
    .min(params.shoulderRotX.min)
    .max(params.shoulderRotX.max)
    .step(params.shoulderRotX.step)
    .name("Shoulder X Rotation")
  leftArmGuiFolder.add(animations.leftShoulderRot, 'z')
    .min(params.shoulderRotZ.min)
    .max(params.shoulderRotZ.max)
    .step(params.shoulderRotZ.step)
    .name("Shoulder Z Rotation")
  leftArmGuiFolder.add(animations.leftElbowRot, 'x')
    .min(params.elbowRotX.min)
    .max(params.elbowRotX.max)
    .step(params.elbowRotX.step)
    .name("Elbow X Rotation")
  leftArmGuiFolder.add(animations.leftElbowRot, 'z')
    .min(params.elbowRotZ.min)
    .max(params.elbowRotZ.max)
    .step(params.elbowRotZ.step)
    .name("Elbow Z Rotation")
  leftArmGuiFolder.add(animations, 'leftFingersRotZ')
    .min(params.fingersRotZ.min)
    .max(params.fingersRotZ.max)
    .step(params.fingersRotZ.step)
    .name("Finger Pinch")

  const rightArmGuiFolder = ctx.lilGui.addFolder('Right Arm');

  rightArmGuiFolder.add(animations.rightShoulderRot, 'x')
    .min(params.shoulderRotX.min)
    .max(params.shoulderRotX.max)
    .step(params.shoulderRotX.step)
    .name("Shoulder X Rotation")
  rightArmGuiFolder.add(animations.rightShoulderRot, 'z')
    .min(params.shoulderRotZ.min)
    .max(params.shoulderRotZ.max)
    .step(params.shoulderRotZ.step)
    .name("Shoulder Z Rotation")
  rightArmGuiFolder.add(animations.rightElbowRot, 'x')
    .min(params.elbowRotX.min)
    .max(params.elbowRotX.max)
    .step(params.elbowRotX.step)
    .name("Elbow X Rotation")
  rightArmGuiFolder.add(animations.rightElbowRot, 'z')
    .min(params.elbowRotZ.min)
    .max(params.elbowRotZ.max)
    .step(params.elbowRotZ.step)
    .name("Elbow Z Rotation")
  rightArmGuiFolder.add(animations, 'rightFingersRotZ')
    .min(params.fingersRotZ.min)
    .max(params.fingersRotZ.max)
    .step(params.fingersRotZ.step)
    .name("Finger Pinch")

  const leftLegGuiFolder = ctx.lilGui.addFolder('Left Leg');

  leftLegGuiFolder.add(animations.leftHipRot, 'x')
    .min(params.hipRotX.min)
    .max(params.hipRotX.max)
    .step(params.hipRotX.step)
    .name("Hip X Rotation")
  leftLegGuiFolder.add(animations.leftHipRot, 'z')
    .min(params.hipRotZ.min)
    .max(params.hipRotZ.max)
    .step(params.hipRotZ.step)
    .name("Hip Z Rotation")
  leftLegGuiFolder.add(animations.leftKneeRot, 'x')
    .min(params.kneeRotX.min)
    .max(params.kneeRotX.max)
    .step(params.kneeRotX.step)
    .name("Knee X Rotation")
  leftLegGuiFolder.add(animations.leftKneeRot, 'z')
    .min(params.kneeRotZ.min)
    .max(params.kneeRotZ.max)
    .step(params.kneeRotZ.step)
    .name("Knee Z Rotation")

  const rightLegGuiFolder = ctx.lilGui.addFolder('Right Leg');

  rightLegGuiFolder.add(animations.rightHipRot, 'x')
    .min(params.hipRotX.min)
    .max(params.hipRotX.max)
    .step(params.hipRotX.step)
    .name("Hip X Rotation")
  rightLegGuiFolder.add(animations.rightHipRot, 'z')
    .min(params.hipRotZ.min)
    .max(params.hipRotZ.max)
    .step(params.hipRotZ.step)
    .name("Hip Z Rotation")
  rightLegGuiFolder.add(animations.rightKneeRot, 'x')
    .min(params.kneeRotX.min)
    .max(params.kneeRotX.max)
    .step(params.kneeRotX.step)
    .name("Knee X Rotation")
  rightLegGuiFolder.add(animations.rightKneeRot, 'z')
    .min(params.kneeRotZ.min)
    .max(params.kneeRotZ.max)
    .step(params.kneeRotZ.step)
    .name("Knee Z Rotation")

  // KeyboardEvents defined
  ctx.keyManager.setHoldEventOn('ArrowLeft', (dt) => {
    tf.neckRotateY(dt);
    tf.headRotateY(dt);

    neckGuiHandle.updateDisplay();
    headYGuiHandle.updateDisplay();
  }
  ).setHoldEventOn('ArrowRight', (dt) => {
    tf.neckRotateY(-dt)
    tf.headRotateY(-dt);

    neckGuiHandle.updateDisplay();
    headYGuiHandle.updateDisplay();
  }
  ).setHoldEventOn('ArrowUp', (dt) => {
    tf.headRotateX(-dt);

    headXGuiHandle.updateDisplay();
  }
  ).setHoldEventOn('ArrowDown', (dt) => {
    tf.headRotateX(dt);

    headXGuiHandle.updateDisplay();
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
    const currState = tf.getState();

    if (currState === 'standing') {
      sparks.visible = false;
    } else if (currState === 'driving') {
      sparks.visible = true;
    }

    tf.tweenToggleAnimation();
  }
  ).setPressEventOn('KeyP', () => {
    tf.log();
    smokeSpriteBook.log();
  }
  ).setPressEventOn('KeyO', () => {
    if (tf.getState() === 'standing')
      tf.setRotationsToDefault();
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
