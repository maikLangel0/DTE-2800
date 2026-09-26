export const RotateAround = Object.freeze({
  X: "x",
  Y: "y",
  Z: "z"
})

export const TranslateDirection = Object.freeze({
  UP: "up" ,
  DOWN: "down" ,
  LEFT: "left" ,
  RIGHT: "right" ,
  FRONT: "front" ,
  BACK: "back" ,
})

import { Matrix4 } from "../lib/cuon-matrix.js";

export class MatrixStack {
  /**@type {Matrix4[]} */
  #stack;

  constructor() {
    this.#stack = [];
  }

  /**Copies the **matrix** and pushes onto stack. @param {Matrix4} matrix */
  push(matrix) {
    let copy = new Matrix4(matrix);
    this.#stack.push(copy);
  }

  pop() {
    if (this.#stack.length === 0) {
      throw Error("MatrixStack is empty so it can't pop.");
    }
    this.#stack.pop();
  }

  /**@returns {Matrix4} */
  peek() {
    if (this.#stack.length === 0) {
      throw Error("MatrixStack is empty so it can't peek.");
    }

    let copy = new Matrix4(this.#stack.at(-1));
    return copy;
  }

  /**@returns {number} */
  size() {
    return this.#stack.length;
  }

  empty() {
    this.#stack = [];
  }

  log() {
    console.log("-- MatrixStack from bottom to top --");

    this.#stack.forEach((matrix, idx) => {
      console.log(`Matrix ${idx}: ${matrix.elements}`)
    })
  }

  /**
   * Translations happen instantly, while rotations can happen over time given the **angle** in **rotationsAround.
   * @param {{x: number; y: number; z: number;}} parentDimentions
   * @param {{x: number; y: number; z: number;}} childDimentions
   * @param {TranslateDirection[]} translateDirections
   * @param {{around: RotateAround, angle: number}[]} rotationsAround
   */
  createChildAndPush(
    parentDimentions,
    childDimentions,
    translateDirections,
    rotationsAround = [],
   ) {
    let modelMatrix = this.peek(); // Parents' modelMatrix

    this.#translateOn(modelMatrix, parentDimentions, translateDirections);
    this.#rotateOn(modelMatrix, rotationsAround);
    this.#translateOn(modelMatrix, childDimentions, translateDirections);

    this.push(modelMatrix); // Now its the childs' modelMatrix
  }


  // PRIVATE HELPERS --------------------

  /**
   * @param {Matrix4} matrix
   * @param {{x: number; y: number; z: number;}} dimentions
   * @param {TranslateDirection[]} translateDirections
   */
  #translateOn(matrix, dimentions, translateDirections) {
    const halfDimentions = { x: dimentions.x / 2, y: dimentions.y / 2, z: dimentions.z / 2 }

    for (let translation of translateDirections) {
      switch (translation) {
        case TranslateDirection.UP:
          matrix.translate(0, halfDimentions.y, 0);
          break

        case TranslateDirection.DOWN:
          matrix.translate(0, -halfDimentions.y, 0);
          break

        case TranslateDirection.LEFT:
          matrix.translate(-halfDimentions.x, 0, 0);
          break

        case TranslateDirection.RIGHT:
          matrix.translate(halfDimentions.x, 0, 0);
          break

        case TranslateDirection.FRONT:
          matrix.translate(0, 0, halfDimentions.z);
          break

        case TranslateDirection.BACK:
          matrix.translate(0, 0, -halfDimentions.z);
          break
      }
    }
  }

  /**
   * @param {Matrix4} matrix
   * @param {{around: RotateAround, angle: number}[]} rotationsAround
   */
  #rotateOn(matrix, rotationsAround) {
    for (let {around, angle} of rotationsAround) {
      switch (around) {
        case RotateAround.X:
          matrix.rotate(angle, 1, 0, 0);
          break

        case RotateAround.Y:
          matrix.rotate(angle, 0, 1, 0);
          break

        case RotateAround.Z:
          matrix.rotate(angle, 0, 0, 1);
          break
      }
    }
  }
}
