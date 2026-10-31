import * as THREE from "three";
import * as TWEEN from "three/examples/jsm/libs/tween.module.js";

export class BasicTweenBuilder {
  /**@type {TWEEN.Group} */
  #group;
  /**@type {{x?: number; y?: number; z?: number}} */
  #to;
  /**@type {(amount: number) => number} */
  #easing;
  /**@type {number} */
  #time;

  /**
   * @param {TWEEN.Group} tweenGroupRef
   * @param {Object} [options]
   * @param {number} [options.defaultTimeMs]
   * @param {{x?: number; y?: number; z?: number}} [options.defaultTo]
   * @param {(amount: number) => number} [options.defaultEasing]
   */
  constructor(
    tweenGroupRef,
    {
      defaultTo = { x: 0, y: 0, z: 0 },
      defaultEasing = TWEEN.Easing.Quadratic.InOut,
      defaultTimeMs = 500,
    } = {}
  ) {
    this.#group = tweenGroupRef;
    this.#to = defaultTo;
    this.#easing = defaultEasing;
    this.#time = defaultTimeMs;
  }
  /** @param {{x?: number; y?: number; z?: number}} to */
  setTo(to) {
    this.#to = to;
    return this;
  }

  /** @param {number} timeMs */
  setTime(timeMs) {
    this.#time = timeMs;
    return this;
  }

  /** @param {(amount: number) => number} easing */
  setEasing(easing) {
    this.#easing = easing;
    return this;
  }

  /**
   * @template {THREE.Euler | THREE.Vector3} T
   * @param {T} toBeOperatedOn
   * @param {Object} [options]
   * @param {{x?: number; y?: number; z?: number}} [options.xyz]
   * @param {TWEEN.Group} [options.group]
   * @param {number} [options.time]
   * @param {(amount: number) => number} [options.easingFunction]
   * @returns {TWEEN.Tween<T>}
   */
  tweenOn(toBeOperatedOn,
    {
      xyz = this.#to,
      group = this.#group,
      time = this.#time,
      easingFunction = this.#easing
    } = {}
  )
  {
    const res = new TWEEN.Tween(toBeOperatedOn, group)
      .to(xyz, time)
      .easing(easingFunction)

    return res;
  }
}
