import { Camera } from "../helpers/Camera.js";
import { Texture } from "../helpers/texture.js";
import { Shader } from "../helpers/WebGLShader.js";
import { Matrix4 } from "../lib/cuon-matrix.js";

export class Drawable {
  /** @type {WebGL2RenderingContext} */
  #gl;
  /** @type {Shader} */
  #shader;

  /**@type {Map<string, (self: Drawable) => Float32Array | number[] | number >} */
  #uniforms = new Map();
  /**@type {Map<string, (self: Drawable) => WebGLBuffer | null >} */
  #attributes = new Map();
  /**@type {Map<string, {texture: Texture, unit: number}>} */
  #textures = new Map();

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
  /**@type {number} */
  #vertexCount;
  /**@type {number} */
  #indexCount;

  // ---- MATRIX STUFF ON THE PRIVATE localModelMatrix -----

  /**
   * Fully local modelMatrix, used so that TORS gets applied in the intended order given the object's `#localTransforms` and `#position`
   * @type {Matrix4} */
  #localModelMatrix;
  /**
   * Contains a lambda that gets defined by the user. They work on the `#localModelMatrix` (and `this` if defined), and define the
   * transforms that the user want to do on the object.
   * @type {((internal: Matrix4, self: Drawable) => void)} */
  #localTransforms;
  /**@type {boolean} */
  #matricesUpdated;

  // ---- HOLDING STATE OF WHICH BUFFERS ARE INITIALIZED AND WHICH COPY OF Drawable OWNS THE WebGLBuffer's -----

  /**@type {boolean} */
  #isOwner; // Flag for if this instance of Drawable owns the WebGLBuffers

  /**@type {Set<WebGLBuffer>} */
  #ownedWebGLBuffers; // Keeps track of all the buffers that are owned by this instance of Drawable

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

    this.#localModelMatrix = new Matrix4();
    this.#localTransforms = () => { };
    this.#matricesUpdated = false;

    this.#isOwner = true;
    this.#ownedWebGLBuffers = new Set();

    this.#attributes.set("aVertexColor", (self) => self.colorBuffer);
    this.#attributes.set("aVertexPosition", (self) => self.vertexBuffer);

    this.#uniforms.set("uModelViewMatrix",  (self) => self.modelViewMatrix.elements);
    this.#uniforms.set("uProjectionMatrix", (self) => self.camera.projectionMatrix.elements);

    // PUBLIC VARIABLES --------------------

    /** This variable is public so that you can access the camera when you e.g do `.setShaderRelationship()`
     * @type {Camera} */
    this.camera = camera;

    /** This variable is public so that you can easily access it when you e.g do `.setShaderRelationship()`.
     *
     * It gets mutated by `.updateMatrices()` and exists so that transformations can happen in
     * two steps:
     * - Transform with itself as origin ( `.setLocalTransforms()` ),
     * - Transform in worldspace with center at origin ( `.draw(outerModelMatrix)` ).
     *
     * This class' owned modelMatrix.
     * @type {Matrix4} */
    this.modelMatrix = new Matrix4();
    /** This variable is public so that you can easily access it when you e.g do `.setShaderRelationship()`.
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

    return this;
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

    return this;
  }

  /**@param {number[]} colors  */
  setVertexColors(colors) {
    if (colors.length % 4 !== 0) console.warn("SetVertexColors recieved a list not divisible by 4 (rbga).");
    this.#vertexColors = colors;

    return this;
  }

  /**@param {number[]} indeces */
  setIndeces(indeces) {
    this.#indeces = indeces;
    this.#indexCount = indeces.length;

    return this;
  }

  /**@param {boolean} bool
   * Set if the object gets drawn with alpha.
   */
  setAlpha(bool) {
    this.#isAlpha = bool;
    return this
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
    return this;
  }

  /**@param {boolean} bool
   * Set if the object is 2D or not for culling purposes.
   */
  set2D(bool) {
    this.#is2D = bool;
    return this
  }

  /**@returns {boolean}
   * Return true if mesh is 2D
   */
  is2D() {
    return this.#is2D;
  }

  /**
   * @param {string} samplerName
   * @param {Texture} texture
   */
  setTexture(samplerName, texture) {
    const unit = this.#textures.get(samplerName)?.unit ?? this.#textures.size;
    this.#textures.set(samplerName, {texture, unit: unit});
    
    return this;
  }

  /**@param {string} label
   * @returns {Texture}
   */
  getTexture(label) {
    const tex = this.#textures.get(label);
    if (!tex) {
      throw Error("Couldnt get texture named " + label);
    }
    return tex.texture;
  }

  /**Returns the textureUnit / activetexture 
   * @param {string} label 
  */
  getTextureUnit(label) {
    const texture = this.#textures.get(label);
    if (!texture) {
      throw Error(`No texture with label "${label}".`)
    };
    return texture.unit;
  }

