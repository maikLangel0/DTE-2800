import { Drawable } from "./drawable";
import { Camera } from "../helpers/Camera";
import { Shader } from "../helpers/WebGLShader";
import { RenderMatrices } from "../helpers/renderMatrices";

export class Cube extends Drawable {
  
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   */
  constructor(gl, shader, camera, color = {r: 1.0, g: 0.0, b: 0.0, a: 1.0}) {
    super(gl, shader, camera);

    this.positions = [
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
    
    this.vertexCount = this.positions.length / 3;

    super.setColor(color)
  }

  /**
   * @override
   * @param {RenderMatrices} matrices 
   * @param {number} glMode 
   */
  draw(matrices, glMode = this.gl.TRIANGLES) {
    super.draw(matrices, glMode);
  }
}