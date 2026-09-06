export class WebGLCanvas {
  /**
   * @param {string} id
   * @param {number} width
   * @param {number} height
   */
  constructor(id, width, height) {

    /**@type HTMLCanvasElement */
    const canvas = document.querySelector(id);
    if (!canvas) {
      throw Error("Canvas not found");
    }

    canvas.height = height;
    canvas.width = width;

		const ctx = canvas.getContext('webgl2', {stencil: true} );
		if (!ctx)
      alert('No context found.');

		/**@type WebGL2RenderingContext */
    this.gl = ctx;
    /**@type number */
    this.aspectRatio = width / height;
  }

  /**@param {{r: number, g: number, b: number, a: number}} bgColor  */
  clearCanvas(bgColor) {
    this.gl.clearColor(...bgColor);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT)
  }
}
