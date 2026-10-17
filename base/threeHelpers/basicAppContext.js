import * as THREE from "three";
import { FpsInfo } from "../helpers/fpsInfo.js";

export class BasicAppContext {
  /**@type {string | null} */
  #fallbackTexturePath = null;
  /**@type {THREE.Texture | null} */
  #fallbackTexture = null;

  /**@type {boolean} */
  #threwError = false;

  /**@type {(self: BasicAppContext) => void} */
  #renderLoop = () => { };

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
    /**@type {THREE.Scene} */
    this.scene = new THREE.Scene();
    /**@type {THREE.TextureLoader} */
    this.textureLoader = new THREE.TextureLoader();

    /**@type {FpsInfo} */
    this.fpsInfo = new FpsInfo(fpsId);

    // ---------- START ----------

    /**@type {HTMLElement | null} */
    const canvas = document.getElementById(canvasId)
    if (!(canvas instanceof HTMLCanvasElement)) throw Error("id of canvas in HTML is wrong.");

    canvas.height = height;
    canvas.width = width;

    const scene = new THREE.Scene();
    scene.name = "mainScene";

    const renderer = new THREE.WebGLRenderer({
      stencil: true,
      antialias: true,
      canvas: canvas,
    });
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000);

    const camera = new THREE.PerspectiveCamera(
      fov ? fov : 75,
      width / height,
      0.1,
      2000
    );
    camera.name = "mainCamera";
    camera.position.set(20, 20, 20);
    camera.lookAt(scene.position);

    /**@type {HTMLCanvasElement} */
    this.canvas = canvas;
    /**@type {THREE.WebGLRenderer} */
    this.renderer = renderer;
    /**@type {THREE.PerspectiveCamera} */
    this.camera = camera;

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

    this.camera.updateProjectionMatrix();
    return this;
  }

  /**
   * Wrapper to load a texture via `this.textureLoader`.
   * Always returns a `fallbackTexture` if loading fails.
   *
   * @param {string} pathToTexture
   * @param {((tex: THREE.Texture) => void) | null} onSuccess
   */
  async loadTexture(pathToTexture, onSuccess = null) {
    let tex;

    try {
      tex = await this.textureLoader.loadAsync(pathToTexture);
      onSuccess?.(tex);
    }
    catch (err) {
      if (!this.#fallbackTexture) {
        tex = await this.#getFallbackTexture();
        this.#fallbackTexture = tex;
      } else {
        tex = this.#fallbackTexture.clone();
        tex.needsUpdate = true;
      }

      console.warn(`Failed to load: ${pathToTexture}, using fallback.`, err);
    }
    return tex;
  }

  /**@param {THREE.Object3D} entry Checks that `name` is set on the object*/
  setObjectInScene(entry) {
    if (entry.name.length === 0) throw Error(`Forgot to give entry with ID: ${entry.id} a name.`);

    this.scene.add(entry);
    return this;
  }

  /**@param {THREE.Object3D[]} entries  */
  setObjectsInScene(entries) {
    for (const entry of entries) {
      this.setObjectInScene(entry);
    }
    return this;
  }

  /**
   * Typechecks AND error-checks the `label` provided.
   * Guarantees that an object is returned; Throws error if not.
   *
   * @param {string | number} label
   * @returns {THREE.Object3D}
   */
  getObjectInScene(label) {
    let res;

    switch (typeof label) {
      case "string":
        res = this.scene.getObjectByName(label);
        if (res === undefined) this.#throwHotpathError(`Label name: ${label} not found.`);

        return res;
      case "number":
        res = this.scene.getObjectById(label);
        if (res === undefined) this.#throwHotpathError(`Label id: ${label} not found.`);

        return res;
      default: this.#throwHotpathError("Unknown typeof label: " + label + ".");
    }
  }

  // This exists just for consistency with the functions above
  /**@param {string | number} label */
  removeObjectInScene(label) {
    const obj = this.getObjectInScene(label);
    this.scene.remove(obj);
  }

  /** @param {(self: BasicAppContext) => void} func */
  setAnimationLoop(func) {
    this.#renderLoop = func;
    return this;
  }

  /**@param {string} path  */
  setFallbackTexturePath(path) {
    this.#fallbackTexturePath = path;
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

    this.#renderLoop(this);

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Just a wrapper function to only throw an error once in hotloop;
   * @param {string} errMsg
   * @returns {never}
   * @throws {Error}
   */
  #throwHotpathError(errMsg) {
    if (!this.#threwError) {
      this.resetScene();
      this.#renderLoop = () => { };

      this.#threwError = true;
    }

    throw Error(errMsg);
  }

  #createFallbackTexture() {
    const data = new Uint8Array([
      255, 0, 255, 255,   0, 0, 0, 255,
      0, 0, 0, 255,       255, 0, 255, 255,
    ]);
    const tex = new THREE.DataTexture(data, 2, 2, THREE.RGBAFormat);

    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;

    return tex;
  }

  /**
   *
   * @param {string} path
   * @returns {Promise<THREE.Texture>}
   */
  async #loadFallbackTexture(path) {
    try {
      const tex = await this.textureLoader.loadAsync(path);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;

      this.#fallbackTexture = tex;

      return tex;
    } catch {
      throw Error("Failed to load errorTexture!");
    }
  }

  /**@returns {Promise<THREE.Texture>} */
  async #getFallbackTexture() {
    let res;

    if (this.#fallbackTexturePath) {
      res = this.#loadFallbackTexture(this.#fallbackTexturePath);
    } else {
      res = this.#createFallbackTexture();
    }
    return res;
  }
}
