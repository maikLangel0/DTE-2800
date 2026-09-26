import { Camera } from "../../base/helpers/Camera.js";
import { Color } from "../../base/helpers/color.js";
import { FpsInfo } from "../../base/helpers/fpsInfo.js";
import { ImageLoader } from "../../base/helpers/ImageLoader.js";
import { KeyManager } from "../../base/helpers/keyManager.js";
import { MatrixStack, RotateAround, TranslateDirection } from "../../base/helpers/matrixStack.js";
import { RenderMatrices } from "../../base/helpers/renderMatrices.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { DataType, LocationType, Shader } from "../../base/helpers/WebGLShader.js";
import { Matrix4 } from "../../base/lib/cuon-matrix.js";
import { Coords } from "../../base/shapes/coord.js";
import { Cube } from "../../base/shapes/cube.js";
import { Square } from "../../base/shapes/square.js";
import { XZPlane } from "../../base/shapes/xzPlane.js";

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

/**@type {{name: string; locationType: LocationType, dataType: DataType}[]} */
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

const CUBEBRICK_SCALEFACTOR = 0.33;

const STEM = { x: 0.1, y: 3, z: 0.1 }
const BRANCH = { x: 0.04, y: 1, z: 0.04 }

export const main = () => {
  const canvas = new WebGLCanvas("canvas", 720, 720);
  const aspectRatio = canvas.aspectRatio;
  const gl = canvas.gl;

  // SHADERS
  const baseShader = new Shader(gl, baseVertShader, baseFragShader);
  baseShader.findLocations(baseShaderVariables);

  const texShader = new Shader(gl, textureVertShader, textureFragShader);
  texShader.findLocations(texShaderVariables);

  const treeShader = new Shader(gl, treeVertShader, treeFragShader);
  treeShader.findLocations(treeShaderVariables);

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
    }, g_xzPlaneColor.rgba
  );
  xzPlane.bindBuffers();

  const cubeBrick = new Cube(gl, texShader, camera);
  cubeBrick.setWorldPosition({
    x: 0,
    y: 0.01 + CUBEBRICK_SCALEFACTOR,
    z: 0
  });
  cubeBrick.setAlpha(true);
  cubeBrick.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => self.positionBuffer },
    ],
    uniforms: [
      { name: "uColor", getValue: () => g_cubeColor.raw },
      { name: "uProjectionMatrix", getValue: (self) => self.camera.projectionMatrix.elements },
      {
        name: "uModelViewMatrix", getValue: (self, matrices) => {
          const modelViewMatrix = matrices.modelViewMatrix;

          modelViewMatrix.set(self.camera.viewMatrix);
          modelViewMatrix.multiply(matrices.modelMatrix);

          return modelViewMatrix.elements
        }
      },
    ]
  });
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

  const treePiece = new Cube(gl, treeShader, camera);
  treePiece.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => self.positionBuffer },
    ],
    uniforms: [
      { name: "uColor", getValue: () => g_treeColor.raw },
      { name: "uProjectionMatrix", getValue: (self) => self.camera.projectionMatrix.elements },
      {
        name: "uModelViewMatrix", getValue: (self, matrices) => {
          const modelViewMatrix = matrices.modelViewMatrix;

          modelViewMatrix.set(self.camera.viewMatrix);
          modelViewMatrix.multiply(matrices.modelMatrix);

          return modelViewMatrix.elements
        }
      },
    ]
  });
  treePiece.bindTexture(brickMetalUvCoords, metalImage, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler0",
    target: gl.TEXTURE_2D,
  });
  treePiece.bindBuffers();

  // MODELMATRIX AND MODELVIEWMATRIX INSTANCIATION
  const matrices = new RenderMatrices();

  const keyManager = new KeyManager();
  const matrixStack = new MatrixStack();

  const renderInfo = {
    canvas: canvas,
    camera: camera,
    matrices: matrices,

    fpsInfo: new FpsInfo("fps"),
    keyManager: keyManager,
    matrixStack: matrixStack,

    coords: coords,
    xzPlane: xzPlane,
    cubeBrick: cubeBrick,
    treePiece: treePiece,

    animations: { cubeBrickRotationY: 0 },
    treeAnimations: { stemRotationZ: 0, branchRotationZ: 5, leafRotationZ: 3 },
  }

  keyManager.setEventOn("KeyJ", (dt) => {
    renderInfo.animations.cubeBrickRotationY += 100 * dt % 360;
  })
  keyManager.setEventOn("KeyK", (dt) => {
    renderInfo.animations.cubeBrickRotationY -= 100 * dt % 360;
  })
  keyManager.setEventOn("KeyU", (dt) => {
    renderInfo.treeAnimations.stemRotationZ += 25 * dt % 360;
  })
  keyManager.setEventOn("KeyI", (dt) => {
    renderInfo.treeAnimations.stemRotationZ -= 25 * dt % 360;
  })
  keyManager.setEventOn("KeyO", (dt) => {
    renderInfo.treeAnimations.branchRotationZ += 25 * dt % 360;
  })
  keyManager.setEventOn("KeyP", (dt) => {
    renderInfo.treeAnimations.branchRotationZ -= 25 * dt % 360;
  })

  animate(renderInfo);
}

