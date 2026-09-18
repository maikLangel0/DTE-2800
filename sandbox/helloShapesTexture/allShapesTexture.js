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
  },
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

/**@type {number[]} */
let diceUvCoords = [];

//Front (1-tallet):
let tl1=[0,1];
let bl1=[0,0.5];
let tr1=[0.33333,1];
let br1=[0.33333,0.5];
diceUvCoords = diceUvCoords.concat(tl1, bl1, br1, tl1, br1, tr1);

//Høyre side (2-tallet):
let tl2=[0.33333,1];
let bl2=[0.33333,0.5];
let tr2=[0.66666,1];
let br2=[0.66666,0.5];
diceUvCoords = diceUvCoords.concat(tl2, bl2, br2, tl2, br2, tr2);

//Baksiden (6-tallet):
let tl3=[0.66666,0.5];
let bl3=[0.66666,0];
let tr3=[1,0.5];
let br3=[1,0];
diceUvCoords = diceUvCoords.concat(bl3, br3, tl3, br3, tr3, tl3);

//Venstre (5-tallet):
let tl4=[0.33333,0.5];
let bl4=[0.33333,0];
let tr4=[0.66666,0.5];
let br4=[0.66666,0];
diceUvCoords = diceUvCoords.concat(bl4, tr4, tl4, br4, tr4, bl4);

//Toppen (3-tallet):
let tl5=[0.66666,1];
let bl5=[0.66666,0.5];
let tr5=[1,1];
let br5=[1,0.5];
diceUvCoords = diceUvCoords.concat(bl5, br5, tl5, tl5, br5, tr5);

//Bunnen (4-tallet):
let tl6=[0,0.5];
let bl6=[0,0];
let tr6=[0.33333,0.5];
let br6=[0.33333,0];
diceUvCoords = diceUvCoords.concat(tr6, bl6, br6,tr6,tl6, bl6);

let xzPlaneColor = new Color([0.0, 0.4, 0.4, 1.0]);
let cubeColor = new Color([1.0, 0.45, 0.9, 1.0]);

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
      y: 0,
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
  cubeBrick.relateDataInClassToShader({
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
    gl: gl,
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
 *  gl: WebGL2RenderingContext,
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

  renderInfo.canvas.clear({ r: 0.8, g: 0.8, b: 0.8, a: 1.0 });
  renderInfo.camera.handleKeys(renderInfo.keyManager.keysPressed, fps.dt);

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  cubeColor.set([0.8, 0.8, 0.8, 0.7]);

  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;
  const gl = renderInfo.gl;

  modelMatrix.setIdentity();

  renderInfo.coords.draw(matrices);
  renderInfo.xzPlane.draw(matrices);

  modelMatrix.setIdentity();
  modelMatrix.translate(0, 1.01, 0);

  renderInfo.cubeBrick.draw(matrices, gl.TRIANGLES, true);
}
