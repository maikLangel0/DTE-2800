export class FpsInfo {
  #previousTime;
  #frameCount;
  #dtInterval;
  #fpsInDoc;

  /**@param {string} idInHtml */
  constructor(idInHtml) {
    /** Time between previous frame and current frame. @type {number} */
    this.dt = 0;
    /** Total time since start of program. @type {number}*/
    this.totalTime = 0;

    this.#dtInterval = 0;
    this.#previousTime = 0;
    this.#frameCount = 0;

    const fpsInDoc = document.getElementById(idInHtml);
    if (!fpsInDoc) {
      throw Error("Couldnt find element in DOM with name " + idInHtml);
    }

    this.#fpsInDoc = fpsInDoc;
  }

  /**@param {number} everyXseconds */
  showFps(everyXseconds = 1.0) {
    
    if (this.#dtInterval >= everyXseconds) {
      const fps = Math.round(this.#frameCount);
      this.#fpsInDoc.innerHTML = `FPS: ${fps}`;

      this.#dtInterval = 0;
      this.#frameCount = 0;
    }
  }

  /**
   * Call this inside the renderLoop to update the fps.
   * @param {number} currentTime 
   */
  updateFps(currentTime) {
    this.dt = (currentTime - this.#previousTime) / 1000;
    this.totalTime += this.dt;
  
    this.#previousTime = currentTime;
    this.#dtInterval += this.dt;
    this.#frameCount++;
  }

  log() {
    console.log(`FrameCount: ${this.#frameCount} | dt: ${this.dt}`)
  }
}