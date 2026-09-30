import { Camera } from "../base/helpers/Camera.js";
import { Color } from "../base/helpers/color.js";
import { FpsInfo } from "../base/helpers/fpsInfo.js";
import { ImageLoader } from "../base/helpers/ImageLoader.js";
import { KeyManager } from "../base/helpers/keyManager.js";
import { MatrixStack, RotateAround, TranslateDirection } from "../base/helpers/matrixStack.js";
import { WebGLCanvas } from "../base/helpers/WebGLCanvas.js";
import { DataType, LocationType, Shader } from "../base/helpers/WebGLShader.js";
import { Matrix4 } from "../base/lib/cuon-matrix.js";
import { Cube } from "../base/shapes/cube.js";
import { Cylinder } from "../base/shapes/cylinder.js";
import { Disc } from "../base/shapes/disc.js";
import { Drawable } from "../base/shapes/drawable.js";
import { Square } from "../base/shapes/square.js";

const craneFragShader = document.getElementById("crane-frag-shader").innerHTML;
const craneVertShader = document.getElementById("crane-vert-shader").innerHTML;

const imageLoader = new ImageLoader();
/**@type {[HTMLImageElement, HTMLImageElement, HTMLImageElement]} */
const [sheetMetalTexture, brickTexture, grassTexture] = await imageLoader.load([
  "../base/textures/sheetMetalTexture.png",
  "../base/textures/bricksLarge.png",
  "../base/textures/grassTexture.png"
]);

/**@type {{name: string; locationType: ("in" | "uniform"), dataType: DataType}[]} */
const craneShaderVariables = [
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
];

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

const BASE = { x: 1, y: 0.5, z: 1 };
const JOINTS = { x: 0.1, y: 1, z: 0.1 };
const FINGERS = { x: 0.03, y: 0.25, z: 0.03 };

const FINGERS_ROTATIONPARAMS = { max: 90, min: 45 };

const g_sheetColor = new Color([0.8, 0.8, 0.8, 1.0]);
const g_baseColor = new Color([1.0, 0.45, 0.9, 1.0]);
const g_canvasColor = new Color([0.8, 0.8, 0.8, 1.0]);
const g_whiteColor = new Color([1.0, 1.0, 1.0, 1.0]);

