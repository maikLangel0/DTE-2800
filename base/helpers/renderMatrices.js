import { Matrix4 } from "../lib/cuon-matrix.js";

/**
 * Helper Class to hold the instances of matrices used during the renderloop
 */
export class RenderMatrices {
  constructor() {
    this.modelMatrix = new Matrix4();
    this.modelViewMatrix = new Matrix4();
  }
}