import { Camera } from "../../base/helpers/Camera.js";
import { Color } from "../../base/helpers/color.js";
import { FpsInfo } from "../../base/helpers/fpsInfo.js";
import { ImageLoader } from "../../base/helpers/ImageLoader.js";
import { KeyManager } from "../../base/helpers/keyManager.js";
import { RenderMatrices } from "../../base/helpers/renderMatrices.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { DataType, LocationType, Shader } from "../../base/helpers/WebGLShader.js";
import { Coords } from "../../base/shapes/coord.js";
import { Cube } from "../../base/shapes/cube.js";
import { XZPlane } from "../../base/shapes/xzPlane.js";

const baseFragShader = document.getElementById("base-frag-shader").innerHTML;
const baseVertShader = document.getElementById("base-vert-shader").innerHTML;

const textureFragShader = document.getElementById("texture-frag-shader").innerHTML;
const textureVertShader = document.getElementById("texture-vert-shader").innerHTML;

const textureUrls = [
  '../../base/textures/bricksLarge.png',
  '../../base/textures/metal1.png',
  '../../base/textures/dice1.png',
];

const imageLoader = new ImageLoader();
/**@type {[HTMLImageElement, HTMLImageElement, HTMLImageElement]} */
const [brickImage, metalImage, diceImage] = await imageLoader.load(textureUrls);

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
  }
]

