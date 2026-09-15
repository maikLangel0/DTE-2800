import { Camera } from "../helpers_oblig1/Camera";
import { RenderMatrices } from "../helpers_oblig1/renderMatrices";
import { Shader } from "../helpers_oblig1/WebGLShader";
import { Drawable } from "./drawable";

export class Coords extends Drawable {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {number} length
   */
  constructor(gl, shader, camera, length) {
    super(gl, shader, camera);

    this._positions =  [
      -length, 0, 0,
      length, 0, 0,
      0, -length, 0,
      0, length, 0,
      0, 0, length,
      0, 0, -length,
    ];
    
    this._vertexColors = [
      1, 0, 0, 1,
      1, 0, 0, 1,
      0, 1, 0, 1,
      0, 1, 0, 1,
      0, 0, 1, 1,
      0, 0, 1, 1
    ];

    /**@type {number} */
    this._vertexCount = this._positions.length / 3;
  }

  /**
   * @override
   * @param {RenderMatrices} matrices 
   * @param {number} glMode 
   */
  draw(matrices, glMode = this._gl.LINES) {
    super.draw(matrices, glMode);
  }
}
