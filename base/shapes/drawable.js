import { Camera } from "../helpers/Camera.js";
import { RenderMatrices } from "../helpers/renderMatrices.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Matrix4 } from "../lib/cuon-matrix.js";

export class Drawable {
  /** @type {WebGL2RenderingContext} */
  #gl;
  /** @type {Shader} */
  #shader;

  /**Storing the position so you can possibly calc the dist to camera.
  * @type {{x: number; y: number; z: number;}} */
  #worldPosition;
  /**Own copy of the matrices needed to render because of TORS order when translating the _worldPosition so its done in the correct order.
  * @type {RenderMatrices} */
  #matrices;

  /**What mode to draw with.
  * @type {number} */
  #glMode;
  /**For drawing when alpha.
  * @type {boolean} */
  #isAlpha;
  /**For culling purposes, if object gets drawn with alpha and is 2D, then dont gl.enable(gl.CULL_FACE) when drawing.
  * @type {boolean} */
  #is2D;

  /**@type {number[]} */
  #vertices;
  /**@type {number[]} */
  #vertexColors;
  /**@type {number[]} */
  #indeces;

  /** Name is a tad misleading, as when drawing with e.g gl.LINES, it gets set to
   *
   * *this.#vertices.length*, not *this.#vertices.length / 3*.
   * @type {number} */
  #vertexCount;
  /**@type {number} */
  #indexCount;

  /**
   * Textures get handled differently. When binding texture(s), the user uses the bindTexture() func and passes in
   *
   * *textureCoordinates: number[],
   * image: HTMLImageElement,
   * settings: {target: number}*
   *
   * instead of it being handled automatically by bindBuffers().
   * Can also have multiple textures on the same object.
   *
   * @type {{
   * uvBuffer: WebGLBuffer;
   * texture: WebGLTexture;
   * uvAttribName: string;
   * samplerName: string;
   * target: number;
   * activeTexture: number;
  }[]} */
  #textureBindings;

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   */
  constructor(gl, shader, camera) {
    this.#gl = gl;
    this.#shader = shader;

    this.#worldPosition = { x: 0, y: 0, z: 0 };
    this.#matrices = new RenderMatrices();

    this.#glMode = gl.TRIANGLES;
    this.#isAlpha = false;
    this.#is2D = false;

    this.#vertices = [];
    this.#vertexColors = [];
    this.#indeces = [];

    this.#vertexCount = 0;
    this.#indexCount = 0;

    this.#textureBindings = [];

    // PUBLIC VARIABLES --------------------

    /** This variable is public so that you can access the camera when you e.g do .setShaderRelationship()
     * @type {Camera} */
    this.camera = camera;

    /**@type {WebGLBuffer | null} */
    this.positionBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.colorBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.indexBuffer = null;

    /** This variable is public so that you can reuse previous attributeBindings when you e.g do .setShaderRelationship()
     * @type { { name: string; getBuffer: (self: Drawable) => WebGLBuffer | null }[] } */
    this.attributeBindings = [
      { name: "aVertexPosition", getBuffer: (self) => self.positionBuffer },
      { name: "aVertexColor", getBuffer: (self) => self.colorBuffer },
    ];

    /** This variable is public so that you can reuse previous uniformBindings when you e.g do .setShaderRelationship()
     * @type { { name: string; getValue: (self: Drawable, matrices: RenderMatrices) => Float32Array | number[] | number}[] } */
    this.uniformBindings = [
      { name: "uModelViewMatrix", getValue: (self, matrices) => {
          const modelViewMatrix = matrices.modelViewMatrix;

          modelViewMatrix.set(self.camera.viewMatrix);
          modelViewMatrix.multiply(matrices.modelMatrix);

          return modelViewMatrix.elements }},
      { name: "uProjectionMatrix", getValue: (self) => {return self.camera.projectionMatrix.elements} },
    ];


    if (this.constructor === Drawable) {
      throw Error("Cannot be an abstract class Drawable.");
    }
  }
  // USER-AVAIALBLE FUNCTIONS TO ALTER CLASS' PRIVATE DATA --------------------

