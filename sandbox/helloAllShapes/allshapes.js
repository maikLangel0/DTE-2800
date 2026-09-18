import { Camera } from "../../base/helpers/Camera.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { Shader, LocationType, DataType } from "../../base/helpers/WebGLShader.js";
import { initKeyPress } from "../../base/lib/utility-functions.js";
import { Coords } from "../../base/shapes/coord.js";
import { FpsInfo } from "../../base/helpers/fpsInfo.js";
import { Cube } from "../../base/shapes/cube.js";
import { RenderMatrices } from "../../base/helpers/renderMatrices.js";
import { Color } from "../../base/helpers/color.js";
import { XZPlane } from "../../base/shapes/xzPlane.js";
import { Cone } from "../../base/shapes/cone.js";
import { Disc } from "../../base/shapes/disc.js";
import { Sphere } from "../../base/shapes/sphere.js";
import { Cylinder } from "../../base/shapes/cylinder.js";
import { Square } from "../../base/shapes/square.js";
import { Triangle } from "../../base/shapes/triangle.js";

const baseFragShader = document.getElementById("base-frag-shader").innerHTML;
const baseVertShader = document.getElementById("base-vert-shader").innerHTML;

const coordVertShader = document.getElementById("coord-vert-shader").innerHTML;
const coordFragShader = document.getElementById("coord-frag-shader").innerHTML;

/**@type {{name: string; locationType: LocationType, dataType: DataType}[]} */
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

/**@type {{name: string; locationType: LocationType, dataType: DataType}[]} */
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

// ------------------------

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

  const coords = new Coords(gl, baseShader, camera, 80);
  coords.bindBuffers();

  const square = new Square(gl, baseShader, camera, { r: 1.0, g: 0.1, b: 0.1, a: 0.5 });
  square.bindBuffers();

  const cone = new Cone(gl, coordShader, camera, 20);
  cone.relateDataInClassToShader({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...cone._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(xzPlaneUColor.raw) } },
    ]
  });
  cone.bindBuffers();

  const disc = new Disc(gl, coordShader, camera, 20);
  disc.relateDataInClassToShader({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...disc._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(xzPlaneUColor.raw) } },
    ]
  });
  disc.bindBuffers();

  const sphere = new Sphere(gl, coordShader, camera);
  sphere.relateDataInClassToShader({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...sphere._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(xzPlaneUColor.raw) } },
    ]
  });
  sphere.bindBuffers();

  const triangle = new Triangle(gl, coordShader, camera);
  triangle.relateDataInClassToShader({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...triangle._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(xzPlaneUColor.raw) } },
    ]
  });
  triangle.bindBuffers();

  const cylinder = new Cylinder(gl, coordShader, camera, 20);
  cylinder.relateDataInClassToShader({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...cylinder._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(xzPlaneUColor.raw) } },
    ]
  });
  cylinder.bindBuffers();

  const xzPlane = new XZPlane(gl, coordShader, camera, { amount: 100, spacing: 1, length: 50 });
  xzPlane.relateDataInClassToShader({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...xzPlane._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(xzPlaneUColor.raw) } },
    ]
  });
  xzPlane.bindBuffers();

  const cube = new Cube(gl, baseShader, camera);

  cube.swapShader(coordShader);
  cube.relateDataInClassToShader({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...cube._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(cubeUColor.raw) } },
    ]
  });
  cube.bindBuffers();

  // RENDERINFO -----------------------

  /**
    * @type {{
    *   gl: WebGL2RenderingContext,
    *   canvas: WebGLCanvas;
    *   camera: Camera,
    *   matrices: RenderMatrices;
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
    *   keysPressed: Record<string, boolean>;}}
  */
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
    matrices: new RenderMatrices(),
    fpsInfo: new FpsInfo("fps"),
    keysPressed: [],
  }

  initKeyPress(renderInfo.keysPressed);

  animate(renderInfo);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  cone: Cone;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;}} renderInfo
 */
function animate(renderInfo) {
  const fps = renderInfo.fpsInfo;

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  fps.showFps();
  renderInfo.camera.handleKeys(renderInfo.keysPressed, fps.dt);

  renderInfo.canvas.clear({ r: 0.8, g: 0.8, b: 0.8, a: 1.0 });

  drawMain(renderInfo);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  cone: Cone;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;}} renderInfo
 */
function drawMain(renderInfo) {
  const gl = renderInfo.gl;
  
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  // COORDS
  modelMatrix.setIdentity();
  renderInfo.coords.draw(matrices);

  cubeUColor.set([1.0, 0.0, 1.0]);

  // WALL 1 part 1
  modelMatrix.setIdentity();
  modelMatrix.translate(5, 0, 0);
  modelMatrix.scale(4, 2.4, 0.3);

  renderInfo.cube.draw(matrices);

  // WALL 1 part 2
  modelMatrix.setIdentity();
  modelMatrix.translate(-5, 0, 0);
  modelMatrix.scale(4, 2.4, 0.3);

  renderInfo.cube.draw(matrices);

  cubeUColor.set([0.0, 1.0, 0.0]);

  // WALL 2 part 1
  modelMatrix.setIdentity();
  modelMatrix.translate(0, 0, 5);
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.scale(4, 2.4, 0.3);

  renderInfo.cube.draw(matrices);

  // WALL 2 part 2
  modelMatrix.setIdentity();
  modelMatrix.translate(0, 0, -5);
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.scale(4, 2.4, 0.3);

  renderInfo.cube.draw(matrices);

  // XZPLANE
  xzPlaneUColor.set([0.0, 0.0, 0.4, 1.0]);

  modelMatrix.setIdentity();
  renderInfo.xzPlane.draw(matrices);

  // CONE
  modelMatrix.setIdentity();
  modelMatrix.translate(5, 0, 5);
  modelMatrix.scale(2, 2, 2);
  renderInfo.cone.draw(matrices);

  // DISC
  modelMatrix.setIdentity();
  modelMatrix.translate(-5, 0, -5);
  modelMatrix.scale(2, 2, 2);
  renderInfo.disc.draw(matrices);

  // SPHERE
  xzPlaneUColor.set([0.4, 0.0, 0.4, 1.0]);

  modelMatrix.setIdentity();
  modelMatrix.translate(-5, 0, 5);
  modelMatrix.scale(2, 2, 2);
  renderInfo.sphere.draw(matrices, gl.TRIANGLES);

  // CYLINDER
  modelMatrix.setIdentity();
  modelMatrix.translate(5, 0, -5);
  modelMatrix.scale(2, 2, 2);
  renderInfo.cylinder.draw(matrices);

  // TRIANGLE
  modelMatrix.setIdentity();
  modelMatrix.translate(0, 2.4, 0);
  renderInfo.triangle.draw(matrices);

  // CENTRAL SQUARE
  modelMatrix.setIdentity();
  renderInfo.square.draw(matrices, gl.TRIANGLES, true);
}
