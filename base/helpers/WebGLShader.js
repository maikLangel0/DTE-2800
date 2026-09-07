export const LocationType = Object.freeze({
  IN: "in",
  UNIFORM: "uniform"
})

export const DataType = Object.freeze({
  SAMPLER2D: "sampler2d",

  MAT4f: "mat4f",
  MAT3f: "mat3f",

  VEC4f: "vec4f",
  VEC4i: "vec4i",
  VEC4ui: "vec4ui",

  VEC3f: "vec3f",
  VEC3i: "vec3i",
  VEC3ui: "vec3ui",

  VEC2f: "vec2f",
  VEC2i: "vec2i",
  VEC2ui: "vec2ui",

  FLOAT: "float",
  INT: "int",
  UINT: "uint",
})

export class Shader {
  #gl;
  #locations;

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {string} vsSource
   * @param {string} fsSource
   */
  constructor(gl, vsSource, fsSource) {
    this.#gl = gl; // reference to the WebGL2RenderingContext class

    /**@type {WebGLProgram} */
    this.shaderProgram = gl.createProgram();

    /** @type {Map<string, {location: number | WebGLUniformLocation, dataType: DataType}>} */
    this.#locations = new Map();

    const vertexShader = this.#compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.#compileShader(gl.FRAGMENT_SHADER, fsSource);

		gl.attachShader(this.shaderProgram, vertexShader);
		gl.attachShader(this.shaderProgram, fragmentShader);
		gl.linkProgram(this.shaderProgram);

		if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
		  throw Error('Error when compiling/linking the shader programs: ' + gl.getProgramInfoLog(this.shaderProgram));
		}
  }

  /**
   * @param {{name: string; locationType: LocationType, dataType: DataType}[]} locationInfo
   */
  findLocations(locationInfo) {
    for (let info of locationInfo) {
      this.#findLocation(info);
    }
  }

  /**
   * @returns {Map<string, {location: number | WebGLUniformLocation, dataType: DataType}>}
   */
  getLocationsChecked() {
    if (this.#locations.size === 0) {
      throw Error("No locations found. They're most likely not instanciated yet. Do findLocations() first.");
    }

    return this.#locations;
  }

  /**
   * @param {string} name
   * @param {{buffer: WebGLBuffer; texture: WebGLTexture} | WebGLBuffer | Float32Array | number} data,
   * @param {{glType: number; stride: number, offset: number}} attribSettings
   * @param {{ sampleName: string; activeTexture: number; target: number; }} [textureSettings]
   *
   */
  connectLocationChecked(
    name,
    data,
    attribSettings = {
      glType: this.#gl.FLOAT,
      stride: 0,
      offset: 0
    },
    textureSettings = {
      sampleName: "uSampler",
      activeTexture: this.#gl.TEXTURE0,
      target: this.#gl.TEXTURE_2D
    }
    ) {
    const locationInfo = this.#locations.get(name);

    if (!locationInfo) {
      throw Error("Found no location named: " + name);
    }

    // ----- FINDING THE CORRECT ATTRIBUTE TYPE TO CONNECT -----
    // if true, either Texture or Attribute
    if (typeof locationInfo.location === "number") {

      // Check if it data is an object & has samplerName
      // (means it wants to connect texture)

      const isTextureBundle = (
        data && typeof data === "object" &&
        "buffer" in data && "texture" in data
      );

      if (data instanceof WebGLBuffer) {
        this.#connectAttribute(
          locationInfo,
          data,
          attribSettings
        );

      } else if (isTextureBundle) {
        const samplerInfo = this.#locations.get(textureSettings.sampleName);

        if (!samplerInfo || typeof samplerInfo.location === "number") {
          throw Error("No sampler found named: " + textureSettings.sampleName);
        }

        this.#connectTextureAttribute(
          locationInfo,
          samplerInfo,
          data.buffer,
          data.texture,
          attribSettings,
          textureSettings,
        );

      } else {
        throw Error(`'Data' is invalid on connectLocationChecked when name = ${name}`)
      }

    } else {
      this.#connectUniform(
        locationInfo,
        data
      );
    }
  }

  useProgram() {
    this.#gl.useProgram(this.shaderProgram);
  }

  free() {
    this.#gl.deleteProgram(this.shaderProgram);
    this.#locations = new Map();
  }

  log() {
    console.log(`--- ShaderProgram ---`)
    console.log(`Locations: `)

    this.#locations.forEach((value, key) => {
      console.log(`Name: ${key}, DataType: ${value.dataType}, Location: ${value.location}`)
    })
  }

  // -------------------- PRIVATE --------------------

  /**
   * @param {number} type
   * @param {string} source
   * @returns {WebGLShader}
  */
	#compileShader(type, source) {
		const shader = this.#gl.createShader(type);

		this.#gl.shaderSource(shader, source);
		this.#gl.compileShader(shader);

		if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
		  throw Error('Error when compiling the shader: ' + this.#gl.getShaderInfoLog(shader));
    }

		return shader;
}

  /**
   * @param {string} name
   * @returns {WebGLUniformLocation}
   */
  #getUniformLocationChecked(name) {
    const location = this.#gl.getUniformLocation(this.shaderProgram, name);

    if (!location) {
      throw Error("Unable to get uniform location of uniform " + name);
    }

    return location;
  }

  /**
   * @param {string} name
   * @returns {number}
   */
  #getAttribLocationChecked(name) {
    const location = this.#gl.getAttribLocation(this.shaderProgram, name);

    if (location === -1) {
      throw Error("Unable to get attribute location of attribute" + name);
    }

    return location;
  }

  /**
   * @param {{name: string; locationType: LocationType; dataType: DataType}} info
   */
  #findLocation(info) {
    switch (info.locationType) {

      case LocationType.UNIFORM:
        this.#locations.set(info.name, {
          location: this.#getUniformLocationChecked(info.name),
          dataType: info.dataType,
        })
        break

      case LocationType.IN:
        this.#locations.set(info.name, {
          location: this.#getAttribLocationChecked(info.name),
          dataType: info.dataType,
        })
        break

      default:
        throw Error("Unrecognized locationType: " + info.locationType);

    }
  }

  /**
   * @param {DataType} type
   * @param {WebGLBuffer | Float32Array | number} data
   * @returns {boolean}
   */
  #isDataTypeCompatible(type, data) {
    const isPrimitive = (
      type === DataType.FLOAT ||
      type === DataType.INT ||
      type === DataType.UINT
    )

    const numComponents = this.#numOfComponents(type);

    if (isPrimitive && typeof data !== "number") {
      return false;
    }

    if (!isPrimitive && typeof data === "number") {
      return false;
    }

    const expectedLengths = {
        [DataType.MAT4f]: 16,
        [DataType.MAT3f]: 9,
        [DataType.VEC4f]: 4,
        [DataType.VEC4i]: 4,
        [DataType.VEC4ui]: 4,
        [DataType.VEC3f]: 3,
        [DataType.VEC3i]: 3,
        [DataType.VEC3ui]: 3,
        [DataType.VEC2f]: 2,
        [DataType.VEC2i]: 2,
        [DataType.VEC2ui]: 2,
        [DataType.SAMPLER2D]: 2,
      };

      const expected = expectedLengths[type];

      if (expected === undefined) {
        return false;
      }

      return data.length === expected;
  }

  /**
   * @param {DataType} type
   * @returns {number}
   */
  #numOfComponents(type) {
    const isFour = (
      type === DataType.VEC4f ||
      type === DataType.VEC4i ||
      type === DataType.VEC4ui
    );

    if (isFour) {
      return 4;
    }

    const isThree = (
      type === DataType.VEC3f ||
      type === DataType.VEC3i ||
      type === DataType.VEC3ui
    );

    if (isThree) {
      return 3;
    }

    const isTwo = (
      type === DataType.VEC2f ||
      type === DataType.VEC2i ||
      type === DataType.VEC2ui ||
      type === DataType.SAMPLER2D
    );

    if (isTwo) {
      return 2;
    }

    const isOne = (
      type === DataType.FLOAT ||
      type === DataType.INT ||
      type === DataType.UINT
    );

    if (isOne) {
      return 1;
    }

    throw Error("Unsupported DataType: " + type + " for attributes.");
  }

  /**
   * @param {{location: number, dataType: DataType}} locationInfo
   * @param {WebGLBuffer} buffer
   * @param {{glType: number; stride: number, offset: number}} settings
   */
  #connectAttribute(locationInfo, buffer, settings) {
    const gl = this.#gl; // For convenience

    const location = locationInfo.location;
    const type = locationInfo.dataType;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.vertexAttribPointer(
      location,
      this.#numOfComponents(type),
      settings.glType,
      false,
      settings.stride,
      settings.offset
    );

    gl.enableVertexAttribArray(location);
  }

  /**
   * @param {{location: number; dataType: DataType}} locationInfo
   * @param {{location: number; dataType: DataType}} samplerInfo
   * @param {WebGLBuffer} buffer
   * @param {WebGLTexture} texture
   * @param {{glType: number; stride: number, offset: number}} attribSettings
   * @param {{ sampleName: string; activeTexture: number; target: number; }} [textureSettings]
   */
  #connectTextureAttribute(
    locationInfo,
    samplerInfo,
    buffer,
    texture,
    attribSettings,
    textureSettings
    ) {
    const gl = this.#gl; // for convenience

    const type = locationInfo.dataType;
    const location = locationInfo.location;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.vertexAttribPointer(
      location,
      this.#numOfComponents(type),
      attribSettings.glType,
      false,
      attribSettings.stride,
      attribSettings.offset
    );

    gl.enableVertexAttribArray(location);

    gl.activeTexture(textureSettings.activeTexture);
    gl.bindTexture(textureSettings.target, texture);

    gl.uniform1i(
      samplerInfo.location,
      textureSettings.activeTexture - gl.TEXTURE0
    );
  }

  /**
   * @param {{location: WebGLUniformLocation, dataType: DataType}} locationInfo
   * @param {Float32Array | number} data
  */
  #connectUniform(locationInfo, data) {
    const gl = this.#gl; // for ease-of-use

    const location = locationInfo.location;
    const type = locationInfo.dataType;

    if (!this.#isDataTypeCompatible(type, data)) {
      throw Error(`DataType: ${type} not compatible with data: ${data}`);
    }

    switch (type) {
      case DataType.MAT4f:
        gl.uniformMatrix4fv(location, false, data);
        break;

      case DataType.MAT3f:
        gl.uniformMatrix3fv(location, false, data);
        break;

      case DataType.VEC4f:
        gl.uniform4fv(location, data);
        break;
      case DataType.VEC4i:
        gl.uniform4iv(location, data);
        break;
      case DataType.VEC4ui:
        gl.uniform4uiv(location, data);
        break;

      case DataType.VEC3f:
        gl.uniform3fv(location, data);
        break;
      case DataType.VEC3i:
        gl.uniform3iv(location, data);
        break;
      case DataType.VEC3ui:
        gl.uniform3uiv(location, data);
        break;

      case DataType.VEC2f:
        gl.uniform2fv(location, data);
        break;
      case DataType.VEC2i:
        gl.uniform2iv(location, data);
        break;
      case DataType.VEC2ui:
        gl.uniform2uiv(location, data);
        break;

      case DataType.FLOAT:
        gl.uniform1f(location, data);
        break;
      case DataType.INT:
        gl.uniform1i(location, data);
        break;
      case DataType.UINT:
        gl.uniform1ui(location, data);
        break;
      default:
        throw Error("DataType of type " + type + " not implemented.");
    }
  }
}
