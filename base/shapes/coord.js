import { Camera } from "../helpers/Camera.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Drawable } from "./drawable.js";

export class Coords extends Drawable {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {number} length
   */
  constructor(gl, shader, camera, length) {
    super(gl, shader, camera);

    this.setGLMode(gl.LINES);

    this.setVertices([
      -length, 0, 0,
      length, 0, 0,
      0, -length, 0,
      0, length, 0,
      0, 0, length,
      0, 0, -length,
    ]);

    this.setVertexColors([
      1, 0, 0, 1,
      1, 0, 0, 1,
      0, 1, 0, 1,
      0, 1, 0, 1,
      0, 0, 1, 1,
      0, 0, 1, 1
    ]);

    this._is2D = true;
  }
}
