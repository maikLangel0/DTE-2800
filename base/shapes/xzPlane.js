import { Camera } from "../helpers/Camera";
import { RenderMatrices } from "../helpers/renderMatrices";
import { Shader } from "../helpers/WebGLShader";
import { Drawable } from "./drawable";

export class XZPlane extends Drawable {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera 
   * @param {{amount: number; spacing: number; length: number}} settings
   * @param {{ r: number; g: number; b: number; a: number; }} [color={r: 0.0,g: 0.0,b: 0.4,a: 1.0}] 
   */
  constructor(gl, shader, camera, settings, color = {r: 0.0,g: 0.0,b: 0.4,a: 1.0}) {
    super(gl, shader, camera);

    for (let i = 0; i <= settings.amount; i += settings.spacing) {
      const offset = i - settings.amount / 2;
      
      this.positions.push(
        -settings.length, 0, offset,
        settings.length, 0, offset,
        offset, 0, -settings.length,
        offset, 0, settings.length,
      );
    }

    this.setColor(color);
  }

  /**
   * @override
   * @param {RenderMatrices} matrices 
   * @param {number} glMode
   */
  draw(matrices, glMode = this.gl.LINES) { 
    
  }
}