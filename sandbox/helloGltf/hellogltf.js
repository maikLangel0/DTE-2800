import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../../base/threeHelpers/basicAppContext";
import { BasicGLTFModel } from "../../base/threeHelpers/basicGLTFModel";
import { basicDirectionalLight, quatFromEulerToNums } from "../../base/threeHelpers/helpers";

const NINETY_DEG = Math.PI / 2;

export const main = async () => {
  const ambientColor = 0xadd8d6;
  const mushroomDimentions = new THREE.Vector3();

  // ---------- MAIN APPCONTEXT ----------
  const ctx = new BasicAppContext({
    canvasId: "canvas",
    fpsId: "fps",
    fov: 75,
    height: window.innerHeight,
    width: window.innerWidth,
  });
  ctx.renderer.setClearColor(ambientColor)

  const mainCameraControls = new OrbitControls(ctx.camera, ctx.renderer.domElement);

  // ---------- GLTF OBJECT & ANIMATIONCLIP ----------
  const gltfLoader = new GLTFLoader(ctx.loadingManager);
  const mushroom = await gltfLoader.loadAsync("../../base/models/pc_nightmare_mushroom/scene.gltf");

  const mushroomBox = new THREE.Box3().setFromObject(mushroom.scene);
  mushroomBox.getSize(mushroomDimentions);

  mushroom.scene.castShadow = true;
  mushroom.scene.position.setY(mushroomDimentions.y + 1.25); // under-reported the height of the model #classic

  const mushroomGLTFModel = new BasicGLTFModel({gltfObject: mushroom, animationNames: ["eatingAnimation"] })
    .setMixerNamePersistent("mainAnimationMixer")
    .createMixer()
    .createAnimationAction("eating", "eatingAnimation",
      (action) => { action.setLoop(THREE.LoopRepeat, Infinity) }
    ).play("eating");

  // ---------- GROUND ----------
  const groundTexture = await ctx.loadTexture("../../base/textures/newGrassTexture.png");
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: 0.1,
    color: 0xffffff,
    side: THREE.DoubleSide
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.name = "ground";
  ground.receiveShadow = true;

  const groundMixer = new THREE.AnimationMixer(ground);

  const groundPosKeyFrames = {
    times: [0, 1, 2, 3, 4], // one timeStamp for each 3 values below
    values: [0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, -20, 0, 0, 0] // 3 values (xyz) * 5 coordinates = 15 elements
  }
  const groundRotZKeyFrames = {
    times: [0, 1, 2, 3, 4],
    values: [
      ...quatFromEulerToNums(NINETY_DEG, 0, 0),
      ...quatFromEulerToNums(NINETY_DEG, 0, NINETY_DEG),
      ...quatFromEulerToNums(NINETY_DEG, 0, Math.PI),
      ...quatFromEulerToNums(NINETY_DEG, 0, Math.PI * 1.5),
      ...quatFromEulerToNums(NINETY_DEG, 0, 0),
    ]
  }
  const groundRotYKeyFrames = {
    times: [0, 1, 2, 3, 4],
    values: [
      ...quatFromEulerToNums(NINETY_DEG, 0, 0),
      ...quatFromEulerToNums(NINETY_DEG, NINETY_DEG, 0),
      ...quatFromEulerToNums(NINETY_DEG, Math.PI, 0),
      ...quatFromEulerToNums(NINETY_DEG, Math.PI * 1.5, 0),
      ...quatFromEulerToNums(NINETY_DEG, 0, 0),
    ]
  }

  const kfMotion = new THREE.VectorKeyframeTrack('.position', groundPosKeyFrames.times, groundPosKeyFrames.values, THREE.InterpolateSmooth);
  const motionClip = new THREE.AnimationClip('groundSmoothMove', -1, [kfMotion]);
  const moveCrazyAnimatonAction = groundMixer.clipAction(motionClip);
  moveCrazyAnimatonAction.setLoop(THREE.LoopRepeat, Infinity);

  const kfRotZ = new THREE.QuaternionKeyframeTrack('.quaternion', groundRotZKeyFrames.times, groundRotZKeyFrames.values, THREE.InterpolateSmooth);
  const rotationZClip = new THREE.AnimationClip('groundRotateZ', -1, [kfRotZ]);
  const rotateZAnimationAction = groundMixer.clipAction(rotationZClip);

  const kfRotY = new THREE.QuaternionKeyframeTrack('.quaternion', groundRotYKeyFrames.times, groundRotYKeyFrames.values, THREE.InterpolateBezier);
  const rotationYClip = new THREE.AnimationClip('groundRotateY', -1, [kfRotY]);
  const rotateYAnimationAction = groundMixer.clipAction(rotationYClip);

  moveCrazyAnimatonAction.play();
  rotateZAnimationAction.play();

  // ---------- LIGHTS ----------
  const directionalLight = basicDirectionalLight({ position: [0, 30, 30] });
  directionalLight.name = "directionalLight";

  const ambientLight = new THREE.AmbientLight(ambientColor, 0.3);
  ambientLight.name = "ambientLight";

  // ---------- ANIMATIONLOOP ----------
  ctx.setAnimationLoop((self) => {
    const dt = self.fpsInfo.dt;
    self.fpsInfo.showFps();

    // ---------- EXTERNAL UPDATES
    groundMixer.update(dt);
    mainCameraControls.update(dt);
    mushroomGLTFModel.update(dt);
  })

  ctx.keyManager.setPressEventOn('KeyO', () => {
    mushroomGLTFModel.stop("eating");
  }).setPressEventOn('KeyI', () => {
    mushroomGLTFModel.play("eating")
  }).setPressEventOn('Space', () => {
    if (rotateYAnimationAction.isRunning()) {
      rotateYAnimationAction.stop();
      rotateZAnimationAction.play();
    } else if (rotateZAnimationAction.isRunning()) {
      rotateZAnimationAction.stop();
      rotateYAnimationAction.play();
    }
  })

  ctx.addToScene(directionalLight);
  ctx.addToScene(ambientLight);

  ctx.addToScene(ground);
  ctx.addToScene(mushroom.scene);

  ctx.startRender();
}
