import { Camera } from "../helpers/Camera";
import { RenderMatrices } from "../helpers/renderMatrices";
import { Shader } from "../helpers/WebGLShader";
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

    this.is2D = true;
    
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