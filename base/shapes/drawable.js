import { Camera } from "../helpers/Camera";
import { Shader } from "../helpers/WebGLShader";

export class Drawable {
  
  /**
   *
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   */
  constructor(gl, shader, camera) {
    this.gl = gl;
    this.shader = shader;
    this.camera = camera;

    if (this.constructor === Drawable) {
      throw Error("Cannot be an abstract class Drawable");
    }
  }

  draw() {
    throw Error("Class must implement 'draw' function.");
  }

  log() {
    throw Error("Class must implement 'draw' function.");
  }
}
