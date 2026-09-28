import { Camera } from "../helpers/Camera.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Drawable } from "./drawable.js";

export class Sphere extends Drawable {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {{latitudeBands: number; longitudeBands: number}} settings
   * @param {{ r: number; g: number; b: number; a: number; } | null} color
   */
  constructor(gl, shader, camera, settings = { latitudeBands: 30, longitudeBands: 30 }, color = null) {
    super(gl, shader, camera);
    
    // Alt basert på kode fra: http://learningwebgl.com/blog/?p=1253
    const radius = 1;
    const latitudeBands = settings.latitudeBands;
    const longitudeBands = settings.longitudeBands;
    
    /**@type {number[]} */
    const positions = [];

    for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      let theta = latNumber * Math.PI / latitudeBands;

      let sinTheta = Math.sin(theta);
      let cosTheta = Math.cos(theta);

      for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {

        let phi = longNumber * 2 * Math.PI / longitudeBands;

        let sinPhi = Math.sin(phi);
        let cosPhi = Math.cos(phi);

        let x = cosPhi * sinTheta;
        let y = cosTheta;
        let z = sinPhi * sinTheta;

        positions.push(radius * x, radius * y, radius * z);
      }
    }

    /**@type {number[]} */
    const indeces = [];

    //Genererer indeksdata for å knytte sammen verteksene:
    for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {

        let first = (latNumber * (longitudeBands + 1)) + longNumber;
        let second = first + longitudeBands + 1;

        indeces.push(first, second, first + 1);
        indeces.push(second, second + 1, first + 1);
      }
    }

    this.setGLMode(gl.TRIANGLES);
    this.setVertices(positions);
    this.setIndeces(indeces);

    if (color) {
      this.setVertexColorSingle(color);
    }
  }
}
