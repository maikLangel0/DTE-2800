import { Drawable } from "../shapes/drawable";

export class RenderQueue {
  /**@type {WebGL2RenderingContext} */
  #gl;
  /**@type {Drawable[]} */
  #baseQueue;
  /**@type {Drawable[]} */
  #deferredQueue;

  /**
   * @param {WebGL2RenderingContext} gl 
   */
  constructor(gl) {
    this.#gl = gl;

    this.#baseQueue = [];
    this.#deferredQueue = [];
  }
}