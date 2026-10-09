import * as THREE from "three";
import { ObjectMap } from "./utilMaps.js";
import { FpsInfo } from "../helpers/fpsInfo.js";

export class BasicAppContext {
  #sceneObjects = new ObjectMap(null);

  /**@type {(scene: THREE.Scene, fpsInfo: FpsInfo) => void} */
  #renderLoop = () => {};

  /**
   * @param {Object} [options]
   * @param {string} [options.canvasId]
   * @param {number} [options.height]
   * @param {number} [options.width]
   * @param {number} [options.fov]
   * @param {string | null} [options.fpsId]
  */
  constructor(
    {
      canvasId = "canvas",
      height = window.innerHeight,
      width = window.innerWidth,
      fov = 75,
      fpsId = null
    } = {})
  {
    /**@type {HTMLElement | null} */
    const canvas = document.getElementById(canvasId)
    if (!(canvas instanceof HTMLCanvasElement)) throw Error("id of canvas in HTML is wrong.");

    canvas.height = height;
    canvas.width = width;

    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
      stencil: true,
      antialias: true,
      canvas: canvas,
    });
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const camera = new THREE.PerspectiveCamera(
      fov ? fov : 75,
      width / height,
      0.1,
      2000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(scene.position);

    /**@type {HTMLCanvasElement} */
    this.canvas = canvas;

    /**@type {THREE.WebGLRenderer} */
    this.renderer = renderer;
    /**@type {THREE.PerspectiveCamera} */
    this.camera = camera;
    /**@type {THREE.Scene} */
    this.scene = new THREE.Scene();

    /**@type {FpsInfo} */
    this.fpsInfo = new FpsInfo(fpsId);

    return this;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns
   */
  camPosition(x, y, z) {
    this.camera.position.set(x, y, z);
    return this;
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns
   */
  camLookAt(x, y, z) {
    this.camera.lookAt(x, y, z);
    return this;
  }

  /**
   * @param {Object} [options]
   * @param {number | null} [options.fov]
   * @param {number | null} [options.near]
   * @param {number | null} [options.far]
   * @param {number | null} [options.aspectRatio]
  */
  camPerspective({fov = null, near = null, far = null, aspectRatio = null} = {}) {
    if (!fov && !near && !far) {
      console.warn("Unnecessary call of camPerspective.");
      return;
    }

    if (fov) this.camera.fov = fov;
    if (near) this.camera.near = near;
    if (far) this.camera.far = far;
    if (aspectRatio) this.camera.aspect = aspectRatio;
  }

  /**
   * @param {string} label
   * @param {THREE.Object3D} mesh
  */
  setObject(label, mesh) {
    this.#sceneObjects.set(label, mesh);
    return this;
  }

  /**@param {{label: string; mesh: THREE.Object3D}[]} entries */
  setObjects(entries) {
    for (const { label, mesh } of entries) {
      this.#sceneObjects.set(label, mesh);
    }
  }

  /**@param {ObjectMap} map */
  setObjectFromObjectMap(map) {
    // makes sure the Object3DEventMap holds the name from `label`
    map.forEach((mesh, label) => { mesh.name = label });

    this.#sceneObjects = map;
    return this;
  }

  /**@param {string} label */
  popObject(label) {
    this.#sceneObjects.pop(label);
  }

  /** @param {(scene: THREE.Scene, fpsInfo: FpsInfo) => void} func */
  setAnimationLoop(func) {
    this.#renderLoop = func;
    return this;
  }

  /** Populates the scene with all the current objects. */
  initScene() {
    this.#sceneObjects.forEach((value, name) => {
      if (this.scene.getObjectByName(name) !== undefined) return;
      this.scene.add(value);
    })

    return this;
  }

  resetScene() {
    this.scene.clear();
    return this;
  }

  startRender() {
    this.renderer.setAnimationLoop(this.#initAnimate);
  }

  log() {

  }

  // ---------- PRIVATE FUNCTIONS ----------

  /**@param {number} time */
  #initAnimate = (time) => {
    this.fpsInfo.updateFps(time);

    this.#renderLoop(
      this.scene,
      this.fpsInfo
    );

    this.renderer.render(this.scene, this.camera);
  }
}