export const main = () => {
  const canvas = new WebGLCanvas("canvas", 700, 700);
  const aspectRatio = canvas.aspectRatio;
  const gl = canvas.gl;

  const craneShader = new Shader(gl, craneVertShader, craneFragShader);
  craneShader.findLocations(craneShaderVariables);

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

  // DRAWABLE OBJECTS
  const ground = new Square(gl, craneShader, camera);
  ground.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => self.vertexBuffer },
    ],
    uniforms: [
      { name: "uColor", getValue: () => g_whiteColor.raw },
      { name: "uProjectionMatrix", getValue: (self) => self.camera.projectionMatrix.elements },
      { name: "uModelViewMatrix", getValue: (self) => self.modelViewMatrix.elements },
    ]
  });
  ground.bindTexture(
    [
      0, 1, // TL
      0, 0, // BL
      1, 0, // BR
      0, 1, // TL
      1, 0, // BR
      1, 1  // TR
    ], grassTexture, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler0",
    target: gl.TEXTURE_2D
  }
  );
  ground.bindBuffers();

  const craneBase = new Cylinder(gl, craneShader, camera, 6);
  craneBase.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => self.vertexBuffer },
    ],
    uniforms: [
      { name: "uColor", getValue: () => g_baseColor.raw },
      { name: "uProjectionMatrix", getValue: (self) => self.camera.projectionMatrix.elements },
      { name: "uModelViewMatrix", getValue: (self) => self.modelViewMatrix.elements },
    ]
  });
  craneBase.bindTexture(cubeUvCoords, brickTexture, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler0",
    target: gl.TEXTURE_2D,
  })
  craneBase.bindBuffers();

  const craneBaseTop = new Disc(gl, craneShader, camera, 6);
  craneBaseTop.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => self.vertexBuffer },
    ],
    uniforms: [
      { name: "uColor", getValue: () => g_baseColor.raw },
      { name: "uProjectionMatrix", getValue: (self) => self.camera.projectionMatrix.elements },
      { name: "uModelViewMatrix", getValue: (self) => self.modelViewMatrix.elements },
    ]
  });
  craneBaseTop.bindTexture(cubeUvCoords, brickTexture, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler0",
    target: gl.TEXTURE_2D,
  })
  craneBaseTop.bindBuffers();

  const joint = new Cube(gl, craneShader, camera);
  joint.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => self.vertexBuffer },
    ],
    uniforms: [
      { name: "uColor", getValue: () => g_sheetColor.raw },
      { name: "uProjectionMatrix", getValue: (self) => self.camera.projectionMatrix.elements },
      { name: "uModelViewMatrix", getValue: (self) => self.modelViewMatrix.elements },
    ]
  });
  joint.bindTexture(cubeUvCoords, sheetMetalTexture, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler0",
    target: gl.TEXTURE_2D,
  })
  joint.bindBuffers();


  // INIT FOR RENDERINFO
  const keyManager = new KeyManager();
  const matrixStack = new MatrixStack();
  const fpsInfo = new FpsInfo("fps");

  const renderInfo = {
    gl: gl,
    canvas: canvas,
    camera: camera,

    fpsInfo: fpsInfo,
    keyManager: keyManager,

    modelMatrix: new Matrix4(),
    matrixStack: matrixStack,

    ground: ground,
    craneBase: craneBase,
    craneBaseTop: craneBaseTop,
    joint: joint,

    animations: {
      baseRotationY: 0,
      baseBaseRotationY: 0,
      jointsRotationZ: 0,
      joint1RotationZ: 0,
      joint2RotationZ: 0,
      joint3RotationZ: 0,
      fingerPinchZ: 60
    }
  }

  keyManager.setEventOn("KeyE", (dt) => {
    renderInfo.animations.baseRotationY += 100 * dt;
  });
  keyManager.setEventOn("KeyR", (dt) => {
    renderInfo.animations.baseRotationY -= 100 * dt;
  });

  keyManager.setEventOn("KeyO", (dt) => {
    renderInfo.animations.jointsRotationZ += 50 * dt;

  });
  keyManager.setEventOn("KeyP", (dt) => {
    renderInfo.animations.jointsRotationZ -= 50 * dt;
  });

  keyManager.setEventOn("KeyZ", (dt) => {
    if (renderInfo.animations.fingerPinchZ < FINGERS_ROTATIONPARAMS.max) {
      renderInfo.animations.fingerPinchZ += 50 * dt;
    }
  })
  keyManager.setEventOn("KeyX", (dt) => {
    if (renderInfo.animations.fingerPinchZ > FINGERS_ROTATIONPARAMS.min - FINGERS_ROTATIONPARAMS.min / 2) {
      renderInfo.animations.fingerPinchZ -= 50 * dt;
    }
  })

  keyManager.setEventOn("KeyN", (dt) => {
    renderInfo.animations.joint1RotationZ += 40 * dt;
  })
  keyManager.setEventOn("KeyM", (dt) => {
    renderInfo.animations.joint1RotationZ -= 40 * dt;
  })
  keyManager.setEventOn("KeyJ", (dt) => {
    renderInfo.animations.joint2RotationZ += 40 * dt;
  })
  keyManager.setEventOn("KeyK", (dt) => {
    renderInfo.animations.joint2RotationZ -= 40 * dt;
  })
  keyManager.setEventOn("KeyU", (dt) => {
    renderInfo.animations.joint3RotationZ += 40 * dt;
  })
  keyManager.setEventOn("KeyI", (dt) => {
    renderInfo.animations.joint3RotationZ -= 40 * dt;
  })

  // GROUND
  ground.setLocalTransforms((localModelMatrix) => {
    localModelMatrix.scale(5, 1, 5);
  })

  // CRANEBASE CYLINDER
  craneBase.setLocalTransforms((innerModelMatrix) => {
    const baseRotationTotal = renderInfo.animations.baseBaseRotationY + renderInfo.animations.baseRotationY;

    innerModelMatrix.rotate(baseRotationTotal, 0, 1, 0);
    innerModelMatrix.scale(BASE.x, BASE.y, BASE.z);
  })

  // CRANEBASE DISC ONTOP
  craneBaseTop.setLocalTransforms((innerModelMatrix) => {
    const baseRotationTotal = renderInfo.animations.baseBaseRotationY + renderInfo.animations.baseRotationY;

    innerModelMatrix.translate(0, BASE.y, 0);
    innerModelMatrix.rotate(baseRotationTotal, 0, 1, 0);
    innerModelMatrix.scale(BASE.x, BASE.y, BASE.z);
  })

  animate(renderInfo);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext;
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  modelMatrix: Matrix4;
 *  fpsInfo: FpsInfo;
 *  keyManager: KeyManager;
 *  matrixStack: MatrixStack;
 *  ground: Square;
 *  craneBase: Cylinder;
 *  craneBaseTop: Disc;
 *  joint: Cube;
 *  animations: {
 *    baseRotationY: number;
 *    baseBaseRotationY: number;
 *    jointsRotationZ: number;
 *    joint1RotationZ: number;
 *    joint2RotationZ: number;
 *    joint3RotationZ: number;
 *    fingerPinchZ: number;
 *  }
 * }} renderInfo
