export class Texture {
  /**@type {WebGL2RenderingContext} */
  #gl;

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {HTMLImageElement} image
   * @param {Object} [settings]
   * @param {number} [settings.target]
   * @param {number} [settings.format]
   * @param {number} [settings.type]
   * @param {number} [settings.texParameter]
   */
  constructor(gl, image, { target = gl.TEXTURE_2D, format = gl.RGBA, type = gl.UNSIGNED_BYTE, texParameter = gl.NEAREST } = {}) {
    this.#gl = gl;

    /**@type {number} */
    this.target = target;
    /**@type {WebGLBuffer | null} */
    this.uvBuffer = null;
    /**@type {number} */
    this.unit = 0;

    this.bindConfig = {
      glType: this.#gl.FLOAT,
      normalize: false,
      stride: 0,
      offset: 0
    }

    const texture = gl.createTexture();
    gl.bindTexture(target, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    gl.texImage2D(
      target,
      0,
      format,
      image.width,
      image.height,
      0,
      format,
      type,
      image
    );

    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, texParameter);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, texParameter);

    gl.bindTexture(target, null);

    /**@type {WebGLTexture} */
    this.texture = texture;
    return this;
  }

  /**
   * Creates a new WebGLBuffer given the `uvCoords` and stores it in `this.uvBuffer`.
   * @param {number[]} uvCoords
  * */
  setUVCoords(uvCoords) {
    const gl = this.#gl;
    const uvBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvCoords), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.uvBuffer = uvBuffer;
    return this;
  }

  /**
   * Simply sets the `this.uvCoords` to the `buffer` provided. Reason for this is so that `Texture`
   * does not hold ownership of the WebGLBuffer in `this.uvBuffer`.
   * @param {WebGLBuffer} buffer
   */
  setUVBuffer(buffer) {
    this.uvBuffer = buffer;
    return this;
  }

  setBindConfig({ glType = this.#gl.FLOAT, normalize = false, stride = 0, offset = 0 } = {}) {
    this.bindConfig = { glType, normalize, stride, offset };
    return this;
  }

  /**@param {number} active  */
  setUnit(active = 0) {
    this.unit = active;
    return this;
  }
}
