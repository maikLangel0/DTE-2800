import { Camera } from "../helpers_oblig1/Camera";
import { RenderMatrices } from "../helpers_oblig1/renderMatrices";
import { Shader } from "../helpers_oblig1/WebGLShader";
import { Drawable } from "./drawable";

export class Square extends Drawable {

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {{ r: number; g: number; b: number; a: number; } | null} color
   */
  constructor(gl, shader, camera, color = null) {
    super(gl, shader, camera);

    this._positions.push(
      -1, 0, -1,
      1, 0, 1,
      -1, 0, 1,

      -1, 0, -1,
      1, 0, -1,
      1, 0, 1,
    );

    this._vertexCount = this._positions.length / 3;

    if (color) {
      super.setVertexColors(color);
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