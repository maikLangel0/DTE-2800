export class Color {

  /**
   * @param {number[]} color
   */
  constructor(color) {
    if (color.length !== 4) {
      throw Error("Color must be RBGA.");
    }
    /**@type {number[]} */
    this.raw = color;
    /**@type {{r: number; g: number; b: number; a: number}} */
    this.rgba = { r: this.raw[0], g: this.raw[1], b: this.raw[2], a: this.raw[3] };
  }

  /**
   * @param {number[]} color
   */
  set(color) {
    if (color.length !== 3 && color.length !== 4) {
      throw Error("Color must be rgb or rgba.");
    }

    this.raw[0] = color[0];
    this.raw[1] = color[1];
    this.raw[2] = color[2];

    if (color.length === 4) {
      this.raw[3] = color[3];
    }
  }
}
