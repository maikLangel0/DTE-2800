import { Camera } from "../helpers/Camera.js";
import { RenderMatrices } from "../helpers/renderMatrices.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Drawable } from "./drawable.js";

export class Cylinder extends Drawable {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {number} sectors
   * @param {{ r: number; g: number; b: number; a: number; } | null} color
   */
  constructor(gl, shader, camera, sectors = 12, color = null) {
    super(gl, shader, camera);

    let stepInDegrees = 360 / sectors;
    let stepInRadians = (Math.PI / 180) * stepInDegrees;

    this._positions.push(1, 0, 0);
    this._positions.push(1, 1, 0);

    // * Kjegla tegnes vha. TRIANGLE_FAN
    // * sector: FRA OG MED 0 TIL OG MED sectors, slik at den siste trekanten også kommer med.
    // Tegner en sylinder med høyde 1 og radius 1, og senter i origo.
    // Sylinderens akse er langs y-aksen.
    let phi = stepInRadians;
    for (let sector = 0; sector <= sectors; sector++) {
      const x = Math.cos(phi);
      const y = 0;
      const z = Math.sin(phi);

      this._positions.push(x, y, z);
      this._positions.push(x, y + 1, z);

      phi += stepInRadians;
    }

    this._vertexCount = this._positions.length / 3;

    if (color) {
      super.setVertexColorSingle(color);
    }
  }

  /**
   * @override
   * @param {RenderMatrices} matrices
   * @param {number} glMode
   * @param {boolean} drawAlpha 
   */
  draw(matrices, glMode = this._gl.TRIANGLE_STRIP, drawAlpha = false) {
    super.draw(matrices, glMode, drawAlpha);
  }
}
