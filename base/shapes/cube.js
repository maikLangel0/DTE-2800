import { Drawable } from "./drawable";
import { Camera } from "../helpers/Camera";
import { Shader } from "../helpers/WebGLShader";
import { RenderMatrices } from "../helpers/renderMatrices";

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
		//Forsiden (pos):
		-1, 1, 1,
		-1,-1, 1,
		1,-1, 1,
   
		-1,1,1,
		1, -1, 1,
		1,1,1,
   
		//Høyre side:
		1,1,1,
		1,-1,1,
		1,-1,-1,
   
		1,1,1,
		1,-1,-1,
		1,1,-1,
   
    //Topp:
    -1,1,-1,
    -1,1,1,
    1,1,1,
   
    -1,1,-1,
    1,1,1,
    1,1,-1,
   
    //Venstre side:
    -1,1,-1,
    -1,-1,-1,
    -1,-1,1,
   
    -1,1,-1,
    -1,-1,1,
    -1,1,1,
   
		//Baksiden (pos):
    1, 1,-1, //OK
    1,-1,-1,
    -1,-1,-1,
   
    1,1,-1,
    -1,-1,-1,
    -1,1,-1,
   
		//Bunn:
    -1,-1,1,
    -1,-1,-1,
    1,-1,-1,
   
    -1,-1,1,
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