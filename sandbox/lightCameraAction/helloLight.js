import { BasicBuffer } from "../../base/helpers/BasicBuffer";
import { Camera } from "../../base/helpers/Camera";
import { Color } from "../../base/helpers/color";
import { FpsInfo } from "../../base/helpers/fpsInfo";
import { loadImage } from "../../base/helpers/ImageLoader";
import { KeyManager } from "../../base/helpers/keyManager";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas";
import { DataType, LocationType, Shader } from "../../base/helpers/WebGLShader";
import { Matrix4 } from "../../base/lib/cuon-matrix";
import { Coords } from "../../base/shapes/coord";
import { Cube } from "../../base/shapes/cube";

/**@typedef {{
 * canvas: WebGLCanvas;
 * camera: Camera;
 * modelMatrix: Matrix4;
 * fpsInfo: FpsInfo;
 * keyManager: KeyManager;
 * coords: Coords;
 * cube: Cube;
 }} RenderInfo */
/**@typedef {{name: string; locationType: ("in" | "uniform"), dataType: DataType}[]} ShaderVariables*/

// ---------- SHADERSOURCE & SHADER-VARIABLES ----------
// 
const baseVertShaderSource = document.getElementById("base-vert-shader")?.innerHTML;
const baseFragShaderSource = document.getElementById("base-frag-shader")?.innerHTML;
if (baseVertShaderSource === undefined || baseFragShaderSource === undefined) throw Error("idot")

const specularLightingVertShaderSource = document.getElementById("lighting-vert-shader")?.innerHTML;
const specularLightingFragShaderSource = document.getElementById("lighting-frag-shader")?.innerHTML; 
if (specularLightingVertShaderSource === undefined || specularLightingFragShaderSource === undefined) throw Error("idot")

/**@type {ShaderVariables} */
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
  }
]

/**@type {ShaderVariables} */
const specularLightShaderVariables = [
  {
    name: "aVertexPosition",
    locationType: LocationType.IN,
    dataType: DataType.VEC3f,
  },
  {
    name: "aVertexNormal",
    locationType: LocationType.IN,
    dataType: DataType.VEC3f,
  },
  {
    name: "uModelMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f,
  },
  {
    name: "uModelViewMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f,
  },
  {
    name: "uProjectionMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f,
  },
  {
    name: "uNormalMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT3f,
  },
  {
    name: "uCameraPosition",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC3f,
  },
  {
    name: "uLightPosition",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC3f,
  },
  {
    name: "uAmbientLightColor",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC4f,
  },
  {
    name: "uDiffuseLightColor",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC4f,
  },
  {
    name: "uSpecularLightColor",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC4f,
  },
  {
    name: "uShininess",
    locationType: LocationType.UNIFORM,
    dataType: DataType.FLOAT,
  },
  {
    name: "uIntensity",
    locationType: LocationType.UNIFORM,
    dataType: DataType.FLOAT,
  },
]

// ---------- TEXTURES AND UVS ----------

/**@type {HTMLImageElement} */
const brickLarge = await loadImage('../../base/textures/bricksLarge.png');

/**@type {number[]} */
let cubeUvCoords = [];
//Front:
let bl=[0,0];
let br=[1,0];
let tr=[1,1];
let tl=[0,1];

cubeUvCoords = cubeUvCoords.concat(tl, bl, br, tl, br, tr);
cubeUvCoords = cubeUvCoords.concat(tl, bl, br, tl, br, tr);
cubeUvCoords = cubeUvCoords.concat(tl, bl, br, tl, br, tr);
cubeUvCoords = cubeUvCoords.concat(tl, bl, br, tl, br, tr);
cubeUvCoords = cubeUvCoords.concat(tl, bl, br, tl, br, tr);
cubeUvCoords = cubeUvCoords.concat(tl, bl, br, tl, br, tr);

// ---------- COLORS ----------

const g_bgColor = new Color([0.8, 0.8, 0.8, 1.0]);
const g_cubeColor = new Color([0.8, 0.8, 0.8, 1.0]);

// ---------- MAIN ----------

export const main = () => {
  const camera = new Camera();

  const canvas = new WebGLCanvas("canvas", 900, 900)
    .setBgColor(g_bgColor.rgba)
    .setCamera(camera)

  const gl = canvas.gl;

  const cubeUvBuffer = new BasicBuffer(gl, cubeUvCoords);

  // ----- Shaders -----
  const baseShader = new Shader(gl, baseVertShaderSource, baseFragShaderSource)
    .findLocations(baseShaderVariables);

  const specularLightShader = new Shader(gl, specularLightingVertShaderSource, specularLightingFragShaderSource)
    .findLocations(specularLightShaderVariables);

  // ----- Meshes / Drawables -----
  const coords = new Coords(gl, baseShader, camera, 100)
    .bindBuffers();

  const cube = new Cube(gl, specularLightShader, camera)
    .removeAttribute("aVertexColor")
    .setAttribute("aVertexNormal", (self) => self.normalBuffer)
    .setUniform("uColor", () => g_cubeColor.raw)
    .bindBuffers();

  const keyManager = new KeyManager();

  const renderInfo = {
    canvas: canvas,
    camera: camera,
    modelMatrix: new Matrix4(),

    fpsInfo: new FpsInfo("fps"),
    keyManager: keyManager,

    coords: coords,
    cube: cube,
  }

  animate(renderInfo);
}

/** @param {RenderInfo} ctx */
function animate(ctx) {
  window.requestAnimationFrame((currTime) => {
    ctx.fpsInfo.updateFps(currTime);
    ctx.canvas.update()
    animate(ctx);
  })
  
  ctx.camera.handleKeys(ctx.keyManager.keysPressed, ctx.fpsInfo.dt);
  ctx.keyManager.handleEvents();
  ctx.fpsInfo.showFps();

  ctx.coords.draw();
  ctx.cube.draw();
}