/**
 * @param {{
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  fpsInfo: FpsInfo;
 *  keyManager: KeyManager;
 *  matrixStack: MatrixStack;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  cubeBrick: Cube;
 *  treePiece: Square;
 *  animations: { cubeBrickRotationY: number }
 *  treeAnimations: {stemRotationZ: number; branchRotationZ: number; leafRotationZ: number;}}} renderInfo
 */
function animate(renderInfo) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  const fps = renderInfo.fpsInfo;
  fps.showFps();

  renderInfo.canvas.clear(g_canvasColor.rgba);

  renderInfo.camera.handleKeys(renderInfo.keyManager.keysPressed, fps.dt);
  renderInfo.keyManager.handleEvents(fps.dt);

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  g_cubeColor.set([1.0, 0.8, 0.8, 0.8]);

  // Drawing --------------------

  modelMatrix.setIdentity();

  renderInfo.coords.draw(matrices);
  renderInfo.xzPlane.draw(matrices);

  // TREEDRAW ENTRYPOINT
  drawTree(renderInfo);
  renderInfo.matrixStack.empty();

  renderInfo.cubeBrick.updateWorldPosition(
    {
      x: 0,
      y: 0.01,
      z: 0
    }, fps.dt
  );

  modelMatrix.setIdentity();
  modelMatrix.translate(2, 0, 2);
  modelMatrix.rotate(renderInfo.animations.cubeBrickRotationY, 0, 1, 0);
  modelMatrix.scale(
    CUBEBRICK_SCALEFACTOR,
    CUBEBRICK_SCALEFACTOR,
    CUBEBRICK_SCALEFACTOR
  );

  renderInfo.cubeBrick.draw(matrices);
}

/**
 * @param {{
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  fpsInfo: FpsInfo;
 *  keyManager: KeyManager;
 *  matrixStack: MatrixStack;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  cubeBrick: Cube;
 *  treePiece: Square;
 *  animations: { cubeBrickRotationY: number }
 *  treeAnimations: {stemRotationZ: number; branchRotationZ: number; leafRotationZ: number;}}} renderInfo
 */
function drawTree(renderInfo) {
  g_treeColor.set([0.59, 0.29, 0.0, 1.0]);

  const matrixStack = renderInfo.matrixStack;
  const modelMatrix = renderInfo.matrices.modelMatrix;

  // ROOT IN ALL OF TREE
  modelMatrix.setIdentity();

  matrixStack.push(modelMatrix);

  matrixStack.createChildAndPush(
    { x: 0, y: 0, z: 0 },
    STEM,
    [TranslateDirection.UP],
    [{ around: RotateAround.Z, angle: renderInfo.treeAnimations.stemRotationZ }]
  );

  drawTreePart(renderInfo, STEM);

  g_treeColor.set([0.05, 0.9, 0.05, 1.0]);
  for (const dist of [1, 0, -1]) {
    matrixStack.createChildAndPush(
      STEM,
      BRANCH,
      [TranslateDirection.UP],
      [{ around: RotateAround.Z, angle: renderInfo.treeAnimations.branchRotationZ * dist }]
    );

    drawTreePart(renderInfo, BRANCH);
    matrixStack.pop();
  }
}

/**
 * @param {{
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  fpsInfo: FpsInfo;
 *  keyManager: KeyManager;
 *  matrixStack: MatrixStack;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  cubeBrick: Cube;
 *  treePiece: Square;
 *  animations: { cubeBrickRotationY: number }
 *  treeAnimations: {stemRotationZ: number; branchRotationZ: number; leafRotationZ: number;}}} renderInfo
 * @param {{x: number; y: number; z: number;}} dimentions
 */
function drawTreePart(renderInfo, dimentions) {
  const halfDim = { x: dimentions.x / 2, y: dimentions.y / 2, z: dimentions.z / 2 };

  const modelMatrixCopy = renderInfo.matrixStack.peek();
  const matrices = new RenderMatrices();

  modelMatrixCopy.scale(halfDim.x, halfDim.y, halfDim.z);
  matrices.modelMatrix = modelMatrixCopy;

  renderInfo.treePiece.draw(matrices)
  matrices.modelMatrix.setIdentity();
}
