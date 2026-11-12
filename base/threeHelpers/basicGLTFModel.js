import * as THREE from "three";
import * as THREE_ADDONS from "three/examples/jsm/Addons.js";
import { getOrThrow } from "../lib/utility-functions";

export class BasicGLTFModel {
  /**@type {Map<string, THREE.AnimationMixer>} */
  #mixers;
  /**@type {Map<string, THREE.AnimationClip>} */
  #animations;
  /**@type {Map<string, THREE.AnimationAction>} */
  #animationActions;

  /**@type {THREE_ADDONS.GLTF} */
  #gltfObj;

  /**@type {string | null} */
  #mixerNamePersistent = null;

  /**
   * @param {Object} params
   * @param {THREE_ADDONS.GLTF} params.gltfObject
   * @param {string[]} [params.animationNames=[]]
   * @param {Object} [params.animationsBaseParams]
   * @param {number} [params.animationsBaseParams.duration]
   * @param {THREE.AnimationBlendMode} [params.animationsBaseParams.blendMode]
   * @param {boolean} [params.animationsBaseParams.optimize]
   */
  constructor({
    gltfObject,
    animationNames = [],
    animationsBaseParams: {
      duration,
      blendMode,
      optimize,
    } = {},
  }) {
    this.#gltfObj = gltfObject;
    this.#mixers = new Map();

    /**@type {Map<string, THREE.AnimationClip>} */
    const animations = new Map();

    let idx = 0;
    for (let name of animationNames) {
      const animation = gltfObject.animations[idx];

      if (animation === undefined) {
        console.warn(`Animation index of ${idx} and over are not defined (couldnt create the animation named ${name}).`);
        break;
      }

      if (duration) animation.duration = duration;
      if (blendMode) animation.blendMode = blendMode;
      if (optimize) animation.optimize();

      animation.name = name;
      animations.set(name, animation);

      idx += 1;
    }

    /**@type {Map<string, THREE.AnimationClip>} */
    this.#animations = animations;
    this.#animationActions = new Map();
    return this;
  }

  /**
   * provide `sceneIdentifier` if you want to assign a new mixer on a specific scene Group in the GLTF Model
   * @param {string | number} [sceneIdentifier]
   * @param {string} [mixerName]
   */
  createMixer = (mixerName, sceneIdentifier) => {
    /**@type {THREE.Group} */
    let scene;
    const leMixer = mixerName ? mixerName : this.#mixerNamePersistent;

    if (sceneIdentifier) {
      /**@type {THREE.Group | undefined} */
      let maybeScene = undefined;

      if (typeof sceneIdentifier === 'string') {
        maybeScene = this.#gltfObj.scenes.find((scene) => { return scene.name === sceneIdentifier });
      } else if (typeof sceneIdentifier === 'number') {
        maybeScene = this.#gltfObj.scenes.find((scene) => { return scene.id === sceneIdentifier });
      }

      if (maybeScene) scene = maybeScene
      else {
        console.warn(`Defaulted to the base scene of GLTFObject because scene of identifier ${sceneIdentifier} not found.`);
        scene = this.#gltfObj.scene;
      }
    } else {
      scene = this.#gltfObj.scene;
    }

    if (leMixer) this.#mixers.set(leMixer, new THREE.AnimationMixer(scene))
    else throw Error("MixerName not provided in function parameters and .setMixerNamePersistent has not been called to set it.")
    
    return this;
  }

  /**@param {string} animationName  */
  getAnimationReferance(animationName) {
    return getOrThrow(this.#animations.get(animationName));
  }

  /**@param {string} mixerName  */
  setMixerNamePersistent(mixerName) {
    this.#mixerNamePersistent = mixerName;
    return this;
  };

  freeMixerNamePersistent() {
    this.#mixerNamePersistent = null;
    return this;
  }

  /**
   * @param {{action: string; animation: string}[]} names
   * @param {string} [mixerName]
  */
  createAnimationActions = (names, mixerName) => {
    for (let { action, animation } of names) {
      this.createAnimationAction(action, animation, null, mixerName);
    }
    return this;
  }

  /**
   * @param {string} actionName
   * @param {string} animationName
   * @param {((action: THREE.AnimationAction) => void) | null} actionConfig
   * @param {string} [mixerName]
  */
  createAnimationAction = (
    actionName,
    animationName,
    actionConfig = null,
    mixerName
  ) => {
    const mixer = this.#getMixer(mixerName);
    const animation = this.#animations.get(animationName);

    if (animation) {
      const action = mixer.clipAction(animation);
      actionConfig?.(action);

      this.#animationActions.set(actionName, action);

    } else {
      console.warn(`Skipped animation of name ${animationName} due to it not being found.`);
    }

    return this;
  }

  /**
   * @param {string} actionName
   * @param {(action: THREE.AnimationAction) => void} func
   */
  onAnimationAction = (actionName, func) => {
    const act = getOrThrow(this.#animationActions.get(actionName));
    func(act);

    return this;
  }

  /** @param {string} actionName */
  play = (actionName) => {
    const action = getOrThrow(this.#animationActions.get(actionName));
    action.play();
    return this;
  }

  /** @param {string} actionName */
  stop = (actionName) => {
    const action = getOrThrow(this.#animationActions.get(actionName));
    action.stop();
    return this;
  }

  /**@param {number} dt */
  update(dt) {
    this.#mixers.forEach((mixer) => {
      mixer.update(dt)
    })
  }

  /**@param {string} [mixerName] */
  #getMixer(mixerName) {
    /**@type {string} */
    let leMixer;

    if (mixerName) leMixer = mixerName
    else if (this.#mixerNamePersistent) leMixer = this.#mixerNamePersistent
    else throw Error("mixerName has not previously been set, and its also not provided in the function call.");

    return getOrThrow(this.#mixers.get(leMixer));
  }
 }
