import { BasicBuffer } from "../../base/helpers/BasicBuffer.js";
import { Camera } from "../../base/helpers/Camera.js";
import { Color } from "../../base/helpers/color.js";
import { FpsInfo } from "../../base/helpers/fpsInfo.js";
import { ImageLoader } from "../../base/helpers/ImageLoader.js";
import { KeyManager } from "../../base/helpers/keyManager.js";
import { MatrixStack, RotateAround, TranslateDirection } from "../../base/helpers/matrixStack.js";
import { Texture } from "../../base/helpers/texture.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { DataType, LocationType, Shader } from "../../base/helpers/WebGLShader.js";
import { Matrix4 } from "../../base/lib/cuon-matrix.js";
import { Coords } from "../../base/shapes/coord.js";
import { Cube } from "../../base/shapes/cube.js";
import { Cylinder } from "../../base/shapes/cylinder.js";
import { Drawable } from "../../base/shapes/drawable.js";
import { XZPlane } from "../../base/shapes/xzPlane.js";

/**
 * @typedef {{
 *  gl: WebGL2RenderingContext;
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  modelMatrix: Matrix4;
 *  fpsInfo: FpsInfo;
 *  keyManager: KeyManager;
 *  matrixStack: MatrixStack;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  cubeBrick: Cube;
 *  treeStem: Cylinder;
 *  treePiece: Cube;
 *  animations: { cubeBrickRotationY: number }
 *  treeAnimations: {
 *    stemRotationZ: number;
 *    stemBaseRotationZ: number;
 *    branchRotationZ: number;
 *    branchBaseRotationZ: number;
 *    leafRotationZ: number;
 *    leafBaseRotationZ: number;
 *  }
 * }} renderInfo
 */

const baseFragShader = document.getElementById("base-frag-shader").innerHTML;
const baseVertShader = document.getElementById("base-vert-shader").innerHTML;

const textureFragShader = document.getElementById("texture-frag-shader").innerHTML;
const textureVertShader = document.getElementById("texture-vert-shader").innerHTML;

const treeFragShader = document.getElementById("tree-frag-shader").innerHTML;
const treeVertShader = document.getElementById("tree-vert-shader").innerHTML;

const textureUrls = [
  '../../base/textures/bricksLarge.png',
  '../../base/textures/metal1.png',
  '../../base/textures/dice1.png',
];

const imageLoader = new ImageLoader();
/**@type {[HTMLImageElement, HTMLImageElement, HTMLImageElement]} */
const [brickImage, metalImage, diceImage] = await imageLoader.load(textureUrls);

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
  }
]

/**@type {{name: string; locationType: ("in" | "uniform"), dataType: DataType}[]} */
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

