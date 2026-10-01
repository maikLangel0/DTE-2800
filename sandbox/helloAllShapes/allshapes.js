import { Camera } from "../../base/helpers/Camera.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { Shader, LocationType, DataType } from "../../base/helpers/WebGLShader.js";
import { Coords } from "../../base/shapes/coord.js";
import { FpsInfo } from "../../base/helpers/fpsInfo.js";
import { Cube } from "../../base/shapes/cube.js";
import { Color } from "../../base/helpers/color.js";
import { XZPlane } from "../../base/shapes/xzPlane.js";
import { Cone } from "../../base/shapes/cone.js";
import { Disc } from "../../base/shapes/disc.js";
import { Sphere } from "../../base/shapes/sphere.js";
import { Cylinder } from "../../base/shapes/cylinder.js";
import { Square } from "../../base/shapes/square.js";
import { Triangle } from "../../base/shapes/triangle.js";
import { Matrix4 } from "../../base/lib/cuon-matrix.js";
import { KeyManager } from "../../base/helpers/keyManager.js";

/**
 * @typedef {{
 *   gl: WebGL2RenderingContext,
 *   canvas: WebGLCanvas;
 *   camera: Camera,
 *   modelMatrix: Matrix4;
 *   coords: Coords;
 *   xzPlane: XZPlane,
 *   square: Square;
 *  triangle: Triangle;
 *   cone: Cone;
 *   disc: Disc;
 *   sphere: Sphere;
 *   cylinder: Cylinder;
 *   cube: Cube;
 *   fpsInfo: FpsInfo;
 *   keyManager: KeyManager;}} renderInfo
 */

const baseFragShader = document.getElementById("base-frag-shader").innerHTML;
const baseVertShader = document.getElementById("base-vert-shader").innerHTML;

const coordVertShader = document.getElementById("coord-vert-shader").innerHTML;
const coordFragShader = document.getElementById("coord-frag-shader").innerHTML;

/**@type {{name: string; locationType: ("in" | "uniform"), dataType: DataType}[]} */
const baseShaderVariables = [
  {
    name: "aVertexPosition",
    locationType: LocationType.IN,
    dataType: DataType.VEC3f
  },
  {
    name: "aVertexColor",
    locationType: LocationType.IN,
    dataType: DataType.VEC4f
  },
  {
    name: "uModelViewMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f
  },
  {
    name: "uProjectionMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f
  },
]

/**@type {{name: string; locationType: ("in" | "uniform"), dataType: DataType}[]} */
const coordShaderVariables = [
  {
    name: "aVertexPosition",
    locationType: LocationType.IN,
    dataType: DataType.VEC3f
  },
  {
    name: "uColor",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC4f
  },
  {
    name: "uModelViewMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f
  },
  {
    name: "uProjectionMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f
  },
]

let cubeUColor = new Color([1.0, 0.3, 1.0, 1.0]);
let xzPlaneUColor = new Color([0.0, 0.0, 0.4, 1.0]);
let g_triangleColor = new Color([0.5, 0.5, 0.5, 1.0]);

// -----------MAIN-------------

