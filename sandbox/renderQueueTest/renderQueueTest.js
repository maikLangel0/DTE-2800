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
import { RenderQueue } from "../../base/helpers/renderQueue.js";
import { KeyManager } from "../../base/helpers/keyManager.js";

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
  square.setAlpha(true);
  square.bindBuffers();

  const renderQueue = new RenderQueue();

  renderQueue.append(coords);
  renderQueue.append(square);

  const renderInfo = {
    canvas: canvas,
    camera: camera,
    keyManager: new KeyManager(),
    fpsInfo: new FpsInfo("fps"),
    renderQueue: renderQueue,

  }

  animate(renderInfo);
}

/**
 *
 * @param {{
 *  canvas: WebGLCanvas,
 *  camera: Camera,
 *  keyManager: KeyManager,
 *  fpsInfo: FpsInfo,
 *  renderQueue: RenderQueue,
 * }} renderInfo
 */
function animate(renderInfo) {
  const fps = renderInfo.fpsInfo;

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  fps.showFps();
  renderInfo.camera.handleKeys(renderInfo.keyManager.keysPressed, fps.dt);

  renderInfo.canvas.clear({ r: 0.8, g: 0.8, b: 0.8, a: 1.0 });

  renderInfo.renderQueue.render();
}
