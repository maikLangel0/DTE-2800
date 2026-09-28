import { Camera } from "../helpers/Camera.js";
import { RenderMatrices } from "../helpers/renderMatrices.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Matrix4 } from "../lib/cuon-matrix.js";

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

    /**Storing the position so you can possibly calc the dist to camera.
     * @type {{x: number; y: number; z: number;}} */
    this._worldPosition = { x: 0, y: 0, z: 0 };
    /**Own copy of the matrices needed to render because of TORS order when translating the _worldPosition so its done in the correct order.
     * @type {RenderMatrices} */
    this._matrices = new RenderMatrices();

    /**What mode to draw with.
     * @type {number} */
    this._glMode = gl.TRIANGLES;
    /**For drawing when alpha.
     * @type {boolean} */
    this._isAlpha = false;
    /**For culling purposes, if object gets drawn with alpha and is 2D, then dont gl.enable(gl.CULL_FACE) when drawing.
    * @type {boolean} */
    this._is2D = false;

    // THESE ARE "PUBLIC" (no underscore) BECAUSE IF YOU setShaderRelationship() YOU NEED
    // TO BE ABLE TO POINT TO THE BUFFERS OF THE CLASS.
    /**@type {WebGLBuffer | null} */
    this.positionBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.colorBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.indexBuffer = null;

    /**@type {number[]} */
    this._positions = [];
    /**@type {number[]} */
    this._vertexColors = [];
    /**@type {number[]} */
    this._indeces = [];

    /**@type {number} */
    this._vertexCount = 0;
    /**@type {number} */
    this._indexCount = 0;

    /**Textures get handled differently. When binding texture(s), the user
      uses the bindTexture() func and passes in |
        textureCoordinates: number[],
        image: HTMLImageElement,
        settings: {target: number} |
      instead of it being handled automatically by bindBuffers().
      Can also have multiple textures on the same object.
     * @type {{
     * uvBuffer: WebGLBuffer;
     * texture: WebGLTexture;
     * uvAttribName: string;
     * samplerName: string;
     * target: number;
     * activeTexture: number;
     }[]} */
    this._textureBindings = [];

    // Should only map the names in the shader to data inside the class.
    /** @type {{
     * name: string;
     * getBuffer: (self: Drawable) => WebGLBuffer | null}[]
     } */
    this._attributeBindings = [
      { name: "aVertexPosition", getBuffer: (self) => self.positionBuffer },
      { name: "aVertexColor", getBuffer: (self) => self.colorBuffer },
    ];

    // Should only map the names in the shader to data inside the class vaguely (takes RenderMatrices aswell).
    /** @type {{
     * name: string;
     * getValue: (self: Drawable, matrices: RenderMatrices) => Float32Array | number[] | number}[]
     } */
    this._uniformBindings = [
      { name: "uModelViewMatrix", getValue: (self, matrices) => {
          const modelViewMatrix = matrices.modelViewMatrix;

          modelViewMatrix.set(self.camera.viewMatrix);
          modelViewMatrix.multiply(matrices.modelMatrix);

          return modelViewMatrix.elements }},
      { name: "uProjectionMatrix", getValue: (self) => {return self.camera.projectionMatrix.elements} },
    ];


    if (this.constructor === Drawable) {
      throw Error("Cannot be an abstract class Drawable");
    }
  }
  // USER-AVAIALBLE FUNCTIONS TO ALTER CLASS' "PRIVATE" DATA --------------------
  /**
   * If you want to alter the vertexPositions of the object.
   * Useful when you need a spesific order to bindTexture() with UV.
   *
   * Uses glMode to also set the vertexCount.
   *
   * Call setGLMode(glMode) before this function to set correct vertexCount.
   * @param {number[]} positions
   */
  setVertices(positions) {
    this._positions = positions;
    this.setVertexCount();
  }

  /**
   * Sets the vertexCount based on this._glMode.
   *
   * If you update the drawMode/glMode using .setGLMode(glMode), use this function to set/update the vertexCount.
   */
  setVertexCount() {
    if (this._glMode === this._gl.LINES) {
      this._vertexCount = this._positions.length;
    } else {
      this._vertexCount = this._positions.length / 3;
    }
  }

  /** One color for all vertices
   * @param {{r: number;g: number;b: number;a: number;}} color
   */
  setVertexColorSingle(color) {
    this._vertexColors = [];

    for (let i = 0; i < this._vertexCount; i++) {
      this._vertexColors.push(color.r, color.g, color.b, color.a);
    }
  }

  /**@param {number[]} colors  */
  setVertexColors(colors) {
    if (colors.length % 4 !== 0) console.warn("SetVertexColors recieved a list not divisible by 4 (rbga).");
    this._vertexColors = colors;
  }

  /**@param {number[]} indeces */
  setIndeces(indeces) {
    this._indeces = indeces;
    this._indexCount = indeces.length;
  }

  /**@param {boolean} bool
   * Set if the object gets drawn with alpha.
   */
  setAlpha(bool) {
    this._isAlpha = bool;
  }

  /**
   * Sets the GLMode.
   *
   * If you're dynamically changing the GLMode, remember to resize the vertexCount using .setVertexCount() .
   * @param {number} glMode */
  setGLMode(glMode) {
    this._glMode = glMode;
  }

  /**Copies the **mat** into the object.
   * @param {Matrix4} mat */
  setModelMatrix(mat) {
    this._matrices.modelMatrix = new Matrix4(mat);
  }

  setModelMatrixIdentity() {
    this._matrices.modelMatrix.setIdentity();
  }

  /**@param {{x: number; y: number; z: number}} pos  */
  setWorldPosition(pos) {
    this._worldPosition = pos;
  }

  /**
   * @param {{x: number; y: number; z: number}} pos
   * @param {number} dt defaults for 60fps*/
  updateWorldPosition(pos, dt = 0.016) {
    this._worldPosition.x += pos.x * dt;
    this._worldPosition.y += pos.y * dt;
    this._worldPosition.z += pos.z * dt;
  }

  /**@returns {{x: number; y: number; z: number}} */
  getWorldPosition() {
    return this._worldPosition;
  }

  // BINDING FUNCTIONS --------------------
  /** Binds the positionbuffer, and indexbuffer + colorbuffer if theyre set previously. */
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
   * @param {number[]} uvCoordinates
   * @param {HTMLImageElement} image
   * @param {{uvAttributeName: string; samplerName: string; target?: number}} settings
   */
  bindTexture(uvCoordinates, image, settings) {
    const gl = this._gl;
    const target = settings.target ?? gl.TEXTURE_2D;

    const texture = gl.createTexture();
    gl.bindTexture(target, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    gl.texImage2D(
      target,
      0,
      gl.RGBA,
      image.width,
      image.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );

    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.bindTexture(target, null);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvCoordinates), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const activeTexture = this._textureBindings.length;
    const maxUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

    if (activeTexture >= maxUnits) {
      throw Error(`Cant bind more than ${maxUnits} textures.`);
    }

    this._textureBindings.push({
      uvBuffer,
      texture,
      uvAttribName: settings.uvAttributeName,
      samplerName: settings.samplerName,
      target,
      activeTexture,
    });
  }
  unbindTextures() {
    this._textureBindings = [];
  }

  // SHADER SPESIFIC --------------------
  /**
   * Defines what data each shader variable should use.
   *
   * Shader variables can point to:
   *
   * - Data inside this class:
   *   `getBuffer = (it) => { it.positionBuffer }`
   *
   * - Data outside this class:
   *   `getValue = () => { color.raw }`
   *
   * **Important**
   *
   * Do not set uniforms or attributes that are needed when calling
   * `bindTexture()`.
   *
   * Call this after `swapShader()` if the new shader uses different variable
   * names or data.
   *
   * @param {{
   *   attributes?: {
   *     name: string;
   *     getBuffer: (self: Drawable) => WebGLBuffer | null;
   *   }[];
   *   uniforms?: {
   *     name: string;
   *     getValue: (
   *       self: Drawable,
   *       matrices: RenderMatrices
   *     ) => Float32Array | number[] |number;
   *   }[];
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
   * Gets the distance from the object center to the cameras world-position.
  @returns {number} */
  getDistanceToCamera() {
    const camPos = this.camera.getWorldPosition();

    return Math.sqrt(
      (this._worldPosition.x - camPos.x) ** 2 +
      (this._worldPosition.y - camPos.y) ** 2 +
      (this._worldPosition.z - camPos.z) ** 2
    )
  }

  /**@param {RenderMatrices} matrices */
  draw(matrices) {
    const gl = this._gl;
    const shader = this._shader;

    if (!this.positionBuffer)
      throw Error("Buffer(s) not instantiated; call bindBuffers() first.");

    shader.useProgram();

    // Setting the translation of the worldPosition of the object into local matrices
    this._matrices.modelMatrix.setIdentity();
    this._matrices.modelMatrix.translate(
      this._worldPosition.x,
      this._worldPosition.y,
      this._worldPosition.z
    );
    this._matrices.modelMatrix.multiply(matrices.modelMatrix);
    this._matrices.modelViewMatrix = matrices.modelViewMatrix;

    for (const { name, getBuffer } of this._attributeBindings) {
      const buffer = getBuffer(this);
      if (!buffer) {
        throw Error("Attribute-buffer defined with name " + name + " is not instanciated.");
      }
      shader.connectAttribute(name, buffer);
    }

    for (const { name, getValue } of this._uniformBindings) {
      const value = getValue(this, this._matrices);
      shader.connectUniform(name, value);
    }

    for (const tb of this._textureBindings) {
      shader.connectTexture(
        tb.uvAttribName,
        tb.samplerName,
        tb.uvBuffer,
        tb.texture,
        { activeTexture: gl.TEXTURE0 + tb.activeTexture, target: tb.target }
      );
    }

    this.#drawCall();
  }

  // PRIVATE FUNCTIONS --------------------

  #drawCall() {
    const gl = this._gl;
    const glMode = this._glMode;

    const indexCount = this._indexCount;
    const vertexCount = this._vertexCount;

    if (this._isAlpha) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);

      this._is2D ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE); // funnE syntax
    } else {
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(true);
    }

    if (this.indexBuffer && indexCount > 0) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

      if (this._isAlpha && !this._is2D) {
        gl.cullFace(gl.FRONT); // Hides the front
        gl.drawElements(glMode, indexCount, gl.UNSIGNED_SHORT, 0);

        gl.cullFace(gl.BACK); // Hides the back
        gl.drawElements(glMode, indexCount, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawElements(glMode, indexCount, gl.UNSIGNED_SHORT, 0);
      }
    } else {
      if (this._isAlpha && !this._is2D) {
        gl.cullFace(gl.FRONT); // Hides the front
        gl.drawArrays(glMode, 0, vertexCount);

        gl.cullFace(gl.BACK); // Hides the back
        gl.drawArrays(glMode, 0, vertexCount);
      } else {
        gl.drawArrays(glMode, 0, vertexCount);
      }
    }
  }
}