/**@type {{name: string; locationType: LocationType, dataType: DataType}[]} */
const texShaderVariables = [
  {
    name: "aVertexPosition",
    locationType: LocationType.IN,
    dataType: DataType.VEC3f
  },
  {
    name: "aVertexTextureCoord",
    locationType: LocationType.IN,
    dataType: DataType.VEC2f
  },
  {
    name: "aDiceTextureCoord",
    locationType: LocationType.IN,
    dataType: DataType.VEC2f
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
  {
    name: "uSampler0",
    locationType: LocationType.UNIFORM,
    dataType: DataType.SAMPLER2D
  },
  {
    name: "uSampler1",
    locationType: LocationType.UNIFORM,
    dataType: DataType.SAMPLER2D
  },
  {
    name: "uSampler2",
    locationType: LocationType.UNIFORM,
    dataType: DataType.SAMPLER2D
  },
  {
    name: "uColor",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC4f
  },
]

/**@type {number[]} */
let brickMetalUvCoords = [];
//Front:
let bl=[0,0];
let br=[1,0];
let tr=[1,1];
let tl=[0,1];

brickMetalUvCoords = brickMetalUvCoords.concat(tl, bl, br, tl, br, tr);
brickMetalUvCoords = brickMetalUvCoords.concat(tl, bl, br, tl, br, tr);
brickMetalUvCoords = brickMetalUvCoords.concat(tl, bl, br, tl, br, tr);
brickMetalUvCoords = brickMetalUvCoords.concat(tl, bl, br, tl, br, tr);
brickMetalUvCoords = brickMetalUvCoords.concat(tl, bl, br, tl, br, tr);
brickMetalUvCoords = brickMetalUvCoords.concat(tl, bl, br, tl, br, tr);

// CLANKER OUTPUT START --------------------
/** @type {number[]} */
let diceUvCoords = [];

// =========================
// Front = 1
// =========================
//
// Vertices:
// 0: (-1,  1, 1) = TL
// 1: (-1, -1, 1) = BL
// 2: ( 1, -1, 1) = BR
// 3: (-1,  1, 1) = TL
// 4: ( 1, -1, 1) = BR
// 5: ( 1,  1, 1) = TR

diceUvCoords = diceUvCoords.concat(
    [0, 1],       // TL
    [0, 0.5],     // BL
    [0.33333, 0.5], // BR

    [0, 1],       // TL
    [0.33333, 0.5], // BR
    [0.33333, 1]  // TR
);

// =========================
// Right = 2
// =========================
//
// Vertex order is:
// A = ( 1,  1,  1)
// B = ( 1, -1,  1)
// C = ( 1, -1, -1)
// D = ( 1,  1, -1)
//
// When looking at the right side from outside,
// A is TR, B is BR, C is BL, D is TL.

diceUvCoords = diceUvCoords.concat(
    [0.33333, 1],   // TL
    [0.33333, 0.5], // BL
    [0.66666, 0.5], // BR

    [0.33333, 1],   // TL
    [0.66666, 0.5], // BR
    [0.66666, 1]    // TR
);

// =========================
// Top = 3
// =========================
//
// Vertex order:
// A = (-1, 1, -1) = TL
// B = (-1, 1,  1) = BL
// C = ( 1, 1,  1) = BR
// D = ( 1, 1, -1) = TR

diceUvCoords = diceUvCoords.concat(
    [0.66666, 1],   // TL
    [0.66666, 0.5], // BL
    [1, 0.5],       // BR

    [0.66666, 1],   // TL
    [1, 0.5],       // BR
    [1, 1]          // TR
);

// =========================
// Left = 5
// =========================
//
// Vertex order:
// A = (-1,  1, -1) = TL
// B = (-1, -1, -1) = BL
// C = (-1, -1,  1) = BR
// D = (-1,  1,  1) = TR

diceUvCoords = diceUvCoords.concat(
    [0.33333, 0.5], // TL
    [0.33333, 0],   // BL
    [0.66666, 0],   // BR

    [0.33333, 0.5], // TL
    [0.66666, 0],   // BR
    [0.66666, 0.5]  // TR
);

// =========================
// Back = 6
// =========================
//
// Vertex order:
// A = ( 1,  1, -1) = TR
// B = ( 1, -1, -1) = BR
// C = (-1, -1, -1) = BL
// D = (-1,  1, -1) = TL

diceUvCoords = diceUvCoords.concat(
    [0.66666, 0.5], // TL
    [0.66666, 0],   // BL
    [1, 0],         // BR

    [0.66666, 0.5], // TL
    [1, 0],         // BR
    [1, 0.5]        // TR
);

// =========================
// Bottom = 4
// =========================
//
// Vertex order:
// A = (-1, -1,  1) = TL
// B = (-1, -1, -1) = BL
// C = ( 1, -1, -1) = BR
// D = ( 1, -1,  1) = TR

diceUvCoords = diceUvCoords.concat(
    [0, 0.5],       // TL
    [0, 0],         // BL
    [0.33333, 0],   // BR

    [0, 0.5],       // TL
    [0.33333, 0],   // BR
    [0.33333, 0.5]  // TR
);
// CLANKER OUTPUT END --------------------

let canvasColor = new Color([0.8, 0.8, 0.8, 1.0]);
let xzPlaneColor = new Color([0.0, 0.4, 0.4, 1.0]);
let cubeColor = new Color([1.0, 0.45, 0.9, 1.0]);

const CUBEBRICK_SCALEFACTOR = 3;

export const main = () => {
  const canvas = new WebGLCanvas("canvas", 720, 720);
  const aspectRatio = canvas.aspectRatio;
  const gl = canvas.gl;

  // SHADERS
  const baseShader = new Shader(gl, baseVertShader, baseFragShader);
  baseShader.findLocations(baseShaderVariables);

  const texShader = new Shader(gl, textureVertShader, textureFragShader);
  texShader.findLocations(texShaderVariables);

  // CAMERA
  const camera = new Camera(
    {
      // projectionOptions
      fov: 30,
      aspectRatio: aspectRatio,
      near: 0.1,
      far: 10000,
    }, {
      // camPos
      x: 10,
      y: 5,
      z: 5,
    }
  );

  // OBJECTS TO DRAW
  const coords = new Coords(gl, baseShader, camera, 80);
  coords.bindBuffers();

  const xzPlane = new XZPlane(gl, baseShader, camera, {
    amount: 100,
    spacing: 0.5,
    length: 50
    }, xzPlaneColor.rgba
  );
  xzPlane.bindBuffers();

  const cubeBrick = new Cube(gl, texShader, camera);
  cubeBrick.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => self.positionBuffer },
    ],
    uniforms: [
      { name: "uColor", getValue: () => new Float32Array(cubeColor.raw) },
      { name: "uProjectionMatrix", getValue: (self) => self.camera.projectionMatrix.elements },
      { name: "uModelViewMatrix", getValue: (self, matrices) => {
        const modelViewMatrix = matrices.modelViewMatrix;

        modelViewMatrix.set(self.camera.viewMatrix);
        modelViewMatrix.multiply(matrices.modelMatrix);

        return modelViewMatrix.elements
      }},
    ]
  })
  cubeBrick.setWorldPosition({
    x: 0,
    y: 0.01 + CUBEBRICK_SCALEFACTOR,
    z: 0
  });
  cubeBrick.setAlpha(true);

  cubeBrick.bindTexture(brickMetalUvCoords, brickImage, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler0",
    target: gl.TEXTURE_2D,
  });
  cubeBrick.bindTexture(brickMetalUvCoords, metalImage, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler1",
    target: gl.TEXTURE_2D,
  });
  cubeBrick.bindTexture(diceUvCoords, diceImage, {
    uvAttributeName: "aDiceTextureCoord",
    samplerName: "uSampler2",
    target: gl.TEXTURE_2D
  })
  cubeBrick.bindBuffers();

  // MODELMATRIX AND MODELVIEWMATRIX INSTANCIATION
  const matrices = new RenderMatrices();

  const renderInfo = {
    canvas: canvas,
    camera: camera,
    matrices: matrices,

    fpsInfo: new FpsInfo("fps"),
    keyManager: new KeyManager(),

    coords: coords,
    xzPlane: xzPlane,
    cubeBrick: cubeBrick,
    }

  animate(renderInfo);
}

/**
 * @param {{
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  fpsInfo: FpsInfo;
 *  keyManager: KeyManager;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  cubeBrick: Cube}} renderInfo
 */
function animate(renderInfo) {
  const fps = renderInfo.fpsInfo;
  fps.showFps();

  renderInfo.canvas.clear(canvasColor.rgba);
  renderInfo.camera.handleKeys(renderInfo.keyManager.keysPressed, fps.dt);

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  cubeColor.set([1.0, 0.8, 0.8, 0.8]);

  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  // Drawing --------------------

  modelMatrix.setIdentity();

  renderInfo.coords.draw(matrices);
  renderInfo.xzPlane.draw(matrices);

  renderInfo.cubeBrick.updateWorldPosition({
    x: 0,
    y: 0.01,
    z: 0
  });

  modelMatrix.setIdentity();
  modelMatrix.translate(1, 0, 1);
  modelMatrix.rotate(45, 0, 1, 0);
  modelMatrix.scale(
    CUBEBRICK_SCALEFACTOR,
    CUBEBRICK_SCALEFACTOR,
    CUBEBRICK_SCALEFACTOR
  );

  renderInfo.cubeBrick.draw(matrices);
}
