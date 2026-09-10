import { rotateVector } from "../lib/utility-functions.js";
import { Matrix4 } from "../lib/cuon-matrix.js";

export class Camera {
  // ALL PRIVATE VARIABLES IN CLASS
  #projectionOptions;
  #camPos;
  #lookAt;
  #up;
  #viewMatrix;
  #projectionMatrix;

  /**
   * @param {*} gl
   * @param {{ x: number; y: number; z: number; }} [camPos={ x: 5, y: 20, z: 35 }]
   * @param {{ x: number; y: number; z: number; }} [lookAt={ x: 0, y: 0, z: 0 }]
   * @param {{ x: number; y: number; z: number; }} [up={x: 0, y: 1, z: 0 }]
   * @param {{ fov: number; aspectRatio: number; near: number; far: number; }} [projectionOptions={fov: 45, aspectRatio: 16/9, near: 0.1, far: 10000}]
   */
  constructor(
    projectionOptions = {
      fov: 45,
      aspectRatio: 16.0/9.0,
      near: 0.1,
      far: 10000,
    },
    camPos = { x: 20, y: 20, z: 20 },
    lookAt = { x: 0, y: 0, z: 0 },
    up = {x: 0, y: 1, z: 0 },
  ) {
    /**@type { {fov: number; aspectRatio: number; near: number; far: number;} } */
    this.#projectionOptions = projectionOptions;

    /**@type {{ x: number; y: number; z: number; }} */
    this.#camPos = camPos;

    /**@type {{ x: number; y: number; z: number; }} */
    this.#lookAt = lookAt;

    /**@type {{ x: number; y: number; z: number; }} */
    this.#up = up;

    /**@type {Matrix4} */
    this.#viewMatrix = new Matrix4();

    /**@type {Matrix4} */
    this.#projectionMatrix = new Matrix4();

    this.#set();
  }
  #set() {
    // ViewMatrix is your is a 4x4 matrix containing where your cam is positioned,
    // where it looks, and what up is defined as. The reason it is a 4x4 matrix and
    // not a 3x3 is because the extra rows allows for translation and perspective
    // projection only using matrix multiplication.
    this.#viewMatrix.setLookAt(
      this.#camPos.x, this.#camPos.y, this.#camPos.z,
      this.#lookAt.x, this.#lookAt.y, this.#lookAt.z,
      this.#up.x, this.#up.y, this.#up.z
    );

    // ProjectionMatrix is how the world is percieved through the "lens" of the camera.
    // It does a translation
    this.#projectionMatrix.setPerspective(
      this.#projectionOptions.fov,
      this.#projectionOptions.aspectRatio,
      this.#projectionOptions.near,
      this.#projectionOptions.far
    );
  }

  /** Multiplies the this.viewMatrix with the modelMatrix, in that order.
   * @param { Matrix4 } modelMatrix
   * @returns { Matrix4 }
   */
  getModelViewMatrix(modelMatrix) {
      return new Matrix4(this.#viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
  }

  /**@param {{x: number; y: number; z: number;}} pos */
  setPosition(pos) {
    this.#camPos = pos;
  }

  /**@param {{x: number; y: number; z: number;}} lookAt */
  setLookAt(lookAt) {
    this.#lookAt = lookAt;
  }

  /**@param {{x: number; y: number; z: number;}} up */
  setUp(up) {
    this.#up = up;
  }

  setprojectionOptions(options = {
    fov: 45,
    aspectRatio: 16.0/9.0,
    near: 0.1,
    far: 10000,
  }) {
    this.#projectionOptions = options;
  }

  /**@param {number} fov  */
  setFov(fov) {
    this.#projectionOptions.fov = fov;
  }

  /**@param {number} near  */
  setNear(near) {
    this.#projectionOptions.near = near;
  }

  /**@param {number} far  */
  setFar(far) {
    this.#projectionOptions.far = far;
  }

  /**
   *
   * @param {Map<string, bool>} currentlyPressedKeys
   * @param {number} degrees
   */
  handleKeys(currentlyPressedKeys, degrees = 2) {
    let camPosVec = vec3.fromValues(this.#camPos.x, this.#camPos.y, this.#camPos.z);

    if (currentlyPressedKeys['KeyA']) {
      rotateVector(degrees, camPosVec, {x:0, y: 1, z: 0});  //Roterer camPosVec 2 grader om y-aksen.
    }
    if (currentlyPressedKeys['KeyD']) {
      rotateVector(-degrees, camPosVec, {x:0, y: 1, z: 0});  //Roterer camPosVec -2 grader om y-aksen.
    }
    if (currentlyPressedKeys['KeyW']) {
      rotateVector(degrees, camPosVec, {x: 1, y: 0, z: 0});  //Roterer camPosVec 2 grader om x-aksen.
    }
    if (currentlyPressedKeys['KeyS']) {
      rotateVector(-degrees, camPosVec, {x: 1, y: 0, z: 0});  //Roterer camPosVec 2 grader om x-aksen.
    }
    //Zoom inn og ut:
    if (currentlyPressedKeys['KeyV']) {
      vec3.scale(camPosVec, camPosVec, 1.05);
    }
    if (currentlyPressedKeys['KeyB']) {
      vec3.scale(camPosVec, camPosVec, 0.95);
    }

    this.#camPos = { x: camPosVec[0], y: camPosVec[1], z: camPosVec[2] };
    this.#set();
  }

  toString() {
    return 'x:' + String(this.#camPos.x.toFixed(1)) +
      ', y' + String(this.#camPos.y.toFixed(1)) +
      ', z:' + String(this.#camPos.z.toFixed(1));
  }
}
