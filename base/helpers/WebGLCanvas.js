import { Camera } from "./Camera.js";

/**@typedef {{r: number, g: number, b: number, a: number}} Color */

export class WebGLCanvas {
  /**@type {HTMLCanvasElement} */
  #canvas;
  /**@type {{width: number; height: number}} */
  #dimensions;
  /**@type {{width: number; height: number}} */
  #previousWindowDimensions;

  /**@type {Color} */
  #bgColor;

  /**@type {Camera | null} */
  #camera;

   /**
    * @param {string} id
    * @param {number} width
    * @param {number} height
    */
  constructor(id, width = window.innerWidth * 0.985, height = window.innerHeight * 0.96) {
    /**@type HTMLCanvasElement | null */
    const canvas = document.querySelector(id);
    if (!canvas) {
      throw Error("Canvas not found");
    }

    this.#camera = null;
    this.#bgColor = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

    this.#canvas = canvas;
    this.#canvas.height = height;
    this.#canvas.width = width;

    this.#dimensions = { width, height };
    this.#previousWindowDimensions = { width: window.innerWidth, height: window.innerHeight };

		const ctx = this.#canvas.getContext('webgl2', {stencil: true} );
		if (!ctx) {
      throw Error('No context found.');
    }

		/**@type WebGL2RenderingContext */
    this.gl = ctx;
    /**@type number */
    this.aspectRatio = this.#canvas.width / this.#canvas.height;


    return this;
  }

  /**@param {Camera} camera  */
  setCamera(camera) {
    this.#camera = camera;
    this.#camera.setAspectRatio(this.aspectRatio);

    return this;
  }

  /**@param {Color} bgColor */
  setBgColor(bgColor) {
    this.#bgColor = bgColor;
    return this;
  }

  update() {
    this.#clear(); // Always clear bg color either way

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const prev = this.#previousWindowDimensions;

    if (prev.width === windowWidth && prev.height === windowHeight) {
      return;
    }
    if (!this.#resize(windowWidth, windowHeight)) {
      return;
    }

    this.#previousWindowDimensions = { width: windowWidth, height: windowHeight };

    this.gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);

    if (this.#camera) {
      this.aspectRatio = this.#canvas.width / this.#canvas.height;
      this.#camera.setprojectionOptions({aspectRatio: this.aspectRatio});
    }

    this.#clear(); // Need to clear again due to change in gl.viewport
  }

  /**
   * @param {number} wWidth
   * @param {number} wHeight
   * @returns {boolean}
   */
  #resize(wWidth, wHeight) {
    const scale = Math.min(
      wWidth / this.#dimensions.width,
      wHeight / this.#dimensions.height,
      1
    );

    const width = Math.round(this.#dimensions.width * scale);
    const height = Math.round(this.#dimensions.height * scale);

    if (width === this.#canvas.width && height === this.#canvas.height) {
      return false;
    }

    this.#canvas.width = width;
    this.#canvas.height = height;

    return true;
  }

  #clear() {
    const bgColor = this.#bgColor;

    this.gl.clearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT)
  }
}
