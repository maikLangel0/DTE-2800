import { Camera } from "../helpers/Camera.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Drawable } from "./drawable.js";

export class Triangle extends Drawable {

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Shader} shader
 * @param {Camera} camera
 * @param {{ r: number; g: number; b: number; a: number; } | null} color
 */
  constructor(gl, shader, camera, color = null) {
    super(gl, shader, camera);

    super.setVertexPositions([
      -1, 0, -1,
      -1, 0, 1,
      1, 0, 0,
    ])

    if (color) {
      this.setVertexColorSingle(color);
    }

    this.is2D = true;
  }
}
