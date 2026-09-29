import { Matrix4 } from "../lib/cuon-matrix.js";
import { Drawable } from "../shapes/drawable.js";
import { RenderMatrices } from "./renderMatrices.js";

export class RenderQueue {
  /**label, Drawable */
  /**@type {[string | null, Drawable][]} */
  #baseQueue;
  /**label, Drawable */
  /**@type {[string | null, Drawable][]} */
  #deferredQueue;

  constructor() {
    this.#baseQueue = [];
    this.#deferredQueue = [];
  }

  /**
   * @param {Drawable} obj
   * @param {string | null} label
   */
  append(obj, label = null) {
    if (obj.getAlpha()) {
      this.#deferredQueue.push([label, obj]);
    } else {
      this.#baseQueue.push([label, obj]);
    }
  }

  render() {
    this.#deferredQueue.sort((first, second) => first[1].getDistanceToCamera() - second[1].getDistanceToCamera());

    let tmp = new Matrix4();
    
    for (let [_, obj] of this.#baseQueue) {
      obj.draw(tmp);
    }
    for (let [_, obj] of this.#deferredQueue) {
      obj.draw(tmp);
    }
  }
}
