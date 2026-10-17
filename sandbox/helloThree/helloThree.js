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

  // ---------- MAIN CAMERA CONTROLS ----------
  const mainCamControls = new OrbitControls(ctx.camera, ctx.renderer.domElement);
  mainCamControls.target.set(0, 0, 0);

  // ---------- ANIMATIONLOOP ----------
  ctx.setAnimationLoop((self) => {
    const fpsInfo = self.fpsInfo;
    const dt = fpsInfo.dt;
  
    fpsInfo.showFps();
    mainCamControls.update(dt);
  
    const cubeGroup = self.getObjectInScene("twoCubes");
  
    const cube = self.getObjectInScene("brownCube");
    const cube2 = self.getObjectInScene("blueCube");
    const pointLight = self.getObjectInScene("pointLight");
  
    const timeAsDegrees = fpsInfo.totalTime % 360;
  
    cubeGroup.position.y = 20 + 10 * Math.sin(fpsInfo.totalTime);
    cubeGroup.rotation.y += dt;
  
    pointLight.position.y = 20 + 10 * Math.sin(timeAsDegrees + degreeToRad(90));
  
    cube.rotation.x += dt * 0.4;
    cube.rotation.y += dt * 0.2;
    cube.rotation.z += dt * 0.6;
  
    cube2.rotation.x += dt * 0.4;
    cube2.rotation.y += dt * 0.2;
    cube2.rotation.z += dt * 0.6;
  
    cube.scale.x = 1 + Math.sin(timeAsDegrees);
    cube2.scale.x = 1 + Math.sin(timeAsDegrees + degreeToRad(90));
  
    cube.getWorldPosition(scratchVec3);
  
    console.log(`POS: ${scratchVec3.x} | TOTALTIME ${fpsInfo.totalTime}`);
  })
  
  // ---------- TEXTURES ----------
  const grassTexture = await ctx.loadTexture(
    '../../base/textures/grassTextur.png',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex
    }
  );

  // ---------- OBJECTMAPS ----------
  const materials = new MaterialMap([
    { label: "brownPhong", value: new THREE.MeshPhongMaterial({ color: 0xac430c }) },
    { label: "grassStandard", value: new THREE.MeshStandardMaterial({ color: 0xffafff, side: THREE.DoubleSide, map: grassTexture }) },
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
