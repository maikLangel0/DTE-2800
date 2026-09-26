export class KeyManager {
  /**@type {Map<string, (dt: number) => void>} */
  #events

  constructor() {
    /**@type {Record<string, boolean>}*/
    this.keysPressed = [];
    this.#events = new Map();

    document.addEventListener('keyup', (event) => {
      this.keysPressed[event.code] = false;
    });

    document.addEventListener('keydown', (event) => {
      this.keysPressed[event.code] = true;
    });
  }

  /**@param {string} eventCode
   * @param {(dt: number) => void} callback
   * If key of eventCode gets held down, execute the callback
   */
  setEventOn(eventCode, callback) {
    this.#events.set(eventCode, callback);
  }

  /**@param {number} dt */
  handleEvents(dt = 0.016) {
    this.#events.forEach((callback, key) => {
      if (this.keysPressed[key]) callback(dt);
    })
  }

  log() {
    console.log(this.keysPressed);
    this.#events.forEach((val, key) => {
      console.log(`Key: ${key} Val: ${val}`)
    })
  }
}
