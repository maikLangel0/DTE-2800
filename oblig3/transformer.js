import * as THREE from "three";
import { Tween } from "three/examples/jsm/libs/tween.module.js";

const BASE_WIDTH = 5;
const BASE_DEPTH = 3;

/**
 * @typedef {{w: number; h: number; d: number}} Dimention
 * @typedef {{currRot: number; min: number; max: number; step: number}} RotParams
 * @typedef {{currPos: number; min: number; max: number; step: number}} MoveParams
 */

export class Transformer {
  /**@type {('standing' | 'transitioning' | 'driving')} */
  #state = 'standing';
  /**@type {string} */
  #name;

  // Used so many times I might as well store it and use it as a reference
  /**@type {THREE.MeshStandardMaterial} */
  #basicMetallicStandardMaterial;

  /**@type {THREE.ColorRepresentation} */
  #metalColor;

  /**@type {THREE.Texture | null} */
  #wheelRimTexture = null;
  /**@type {THREE.Texture | null} */
  #wheelSideTexture = null;
  /**@type {THREE.Texture | null} */
  #metalnessTexture = null;
  /**@type {THREE.Texture | null} */
  #shatterAlphaMap = null;
  /**@type {THREE.Texture | null} */
  #circleAlphaMap = null;
  /**@type {THREE.VideoTexture<HTMLVideoElement> | null} */
  #torsoVideoTexture = null;

