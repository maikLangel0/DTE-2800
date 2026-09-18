import { Camera } from "../../base/helpers/Camera";
import { Color } from "../../base/helpers/color";
import { FpsInfo } from "../../base/helpers/fpsInfo";
import { ImageLoader } from "../../base/helpers/ImageLoader";
import { KeyManager } from "../../base/helpers/keyManager";
import { RenderMatrices } from "../../base/helpers/renderMatrices";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas";
import { DataType, LocationType, Shader } from "../../base/helpers/WebGLShader";
import { Coords } from "../../base/shapes/coord";
import { Cube } from "../../base/shapes/cube";
import { XZPlane } from "../../base/shapes/xzPlane";

const baseFragShader = document.getElementById("base-frag-shader").innerHTML;
const baseVertShader = document.getElementById("base-vert-shader").innerHTML;

const textureFragShader = document.getElementById("texture-frag-shader").innerHTML;
const textureVertShader = document.getElementById("texture-vert-shader").innerHTML;

const textureUrls = [
    '../../base/textures/bricksLarge.png',
    '../../base/textures/metal1.png'
];

const imageLoader = new ImageLoader();
/**@type {[HTMLImageElement, HTMLImageElement]} */
const [brickImage, metalImage] = await imageLoader.load(textureUrls);

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
    name: "uColor",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC4f
  },
]

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
    },
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

  cubeBrick.bindTexture(cubeUvCoords, brickImage, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler0",
    target: gl.TEXTURE_2D,
  })
  cubeBrick.bindTexture(cubeUvCoords, metalImage, {
    uvAttributeName: "aVertexTextureCoord",
    samplerName: "uSampler1",
    target: gl.TEXTURE_2D,
  });
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

  cubeColor.set([1.0, 1.0, 1.0, 1.0]); 

  renderInfo.coords.draw(renderInfo.matrices);
  renderInfo.xzPlane.draw(renderInfo.matrices);
  renderInfo.cubeBrick.draw(renderInfo.matrices);
}
