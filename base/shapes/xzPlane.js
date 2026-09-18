import { Camera } from "../helpers/Camera.js";
import { RenderMatrices } from "../helpers/renderMatrices.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Drawable } from "./drawable.js";

export class XZPlane extends Drawable {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera 
   * @param {{amount: number; spacing: number; length: number}} settings
   * @param {{ r: number; g: number; b: number; a: number; } | null} color 
   */
  constructor(gl, shader, camera, settings, color = null) {
    super(gl, shader, camera);

    for (let i = 0; i <= settings.amount; i += settings.spacing) {
      const offset = i - settings.amount / 2;
      
      this._positions.push(
        -settings.length, 0, offset,
        settings.length, 0, offset,
        offset, 0, -settings.length,
        offset, 0, settings.length,
      );
    }

    this._vertexCount = this._positions.length;

    if (color) {
      this.setVertexColorSingle(color);  
    }
    
    this.is2D = true;
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