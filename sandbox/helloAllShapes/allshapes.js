import { Matrix4 } from "../../base/lib/cuon-matrix.js";
import { Camera } from "../../base/helpers/Camera.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { Shader, LocationType, DataType } from "../../base/helpers/WebGLShader.js";
import { initKeyPress, showFps, updateFps } from "../../base/lib/utility-functions.js";
import { Coords } from "../../base/shapes/coord.js";

const baseFragShader = document.getElementById("base-frag-shader").innerHTML;
const baseVertShader = document.getElementById("base-vert-shader").innerHTML;

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

// ------------------------

export const main = () => {
  const canvas = new WebGLCanvas("canvas", 720, 720);
  const aspectRatio = canvas.aspectRatio;
  const gl = canvas.gl;

  const baseShader = new Shader(gl, baseVertShader, baseFragShader);
  baseShader.findLocations(baseShaderVariables);

  const camera = new Camera(
    {
      // projectionOptions
      fov: 30,
      aspectRatio: aspectRatio,
      near: 0.1,
      far: 10000,
    },
  );

  const coords = new Coords(80, gl, baseShader, camera);

  /**
    * @type {{
    *   canvas: WebGLCanvas;
    *   camera: Camera,
    *   modelMatrix: Matrix4,
    *   modelViewMatrix: Matrix4,
    *   coords: Coords,
    *   keysPressed: Record<string, boolean>;}}
  */
  const renderInfo = {
    canvas: canvas,
    camera: camera,
    modelMatrix: new Matrix4(),
    modelViewMatrix: new Matrix4(),
    coords: coords,
    keysPressed: [],
  }

  /**
   * @type {{
   *  previousTime: number;
   *  dt: number;
   *  dtTotal: number;
   *  fps: number;
   * }}
   */
  const timeInfo = {
    previousTime: 0,
    dt: 0,
    dtTotal: 0,
    fps: 0
  }

  initKeyPress(renderInfo.keysPressed);

  renderLoop(renderInfo, timeInfo);
}

/**
 * @param {{
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  modelMatrix: Matrix4,
 *  modelViewMatrix: Matrix4,
 *  coords: Coords;
 *  keysPressed: Record<string, boolean>;}} renderInfo
 * @param {{ previousTime: number; dt: number; dtTotal: number; fps: number;}} timeInfo
 */
function renderLoop(renderInfo, timeInfo) {

  window.requestAnimationFrame((currentTime) => {
    updateFps(timeInfo, currentTime);
    renderLoop(renderInfo, timeInfo);
  })

  showFps(timeInfo, "fps")

  // --------------------

  renderInfo.canvas.clearCanvas({ r: 0.1, g: 0.1, b: 0.1, a: 1.0 });

  renderInfo.camera.handleKeys(renderInfo.keysPressed, timeInfo.dt);

  renderInfo.coords.draw(renderInfo.modelMatrix, renderInfo.modelViewMatrix);
}
