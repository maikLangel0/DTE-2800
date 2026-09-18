import { Camera } from "../helpers/Camera.js";
import { RenderMatrices } from "../helpers/renderMatrices.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Drawable } from "./drawable.js";

export class Disc extends Drawable {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {number} [sectors=6]
   * @param {{ r: number; g: number; b: number; a: number; } | null} color
   */
  constructor(gl, shader, camera, sectors = 6, color = null) {
    super(gl, shader, camera);

    if (sectors < 3) {
      sectors = 3;
    }

    let stepInDegrees = 360.0 / sectors;
    let stepInRadians = (Math.PI / 180) * stepInDegrees;

    this._positions.push(0, 0, 0);

    // Merk:
    // * Sirkelen tegnes vha. TRIANGLE_FAN
    // * sector: FRA OG MED 0 TIL OG MED sectors, slik at den siste trekanten også kommer med.
    let phi = 0.0;

    for (let sector = 0; sector <= sectors; sector++) {

      const x = Math.cos(phi);
      const y = 0;
      const z = Math.sin(phi);

      this._positions.push(x, y, z);

      phi += stepInRadians;
    }

    this._vertexCount = this._positions.length / 3;

    if (color) {
      super.setVertexColorSingle(color);
    }

    this.is2D = true;
  }

  /**
   * @override
   * @param {RenderMatrices} matrices
   * @param {number} glMode
   * @param {boolean} drawAlpha
   */
  draw(matrices, glMode = this._gl.TRIANGLE_FAN, drawAlpha = false) {
    super.draw(matrices, glMode, drawAlpha)
  }
}