  /**
   * If you want to alter the vertexPositions of the object.
   * Useful when you need a spesific order to bindTexture() with UV.
   *
   * Uses glMode to also set the vertexCount.
   *
   * Call setGLMode(glMode) before this function to set correct vertexCount.
   * @param {number[]} vertices
   */
  setVertices(vertices) {
    this.#vertices = vertices;
    this.setVertexCount();
  }

  /** Useful when you want to .setVertexColors(colors) and need the vertexCount to size your colors correctly.
   * @returns {number} */
  getVertexCount() {
    return this.#vertices.length / 3;
  }

  /**
   * Sets the vertexCount based on this.#glMode.
   *
   * If you update the drawMode/glMode using .setGLMode(glMode), use this function to set/update the vertexCount.
   */
  setVertexCount() {
    if (this.#glMode === this.#gl.LINES) {
      this.#vertexCount = this.#vertices.length;
    } else {
      this.#vertexCount = this.#vertices.length / 3;
    }
  }

  /** One color for all vertices
   * @param {{r: number;g: number;b: number;a: number;}} color
   */
  setVertexColorSingle(color) {
    this.#vertexColors = [];

    for (let i = 0; i < this.#vertexCount; i++) {
      this.#vertexColors.push(color.r, color.g, color.b, color.a);
    }
  }

  /**@param {number[]} colors  */
  setVertexColors(colors) {
    if (colors.length % 4 !== 0) console.warn("SetVertexColors recieved a list not divisible by 4 (rbga).");
    this.#vertexColors = colors;
  }

  /**@param {number[]} indeces */
  setIndeces(indeces) {
    this.#indeces = indeces;
    this.#indexCount = indeces.length;
  }

  /**@param {boolean} bool
   * Set if the object gets drawn with alpha.
   */
  setAlpha(bool) {
    this.#isAlpha = bool;
  }

  /**
   * Sets the GLMode.
   *
   * If you're dynamically changing the GLMode, remember to resize the vertexCount using .setVertexCount() .
   * @param {number} glMode */
  setGLMode(glMode) {
    this.#glMode = glMode;
  }

  /**@param {boolean} bool
   * Set if the object is 2D or not for culling purposes.
   */
  is2D(bool) {
    this.#is2D = bool;
  }

  /**Copies the **mat** into the object.
   * @param {Matrix4} mat */
  setModelMatrix(mat) {
    this.#matrices.modelMatrix = new Matrix4(mat);
  }

  setModelMatrixIdentity() {
    this.#matrices.modelMatrix.setIdentity();
  }

  /**@param {{x: number; y: number; z: number}} pos  */
  setWorldPosition(pos) {
    this.#worldPosition = pos;
  }

  /**
   * @param {{x: number; y: number; z: number}} pos
   * @param {number} dt defaults for 60fps*/
  updateWorldPosition(pos, dt = 0.016) {
    this.#worldPosition.x += pos.x * dt;
    this.#worldPosition.y += pos.y * dt;
    this.#worldPosition.z += pos.z * dt;
  }

  /**@returns {{x: number; y: number; z: number}} */
  getWorldPosition() {
    return this.#worldPosition;
  }

  // BINDING FUNCTIONS --------------------
  /** Binds the positionbuffer, and indexbuffer + colorbuffer if theyre set previously. */
  bindBuffers() {
    this.bindPositionBuffer();

    if (this.#vertexColors.length !== 0) {
      this.bindColorBuffer();
    }

    if (this.#indeces.length !== 0) {
      this.bindIndexBuffer();
    }
  }
  bindPositionBuffer() {
    const positionBuffer = this.#gl.createBuffer();
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, positionBuffer);
    this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(this.#vertices), this.#gl.STATIC_DRAW);
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null);

