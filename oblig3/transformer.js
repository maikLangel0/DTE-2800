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
     *  head: Dimention,
     *  neck: Dimention,
     *  torso: Dimention,
     *  upperArms: Dimention,
     *  lowerArms: Dimention,
     *  upperLegs: Dimention,
     *  lowerLegs: Dimention,
     *  feet: Dimention,
     *  wheel: { radius: number; thickness: number },
     *  radarSphere: { radius: number },
     *  radarDisc: { radius: number; thickness: number },
     *  radarPole: { radius: number; height: number },
     *  exhausts: { radius: number; height: number },
     * }}
     */
    this.dimentions = Object.freeze({
      head: { w: BASE_WIDTH, h: 2, d: BASE_DEPTH },
      neck: { w: Math.sqrt(BASE_WIDTH / 2), h: 1, d: Math.sqrt(BASE_WIDTH / 2) },

      torso: { w: BASE_WIDTH, h: 8, d: BASE_DEPTH },
      upperArms: { w: BASE_DEPTH * 0.9, h: 8, d: BASE_DEPTH * 0.9 },
      lowerArms: { w: BASE_DEPTH * 0.8, h: 8, d: BASE_DEPTH * 0.8 },
      upperLegs: { w: BASE_DEPTH * 0.95, h: 5, d: BASE_DEPTH * 0.95 },
      lowerLegs: { w: BASE_DEPTH * 0.9, h: 5, d: BASE_DEPTH * 0.9 },
      feet: { w: BASE_DEPTH * 0.9, h: 0.5, d: BASE_DEPTH * 1.5 },

      wheel: { radius: BASE_DEPTH, thickness: 1 },
      radarSphere: { radius: BASE_DEPTH / 10 },
      radarDisc: { radius: BASE_DEPTH * 0.8, thickness: 0.2 },
      radarPole: { radius: BASE_DEPTH / 12, height: BASE_DEPTH / 3 },
      exhausts: { radius: BASE_DEPTH * 0.4, height: 1 }
    })

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

    // ---------- RADAR
    const radarHeight = dims.radarPole.height / 2 + dims.head.h / 2 + 0.01;
    const radar = this.#createRadar("radar");
    radar.position.set(0, radarHeight, 0);
    head.add(radar);

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
    /**@type {THREE.Mesh} */
    this.head = head;
    /**@type {THREE.Mesh} */
    this.radar = radar;

    /**@type {THREE.Group} */
    this.self = self;
  }

  // ---------- PRIVATE CREATING FUNCTIONS ----------

  /**
   * @param {string} subName
   * @returns {THREE.Mesh} torso
  */
  #createTorso(subName) {
    const name = this.#name + "_" + subName;

    const torsoMainMaterial = this.#basicMetallicStandardMaterial;
    const torsoVideoMaterial = new THREE.MeshStandardMaterial({
      color: this.#metalColor,
      map: this.#torsoVideoTexture,
      metalness: 1.0,
      metalnessMap: this.#metalnessTexture,
      side: THREE.DoubleSide,
      roughness: 0.1
    });

    const torso = this.#boxGeometryTemplate(name, this.dimentions.torso, [
      torsoMainMaterial, torsoMainMaterial, torsoMainMaterial,
      torsoMainMaterial, torsoVideoMaterial, torsoMainMaterial
    ])

    return torso;
  }

  /**
   * @param {string} subName
   * @returns {THREE.Mesh} torso
  */
  #createNeck(subName) {
    const name = this.#name + "_" + subName;

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

    const neck = this.#boxGeometryTemplate(name, this.dimentions.neck, [
      // @ts-ignore
      neckAlphaMaterial, neckAlphaMaterial, undefined,
      // @ts-ignore
      undefined, neckMainMaterial, neckMainMaterial
    ])

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
    rimMesh.receiveShadow = true;
    rimMesh.rotateX(Math.PI / 2);

    const sideFaceGeometry = new THREE.CircleGeometry(dims.radius, 20);
    const sideFaceMaterial = new THREE.MeshStandardMaterial({ map: this.#wheelSideTexture });

    const sideFaceFrontMesh = new THREE.Mesh(sideFaceGeometry, sideFaceMaterial);
    sideFaceFrontMesh.name = name + "FrontFace";
    sideFaceFrontMesh.castShadow = true;
    sideFaceFrontMesh.receiveShadow = true;
    sideFaceFrontMesh.translateZ(dims.thickness / 2);

    const sideFaceBackMesh = new THREE.Mesh(sideFaceGeometry, sideFaceMaterial);
    sideFaceBackMesh.name = name + "BackFace";
    sideFaceBackMesh.castShadow = true;
    sideFaceBackMesh.receiveShadow = true;
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
   * @returns {THREE.Mesh} radar
  */
  #createRadar(subName) {
    const poleDims = this.dimentions.radarPole;
    const sphereDims = this.dimentions.radarSphere;
    const discDims = this.dimentions.radarDisc;
    const radarName = this.#name + "_" + subName;

    const radarBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, map: this.#metalnessTexture, side: THREE.DoubleSide });
    const radarCircleMaterial = radarBaseMaterial.clone();
    radarCircleMaterial.alphaMap = this.#shatterAlphaMap;
    radarCircleMaterial.transparent = true;

    // Generating the antenna-lookin shape
    /**@type {THREE.Vector2[]} */
    let discPoints = [];
    for (let i = 1; i < discDims.radius + 1; i += discDims.radius / 10) {
      const point = new THREE.Vector2(i - 1, i ** 0.3 - 1);
      discPoints.push(point);
    }

    const poleGeometry = new THREE.CylinderGeometry(poleDims.radius, poleDims.radius, poleDims.height, 20, 20);
    const discGeometry = new THREE.LatheGeometry(discPoints, 20);
    const circleGeometry = new THREE.SphereGeometry(sphereDims.radius, 20, 20);

    const lowerPoleMesh = new THREE.Mesh(poleGeometry, radarBaseMaterial);
    const upperPoleMesh = lowerPoleMesh.clone();
    const discMesh = new THREE.Mesh(discGeometry, radarBaseMaterial);
    const circleMesh = new THREE.Mesh(circleGeometry, radarCircleMaterial);
    
    const upperPoleYScaleFactor = 1.1;
    upperPoleMesh.scale.y = upperPoleYScaleFactor;
    upperPoleMesh.scale.x = 0.4;
    upperPoleMesh.scale.z = 0.4;

    discMesh.rotateZ(Math.PI / 10);

    discMesh.position.setY(poleDims.height / 2);
    upperPoleMesh.position.setY(poleDims.height / 2 * upperPoleYScaleFactor + discDims.thickness / 2);
    circleMesh.position.setY(poleDims.height * upperPoleYScaleFactor + sphereDims.radius);

    lowerPoleMesh.receiveShadow = true;
    lowerPoleMesh.castShadow = true;
    discMesh.receiveShadow = true;
    discMesh.castShadow = true;
    upperPoleMesh.receiveShadow = true;
    upperPoleMesh.castShadow = true;
    circleMesh.receiveShadow = true;
    circleMesh.castShadow = true;
    
    // lowerPoleMesh root of the meshes
    lowerPoleMesh.add(discMesh);
    discMesh.add(upperPoleMesh);
    discMesh.add(circleMesh);

    lowerPoleMesh.name = radarName;
    return lowerPoleMesh;
  }

  /**
   * @param {string} subName
   * @returns {THREE.Mesh} head
  */
  #createHead(subName) {
    const name = this.#name + "_" + subName;

    const headMainMaterial = this.#basicMetallicStandardMaterial.clone();
    const headGlassMaterial = new THREE.MeshLambertMaterial({
      color: 0x0000ff,
      opacity: 0.2,
      transparent: true,
      depthTest: false,
    })
    headMainMaterial.side = THREE.DoubleSide;

    const head = this.#boxGeometryTemplate(name, this.dimentions.head, [
      headMainMaterial, headMainMaterial, headMainMaterial,
      headMainMaterial, headGlassMaterial, headMainMaterial
    ])

    return head;
  }

  /**
   * @param {string} subName
   *  
   */
  #createUpperArms(subName) {
    const dims = this.dimentions.upperArms;
    const name = this.#name + "_" + subName;

    
  }

  // ---------- HELPER FOR THE HELPERS ----------

  /**
   * @param {string} name 
   * @param {Dimention} dimentions 
   * @param {THREE.Material | THREE.Material[]} material 
   * @returns {THREE.Mesh} mesh
   */
  #boxGeometryTemplate(name, dimentions, material) {
    const geometry = new THREE.BoxGeometry(dimentions.w, dimentions.h, dimentions.d);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.name = name;

    return mesh;
  }
}
