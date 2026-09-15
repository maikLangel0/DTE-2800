import { Drawable } from "./drawable";
import { Camera } from "../helpers_oblig1/Camera";
import { Shader } from "../helpers_oblig1/WebGLShader";
import { RenderMatrices } from "../helpers_oblig1/renderMatrices";

export class Cube extends Drawable {
  
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   * @param {{ r: number; g: number; b: number; a: number; } | null} color
   */
  constructor(gl, shader, camera, color = null) {
    super(gl, shader, camera);

    this._positions = [
        //Front:
        -1, 1, 1,
        -1,-1, 1,
        1,-1, 1,

        -1,1,1,
        1, -1, 1,
        1,1,1,

        //Right side:
        1,1,1,
        1,-1,1,
        1,-1,-1,

        1,1,1,
        1,-1,-1,
        1,1,-1,

        //Backside:
        1,-1,-1,
        -1,-1,-1,
        1, 1,-1,

        -1,-1,-1,
        -1,1,-1,
        1,1,-1,

        //Left side:
        -1,-1,-1,
        -1,1,1,
        -1,1,-1,

        -1,-1,1,
        -1,1,1,
        -1,-1,-1,

        //Top:
        -1,1,1,
        1,1,1,
        -1,1,-1,

        -1,1,-1,
        1,1,1,
        1,1,-1,

        //Bottom:
        -1,-1,-1,
        1,-1,1,
        -1,-1,1,

        -1,-1,-1,
        1,-1,-1,
        1,-1,1,
    ];
    
    this._vertexCount = this._positions.length / 3;

    if (color) {
      super.setVertexColors(color)
    }
  }

  /**
   * @override
   * @param {RenderMatrices} matrices 
   * @param {number} glMode 
   */
  draw(matrices, glMode = this._gl.TRIANGLES) {
    super.draw(matrices, glMode);
  }
}