import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BasicAppContext } from "../../base/threeHelpers/basicAppContext";
import { BasicGLTFModel } from "../../base/threeHelpers/basicGLTFModel";
import { basicDirectionalLight, degreeToRad } from "../../base/threeHelpers/helpers";

export const main = async () => {
  const ambientColor = 0xadd8d6;

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
  mushroom.scene.position.setY(23); // Magic number cuz this is the height from the center of this gltf mesh
  mushroom.scene.castShadow = true;

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
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.name = "ground";
  ground.rotateX(degreeToRad(-90));
  ground.receiveShadow = true;

  const groundMixer = new THREE.AnimationMixer(ground);
  const groundKeyFrames = {
    times: [0, 1, 2, 3, 4], // one timeStamp for each 3 values below
    values: [0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, -20, 0, 0, 0] // 3 values (xyz) * 5 coordinates = 15 elements
  }
  const kfMotion = new THREE.VectorKeyframeTrack('.position', groundKeyFrames.times, groundKeyFrames.values);
  const motionClip = new THREE.AnimationClip('groundSmoothMove', -1, [kfMotion]);

  const moveCrazyAnimatonAction = groundMixer.clipAction(motionClip);
  moveCrazyAnimatonAction.setLoop(THREE.LoopRepeat, Infinity);
  moveCrazyAnimatonAction.play();

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
  })

  ctx.addToScene(directionalLight);
  ctx.addToScene(ambientLight);

  ctx.addToScene(ground);
  ctx.addToScene(mushroom.scene);

  ctx.startRender();
}
