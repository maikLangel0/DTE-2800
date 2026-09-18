import { Drawable } from "./drawable.js";
import { Camera } from "../helpers/Camera.js";
import { Shader } from "../helpers/WebGLShader.js";

export class Cube extends Drawable {
  
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {{ r: number; g: number; b: number; a: number; } | null} color
   */
  constructor(gl, shader, camera, color = null) {
    super(gl, shader, camera);

    super.setVertexPositions([
      //Forsiden (pos):
      -1, 1, 1,
      -1, -1, 1,
      1, -1, 1,
      
      -1, 1, 1,
      1, -1, 1,
      1, 1, 1,
      
      //Høyre side:
      1, 1, 1,
      1, -1, 1,
      1, -1, -1,
      
      1, 1, 1,
      1, -1, -1,
      1, 1, -1,
      
      //Topp:
      -1, 1, -1,
      -1, 1, 1,
      1, 1, 1,
      
      -1, 1, -1,
      1, 1, 1,
      1, 1, -1,
      
      //Venstre side:
      -1, 1, -1,
      -1, -1, -1,
      -1, -1, 1,
      
      -1, 1, -1,
      -1, -1, 1,
      -1, 1, 1,
      
      //Baksiden (pos):
      1, 1, -1, //OK
      1, -1, -1,
      -1, -1, -1,
      
      1, 1, -1,
      -1, -1, -1,
      -1, 1, -1,
      
      //Bunn:
      -1, -1, 1,
      -1, -1, -1,
      1, -1, -1,
      
      -1, -1, 1,
      1, -1, -1,
      1, -1, 1,
    ]);

    if (color) {
      super.setVertexColorSingle(color)
    }
  }  
}