export const main = () => {
  const canvas = new WebGLCanvas("canvas", 720, 720);
  const aspectRatio = canvas.aspectRatio;
  const gl = canvas.gl;

  // SHADERS --------------------------

  const baseShader = new Shader(gl, baseVertShader, baseFragShader);
  baseShader.findLocations(baseShaderVariables);

  const coordShader = new Shader(gl, coordVertShader, coordFragShader);
  coordShader.findLocations(coordShaderVariables);

  // OBJECTS AND CAMERA ---------------

  const camera = new Camera(
    {
      // projectionOptions
      fov: 30,
      aspectRatio: aspectRatio,
      near: 0.1,
      far: 10000,
    },
  );

  const coords = new Coords(gl, baseShader, camera, 80)
    .bindBuffers();

  const square = new Square(gl, baseShader, camera, { r: 1.0, g: 0.1, b: 0.1, a: 0.5 })
    .setAttribute("aVertexColor", (self) => self.colorBuffer)
    .setAlpha(true)
    .bindBuffers();

  const cone = new Cone(gl, coordShader, camera, 20)
    .setUniform("uColor", () => xzPlaneUColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers()
    .setLocalPosition({ x: 5, y: 0, z: 5 })
    .setLocalTransforms((localMat) => {
      localMat.scale(2, 2, 2);
    }
  )

  const disc = new Disc(gl, coordShader, camera, 20)
    .setUniform("uColor", () => xzPlaneUColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers()
    .setLocalPosition({ x: -5, y: 0, z: -5 })
    .setLocalTransforms((localMat) => {
      localMat.scale(2, 2, 2);
    }
  )

  const sphere = new Sphere(gl, coordShader, camera)
    .setUniform("uColor", () => xzPlaneUColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers()
    .setLocalPosition({ x: -5, y: 0, z: 5 })
    .setLocalTransforms((localMat) => {
      localMat.scale(2, 2, 2);
    }
  )

  const triangle = new Triangle(gl, coordShader, camera)
    .setUniform("uColor", () => g_triangleColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers()
    .setLocalPosition({ x: 0, y: 2.4, z: 0 })
    .setLocalTransforms((localMat) => {
      localMat.translate(0, 1, 0);
      localMat.rotate(90, 1, 0, 0);
      localMat.rotate(90, 0, 1, 0);
    });

  const cylinder = new Cylinder(gl, coordShader, camera, 20)
    .setUniform("uColor", () => xzPlaneUColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers()
    .setLocalPosition({ x: 5, y: 0, z: -5 })
    .setLocalTransforms((localMat) => {
      localMat.scale(2, 2, 2);
    }
  )

  const xzPlane = new XZPlane(gl, coordShader, camera, { amount: 100, spacing: 1, length: 50 })
    .setUniform("uColor", () => xzPlaneUColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers();

  const cube = new Cube(gl, baseShader, camera)
    .swapShader(coordShader)
    .setUniform("uColor", () => cubeUColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers()
    .setLocalTransforms((localModelMatrix) => {
      localModelMatrix.scale(4, 2.4, 0.3);
    }
  )

  // RENDERINFO -----------------------

  /** @type {renderInfo}*/
  const renderInfo = {
    gl: gl,
    canvas: canvas,
    camera: camera,

    coords: coords,
    xzPlane: xzPlane,
    square: square,
    triangle: triangle,
    cone: cone,
    disc: disc,
    sphere: sphere,
    cylinder: cylinder,
    cube: cube,

    modelMatrix: new Matrix4(),
    fpsInfo: new FpsInfo("fps"),
    keyManager: new KeyManager(),
  }

  animate(renderInfo);
}

/**@param {renderInfo} renderInfo */
function animate(renderInfo) {
  const fps = renderInfo.fpsInfo;

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  fps.showFps();

  renderInfo.camera.handleKeys(renderInfo.keyManager.keysPressed, fps.dt);
  renderInfo.keyManager.handleEvents();
  renderInfo.canvas.clear({ r: 0.8, g: 0.8, b: 0.8, a: 1.0 });

  drawMain(renderInfo);
}

/**
 * @param {renderInfo} renderInfo
 */
function drawMain(renderInfo) {
  const modelMatrix = renderInfo.modelMatrix;

  // COORDS
  renderInfo.coords.draw();

  cubeUColor.set([1.0, 0.0, 1.0]);

  // WALL 1 part 1
  renderInfo.cube.setLocalPosition({ x: 5, y: 0, z: 0 });
  renderInfo.cube.draw();

  // WALL 1 part 2
  renderInfo.cube.setLocalPosition({ x: -5, y: 0, z: 0 });
  renderInfo.cube.draw();

  cubeUColor.set([0.0, 1.0, 0.0]);

  // WALL 2 part 1 --- ROTATE IN-PLACE BY GETTING POSITION
  renderInfo.cube.setLocalPosition({ x: 0, y: 0, z: -5 });
  const pos = renderInfo.cube.getLocalPosition();

  modelMatrix.setIdentity();
  modelMatrix.translate(pos.x, pos.y, pos.z);
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.translate(-pos.x, -pos.y, -pos.z);

  renderInfo.cube.updateMatrices(modelMatrix); // UPDATES THE MATRICES IN SEPERATE STEP
  console.log(`WALL 2 P1 ACTUAL POS: ${JSON.stringify(renderInfo.cube.getWorldPosition())}`);

  renderInfo.cube.draw({skipUpdateMatrices: true});

  // WALL 2 part 2 --- ROTATE AROUND ORIGIN (see diff in .setLocalPosition())
  renderInfo.cube.setLocalPosition({ x: -5, y: 0, z: 0 });
  modelMatrix.setIdentity();
  modelMatrix.rotate(90, 0, 1, 0);

  renderInfo.cube.updateMatrices(modelMatrix); // UPDATES THE MATRICES IN SEPERATE STEP
  console.log(`WALL 2 P2 ACTUAL POS: ${JSON.stringify(renderInfo.cube.getWorldPosition())}`); // NOW ACTUAL POS IS {x: -3.0..^-16, y: 0, z: 5} WHICH IS EXPECTED

  renderInfo.cube.draw({skipUpdateMatrices: true});

  // XZPLANE
  xzPlaneUColor.set([0.0, 0.0, 0.4, 1.0]);
  renderInfo.xzPlane.draw();

  // CONE
  renderInfo.cone.draw();

  // DISC
  renderInfo.disc.draw();

  // SPHERE
  xzPlaneUColor.set([0.4, 0.0, 0.4, 1.0]);
  renderInfo.sphere.draw();

  // CYLINDER
  renderInfo.cylinder.draw();

  // TRIANGLE 1
  g_triangleColor.set([0.5, 0.5, 0.5, 1.0])
  renderInfo.triangle.draw();

  // TRIANGLE 2
  g_triangleColor.set([0.3, 0.3, 0.3, 1.0])
  modelMatrix.setIdentity();
  modelMatrix.rotate(90, 0, 1, 0);
  
  renderInfo.triangle.updateMatrices(modelMatrix);
  renderInfo.triangle.draw({skipUpdateMatrices: true});

  // CENTRAL SQUARE
  renderInfo.square.draw();
}
