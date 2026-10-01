import { Camera } from "./Camera.js";

export class WebGLCanvas {
  /**@type {HTMLCanvasElement} */
  #canvas;
  /**@type {{width: number; height: number}} */
  #dimensions;
  /**@type {{width: number; height: number}} */
  #previousWindowDimensions;

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
  }

  /**@param {{r: number, g: number, b: number, a: number}} bgColor  */
  clear(bgColor) {
    this.gl.clearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT)
  }

  /**@param {Camera} camera  */
  updateCanvasDimensions(camera) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const prev = this.#previousWindowDimensions;
    if (prev.width === windowWidth && prev.height === windowHeight) {
      return;
    }
    this.#previousWindowDimensions = { width: windowWidth, height: windowHeight };

    this.#resize();

    this.gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);

    this.aspectRatio = this.#canvas.width / this.#canvas.height;
    camera.setprojectionOptions({aspectRatio: this.aspectRatio});
  }

  #resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scale = Math.min(
      windowWidth / this.#dimensions.width,
      windowHeight / this.#dimensions.height,
      1
    );

    this.#canvas.width = Math.round(this.#dimensions.width * scale);
    this.#canvas.height = Math.round(this.#dimensions.height * scale);
  }
}
