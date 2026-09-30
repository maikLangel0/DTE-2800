import { Camera } from "../helpers/Camera.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Matrix4 } from "../lib/cuon-matrix.js";

export class Drawable {
  /** @type {WebGL2RenderingContext} */
  #gl;
  /** @type {Shader} */
  #shader;

  /**Storing the position so you can possibly calc the dist to camera.
  * @type {{x: number; y: number; z: number;}} */
  #position;

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

  /** Fully local modelMatrix, used so that TORS gets applied in the intended order given the object's `#localTransforms` and `#position`
   * @type {Matrix4} */
  #localModelMatrix;
  /** Contains a lambda that gets defined by the user. They work on the `#localModelMatrix` (and `this` if defined), and define the
   * transforms that the user want to do on the object.
   * @type {((internal: Matrix4, self: Drawable) => void)} */
  #localTransforms;
  /**@type {boolean} */
  #matricesUpdated;

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Shader} shader
   * @param {Camera} camera
   */
  constructor(gl, shader, camera) {
    this.#gl = gl;
    this.#shader = shader;

    this.#position = { x: 0, y: 0, z: 0 };

    this.#glMode = gl.TRIANGLES;
    this.#isAlpha = false;
    this.#is2D = false;

    this.#vertices = [];
    this.#vertexColors = [];
    this.#indeces = [];

    this.#vertexCount = 0;
    this.#indexCount = 0;

    this.#textureBindings = [];

    this.#localModelMatrix = new Matrix4();
    this.#localTransforms = () => { };
    this.#matricesUpdated = false;

    // PUBLIC VARIABLES --------------------

    /** This variable is public so that you can access the camera when you e.g do `.setShaderRelationship()`
     * @type {Camera} */
    this.camera = camera;

    /** This variable is public so that you can easily access it when you e.g do `.setShaderRelationship()`
     *
     * This class' owned modelMatrix.
     * @type {Matrix4} */
    this.modelMatrix = new Matrix4();
    /** This variable is public so that you can easily access it when you e.g do `.setShaderRelationship()`
     *
     * This class' owned modelViewMatrix.
     * @type {Matrix4} */
    this.modelViewMatrix = new Matrix4();

    /**@type {WebGLBuffer | null} */
    this.vertexBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.colorBuffer = null;
    /**@type {WebGLBuffer | null} */
    this.indexBuffer = null;

    /** This variable is public so that you can reuse previous attributeBindings when you e.g do .setShaderRelationship()
     * @type { { name: string; getBuffer: (self: Drawable) => WebGLBuffer | null }[] } */
    this.attributeBindings = [
      { name: "aVertexPosition", getBuffer: (self) => self.vertexBuffer },
      { name: "aVertexColor", getBuffer: (self) => self.colorBuffer },
    ];

    /** This variable is public so that you can reuse previous uniformBindings when you e.g do .setShaderRelationship()
     * @type { { name: string; getValue: (self: Drawable) => Float32Array | number[] | number}[] } */
    this.uniformBindings = [
      { name: "uModelViewMatrix", getValue: (self) => self.modelViewMatrix.elements },
      { name: "uProjectionMatrix", getValue: (self) => self.camera.projectionMatrix.elements },
    ];
  }
  // USER-AVAIALBLE FUNCTIONS TO ALTER CLASS' PRIVATE DATA --------------------

  // ##############################################################################
  //                 SETTERS AND GETTERS FOR PRIMITIVES IN CLASS
  // ##############################################################################

  /**
   * If you want to alter the vertexPositions of the object.
   * Useful when you need a spesific order to bindTexture() with UV.
   * @param {number[]} vertices
   */
  setVertices(vertices) {
    this.#vertices = vertices;
    this.#vertexCount = vertices.length / 3;
  }

  /**
   * Useful when you want to .setVertexColors(colors) and need the vertexCount to size your colors correctly.
   * @returns {number} */
  getVertexCount() {
    return this.#vertexCount;
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

  /**@returns {boolean}
   * Returns true if the obj is set to be drawn with alpha.
   */
  getAlpha() {
    return this.#isAlpha;
  }

  /**@param {number} glMode */
  setGLMode(glMode) {
    this.#glMode = glMode;
  }

  /**@param {boolean} bool
   * Set if the object is 2D or not for culling purposes.
   */
  set2D(bool) {
    this.#is2D = bool;
  }

  /**@returns {boolean}
   * Return true if mesh is 2D
   */
  is2D() {
    return this.#is2D;
  }


  // ##############################################################################
  //                                BINDING STUFF
  // ##############################################################################

  /** Binds the positionbuffer, and indexbuffer + colorbuffer if theyre set previously. */
  bindBuffers() {
    this.bindVertexBuffer();

    if (this.#vertexColors.length !== 0) {
      this.bindColorBuffer();
    }

    if (this.#indeces.length !== 0) {
      this.bindIndexBuffer();
    }
  }
  bindVertexBuffer() {
    const vertexBuffer = this.#gl.createBuffer();
     this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, vertexBuffer);
    this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(this.#vertices), this.#gl.STATIC_DRAW);
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null);

    this.vertexBuffer = vertexBuffer;
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

  // ##############################################################################
  //                                SHADER SPESIFIC
  // ##############################################################################

  /**
   * Defines what data each shader variable should use.
   *
   * Shader variables can point to data inside the class, and outside the class:
   *
   * - Example of Data inside this class:
   *   `'aVertexPosition', getBuffer = (it) => { it.vertexBuffer }`
   *
   * - Example of data outside this class:
   *   `'uColor', getValue = () => { color }`
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
   *     getValue: (self: Drawable) => Float32Array | number[] |number;
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

  // ##############################################################################
  //                       MATRIX CALLBACKS AND UPDATES
  // ##############################################################################

  /**Creates a callback that is intended to operate on this.modelMatrix.
   *
   * This callback will be invoked when you call `.draw()` or `updateMatrices()`.
   * @param {((local: Matrix4, self: Drawable) => void)} callback */
  setLocalTransforms(callback) {
    this.#localTransforms = callback;
  }

  /** Update the ModelMatrix and ModelViewMatrix of the object, so that it is ready for `.draw()`.
   *
   * Follows the TORS order, and executes the `#localTransforms` if the user provided them.
   * @param {Matrix4 | null} outerModelMatrix
   * @param {boolean} skipLocalTransforms*/
  updateMatrices(outerModelMatrix, skipLocalTransforms = false) {
    this.#matricesUpdated = true;

    const modelMatrix = this.modelMatrix;
    const local = this.#localModelMatrix.setIdentity();

    if (!skipLocalTransforms) {
      this.#localTransforms(local, this);
    }

    if (outerModelMatrix) { modelMatrix.set(outerModelMatrix) }
    else { modelMatrix.setIdentity() };

    modelMatrix.translate(
      this.#position.x,
      this.#position.y,
      this.#position.z
    );
    modelMatrix.multiply(local);

    this.modelViewMatrix.set(this.camera.viewMatrix);
    this.modelViewMatrix.multiply(modelMatrix);
  }

  // ##############################################################################
  //                      DISTANCE AND POSITION FUNCTIONS
  // ##############################################################################

  /**@param {{x: number;y: number;z: number;}} pos  */
  setPosition(pos) {
    this.#position = { ...pos };
  }
  /**@returns {{x: number;y: number;z: number;}} */
  getPosition() {
    return { ...this.#position };
  }
  /** Actual world-space origin of the mesh (includes parent and local transforms).
   * @returns {{x: number; y: number; z: number}} */
  getWorldPosition() {
    if (!this.#matricesUpdated) {
      throw Error("Can't getWorldPosition before updateMatrices() or draw().");
    }

    const elements = this.modelMatrix.elements;
    const [x, y, z] = [elements[12], elements[13], elements[14]];

    if (x === undefined || y === undefined || z === undefined) {
      throw Error("Wat how dis possible.")
    } else {
      return {x, y, z}
    }
;
  }
  /**
   * Gets the distance from the object center to the cameras world-position.
   @returns {number} */
  getDistanceToCamera() {
    const camPos = this.camera.getWorldPosition();
    const worldPos = this.getWorldPosition();

    return Math.sqrt(
      (worldPos.x - camPos.x) ** 2 +
      (worldPos.y - camPos.y) ** 2 +
      (worldPos.z - camPos.z) ** 2
    )
  }
  /**
   * @param {{x: number; y: number; z: number}} pos
  * @param {number} dt defaults for 60fps*/
  updatePosition(pos, dt = 0.016) {
    this.#position.x += pos.x * dt;
    this.#position.y += pos.y * dt;
    this.#position.z += pos.z * dt;
  }

  // ##############################################################################
  //                                MISC FUNCTIONS
  // ##############################################################################

  log() {
    if (this.#matricesUpdated) {
      console.log(`
Position: ${JSON.stringify(this.#position)}
Current worldPosition: ${JSON.stringify(this.getWorldPosition())}

Is vertexBuffer set? : ${this.vertexBuffer !== null}
Is indexBuffer set? : ${this.indexBuffer !== null}
Is colorBuffer set? : ${this.colorBuffer !== null}

AlphaMode: ${this.#isAlpha}
GLMode: ${this.#glMode}
is2D: ${this.#is2D}`)
    } else {
      console.log(`
Position: ${JSON.stringify(this.#position)}
Current worldPosition: undefined (due to .updateMatrices() not being called yet)

Is vertexBuffer set? : ${this.vertexBuffer !== null}
Is indexBuffer set? : ${this.indexBuffer !== null}
Is colorBuffer set? : ${this.colorBuffer !== null}

AlphaMode: ${this.#isAlpha}
GLMode: ${this.#glMode}
is2D: ${this.#is2D}`)
    }
  }

  /**
   * Deepcopy of the class and its' data.
   * @returns {Drawable}
   */
  clone() {
    const clone = new Drawable(this.#gl, this.#shader, this.camera);

    clone.#position = { ...this.#position };

    clone.modelMatrix = new Matrix4(this.modelMatrix);
    clone.modelViewMatrix = new Matrix4(this.modelViewMatrix);

    clone.#glMode = this.#glMode;
    clone.#isAlpha = this.#isAlpha;
    clone.#is2D = this.#is2D;

    clone.#vertexCount = this.#vertexCount;
    clone.#indexCount = this.#indexCount;

    // TODO: HOW TO DEEPCOPY WATAFAK :(
    clone.vertexBuffer = this.vertexBuffer;
    clone.colorBuffer = this.colorBuffer;
    clone.indexBuffer = this.indexBuffer;
    clone.#textureBindings = [...this.#textureBindings];

    return clone;
  }

  // ##############################################################################
  //                                DRAWING WOWIE
  // ##############################################################################

  /** Draws the object to the canvas.
   *
   * You can supply `outerModelMatrix` if you construct it in your renderLoop/animationLoop.
   *
   * modelMatrix can either be **the** modelMatrix your object will work on, or it can
   * be additional transformations if you've already defined a set of transforms to operate
   * on using `.setLocalTransforms()`.
   * @param {Object} [options]
   * @param {Matrix4 | null} [options.outerModelMatrix]
   * @param {boolean} [options.skipUpdateMatrices]
   * @param {boolean} [options.skipLocalTransforms] */
  draw({ outerModelMatrix = null, skipUpdateMatrices = false, skipLocalTransforms = false } = {}) {
    const gl = this.#gl;
    const shader = this.#shader;

    if (!this.vertexBuffer)
      throw Error("Buffer(s) not instantiated; call bindBuffers() first.");

    shader.useProgram();

    if (!skipUpdateMatrices) {
      this.updateMatrices(outerModelMatrix, skipLocalTransforms);
    };

    for (const { name, getBuffer } of this.attributeBindings) {
      const buffer = getBuffer(this);
      if (!buffer) {
        throw Error("Attribute-buffer defined with name " + name + " is not instanciated.");
      }
      shader.connectAttribute(name, buffer);
    }

    for (const { name, getValue } of this.uniformBindings) {
      const value = getValue(this);
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
