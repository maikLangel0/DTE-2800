import { Matrix4 } from "../../base/lib/cuon-matrix.js";
import { Camera } from "../../base/helpers/Camera.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { Shader, LocationType, DataType } from "../../base/helpers/WebGLShader.js";
import { initKeyPress } from "../../base/lib/utility-functions.js";

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

  // TODO: make connectAttribute, connectUniform, connectTextureAttribute accessable

  baseShader.log()

  const camera = new Camera({
      // projectionOptions
      fov: 45,
      aspectRatio: aspectRatio,
      near: 0.1,
      far: 10000,
  });

  /** 
    * @type {{
    *   baseShader: Shader;
    *   keysPressed: Record<string, boolean>;}} 
  */
  const renderInfo = {
    baseShader: baseShader,
    keysPressed = [],
  }

  initKeyPress(renderInfo.keysPressed);
}
