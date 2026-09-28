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

    const stepInRadians = Math.PI * 2 / sectors;

    /**@type {number[]} */
    const positions = [];

    positions.push(1, 0, 0);
    positions.push(1, 1, 0);

    // * Kjegla tegnes vha. TRIANGLE_FAN
    // * sector: FRA OG MED 0 TIL OG MED sectors, slik at den siste trekanten også kommer med.
    // Tegner en sylinder med høyde 1 og radius 1, og senter i origo.
    // Sylinderens akse er langs y-aksen.
    let phi = stepInRadians;
    for (let sector = 0; sector <= sectors; sector++) {
      const x = Math.cos(phi);
      const y = 0;
      const z = Math.sin(phi);

      positions.push(x, y, z);
      positions.push(x, y + 1, z);

      phi += stepInRadians;
    }

    this.setGLMode(gl.TRIANGLE_STRIP);
    this.setVertices(positions);

    if (color) {
      super.setVertexColorSingle(color);
    }
  }
}
