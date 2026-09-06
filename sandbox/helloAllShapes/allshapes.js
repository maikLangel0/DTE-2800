import { Matrix4 } from "../../base/lib/cuon-matrix.js";
import { Camera } from "../../base/helpers/Camera.js";
import { WebGLCanvas } from "../../base/helpers/WebGLCanvas.js";
import { Shader, LocationType } from "../../base/helpers/WebGLShader.js";

const baseFragShader = document.getElementById("base-frag-shader").innerHTML;
const baseVertShader = document.getElementById("base-vert-shader").innerHTML;

const baseShaderVariables = [
  {
    name: "aVertexPosition",
    type: LocationType.VERTEX
  },
  {
    name: "uModelMatrix",
    type: LocationType.UNIFORM,
  },
  {
    name: "uViewMatrix",
    type: LocationType.UNIFORM,
  },
  {
    name: "uProjectionMatrix",
    type: LocationType.UNIFORM,
  },
  {
    name: "vColor",
    type: LocationType.UNIFORM,
  }
]

// ------------------------

export const main = () => {
  const canvas = new WebGLCanvas("canvas", 960, 540);
  const aspectRatio = canvas.aspectRatio;
  const gl = canvas.gl;

  const baseShader = new Shader(gl, baseVertShader, baseFragShader);
  baseShader.connectLocations(gl, baseShaderVariables);

  const camera = new Camera({
      // projectionOptions
      fov: 45,
      aspectRatio: aspectRatio,
      near: 0.1,
      far: 10000,
  });

  let mat4 = new Matrix4();
  mat4.setIdentity();
}