    this.positionBuffer = positionBuffer;
    this.#vertexCount = this.#vertices.length / 3;
  }
  bindColorBuffer() {
    const colorBuffer = this.#gl.createBuffer();
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, colorBuffer);
    this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(this.#vertexColors), this.#gl.STATIC_DRAW);
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null);

    this.colorBuffer = colorBuffer;
  }
  bindIndexBuffer() {
    const indexBuffer = this.#gl.createBuffer();
    this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.#gl.bufferData(this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.#indeces), this.#gl.STATIC_DRAW);

    this.indexBuffer = indexBuffer;
    this.#indexCount = this.#indeces.length;
  }
  /**
   * @param {number[]} uvCoordinates
   * @param {HTMLImageElement} image
   * @param {{uvAttributeName: string; samplerName: string; target?: number}} settings
   */
  bindTexture(uvCoordinates, image, settings) {
    const gl = this.#gl;
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

    const activeTexture = this.#textureBindings.length;
    const maxUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

    if (activeTexture >= maxUnits) {
      throw Error(`Cant bind more than ${maxUnits} textures.`);
    }

    this.#textureBindings.push({
      uvBuffer,
      texture,
      uvAttribName: settings.uvAttributeName,
      samplerName: settings.samplerName,
      target,
      activeTexture,
    });
  }
  unbindTextures() {
    this.#textureBindings = [];
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
    if (attributes) { this.attributeBindings = attributes };
    if (uniforms) { this.uniformBindings = uniforms };
  }
  /** @param {Shader} shader */
  swapShader(shader) {
    this.#shader = shader;
  }

  log() {
    if (this.indexBuffer) {
      console.log(`Positions: ${this.#vertices} | Indeces: ${this.#indeces} | Colors: ${this.#vertexColors}`)
    } else {
      console.log(`Positions: ${this.#vertices} | Colors: ${this.#vertexColors}`)
    }
  }

  /**
   * Gets the distance from the object center to the cameras world-position.
  @returns {number} */
  getDistanceToCamera() {
    const camPos = this.camera.getWorldPosition();

    return Math.sqrt(
      (this.#worldPosition.x - camPos.x) ** 2 +
      (this.#worldPosition.y - camPos.y) ** 2 +
      (this.#worldPosition.z - camPos.z) ** 2
    )
  }

  /**@param {RenderMatrices} matrices */
  draw(matrices) {
    const gl = this.#gl;
    const shader = this.#shader;

    if (!this.positionBuffer)
      throw Error("Buffer(s) not instantiated; call bindBuffers() first.");

    shader.useProgram();

    // Setting the translation of the worldPosition of the object into local matrices
    this.#matrices.modelMatrix.setIdentity();
    this.#matrices.modelMatrix.translate(
      this.#worldPosition.x,
      this.#worldPosition.y,
      this.#worldPosition.z
    );
    this.#matrices.modelMatrix.multiply(matrices.modelMatrix);
    this.#matrices.modelViewMatrix = matrices.modelViewMatrix;

    for (const { name, getBuffer } of this.attributeBindings) {
      const buffer = getBuffer(this);
      if (!buffer) {
        throw Error("Attribute-buffer defined with name " + name + " is not instanciated.");
      }
      shader.connectAttribute(name, buffer);
    }

    for (const { name, getValue } of this.uniformBindings) {
      const value = getValue(this, this.#matrices);
      shader.connectUniform(name, value);
    }

    for (const tb of this.#textureBindings) {
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
    const gl = this.#gl;
    const glMode = this.#glMode;

    const indexCount = this.#indexCount;
    const vertexCount = this.#vertexCount;

    if (this.#isAlpha) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);

      this.#is2D ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE); // funnE syntax
    } else {
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(true);
    }

    if (this.indexBuffer && indexCount > 0) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

      if (this.#isAlpha && !this.#is2D) {
        gl.cullFace(gl.FRONT); // Hides the front
        gl.drawElements(glMode, indexCount, gl.UNSIGNED_SHORT, 0);

        gl.cullFace(gl.BACK); // Hides the back
        gl.drawElements(glMode, indexCount, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawElements(glMode, indexCount, gl.UNSIGNED_SHORT, 0);
      }
    } else {
      if (this.#isAlpha && !this.#is2D) {
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
