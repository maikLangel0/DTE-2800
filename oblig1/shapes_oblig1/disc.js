import { Camera } from "../helpers_oblig1/Camera";
import { RenderMatrices } from "../helpers_oblig1/renderMatrices";
import { Shader } from "../helpers_oblig1/WebGLShader";
import { Drawable } from "./drawable";

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

    if (color) {
      this._vertexColors.push(color.r, color.g, color.b, color.a);
    }
    // Merk:
    // * Sirkelen tegnes vha. TRIANGLE_FAN
    // * sector: FRA OG MED 0 TIL OG MED sectors, slik at den siste trekanten også kommer med.
    let phi = 0.0;

    for (let sector = 0; sector <= sectors; sector++) {

      const x = Math.cos(phi);
      const y = 0;
      const z = Math.sin(phi);

      this._positions.push(x, y, z);

      if (color) {
        this._vertexColors.push(color.r, color.g, color.b, color.a);
      }

      phi += stepInRadians;
    }

    this._vertexCount = this._positions.length / 3;
  }

  /**
   * @override
   * @param {RenderMatrices} matrices
   * @param {number} glMode
   */
  draw(matrices, glMode = this._gl.TRIANGLE_FAN) {
    super.draw(matrices, glMode)
  }
}
