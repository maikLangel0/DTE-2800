export class KeyManager {
  /**@type {Map<string, (dt: number) => void>} */
  #holdEvents

  /**@type {Map<string, () => void>} */
  #pressEvents

  /**@type {Map<string, () => void>} */
  #releaseEvents

  constructor() {
    /**@type {Record<string, boolean>}*/
    this.keysHeld = {};
    /**@type {Record<string, boolean>}*/
    this.keysPressed = {};
    
    this.#holdEvents = new Map();
    this.#pressEvents = new Map();
    this.#releaseEvents = new Map();

    document.addEventListener('keyup', (event) => {
      if (!this.keysHeld[event.code]) return;
      
      this.keysHeld[event.code] = false;
      this.#releaseEvents.get(event.code)?.();
    });

    document.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      
      this.keysHeld[event.code] = true;
      this.keysPressed[event.code] = true;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {}; 
      this.keysPressed = {};  
    })
  }

  /**If key of eventCode gets held down, execute the callback
   * @param {string} eventCode
   * @param {(dt: number) => void} callback
   */
  setHoldEventOn(eventCode, callback) {
    this.#holdEvents.set(eventCode, callback);
    return this;
  }

  /**If key of eventCode gets clicked, execute the callback
   * @param {string} eventCode
   * @param {() => void} callback
   */
  setPressEventOn(eventCode, callback) {
    this.#pressEvents.set(eventCode, callback);
    return this;
  }

  /**If key of eventCode gets released, execute the callback
   * @param {string} eventCode
   * @param {() => void} callback
   */
  setReleaseEventOn(eventCode, callback) {
    this.#releaseEvents.set(eventCode, callback);
    return this;
  }

  /**@param {number} dt */
  handleEvents(dt = 0.016) {
    this.#holdEvents.forEach((callback, key) => {
      if (this.keysHeld[key]) callback(dt);
    })
    this.#pressEvents.forEach((callback, key) => {
      if (this.keysPressed[key]) callback();
    })

    this.keysPressed = {}; // So it doesnt activate multiple times.
  }

  log() {
    console.log(this.keysHeld);
    this.#holdEvents.forEach((val, key) => {
      console.log(`Key: ${key} Val: ${val}`)
    })
  }
}
