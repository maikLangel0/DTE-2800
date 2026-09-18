import { Camera } from "../helpers/Camera";
import { RenderMatrices } from "../helpers/renderMatrices";
import { Shader } from "../helpers/WebGLShader";
import { Drawable } from "./drawable";

export class Triangle extends Drawable {

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Shader} shader
 * @param {Camera} camera
 * @param {{ r: number; g: number; b: number; a: number; } | null} color
 */
  constructor(gl, shader, camera, color = null) {
    super(gl, shader, camera);

    this._positions = [
      -1, 0, -1,
      -1, 0, 1,
      1, 0, 0,
    ]

    this._vertexCount = this._positions.length / 3;

    this.is2D = true;

    if (color) {
      this.setVertexColors(color);
    }
  }

  /**
   * @override
   * @param {RenderMatrices} matrices
   * @param {number} glMode
   * @param {boolean} drawAlpha
   */
  draw(matrices, glMode = this._gl.TRIANGLES, drawAlpha = false) {
    super.draw(matrices, glMode, drawAlpha);
  }
}
