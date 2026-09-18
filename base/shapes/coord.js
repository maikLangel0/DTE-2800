import { Camera } from "../helpers/Camera.js";
import { RenderMatrices } from "../helpers/renderMatrices.js";
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

    super.setVertexPositions([
      -length, 0, 0,
      length, 0, 0,
      0, -length, 0,
      0, length, 0,
      0, 0, length,
      0, 0, -length,
    ]);

    super.setVertexColors([
      1, 0, 0, 1,
      1, 0, 0, 1,
      0, 1, 0, 1,
      0, 1, 0, 1,
      0, 0, 1, 1,
      0, 0, 1, 1
    ]);

    this.is2D = true;
  }

  /**
   * @override
   * @param {RenderMatrices} matrices 
   * @param {number} glMode 
   * @param {boolean} drawAlpha 
   */
  draw(matrices, glMode = this._gl.LINES, drawAlpha = false) {
    super.draw(matrices, glMode, drawAlpha);
  }
}
