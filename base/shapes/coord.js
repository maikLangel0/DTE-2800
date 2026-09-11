import { Camera } from "../helpers/Camera";
import { Shader } from "../helpers/WebGLShader";
import { Matrix4 } from "../lib/cuon-matrix";
import { Drawable } from "./drawable";

export class Coords extends Drawable {

  /**
   * @param {number} length
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   */
  constructor(length, gl, shader, camera) {
    super(gl, shader, camera);

    const positions = [
      -length, 0, 0,
      length, 0, 0,
      0, -length, 0,
      0, length, 0,
      0, 0, length,
      0, 0, -length,
    ];

    const colors = [
      1, 0, 0, 1,
      1, 0, 0, 1,
      0, 1, 0, 1,
      0, 1, 0, 1,
      0, 0, 1, 1,
      0, 0, 1, 1
    ];

    this.positions = positions;
    this.colors = colors;

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    const colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colors), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    /**@type {WebGLBuffer} */
    this.positionBuffer = positionBuffer;

    /**@type {WebGLBuffer} */
    this.colorBuffer = colorBuffer;

    /**@type {number} */
    this.vertexCount = positions.length / 3;
  }



  /**
   * @param {Matrix4} modelMatrix
   * @param {Matrix4} modelViewMatrix
   */
  draw(modelMatrix, modelViewMatrix) {
    if (!(this.positionBuffer && this.colorBuffer && this.vertexCount)) {
      throw Error("Buffers not instanciated; Call bindBuffers() first.");
    }

    const shader = this.shader;

    shader.useProgram();

    shader.connectAttribute("aVertexPosition", this.positionBuffer);
    shader.connectAttribute("aVertexColor", this.colorBuffer);

    modelMatrix.setIdentity();
    modelViewMatrix.set(this.camera.viewMatrix);
    modelViewMatrix.multiply(modelMatrix);

    shader.connectUniform("uModelViewMatrix", modelViewMatrix.elements);
    shader.connectUniform("uProjectionMatrix", this.camera.projectionMatrix.elements);

    this.gl.drawArrays(this.gl.LINES, 0, this.vertexCount);
  }

  log() {
    console.log(`Positions: ${this.positions}`);
    console.log(`Colors: ${this.colors}`);
  }
}
