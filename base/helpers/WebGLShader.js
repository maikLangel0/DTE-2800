export const LocationType = Object.freeze({
  VERTEX: "vertex",
  UNIFORM: "uniform"
})

export class Shader {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {string} vsSource
   * @param {string} fsSource
   */
  constructor(gl, vsSource, fsSource) {
    /**@type WebGLProgram */
    this.shaderProgram = gl.createProgram();

    /**@type Map<string, number> */
    this.vertexLocations = new Map();

    /**@type Map<string, WebGLUniformLocation> */
    this.uniformLocations = new Map();

    const vertexShader = this.#compileShader(gl, gl.VERTEX_SHADER, vsSource);
		const fragmentShader = this.#compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

		gl.attachShader(this.shaderProgram, vertexShader);
		gl.attachShader(this.shaderProgram, fragmentShader);
		gl.linkProgram(this.shaderProgram);

		if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      throw Error('Error when compiling/linking the shader programs: ' + gl.getProgramInfoLog(this.shaderProgram));
		}
  }

  /**
   * @param {WebGL2RenderingContext} gl 
   * @param {{name: string; info: LocationInfo}[]} locationInfo 
   */
  connectLocations(gl, locationInfo) {
    for (let info of locationInfo) {
      this.#connectLocation(gl, info);
    }
  }

  /**@param {WebGL2RenderingContext} gl*/
  useProgram(gl) {
    gl.useProgram(this.shaderProgram);
  }

  /**@param {WebGL2RenderingContext} gl*/
  free(gl) {
    gl.deleteProgram(this.shaderProgram);
    this.vertexLocations = undefined;
    this.uniformLocations = undefined;
  }

  log() {
    console.log(`--- ShaderProgram ---`)

    console.log(`VertexLocations:`);
    this.vertexLocations.forEach((value, key) => {
      console.log(`\t${key} : ${value}`)
    })

    console.log(`UniformLocations`);
    this.uniformLocations.forEach((value, key) => {
      console.log(`\t${key} : `, value);
    })
  }

  // -------------------- PRIVATE --------------------

	/**
 * @param {WebGL2RenderingContext} gl
 * @param {number} type
 * @param {string} source
 * @returns {WebGLShader}
 */
	#compileShader(gl, type, source) {
		const shader = gl.createShader(type);

		gl.shaderSource(shader, source);
    gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw Error('Error when compiling the shader: ' + gl.getShaderInfoLog(shader));
    }

		return shader;
  }

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {string} name
   * @returns {WebGLUniformLocation}
   */
  #getUniformLocationChecked(gl, name) {
    const location = gl.getUniformLocation(this.shaderProgram, name);

    if (!location) {
      throw Error("Unable to get uniform location of attribute " + name);
    }

    return location;
  }

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {{name: string; type: LocationType}} info
   */
  #connectLocation(gl, info) {
    switch (info.type) {
      case LocationType.UNIFORM:
        this.uniformLocations.set(
          info.name,
          this.#getUniformLocationChecked(gl, info.name)
        );
        break
      case LocationType.VERTEX:
        this.vertexLocations.set(
          info.name,
          gl.getAttribLocation(this.shaderProgram, info.name)
        );
        break
    }
  }
}