*/
function animate(renderInfo) {
  const animations = renderInfo.animations;

  const fps = renderInfo.fpsInfo;
  fps.showFps();

  renderInfo.canvas.clear(g_canvasColor.rgba);

  renderInfo.camera.handleKeys(renderInfo.keyManager.keysPressed, fps.dt);
  renderInfo.keyManager.handleEvents(fps.dt);

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  animateBase(animations, fps.totalTime);

  // DRAWING TIME --------------------

  // GROUND
  renderInfo.ground.draw();

  // CRANEBASE CYLINDER
  renderInfo.craneBase.draw();

  // CRANEBASE DISC ONTOP
  renderInfo.craneBaseTop.draw();

  // REST OF CRANE
  drawCrane(renderInfo);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext;
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  fpsInfo: FpsInfo;
 *  keyManager: KeyManager;
 *  modelMatrix: Matrix4;
 *  matrixStack: MatrixStack;
 *  ground: Square;
 *  craneBase: Cylinder;
 *  craneBaseTop: Disc;
 *  joint: Cube;
 *  animations: {
 *    baseRotationY: number;
 *    baseBaseRotationY: number;
 *    jointsRotationZ: number;
 *    joint1RotationZ: number;
 *    joint2RotationZ: number;
 *    joint3RotationZ: number;
 *    fingerPinchZ: number;
 *  }
 * }} renderInfo
 */
function drawCrane(renderInfo) {
  const modelMatrix = renderInfo.modelMatrix;
  const matrixStack = renderInfo.matrixStack;

  const animations = renderInfo.animations;

  g_sheetColor.set([0.8, 0.8, 0.8, 1.0]);

  // ROOT IN ALL OF CRANE
  modelMatrix.setIdentity();
  matrixStack.push(modelMatrix);

  // CREATE JOINT1 ON STACK (ORDER OF ROTATIONS IMPORTANT)
  matrixStack.createChildAndPush(
    {x: BASE.x, y: BASE.y * 2, z: BASE.z},
    JOINTS,
    [TranslateDirection.UP],
    [{
      around: RotateAround.Y,
      angle: animations.baseRotationY
    },
    {
      around: RotateAround.Z,
      angle: animations.joint1RotationZ + animations.jointsRotationZ
      }
    ]
  )

  let modelMatrixPart = matrixStack.peek();
  drawCranePart(modelMatrixPart, modelMatrix, JOINTS, renderInfo.joint);

  // CREATE JOINT2 ON STACK
  matrixStack.createChildAndPush(
    JOINTS,
    JOINTS,
    [TranslateDirection.UP],
    [{
      around: RotateAround.Z,
      angle: animations.joint2RotationZ + animations.jointsRotationZ
    }]
  )

  modelMatrixPart = matrixStack.peek();
  drawCranePart(modelMatrixPart, modelMatrix, JOINTS, renderInfo.joint);

  // CREATE JOINT3 ON STACK
  matrixStack.createChildAndPush(
    JOINTS,
    JOINTS,
    [TranslateDirection.UP],
    [{
      around: RotateAround.Z,
      angle: animations.joint3RotationZ + animations.jointsRotationZ
    }]
  )

  modelMatrixPart = matrixStack.peek();
  drawCranePart(modelMatrixPart, modelMatrix, JOINTS, renderInfo.joint);

  renderInfo.joint.setAlpha(true);
  g_sheetColor.set([0.4, 0.4, 0.8, 0.5]);

  // CREATE FINGERS ON STACK
  for (let fingerAngleOffset of [-0.5, 0.5]) {
    matrixStack.createChildAndPush(
      JOINTS,
      FINGERS,
      [TranslateDirection.UP],
      [{
        around: RotateAround.Z,
        angle: animations.fingerPinchZ * fingerAngleOffset
      }]
    )

    modelMatrixPart = matrixStack.peek();
    drawCranePart(modelMatrixPart, modelMatrix, FINGERS, renderInfo.joint);

    matrixStack.createChildAndPush(
      FINGERS,
      FINGERS,
      [TranslateDirection.UP],
      [{
        around: RotateAround.Z,
        angle: -FINGERS_ROTATIONPARAMS.min * fingerAngleOffset
      }]
    )

    modelMatrixPart = matrixStack.pop();
    drawCranePart(modelMatrixPart, modelMatrix, FINGERS, renderInfo.joint);

    matrixStack.pop();
  }
  renderInfo.joint.setAlpha(false);

  matrixStack.empty();
}

/**
 * @param {Matrix4} stackModelMatrix
 * @param {Matrix4} scratchModelMatrix
 * @param {{x: number; y: number; z: number;}} dimentions
 * @param {Drawable} drawable
 */
function drawCranePart(stackModelMatrix, scratchModelMatrix, dimentions, drawable) {
  stackModelMatrix.scale(
    dimentions.x / 2,
    dimentions.y / 2,
    dimentions.z / 2
  );

  scratchModelMatrix.multiply(stackModelMatrix);
  drawable.draw({outerModelMatrix: scratchModelMatrix});
  scratchModelMatrix.setIdentity();
}

/**
 * @param {{
 *    baseRotationY: number;
 *    baseBaseRotationY: number;
 *    joint1RotationZ: number;
 *    joint2RotationZ: number;
 *    joint3RotationZ: number;
 *    fingerPinchZ: number;
 *  } } animations
 * @param {number} time
 */
function animateBase(animations, time, speed = 10) {
  animations.baseBaseRotationY = speed * time % 360;
}