  // ##############################################################################
  //                               BINDING STUFF
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
    return this
  }
  bindVertexBuffer() {
    this.vertexBuffer = this.#bindBuffer(this.vertexBuffer, this.#vertices, this.#gl.ARRAY_BUFFER, Float32Array);
    this.#vertexCount = this.#vertices.length / 3;
  }
  bindColorBuffer() {
    this.colorBuffer = this.#bindBuffer(this.colorBuffer, this.#vertexColors, this.#gl.ARRAY_BUFFER, Float32Array);
  }
  bindIndexBuffer() {
    this.indexBuffer = this.#bindBuffer(this.indexBuffer, this.#indeces, this.#gl.ELEMENT_ARRAY_BUFFER, Uint16Array);
    this.#indexCount = this.#indeces.length;
  }

  freeBuffers() {
    if (!this.#isOwner) return;

    for (const buf of this.#ownedWebGLBuffers) {
      this.#gl.deleteBuffer(buf);
    }
    this.#ownedWebGLBuffers.clear();
  }

  // ##############################################################################
  //                              SHADER SPESIFIC
  // ##############################################################################


  // Defines what data each shader variable should use.

  // Shader variables can point to data inside the class, and outside the class:

  // - Example of Data inside this class:
  //   `'aVertexPosition', getBuffer = (it) => { it.vertexBuffer }`

  // - Example of data outside this class:
  //   `'uColor', getValue = () => { color }`

  // **Important**

  // Do not set uniforms or attributes that are needed when calling
  // `bindTexture()`.

  // Call this after `swapShader()` if the new shader uses different variable
  // names or data.

  /**
   * @param {string} name
   * @param {((self: Drawable) => number | number[] | Float32Array)} callback
   */
  setUniform(name, callback) {
    this.#uniforms.set(name, callback);
    return this
  }

  /** @param {string} name */
  removeUniform(name) {
    const didRemove = this.#uniforms.delete(name);
    if (!didRemove) {
      console.warn("No uniform to remove with name " + name + ".");
    }
    return this;
  }

  deleteUniforms() {
    this.#uniforms = new Map();
    return this;
  }

  /**
   * @param {string} name
   * @param {((self: Drawable) => WebGLBuffer | null)} callback
   */
  setAttribute(name, callback) {
    this.#attributes.set(name, callback);
    return this
  }

  /**@param {string} name */
  removeAttribute(name) {
    const didRemove = this.#attributes.delete(name);
    if (!didRemove) {
      console.warn("No attribute to remove with name " + name + ".");
    }
    return this;
  }

  deleteAttributes() {
    this.#attributes = new Map();
    return this;
  }

  /** @param {Shader} shader */
  swapShader(shader) {
    this.#shader = shader;
    return this;
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
    return this;
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
    else { modelMatrix.setIdentity() }

    modelMatrix.translate(
      this.#position.x,
      this.#position.y,
      this.#position.z
    );
    modelMatrix.multiply(local);

    this.modelViewMatrix.set(this.camera.viewMatrix);
    this.modelViewMatrix.multiply(modelMatrix);
    this.modelViewMatrix;

    return this;
  }

  // ##############################################################################
  //                      DISTANCE AND POSITION FUNCTIONS
  // ##############################################################################

  /**Sets the position before transformations are applied, which might alter
   * the actual worldPosition.
   *
   * use `.updateMatrices()` then `.getWorldPosition()` to get the actual worldPosition.
   * @param {{x: number;y: number;z: number;}} pos  */
  setLocalPosition(pos) {
    this.#position = { ...pos };
    return this;
  }
  /**@returns {{x: number;y: number;z: number;}} */
  getLocalPosition() {
    return { ...this.#position };
  }
  /** Actual world-space origin of the mesh (includes outer and local transforms).
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
  //                              MISC FUNCTIONS
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

    clone.modelMatrix.set(this.modelMatrix);
    clone.modelViewMatrix.set(this.modelViewMatrix);

    clone.#glMode = this.#glMode;
    clone.#isAlpha = this.#isAlpha;
    clone.#is2D = this.#is2D;

    clone.#vertexCount = this.#vertexCount;
    clone.#indexCount = this.#indexCount;

    // TODO: HOW TO DEEPCOPY WATAFAK :(
    clone.vertexBuffer = this.vertexBuffer;
    clone.colorBuffer = this.colorBuffer;
    clone.indexBuffer = this.indexBuffer;

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

    this.#attributes.forEach((callBack, name) => {
      const buffer = callBack(this);
      if (!buffer) {
        throw Error("Attribute-buffer defined with name " + name + " is not instanciated.");
      }
      shader.connectAttribute(name, buffer);
    })

    this.#uniforms.forEach((callBack, name) => {
      const buffer = callBack(this);
      shader.connectUniform(name, buffer);
    })

    this.#textures.forEach(({texture, unit}, samplerName) => {
      shader.connectTexture(texture.texture, gl.TEXTURE0 + unit, texture.target);
      shader.connectUniform(samplerName, unit);
    })
    
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

  /**
   *
   * @param {WebGLBuffer | null} buffer
   * @param {number[]} data
   * @param {number} target
   * @param {Float32ArrayConstructor | Float16ArrayConstructor | Float64ArrayConstructor | Uint32ArrayConstructor | Uint16ArrayConstructor} ArrayType
   * @returns {WebGLBuffer}
   */
  #bindBuffer(buffer, data, target, ArrayType) {
    const gl = this.#gl;

    if (buffer) { // Cleanup if dupe initialization
      gl.deleteBuffer(buffer);
      this.#ownedWebGLBuffers.delete(buffer);
    }

    const newBuffer = gl.createBuffer();

    gl.bindBuffer(target, newBuffer);
    gl.bufferData(target, new ArrayType(data), gl.STATIC_DRAW);
    gl.bindBuffer(target, null);

    this.#ownedWebGLBuffers.add(newBuffer);

    return newBuffer;
  }
}
