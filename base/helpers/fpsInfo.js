export class FpsInfo {
  #previousTime;
  #frameCount;
  #dtTotal;
  #fpsInDoc;

  /**
   * @param {string} idInHtml 
   */
  constructor(idInHtml) {
    this.dt = 0;

    this.#previousTime = 0;
    this.#frameCount = 0;
    this.#dtTotal = 0;

    const fpsInDoc = document.getElementById(idInHtml);
    if (!fpsInDoc) {
      throw Error("Couldnt find element in DOM with name " + idInHtml);
    }

    this.#fpsInDoc = fpsInDoc;
  }

  /**
   * @param {number} everyXseconds 
   */
  showFps(everyXseconds = 1.0) {
    if (this.#dtTotal >= everyXseconds) {
      const fps = Math.round(this.#frameCount);
      
      this.#fpsInDoc.innerHTML = `FPS: ${fps}`;
      
      this.#dtTotal = 0;
      this.#frameCount = 0;
    }
  }

  /**
   * Call this inside the renderLoop to update what 
   * @param {number} currentTime 
   */
  updateFps(currentTime) {
    this.dt = (currentTime - this.#previousTime) / 1000;
  
    this.#previousTime = currentTime;
    this.#dtTotal += this.dt;
    this.#frameCount++;
  }

  log() {
    console.log(`FrameCount: ${this.#frameCount} | dt: ${this.dt}`)
  }
}