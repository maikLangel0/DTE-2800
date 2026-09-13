import { Camera } from "../helpers/Camera";
import { RenderMatrices } from "../helpers/renderMatrices";
import { Shader } from "../helpers/WebGLShader";

export class Drawable {

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   */
  constructor(gl, shader, camera) {
    this.gl = gl;
    this.shader = shader;
    this.camera = camera;

    /**@type {WebGLBuffer | null} */
    this.positionBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.colorBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.indexBuffer = null;

    /**@type {number[]} */
    this.colors = [];
    /**@type {number[]} */
    this.positions = [];
    /**@type {number[]} */
    this.indeces = [];

    /**@type {number} */
    this.vertexCount = 0;
    /**@type {number} */
    this.indexCount = 0;

    /** @type {{
     * name: string; 
     * getBuffer: (self: Drawable) => WebGLBuffer | null}[]
     } */
    this.attributeBindings = [
      { name: "aVertexPosition", getBuffer: (self) => self.positionBuffer },
      { name: "aVertexColor", getBuffer: (self) => self.colorBuffer },
    ];

    /** @type {{
     * name: string; 
     * getValue: (self: Drawable, matrices: RenderMatrices) => Float32Array | number}[]
     } */
    this.uniformBindings = [
      {
        name: "uModelViewMatrix",
        getValue: (self, matrices) => {
          const modelViewMatrix = matrices.modelViewMatrix;

          modelViewMatrix.set(self.camera.viewMatrix);
          modelViewMatrix.multiply(matrices.modelMatrix);

          return modelViewMatrix.elements;
        },
      },
      {
        name: "uProjectionMatrix",
        getValue: (self, _) => self.camera.projectionMatrix.elements,
      },
    ];

    if (this.constructor === Drawable) {
      throw Error("Cannot be an abstract class Drawable");
    }
  }

  bindBuffers() {
    const gl = this.gl;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.positionBuffer = positionBuffer;
    this.colorBuffer = colorBuffer;

    if (this.indeces.length !== 0) {
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indeces), gl.STATIC_DRAW);

      this.indexBuffer = indexBuffer;
      this.indexCount = this.indeces.length / 3;
    }
  }

  /**
   * @param {{r: number;g: number;b: number;a: number;}} color
   */
  setColor(color) {
    this.colors = [];

    for (let i = 0; i < this.vertexCount; i++) {
      this.colors.push(color.r, color.g, color.b, color.a);
    }
  }

  bindColorBuffer() {
    const colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colors), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    this.colorBuffer = colorBuffer;
  }

  /**
   * @param {Shader} shader
   */
  swapShader(shader) {
    this.shader = shader;
  }

  log() {
    if (this.indexBuffer) {
      console.log(`Positions: ${this.positions} | Indeces: ${this.indeces} | Colors: ${this.colors}`)
    } else {
      console.log(`Positions: ${this.positions} | Colors: ${this.colors}`)
    }
  }

  /**
   * Redefine how this Class' data maps onto shader attribute and/or uniform names. 
   * Use after swapShader() if the new shader uses different names.
   * @param {{
   *   attributes?: {name: string; getBuffer: (self: Drawable) => WebGLBuffer}[];
   *   uniforms?: {name: string; getValue: (self: Drawable, matrices: RenderMatrices) => Float32Array | number}[];
   * }} relationship
   */
  setShaderRelationship({ attributes, uniforms } = {}) {
    if (attributes) this.attributeBindings = attributes;
    if (uniforms) this.uniformBindings = uniforms;
  }

  /**
   * @param {RenderMatrices} matrices
   * @param {number} glMode
   */
  draw(matrices, glMode = this.gl.TRIANGLES) {
    if (!this.positionBuffer) {
      throw Error("Buffers not instantiated; call bindBuffers() first.");
    }

    const shader = this.shader;
    shader.useProgram();

    for (const { name, getBuffer } of this.attributeBindings) {
      const buffer = getBuffer(this);
      if (!buffer) {
        throw Error("Buffer defined with name " + name + " not instanciated.");
      }
      
      shader.connectAttribute(name, buffer);
    }
    
    for (const { name, getValue } of this.uniformBindings) {
      const value = getValue(this, matrices);
      
      shader.connectUniform(name, value);
    }

    this.#drawCall(glMode);
  }

  /**@param {number} glMode*/
  #drawCall(glMode) {
    if (this.indexBuffer && this.indexCount > 0)
    {
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.gl.drawElements(glMode, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    else
    {
      this.gl.drawArrays(glMode, 0, this.vertexCount);
    }
  }
}
