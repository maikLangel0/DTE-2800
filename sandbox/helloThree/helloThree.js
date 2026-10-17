import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DirectionalLightHelper } from 'three/src/helpers/DirectionalLightHelper.js';
import { BasicAppContext } from "../../base/threeHelpers/basicAppContext.js";
import { GeometryMap, MaterialMap } from "../../base/threeHelpers/utilMaps.js";
import { basicDirectionalLight, degreeToRad } from "../../base/threeHelpers/helpers.js";
import { FirstPersonControls } from "three/examples/jsm/Addons.js";

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

  // ---------- INPUT HANDLING ----------
  ctx.lilGui.title("animations");
  const brownCubeScaleGui = ctx.lilGui
    .add(animations, 'brownCubeScale')
    .min(animations.brownCubeParams.min)
    .max(animations.brownCubeParams.max)
    .step(animations.brownCubeParams.step)
    .name("brown cube scale");

  const blueCubeScaleGui = ctx.lilGui
    .add(animations, 'blueCubeScale')
    .min(animations.blueCubeParams.min)
    .max(animations.blueCubeParams.max)
    .step(animations.blueCubeParams.step)
    .name("blue cube scale");

  ctx.keyManager.setEventOn('KeyW', (dt) => {
    let res = animations.brownCubeScale + dt;
    if (res > animations.brownCubeParams.max) res = animations.brownCubeParams.max;

    animations.brownCubeScale = res;
    brownCubeScaleGui.updateDisplay();
  })
  ctx.keyManager.setEventOn('KeyS', (dt) => {
    let res = animations.brownCubeScale - dt;
    if (res < animations.brownCubeParams.min) res = animations.brownCubeParams.min;

    animations.brownCubeScale = res;
    brownCubeScaleGui.updateDisplay();
  })
  ctx.keyManager.setEventOn('KeyA', (dt) => {
    let res = animations.blueCubeScale + dt;
    if (res > animations.blueCubeParams.max) res = animations.blueCubeParams.max;

    animations.blueCubeScale = res;
    blueCubeScaleGui.updateDisplay();
  })
  ctx.keyManager.setEventOn('KeyD', (dt) => {
    let res = animations.blueCubeScale - dt;
    if (res < animations.blueCubeParams.min) res = animations.blueCubeParams.min;

    animations.blueCubeScale = res;
    blueCubeScaleGui.updateDisplay();
  })

  // ---------- MAIN CAMERA CONTROLS ----------
  const mainCamControls = new OrbitControls(ctx.camera, ctx.renderer.domElement);
  mainCamControls.target.set(0, 0, 0);

  // ---------- APP CALLBACKS ----------
  ctx.setAnimationLoop((self) => {
    const keyManager = self.keyManager;
    const fpsInfo = self.fpsInfo;
    const dt = fpsInfo.dt;

    fpsInfo.showFps();
    keyManager.handleEvents();
    mainCamControls.update(dt);

    const timeAsDegrees = fpsInfo.totalTime % 360;

    const cubeGroup = self.getObjectInScene("twoCubes");

    const brownCube = self.getObjectInScene("brownCube");
    const blueCube = self.getObjectInScene("blueCube");
    const pointLight = self.getObjectInScene("pointLight");

    brownCube.scale.setScalar(animations.brownCubeScale);
    blueCube.scale.setScalar(animations.blueCubeScale);

    cubeGroup.position.y = 20 + 10 * Math.sin(fpsInfo.totalTime);
    cubeGroup.rotation.y += dt;

    pointLight.position.y = 20 + 10 * Math.sin(timeAsDegrees + degreeToRad(90));

    brownCube.rotation.x += dt * 0.4;
    brownCube.rotation.y += dt * 0.2;
    brownCube.rotation.z += dt * 0.6;

    blueCube.rotation.x += dt * 0.4;
    blueCube.rotation.y += dt * 0.2;
    blueCube.rotation.z += dt * 0.6;

    blueCube.scale.x = 1 + Math.sin(timeAsDegrees + degreeToRad(90));

    cube.getWorldPosition(scratchVec3);

    console.log(`POS: ${scratchVec3.x} | TOTALTIME ${fpsInfo.totalTime}`);
  })

  ctx.setOnResize((camera, renderer) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  });


  // ---------- TEXTURES ----------
  const grassTexture = await ctx.loadTexture(
    '../../base/textures/grassTexture.png',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    }
  );

  // ---------- OBJECTMAPS ----------
  const materials = new MaterialMap([
    { label: "brownPhong", value: new THREE.MeshPhongMaterial({ color: 0xac430c }) },
    { label: "grassStandard", value: new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: grassTexture }) },
    { label: "blueLambert", value: new THREE.MeshLambertMaterial({ color: 0x0000ff, opacity: 0.2, transparent: true }) }
  ]);

  const geometries = new GeometryMap([
    { label: "basicCube", value: new THREE.BoxGeometry(10, 10, 10) },
    { label: "ground", value: squareGeometry()}
  ]);

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

  const pointLight = new THREE.PointLight(0xffffff, 1000);
  pointLight.name = "pointLight";
  pointLight.translateY(10);


  const directionalLightHelper = new DirectionalLightHelper(directionalLight, 5, new THREE.Color());
  directionalLightHelper.name = "dirLightHelp";
  directionalLightHelper.visible = false;

  // ---------- MESHES ----------
  const groundGeometry = geometries.get("ground");
  const basicCubeGeometry = geometries.get("basicCube");

  const brownPhongMaterial = materials.get("brownPhong");
  const blueLambertMaterial = materials.get("blueLambert");
  const grassStandardMaterial = materials.get("grassStandard");

  const cube = new THREE.Mesh(basicCubeGeometry, brownPhongMaterial);
  cube.name = "brownCube";
  cube.position.x = 10;
  cube.receiveShadow = true;
  cube.castShadow = true;

  const cube2 = new THREE.Mesh(basicCubeGeometry, blueLambertMaterial);
  cube2.name = "blueCube";
  cube2.position.x = -10;
  cube2.receiveShadow = true;
  cube2.castShadow = false;

  const ground = new THREE.Mesh(groundGeometry, grassStandardMaterial);
  ground.name = "ground";
  ground.rotateX(degreeToRad(-90));
  ground.scale.set(50, 50, 1);
  ground.receiveShadow = true;

  const cubeGroup = new THREE.Group();
  cubeGroup.name = "twoCubes";
  cubeGroup.translateY(10);
  cubeGroup.add(cube);
  cubeGroup.add(cube2);

  // ---------- ADD ALL TO SCENE ----------
  ctx.setObjectInScene(directionalLight);
  ctx.setObjectInScene(directionalLightHelper);
  ctx.setObjectInScene(pointLight);
  ctx.setObjectInScene(ambientLight);
  ctx.setObjectInScene(cubeGroup);
  ctx.setObjectInScene(ground);

  ctx.startRender();
}

/**@returns {THREE.BufferGeometry} */
function squareGeometry() {
  const geometry = new THREE.BufferGeometry();

  const vertices = new Float32Array([
    -1.0, -1.0,  0.0, // v0
     1.0, -1.0,  0.0, // v1
     1.0,  1.0,  0.0, // v2
    -1.0,  1.0,  0.0, // v3
  ]);
  const indices = [
    0, 1, 2,
    2, 3, 0,
  ];
  const uvs = new Float32Array([
    0.0, 0.0, // v0: bottom left
    1.0, 0.0, // v1: bottom right
    1.0, 1.0, // v2: top right
    0.0, 1.0, // v3: top left
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  return geometry;
}
