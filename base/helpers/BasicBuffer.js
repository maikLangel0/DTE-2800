export class BasicBuffer {
  /**@type {WebGL2RenderingContext} */
  #gl;

  /**
   *
   * @param {WebGL2RenderingContext} gl
   * @param {number[]} data
   * @param {Object} [options]
   * @param {Float32ArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Float16ArrayConstructor | Float64ArrayConstructor} [options.bufDataConstructor]
   * @param {number} [options.bufTarget]
   * @param {number} [options.bufUsage]
   */
  constructor(gl, data, {
    bufDataConstructor = Float32Array,
    bufTarget = 34962, /** ARRAY_BUFFER */
    bufUsage = 35044   /** STATIC_DRAW */ } = {}
  ) {

    this.#gl = gl;

    const buf = gl.createBuffer();

    gl.bindBuffer(bufTarget, buf);
    gl.bufferData(bufTarget, new bufDataConstructor(data), bufUsage);
    gl.bindBuffer(bufTarget, null);

    this.buffer = buf;

  }

  free() {
    this.#gl.deleteBuffer(this.buffer)
  }
}
