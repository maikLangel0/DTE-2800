import { BasicBuffer } from "../../base/helpers/BasicBuffer";
import { Camera } from "../../base/helpers/Camera";
import { Color } from "../../base/helpers/color";
import { FpsInfo } from "../../base/helpers/fpsInfo";
import { loadImage } from "../../base/helpers/ImageLoader";
import { KeyManager } from "../../base/helpers/keyManager";
import { Texture } from "../../base/helpers/texture";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas";
import { DataType, LocationType, Shader } from "../../base/helpers/WebGLShader";
import { Matrix4 } from "../../base/lib/cuon-matrix";
import { niceColorsRaw } from "../../base/lib/utility-functions";
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
 * lightCube: Cube;
 * lightPosition: {x: number; y: number; z: number}
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

const lightPosInHtml = document.getElementById("lightPos");
if (!lightPosInHtml) throw Error("idot");

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
  }, {
    name: "uColorScalar",
    locationType: LocationType.UNIFORM,
    dataType: DataType.FLOAT
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
  {
    name: "aUvCoord",
    locationType: LocationType.IN,
    dataType: DataType.VEC2f
  },
  {
    name: "uSampler0",
    locationType: LocationType.UNIFORM,
    dataType: DataType.SAMPLER2D
  }
]

// ---------- TEXTURES AND UVS ----------

/**@type {HTMLImageElement} */
const brickImage = await loadImage('../../base/textures/bricksLarge.png');

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

const g_specularParams = niceColorsRaw.gold;

const g_bgColor = new Color([0.0, 0.0, 0.0, 1.0])
const g_lightCubeColor = new Color(g_specularParams.diffuse);

// ---------- MAIN ----------

export const main = () => {
  const camera = new Camera();

  const canvas = new WebGLCanvas("canvas", 1200, 1200)
    .setBgColor(g_bgColor.rgba)
    .setCamera(camera)

  const gl = canvas.gl;

  const cubeUvBuffer = new BasicBuffer(gl, cubeUvCoords);
  const brickTexture = new Texture(gl, brickImage);

  // ----- Shaders -----
  const baseShader = new Shader(gl, baseVertShaderSource, baseFragShaderSource)
    .findLocations(baseShaderVariables);

  const specularLightShader = new Shader(gl, specularLightingVertShaderSource, specularLightingFragShaderSource)
    .findLocations(specularLightShaderVariables);

  specularLightShader.log();

  // ----- Meshes / Drawables -----
  const coords = new Coords(gl, baseShader, camera, 100)
    .setUniform("uColorScalar", () => 0.3)
    .bindBuffers();

  const lightPosition = { x: 0, y: 0, z: 0 };

  const cube = new Cube(gl, specularLightShader, camera)
    .removeAttributes()
    .setAttribute("aVertexPosition", (self) => self.vertexBuffer)
    .setAttribute("aVertexNormal", (self) => self.normalBuffer)
    .setAttribute("aUvCoord", () => cubeUvBuffer.buffer)
    .setTexture("uSampler0", brickTexture)
    .setUniform("uModelMatrix", (self) => self.modelMatrix.elements)
    .setUniform("uModelViewMatrix", (self) => self.modelViewMatrix.elements)
    .setUniform("uProjectionMatrix", (self) => self.camera.projectionMatrix.elements)
    .setUniform("uNormalMatrix", (self) => self.normalMatrix)
    .setUniform("uCameraPosition", (self) => self.camera.getWorldPositionRaw())
    .setUniform("uLightPosition", () => [lightPosition.x, lightPosition.y, lightPosition.z])
    .setUniform("uAmbientLightColor", () => g_bgColor.raw)
    .setUniform("uDiffuseLightColor", () => g_specularParams.diffuse)
    .setUniform("uSpecularLightColor", () => g_specularParams.specular)
    .setUniform("uShininess", () => g_specularParams.shininess)
    .setUniform("uIntensity", () => g_specularParams.intensity)
    .setLocalPosition({ x: 10, y: 5, z: 2 })
    .setLocalTransforms((localMat) => {
      localMat.rotate(45, 1, 0, 0);
      localMat.scale(4, 3, 2);
    })
    .bindBuffers();

  const lightCube = new Cube(gl, baseShader, camera)
    .setVertexColorSingle(g_lightCubeColor.rgba)
    .setUniform("uColorScalar", () => 1)
    .setLocalTransforms((localMat) => {
      localMat.translate(lightPosition.x, lightPosition.y, lightPosition.z)
      localMat.scale(0.2, 0.2, 0.2)
    })
    .setAlpha(true)
    .bindBuffers()

  const keyManager = new KeyManager();

  const renderInfo = {
    canvas: canvas,
    camera: camera,
    modelMatrix: new Matrix4(),

    fpsInfo: new FpsInfo("fps"),
    keyManager: keyManager,

    coords: coords,
    cube: cube,
    lightCube: lightCube,

    lightPosition: lightPosition,
  }

  keyManager.setEventOn("KeyL", (dt) => {
    renderInfo.lightPosition.x -= 30 * dt;
  }).setEventOn("KeyJ", (dt) => {
    renderInfo.lightPosition.x += 30 * dt;
  }).setEventOn("KeyI", (dt) => {
    renderInfo.lightPosition.z += 30 * dt;
  }).setEventOn("KeyK", (dt) => {
    renderInfo.lightPosition.z -= 30 * dt;
  }).setEventOn("KeyU", (dt) => {
    renderInfo.lightPosition.y += 30 * dt;
  }).setEventOn("KeyO", (dt) => {
    renderInfo.lightPosition.y -= 30 * dt;
  })

  animate(renderInfo);
}

/** @param {RenderInfo} ctx */
function animate(ctx) {
  window.requestAnimationFrame((currTime) => {
    ctx.fpsInfo.updateFps(currTime);
    ctx.canvas.update()
    animate(ctx);
  })

  if (lightPosInHtml) {
    lightPosInHtml.innerHTML = `
      LightPosition: ${
        [Math.round(ctx.lightPosition.x), Math.round(ctx.lightPosition.y), Math.round(ctx.lightPosition.z)].join(" ")
      }
    `;
  }

  ctx.camera.handleKeys(ctx.keyManager.keysPressed, ctx.fpsInfo.dt);
  ctx.keyManager.handleEvents(ctx.fpsInfo.dt);
  ctx.fpsInfo.showFps();

  ctx.coords.draw();
  ctx.cube.draw();
  ctx.lightCube.draw();
}
