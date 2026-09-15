import { Matrix4 } from "../lib_oblig1/cuon-matrix";

/**
 * Helper Class to hold the instances of matrices used during the renderloop
 */
export class RenderMatrices {
  constructor() {
    this.modelMatrix = new Matrix4();
    this.modelViewMatrix = new Matrix4();
  }
}