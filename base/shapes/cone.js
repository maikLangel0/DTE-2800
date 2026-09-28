import { Camera } from "../helpers/Camera.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Drawable } from "./drawable.js";

export class Cone extends Drawable {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {number} [sectors=6]
   * @param {{ r: number; g: number; b: number; a: number; } | null} color
   */
  constructor(gl, shader, camera, sectors = 6, color = null) {
    super(gl, shader, camera);

    if (sectors < 3) sectors = 3;
    
    let stepRadians = (Math.PI * 2) / sectors;

    /**@type {number[]} */
    const positions = [];

    // Startpunkt (toppen av kjegla):
    positions.push(0, 2, 0);

    // Merk:
    // * Kjegla tegnes vha. TRIANGLE_FAN
    // * sector: FRA OG MED 0 TIL OG MED sectors, slik at den siste trekanten også kommer med.
    let phi = 0.0;

    for (let sector = 1; sector <= sectors + 2; sector++) {
      const x = Math.cos(phi);
      const y = 0;
      const z = Math.sin(phi);

      positions.push(x,y,z);

      phi += stepRadians;
    }

    this.setGLMode(gl.TRIANGLE_FAN);
    this.setVertices(positions);

    if (color) {
      this.setVertexColorSingle(color);
    }
  }
}