  /**
   * @param {string} name
   * @param {Object} [options]
   * @param {THREE.ColorRepresentation} [options.metalColor]
   * @param {THREE.Texture | null} [options.fallbackTexture]
   * @param {THREE.Texture | null} [options.wheelRimTexture]
   * @param {THREE.Texture | null} [options.wheelSideTexture]
   * @param {THREE.Texture | null} [options.metalnessTexture]
   * @param {THREE.Texture | null} [options.shatterAlphaMap]
   * @param {THREE.Texture | null} [options.circleAlphaMap]
   * @param {THREE.VideoTexture | null} [options.chestVideoTexture]
   */
  constructor(
    name = "me", {
      metalColor = 0x9f9f9f,
      fallbackTexture = null,
      wheelRimTexture = null,
      wheelSideTexture = null,
      chestVideoTexture = null,
      metalnessTexture = null,
      shatterAlphaMap = null,
      circleAlphaMap = null,
    } = {}
  )
  {
    this.#name = name;
    this.#metalColor = metalColor;

    this.#wheelRimTexture = wheelRimTexture ? wheelRimTexture : fallbackTexture;
    this.#wheelSideTexture = wheelSideTexture ? wheelSideTexture : fallbackTexture;
    this.#metalnessTexture = metalnessTexture ? metalnessTexture : fallbackTexture;
    this.#shatterAlphaMap = shatterAlphaMap ? shatterAlphaMap : fallbackTexture;
    this.#circleAlphaMap = circleAlphaMap ? circleAlphaMap : fallbackTexture;
    this.#torsoVideoTexture = chestVideoTexture;

    this.#basicMetallicStandardMaterial = new THREE.MeshStandardMaterial({
      color: metalColor,
      metalness: 0.6,
      roughness: 0.1,
      metalnessMap: this.#metalnessTexture,
    });

    /**
     * @type {{
     *  neckRotY: RotParams,
     *  headRotY: RotParams,
     *  upperArmsRotX: RotParams,
     *  upperArmsRotZ: RotParams,
     *  lowerArmsRotX: RotParams,
     *  lowerArmsRotZ: RotParams,
     *  upperLegsRotX: RotParams,
     *  upperLegsRotZ: RotParams,
     *  lowerLegsRotX: RotParams,
     *  lowerLegsRotZ: RotParams,
     *  feetRotY: RotParams,
     * }}
     */
    this.animations = {
      neckRotY: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 }, // neckRot + headRot = 180 degrees each way
      headRotY: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },

      upperArmsRotX: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },
      upperArmsRotZ: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },

      lowerArmsRotX: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },
      lowerArmsRotZ: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },

      upperLegsRotX: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },
      upperLegsRotZ: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },

      lowerLegsRotX: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },
      lowerLegsRotZ: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },

      feetRotY: { currRot: 0, min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },
    }

    /**
     * @type {{
     *  radar: Dimention,
     *  head: Dimention,
     *  neck: Dimention,
     *  torso: Dimention,
     *  upperArms: Dimention,
     *  lowerArms: Dimention,
     *  upperLegs: Dimention,
     *  lowerLegs: Dimention,
     *  feet: Dimention,
     *  wheel: { radius: number, thickness: number }
     *  exhausts: { radius: number, height: number }
     * }}
     */
    this.dimentions = {
      /**@type {Dimention} */
      radar: { w: BASE_DEPTH / 2, h: 1, d: BASE_DEPTH / 2 },
      /**@type {Dimention} */
      head: { w: BASE_WIDTH, h: 2, d: BASE_DEPTH },
      /**@type {Dimention} */
      neck: { w: Math.sqrt(BASE_WIDTH / 2), h: 1, d: Math.sqrt(BASE_WIDTH / 2) },

      /**@type {Dimention} */
      torso: { w: BASE_WIDTH, h: 8, d: BASE_DEPTH },
      /**@type {Dimention} */
      upperArms: { w: BASE_DEPTH * 0.9, h: 8, d: BASE_DEPTH * 0.9 },
      /**@type {Dimention} */
      lowerArms: { w: BASE_DEPTH * 0.8, h: 8, d: BASE_DEPTH * 0.8 },
      /**@type {Dimention} */
      upperLegs: { w: BASE_DEPTH * 0.95, h: 5, d: BASE_DEPTH * 0.95 },
      /**@type {Dimention} */
      lowerLegs: { w: BASE_DEPTH * 0.9, h: 5, d: BASE_DEPTH * 0.9 },
      /**@type {Dimention} */
      feet: { w: BASE_DEPTH * 0.9, h: 0.5, d: BASE_DEPTH * 1.5 },

      wheel: { radius: BASE_DEPTH, thickness: 1 },
      exhausts: { radius: BASE_DEPTH * 0.4, height: 1 }
    }

    // ---------- CREATING EVERYTHING ----------
    const dims = this.dimentions;

    // ---------- TORSO
    const torsoDims = dims.torso;
    const torso = this.#createTorso("torso");

    // ---------- WHEELS
    const wheelDims = dims.wheel;
    const wheel1 = this.#createWheel("wheel1");
    wheel1.position.set(torsoDims.w / 2 + wheelDims.thickness / 2, 0, 0);
    torso.add(wheel1);

    const wheel2 = this.#createWheel("wheel2");
    wheel2.position.set(-torsoDims.w / 2 - wheelDims.thickness / 2, 0, 0);
    torso.add(wheel2);

    const wheel3 = this.#createWheel("wheel3");
    const wheel4 = this.#createWheel("wheel4");
    const wheel5 = this.#createWheel("wheel5");
    const wheel6 = this.#createWheel("wheel6");

    // ---------- NECK
    const neckDims = dims.neck;
    const neck = this.#createNeck("neck");
    neck.position.set(0, torsoDims.h / 2 + neckDims.h / 2, 0);
    torso.add(neck);

    // ---------- HEAD
    const headDims = dims.head;
    const head = this.#createHead("head");
    head.position.set(0, neckDims.h / 2 + headDims.h / 2, 0);
    neck.add(head);

    // ---------- SETTING EVERYTHING IN A GROUP ----------
    const self = new THREE.Group();
    self.name = this.#name;
    self.position.setY(15);

    self.add(torso);

    /**@type {THREE.Mesh} */
    this.torso = torso;

    /**@type {THREE.Group} */
    this.wheel1 = wheel1;
    /**@type {THREE.Group} */
    this.wheel2 = wheel2;
    /**@type {THREE.Group} */
    this.wheel3 = wheel3;
    /**@type {THREE.Group} */
    this.wheel4 = wheel4;
    /**@type {THREE.Group} */
    this.wheel5 = wheel5;
    /**@type {THREE.Group} */
    this.wheel6 = wheel6;

    /**@type {THREE.Mesh} */
    this.neck = neck;
    /**@type {THREE.Group} */
    this.head = head;

    /**@type {THREE.Group} */
    this.self = self;
  }

  // ---------- PRIVATE CREATING FUNCTIONS ----------

  /**
   * @param {string} subName
   * @returns {THREE.Mesh} torso
  */
  #createTorso(subName) {
    const dims = this.dimentions.torso;
    const name = this.#name + "_" + subName;

    const torsoGeometry = new THREE.BoxGeometry(dims.w, dims.h, dims.d);

    const torsoMainMaterial = this.#basicMetallicStandardMaterial;
    const torsoVideoMaterial = new THREE.MeshStandardMaterial({
      color: this.#metalColor,
      map: this.#torsoVideoTexture,
      metalness: 1.0,
      metalnessMap: this.#metalnessTexture,
      side: THREE.DoubleSide,
      roughness: 0.1
    });

    const torso = new THREE.Mesh(torsoGeometry, [
      torsoMainMaterial, torsoMainMaterial, torsoMainMaterial,
      torsoMainMaterial, torsoVideoMaterial, torsoMainMaterial
    ])
    torso.name = name;
    torso.castShadow = true;

    return torso;
  }

  /**
   * @param {string} subName
   * @returns {THREE.Mesh} torso
  */
  #createNeck(subName) {
    const dims = this.dimentions.neck;
    const name = this.#name + "_" + subName;

    const neckGeometry = new THREE.BoxGeometry(dims.w, dims.h, dims.d);
    const neckMainMaterial = new THREE.MeshStandardMaterial({
      color: this.#metalColor,
      metalness: 1.0,
      metalnessMap: this.#metalnessTexture,
      side: THREE.DoubleSide
    });
    const neckAlphaMaterial = new THREE.MeshStandardMaterial({
      color: this.#metalColor,
      metalness: 1.0,
      metalnessMap: this.#metalnessTexture,
      alphaMap: this.#circleAlphaMap,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const neck = new THREE.Mesh(neckGeometry, [
      // @ts-ignore
      neckAlphaMaterial, neckAlphaMaterial, undefined,
      // @ts-ignore
      undefined, neckMainMaterial, neckMainMaterial
    ])
    neck.name = name;
    neck.castShadow = true;

    return neck;
  }

  /**
   * @param {string} subName
   * @returns {THREE.Group} wheel
  */
  #createWheel(subName) {
    const dims = this.dimentions.wheel;
    const name = this.#name + "_" + subName;

    const wheel = new THREE.Group();
    wheel.name = name;

    const rimGeometry = new THREE.CylinderGeometry(dims.radius, dims.radius, dims.thickness, 20, 20, true);
    const rimMaterial = new THREE.MeshStandardMaterial({ map: this.#wheelRimTexture });
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.name = name + "Rim";
    rimMesh.castShadow = true;
    rimMesh.rotateX(Math.PI / 2);

    const sideFaceGeometry = new THREE.CircleGeometry(dims.radius, 20);
    const sideFaceMaterial = new THREE.MeshStandardMaterial({ map: this.#wheelSideTexture });

    const sideFaceFrontMesh = new THREE.Mesh(sideFaceGeometry, sideFaceMaterial);
    sideFaceFrontMesh.name = name + "FrontFace";
    sideFaceFrontMesh.castShadow = true;
    sideFaceFrontMesh.translateZ(dims.thickness / 2);

    const sideFaceBackMesh = new THREE.Mesh(sideFaceGeometry, sideFaceMaterial);
    sideFaceBackMesh.name = name + "BackFace";
    sideFaceBackMesh.castShadow = true;
    sideFaceBackMesh.translateZ(-dims.thickness / 2);
    sideFaceBackMesh.rotateY(Math.PI)

    wheel.add(rimMesh);
    wheel.add(sideFaceFrontMesh);
    wheel.add(sideFaceBackMesh);

    wheel.rotateY(Math.PI / 2);

    return wheel;
  }

  /**
   * @param {string} subName
   * @returns {THREE.Mesh} wheel
  */
  #createRadar(subName) {
    const dims = this.dimentions.radar;
    const name = this.#name + "_" + subName;


  }

  /**
   * @param {string} subName
   * @returns {THREE.Group} wheel
  */
  #createHead(subName) {
    const dims = this.dimentions.head;
    const name = this.#name + "_" + subName;

    const headGroup = new THREE.Group();
    headGroup.name = name;

    const headGeometry = new THREE.BoxGeometry(dims.w, dims.h, dims.d);

    const headMainMaterial = this.#basicMetallicStandardMaterial.clone();
    const headGlassMaterial = new THREE.MeshLambertMaterial({
      color: 0x0000ff,
      opacity: 0.2,
      transparent: true,
      depthTest: false,
    })
    headMainMaterial.side = THREE.DoubleSide;

    const headMesh = new THREE.Mesh(headGeometry, [
      headMainMaterial, headMainMaterial, headMainMaterial,
      headMainMaterial, headGlassMaterial, headMainMaterial
    ]);

    headGroup.add(headMesh);

    return headGroup;
  }
}
