import { Camera } from "../helpers/Camera.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Drawable } from "./drawable.js";

export class Square extends Drawable {

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
      1, 0, 1,
      -1, 0, 1,

      -1, 0, -1,
      1, 0, -1,
      1, 0, 1
    ]);

    if (color) {
      super.setVertexColorSingle(color);
    }

    this.is2D = true;
  }
}
