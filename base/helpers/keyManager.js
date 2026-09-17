export class KeyManager {
  constructor() {
    /**@type {Record<string, boolean>}*/
    this.keysPressed = [];

    document.addEventListener('keyup', (event) => {
      this.keysPressed[event.code] = false;
    });

    document.addEventListener('keydown', (event) => {
      this.keysPressed[event.code] = true;
    });
  }

  log() {
    console.log(this.keysPressed);
  }
}
