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
    this._gl = gl;
    this._shader = shader;
    this.camera = camera;

    /**@type {WebGLBuffer | null} */
    this.positionBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.colorBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.indexBuffer = null;

    /**Map<label: string, coords: number[]>
    *  @type {Map<string, WebGLBuffer>} */
    this._textureBuffers = new Map();
    /**Map<label: string, texture: WebGLTexture>
     * @type {Map<string, WebGLTexture>} */
    this._textures = new Map();


    /**@type {number[]} */
    this._vertexColors = [];
    /**@type {number[]} */
    this._positions = [];
    /**@type {number[]} */
    this._indeces = [];

    /**@type {number} */
    this._vertexCount = 0;
    /**@type {number} */
    this._indexCount = 0;

    /** @type {{
     * name: string;
     * getBuffer: (self: Drawable) => WebGLBuffer | null}[]
     } */
    this._attributeBindings = [
      { name: "aVertexPosition", getBuffer: (self) => self.positionBuffer },
      { name: "aVertexColor", getBuffer: (self) => self.colorBuffer },
    ];

    /** @type {{
     * name: string;
     * getValue: (self: Drawable, matrices: RenderMatrices) => Float32Array | number}[]
     } */
    this._uniformBindings = [
      { name: "uModelViewMatrix", getValue: (self, matrices) => {
          const modelViewMatrix = matrices.modelViewMatrix;

          modelViewMatrix.set(self.camera.viewMatrix);
          modelViewMatrix.multiply(matrices.modelMatrix);

          return modelViewMatrix.elements }},
      { name: "uProjectionMatrix", getValue: (self, _) => {return self.camera.projectionMatrix.elements} },
    ];



    if (this.constructor === Drawable) {
      throw Error("Cannot be an abstract class Drawable");
    }
  }

  // FUNCTIONS

  bindBuffers() {
    this.bindPositionBuffer();

    if (this._vertexColors.length !== 0) {
      this.bindColorBuffer();
    }

    if (this._indeces.length !== 0) {
      this.bindIndexBuffer();
    }
  }

  bindPositionBuffer() {
    const positionBuffer = this._gl.createBuffer();
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, positionBuffer);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(this._positions), this._gl.STATIC_DRAW);
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

    this.positionBuffer = positionBuffer;
    this._vertexCount = this._positions.length / 3;
  }

  bindColorBuffer() {
    const colorBuffer = this._gl.createBuffer();
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, colorBuffer);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(this._vertexColors), this._gl.STATIC_DRAW);
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

    this.colorBuffer = colorBuffer;
  }

  bindIndexBuffer() {
    const indexBuffer = this._gl.createBuffer();
    this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indeces), this._gl.STATIC_DRAW);

    this.indexBuffer = indexBuffer;
    this._indexCount = this._indeces.length;
  }

  /**
   * @param {{r: number;g: number;b: number;a: number;}} color
   */
  setVertexColors(color) {
    this._vertexColors = [];

    for (let i = 0; i < this._vertexCount; i++) {
      this._vertexColors.push(color.r, color.g, color.b, color.a);
    }
  }

  /**
   * @param {string} label
   * @param {number[]} textureCoordinates
   * @param {HTMLImageElement} image
   * @param {{target: number; }} settings
   */
  bindTexture(label, textureCoordinates, image, settings) {
    const gl = this._gl; // For convenience

    const texture = gl.createTexture();
    gl.bindTexture(settings.target, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true) // Anticipates transparency

    // NOTE : NOT THE SAME FUNCTION SIGNATURE AS IN cubemultitextured.js @LINE 277
    gl.texImage2D(
      settings.target,    // target
      0,                  // LOD
      gl.RGBA,            // Internal format
      image.width,        // width
      image.height,       // height
      0,                  // border ("must be 0")
      gl.RGBA,            // format (set to same as internal format)
      gl.UNSIGNED_BYTE,   // type (size of each integer element in raw texel data)
      image               // source
    );

    gl.texParameteri(settings.target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(settings.target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.bindTexture(settings.target, null);

    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, 0);

    this._textureBuffers.set(label, textureBuffer);
    this._textures.set(label, texture);
  }

  /**
   * Redefine how this Class' data maps onto shader attribute and/or uniform names.
   * Use after swapShader() if the new shader uses different names or data.
   * @param {{
   *   attributes?: {name: string; getBuffer: (self: Drawable) => WebGLBuffer | null}[];
   *   uniforms?: {name: string; getValue: (self: Drawable, matrices: RenderMatrices) => Float32Array | number}[];
   * }} relationship
   */
  setShaderRelationship({ attributes, uniforms } = {}) {
    if (attributes) { this._attributeBindings = attributes };
    if (uniforms) { this._uniformBindings = uniforms };
  }

  /**
   * @param {Shader} shader
   */
  swapShader(shader) {
    this._shader = shader;
  }

  log() {
    if (this.indexBuffer) {
      console.log(`Positions: ${this._positions} | Indeces: ${this._indeces} | Colors: ${this._vertexColors}`)
    } else {
      console.log(`Positions: ${this._positions} | Colors: ${this._vertexColors}`)
    }
  }

  /**
   * @param {RenderMatrices} matrices
   * @param {number} glMode
   * @param {boolean} drawAlpha
   */
  draw(matrices, glMode = this._gl.TRIANGLES, drawAlpha = false) {
    if (!this.positionBuffer) {
      throw Error("Buffer(s) not instantiated; call bindBuffers() first.");
    }

    const gl = this._gl;

    const shader = this._shader;
    shader.useProgram();

    if (drawAlpha) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
    } else {
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(true);
    }

    for (const { name, getBuffer } of this._attributeBindings) {
      const buffer = getBuffer(this);
      if (!buffer) {
        throw Error("Attribute-buffer defined with name " + name + " is not instanciated.");
      }
      shader.connectAttribute(name, buffer);
    }

    for (const { name, getValue } of this._uniformBindings) {
      const value = getValue(this, matrices);
      shader.connectUniform(name, value);
    }

    this.#drawCall(glMode);
  }

  /**@param {number} glMode*/
  #drawCall(glMode) {
    if (this.indexBuffer && this._indexCount > 0)
    {
      this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this._gl.drawElements(glMode, this._indexCount, this._gl.UNSIGNED_SHORT, 0);
    }
    else
    {
      this._gl.drawArrays(glMode, 0, this._vertexCount);
    }
  }
}