/**@type {{name: string; locationType: ("in" | "uniform"), dataType: DataType}[]} */
const treeShaderVariables = [
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

let g_canvasColor = new Color([0.8, 0.8, 0.8, 1.0]);
let g_xzPlaneColor = new Color([0.0, 0.4, 0.4, 1.0]);
let g_cubeColor = new Color([1.0, 0.45, 0.9, 1.0]);

let g_treeColor = new Color([0.59, 0.29, 0.0, 1.0]);

const STEM = { x: 0.2, y: 3, z: 0.2 }
const BRANCH = { x: 0.1, y: 1, z: 0.1 }
const LEAF = { x: 0.12, y: 0.5, z: 0.12 };

export const main = () => {
  // CAMERA
  const camera = new Camera(
    {
      // projectionOptions
      fov: 30,
      aspectRatio: 16/9,
      near: 0.1,
      far: 10000,
    }, {
      // camPos
      x: 10,
      y: 5,
      z: 5,
    }
  );

  const canvas = new WebGLCanvas("canvas", 1000, 1000)
    .setCamera(camera)
    .setBgColor(g_canvasColor.rgba);

  const gl = canvas.gl;

  const brickMetalUvBuffer = new BasicBuffer(gl, brickMetalUvCoords);
  const diceUvBuffer = new BasicBuffer(gl, diceUvCoords);

  const brickTexture = new Texture(gl, brickImage);
  const metalTexture = new Texture(gl, metalImage);
  const diceTexture = new Texture(gl, diceImage);

  // SHADERS
  const baseShader = new Shader(gl, baseVertShader, baseFragShader)
    .findLocations(baseShaderVariables);

  const texShader = new Shader(gl, textureVertShader, textureFragShader)
    .findLocations(texShaderVariables);

  const treeShader = new Shader(gl, treeVertShader, treeFragShader)
    .findLocations(treeShaderVariables);


  // OBJECTS TO DRAW
  const coords = new Coords(gl, baseShader, camera, 80)
    .bindBuffers();

  const xzPlane = new XZPlane(gl, baseShader, camera, {
    amount: 100,
    spacing: 0.5,
    length: 50
    }, g_xzPlaneColor.rgba
  )
    .bindBuffers();

  const cubeBrick = new Cube(gl, texShader, camera)
    .setTexture("uSampler0", brickTexture)
    .setTexture("uSampler1", metalTexture)
    .setTexture("uSampler2", diceTexture)
    .setAttribute("aVertexTextureCoord", () => brickMetalUvBuffer.buffer)
    .setAttribute("aDiceTextureCoord", () => diceUvBuffer.buffer)
    .setUniform("uColor", () => g_cubeColor.raw)
    .setLocalPosition({ x: 1, y: 0.01, z: 1 })
    .setAlpha(true)
    .removeAttribute("aVertexColor")
    .bindBuffers();

  const treePiece = new Cube(gl, treeShader, camera)
    .setTexture("uSampler0", metalTexture)
    .setAttribute("aVertexTextureCoord", () => brickMetalUvBuffer.buffer)
    .setUniform("uColor", () => g_treeColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers();

  const stem = new Cylinder(gl, treeShader, camera, 12)
    .setTexture("uSampler0", brickTexture)
    .setAttribute("aVertexTextureCoord", () => brickMetalUvBuffer.buffer)
    .setUniform("uColor", () => g_treeColor.raw)
    .removeAttribute("aVertexColor")
    .bindBuffers();

  const keyManager = new KeyManager();
  const matrixStack = new MatrixStack();

  const renderInfo = {
    gl: gl,
    canvas: canvas,
    camera: camera,
    modelMatrix: new Matrix4(),

    fpsInfo: new FpsInfo("fps"),
    keyManager: keyManager,
    matrixStack: matrixStack,

    coords: coords,
    xzPlane: xzPlane,
    cubeBrick: cubeBrick,
    treeStem: stem,
    treePiece: treePiece,

    animations: { cubeBrickRotationY: 0 },
    treeAnimations: {
      stemRotationZ: 0,
      stemBaseRotationZ: 0,
      branchRotationZ: 0,
      branchBaseRotationZ: 0,
      leafRotationZ: 0,
      leafBaseRotationZ: 0
    },
  }

  keyManager.setEventOn("KeyZ", (dt) => {
    renderInfo.animations.cubeBrickRotationY += 100 * dt % 360;
  })
  keyManager.setEventOn("KeyX", (dt) => {
    renderInfo.animations.cubeBrickRotationY -= 100 * dt % 360;
  })
  keyManager.setEventOn("KeyN", (dt) => {
    renderInfo.treeAnimations.stemRotationZ += 25 * dt % 360;
  })
  keyManager.setEventOn("KeyM", (dt) => {
    renderInfo.treeAnimations.stemRotationZ -= 25 * dt % 360;
  })
  keyManager.setEventOn("KeyJ", (dt) => {
    renderInfo.treeAnimations.branchRotationZ += 25 * dt % 360;
  })
  keyManager.setEventOn("KeyK", (dt) => {
    renderInfo.treeAnimations.branchRotationZ -= 25 * dt % 360;
  })
  keyManager.setEventOn("KeyU", (dt) => {
    renderInfo.treeAnimations.leafRotationZ += 25 * dt % 360;
  })
  keyManager.setEventOn("KeyI", (dt) => {
    renderInfo.treeAnimations.leafRotationZ -= 25 * dt % 360;
  })

  cubeBrick.setLocalTransforms((localMat) => {
    localMat.translate(0, 0.33, 0);
    localMat.scale(0.33, 0.33, 0.33);
    localMat.rotate(renderInfo.animations.cubeBrickRotationY, 0, 1, 0);
  })

  animate(renderInfo);
}

/**
 * @param {renderInfo} renderInfo
 */
function animate(renderInfo) {
  const modelMatrix = renderInfo.modelMatrix;

  const fps = renderInfo.fpsInfo;
  fps.showFps();

  renderInfo.canvas.update();

  renderInfo.camera.handleKeys(renderInfo.keyManager.keysPressed, fps.dt);
  renderInfo.keyManager.handleEvents(fps.dt);

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  g_cubeColor.set([1.0, 0.8, 0.8, 0.8]);

  // Drawing --------------------

  modelMatrix.setIdentity();

  renderInfo.coords.draw();
  renderInfo.xzPlane.draw();

  // TREEDRAW ENTRYPOINT
  animateTree(renderInfo.treeAnimations, fps.totalTime);
  drawTree(renderInfo);

  renderInfo.matrixStack.empty();

  renderInfo.cubeBrick.updatePosition(
    {
      x: 0,
      y: 0.01,
      z: 0
    }, fps.dt
  );
  renderInfo.cubeBrick.draw();
}

/**
 * @param {renderInfo} renderInfo
 */
function drawTree(renderInfo) {
  const modelMatrix = renderInfo.modelMatrix;
  const matrixStack = renderInfo.matrixStack;

  const treeAnimations = renderInfo.treeAnimations;

  // ROOT IN ALL OF TREE
  modelMatrix.setIdentity();
  matrixStack.push(modelMatrix);

  matrixStack.createChildAndPush(
    { x: 0, y: 0, z: 0 },
    STEM,
    [TranslateDirection.UP],
    [
      {
        around: RotateAround.Z,
        angle: treeAnimations.stemRotationZ + treeAnimations.stemBaseRotationZ
      }
    ]
  );

  for (const dist of [3,2, 1, 0, -1, -2, -3]) {
    g_treeColor.set([0.89, 0.42, 0.15, 1.0]); // Color for the BRANCH

    matrixStack.createChildAndPush(
      STEM,
      BRANCH,
      [TranslateDirection.UP],
      [
        {
          around: RotateAround.Z,
          angle: treeAnimations.branchRotationZ + treeAnimations.branchBaseRotationZ - (dist * 25)
        }
      ]
    );

    const modelMatrixPart = matrixStack.peek();
    drawTreePart(modelMatrixPart, modelMatrix, BRANCH, renderInfo.treePiece);

    g_treeColor.set([0.05, 0.9, 0.05, 0.5]); // Color for the LEAF
    renderInfo.treePiece.setAlpha(true); // Should draw LEAF with alpha

    for (const j of [1, 0, -1]) {
      matrixStack.createChildAndPush(
        BRANCH,
        LEAF,
        [TranslateDirection.UP],
        [
          {
            around: RotateAround.Z,
            angle: treeAnimations.leafRotationZ + treeAnimations.leafBaseRotationZ - (j * 30)
          }
        ]
      )

      const modelMatrixPart = matrixStack.pop();
      drawTreePart(modelMatrixPart, modelMatrix, LEAF, renderInfo.treePiece);
    }
    renderInfo.treePiece.setAlpha(false); // Turn off alpha when LEAF finished drawing
    matrixStack.pop();
  }

  g_treeColor.set([0.59, 0.29, 0.0, 1.0]); // Color for the STEM

  // Cylinder goes from 1 -> 0, instead of 1 -> -1 like Square,
  // so need to translate and scale appropriately
  const modelMatrixPart = matrixStack.pop();
  modelMatrixPart.translate(0, -STEM.y / 2, 0);
  modelMatrixPart.scale(1, 2, 1);

  drawTreePart(modelMatrixPart, modelMatrix, STEM, renderInfo.treeStem);
}

/**
 * @param {Matrix4} stackModelMatrix
 * @param {Matrix4} modelMatrix
 * @param {{x: number; y: number; z: number;}} dimentions
 * @param {Drawable} drawable
 */
function drawTreePart(stackModelMatrix, modelMatrix, dimentions, drawable) {
  modelMatrix.set(stackModelMatrix);
  modelMatrix.scale(dimentions.x / 2, dimentions.y / 2, dimentions.z / 2);

  drawable.draw({outerModelMatrix: modelMatrix});
}

/**
 * @param {{
 *    stemRotationZ: number;
 *    stemBaseRotationZ: number;
 *    branchRotationZ: number;
 *    branchBaseRotationZ: number;
 *    leafRotationZ: number;
 *    leafBaseRotationZ: number;
 * }} treeAnimations
 * @param {number} time
 * @param {number} amplitude
*/
function animateTree(treeAnimations, time, amplitude = 8) {
  treeAnimations.stemBaseRotationZ = amplitude * Math.sin(time);
  treeAnimations.branchBaseRotationZ = amplitude * Math.sin(time + 1);
  treeAnimations.leafBaseRotationZ = amplitude * Math.sin(time + 2);
}
