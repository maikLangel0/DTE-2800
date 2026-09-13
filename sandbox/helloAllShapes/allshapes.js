import { Camera } from "../../base/helpers/Camera.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { Shader, LocationType, DataType } from "../../base/helpers/WebGLShader.js";
import { initKeyPress } from "../../base/lib/utility-functions.js";
import { Coords } from "../../base/shapes/coord.js";
import { FpsInfo } from "../../base/helpers/fpsInfo.js";
import { Cube } from "../../base/shapes/cube.js";
import { RenderMatrices } from "../../base/helpers/renderMatrices.js";

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

  const coords = new Coords(gl, baseShader, camera, 80);
  coords.bindBuffers();

  const cube = new Cube(gl, baseShader, camera, { r: 1.0, g: 0.5, b: 1.0, a: 1.0 });
  cube.bindBuffers();

  cube.setColor({ r: 0.5, g: 0.5, b: 1.0, a: 1.0 });
  cube.bindColorBuffer();
  
  /**
    * @type {{
    *   canvas: WebGLCanvas;
    *   camera: Camera,
    *   matrices: RenderMatrices;
    *   coords: Coords;
    *   cube: Cube;
    *   fpsInfo: FpsInfo;
    *   keysPressed: Record<string, boolean>;}}
  */
  const renderInfo = {
    canvas: canvas,
    camera: camera,
    coords: coords,
    cube: cube,
    matrices: new RenderMatrices(),
    fpsInfo: new FpsInfo("fps"),
    keysPressed: [],
  }

  initKeyPress(renderInfo.keysPressed);

  renderLoop(renderInfo);
}

/**
 * @param {{
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;}} renderInfo
 */
function renderLoop(renderInfo) {
  const fps = renderInfo.fpsInfo;
  const canvas = renderInfo.canvas;
  const camera = renderInfo.camera;

  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    renderLoop(renderInfo);
  })

  fps.showFps();

  // ----------------------------------------------------

  canvas.clear({ r: 0.1, g: 0.1, b: 0.1, a: 1.0 });

  camera.handleKeys(renderInfo.keysPressed, fps.dt);

  modelMatrix.setIdentity();
  renderInfo.coords.draw(matrices);
  
  modelMatrix.setIdentity();
  renderInfo.cube.draw(matrices);
}
