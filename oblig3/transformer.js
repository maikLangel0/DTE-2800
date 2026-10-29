import * as THREE from "three";
import GUI from "lil-gui";
import { Tween } from "three/examples/jsm/libs/tween.module.js";
import { clamp, getOrThrow } from "../base/lib/utility-functions";
import { basicSpotLight } from "../base/threeHelpers/helpers";

const BASE_WIDTH = 5;
const BASE_DEPTH = 3;

/**
 * @typedef {{w: number; h: number; d: number}} Dimention
 * @typedef {{currRot: number; min: number; max: number; step: number}} RotParams
 * @typedef {{min: number; max: number; step: number}} AnimationParameters
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

  /**@type {THREE.Color} */
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
  /**@type {THREE.Texture | null} */
  #upperArmAlphaMap = null;
  /**@type {THREE.VideoTexture<HTMLVideoElement> | null} */
  #torsoVideoTexture = null;

  /**@type {string} */
  #upperArmVert;
  /**@type {string} */
  #upperArmFrag;

  /**@type {number} */
  #height;

  /**@type {{
   * radar: THREE.Mesh;
   * head: THREE.Mesh;
   * neck: THREE.Mesh;
   * leftHeadLight: THREE.SpotLight;
   * rightHeadLight: THREE.SpotLight;
   * }} */
  #neckUp;

  /**@type {THREE.SpotLightHelper} */
  #leftHeadLightHelper;
  /**@type {THREE.SpotLightHelper} */
  #rightHeadLightHelper;

  /**@type {THREE.Mesh} */
  #torso;

  /**@type {{
   * exhaust: THREE.Mesh;
   * shoulder: THREE.Group;
   * elbow: THREE.Group;
   * wheel: THREE.Group;
   * fingers: {left: THREE.Mesh; right: THREE.Mesh}
   * }} */
  #rightArm;

  /**@type {{
   * exhaust: THREE.Mesh;
   * shoulder: THREE.Group;
   * elbow: THREE.Group;
   * wheel: THREE.Group;
   * fingers: {left: THREE.Mesh; right: THREE.Mesh}
   * }} */
  #leftArm;

  /**@type {{
   * hip: THREE.Group;
   * knee: THREE.Group;
   * wheel: THREE.Group;
   * }} */
  #rightLeg;

  /**@type {{
   * hip: THREE.Group;
   * knee: THREE.Group;
   * wheel: THREE.Group;
   * }} */
  #leftLeg;

  /**@type {THREE.Group} */
  #self;

  /**
   * @param {string} name
   *
   * @param {Object} armShaderPair
   * @param {string} armShaderPair.upperArmFragmentShader
   * @param {string} armShaderPair.upperArmVertexShader
   *
   * @param {Object} [optionals]
   * @param {THREE.ColorRepresentation} [optionals.metalColor]
   * @param {THREE.Texture | null} [optionals.fallbackTexture]
   * @param {THREE.Texture | null} [optionals.wheelRimTexture]
   * @param {THREE.Texture | null} [optionals.wheelSideTexture]
   * @param {THREE.Texture | null} [optionals.metalnessTexture]
   * @param {THREE.Texture | null} [optionals.shatterAlphaMap]
   * @param {THREE.Texture | null} [optionals.circleAlphaMap]
   * @param {THREE.Texture | null} [optionals.upperArmAlphaMap]
   * @param {THREE.VideoTexture | null} [optionals.chestVideoTexture]
   */
  constructor(
    name = "me",
    {
      upperArmVertexShader,
      upperArmFragmentShader
    },
    {
      metalColor = 0x9f9f9f,
      fallbackTexture = null,
      wheelRimTexture = null,
      wheelSideTexture = null,
      chestVideoTexture = null,
      metalnessTexture = null,
      shatterAlphaMap = null,
      circleAlphaMap = null,
      upperArmAlphaMap = null,
    } = {}
  )
  {
    this.#name = name;
    this.#upperArmVert = upperArmVertexShader;
    this.#upperArmFrag = upperArmFragmentShader;
    this.#metalColor = new THREE.Color(metalColor);

    this.#wheelRimTexture = wheelRimTexture ? wheelRimTexture : fallbackTexture;
    this.#wheelSideTexture = wheelSideTexture ? wheelSideTexture : fallbackTexture;
    this.#metalnessTexture = metalnessTexture ? metalnessTexture : fallbackTexture;
    this.#shatterAlphaMap = shatterAlphaMap ? shatterAlphaMap : fallbackTexture;
    this.#circleAlphaMap = circleAlphaMap ? circleAlphaMap : fallbackTexture;
    this.#upperArmAlphaMap = upperArmAlphaMap ? upperArmAlphaMap : fallbackTexture;
    this.#torsoVideoTexture = chestVideoTexture;

    this.#basicMetallicStandardMaterial = new THREE.MeshStandardMaterial({
      color: metalColor,
      metalness: 0.6,
      roughness: 0.1,
      metalnessMap: this.#metalnessTexture,
    });

    /**
     * @type {{
     *  neckRotY: number,
     *  headRotY: number,
     *  leftShoulderRot: {x: number, z: number},
     *  leftElbowRot: {x: number, y: number, z: number},
     *  leftFingersRotZ: number,
     *  rightShoulderRot: {x: number, z: number},
     *  rightElbowRot: {x: number, y: number, z: number},
     *  rightFingersRotZ: number,
     *  leftHipRot: {x: number, z: number},
     *  leftKneeRot: {x: number, z: number},
     *  rightHipRot: {x: number, z: number},
     *  rightKneeRot: {x: number, z: number},
     * }}
     */
    this.animations = {
      neckRotY: 0,
      headRotY: 0,

      leftShoulderRot: { x: 0, z: 0 },
      leftElbowRot: { x: 0, y: 0, z: 0 },
      leftFingersRotZ: 0,

      rightShoulderRot: { x: 0, z: 0 },
      rightElbowRot: { x: 0, y: 0, z: 0 },
      rightFingersRotZ: 0,

      leftHipRot: { x: 0, z: 0 },
      leftKneeRot: { x: 0, z: 0 },

      rightHipRot: { x: 0, z: 0 },
      rightKneeRot: { x: 0, z: 0 },
    }

    /**
     * @type {{
     *  neckRotY: AnimationParameters,
     *  headRotY: AnimationParameters,
     *  shoulderRotX: AnimationParameters,
     *  shoulderRotZ: AnimationParameters,
     *  elbowRotX: AnimationParameters,
     *  elbowRotY: AnimationParameters,
     *  elbowRotZ: AnimationParameters,
     *  hipRotX: AnimationParameters,
     *  hipRotZ: AnimationParameters,
     *  kneeRotX: AnimationParameters,
     *  kneeRotZ: AnimationParameters,
     *  fingersRotZ: AnimationParameters,
     * }}
     */
    this.animationParameters = Object.freeze({
      neckRotY: { min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 }, // neckRot + headRot = 180 degrees each way
      headRotY: { min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },

      shoulderRotX: { min: -Math.PI, max: Math.PI / 4, step: 0.05 },
      shoulderRotZ: { min: 0, max: Math.PI / 8, step: 0.05 },
      elbowRotX: { min: -Math.PI / 2, max: 0, step: 0.05 },
      elbowRotY: { min: -Math.PI / 4, max: Math.PI / 4, step: 0.05 },
      elbowRotZ: { min: 0, max: Math.PI / 6, step: 0.05 },

      fingersRotZ: { min: -Math.PI / 8, max: Math.PI / 8, step: 0.05 },

      hipRotX: { min: -Math.PI / 2, max: Math.PI / 4, step: 0.05 },
      hipRotZ: { min: 0, max: Math.PI / 4, step: 0.05 },
      kneeRotX: { min: 0, max: Math.PI / 1.25, step: 0.05 },
      kneeRotZ: { min: 0, max: Math.PI / 12, step: 0.01 },
    });

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
     *  fingers: Dimention,
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
      upperArms: { w: BASE_DEPTH * 0.9, h: 4, d: BASE_DEPTH * 0.9 },
      lowerArms: { w: BASE_DEPTH * 0.8, h: 4, d: BASE_DEPTH * 0.8 },
      upperLegs: { w: BASE_DEPTH * 0.7, h: 5, d: BASE_DEPTH * 0.95 },
      lowerLegs: { w: BASE_DEPTH * 0.6, h: 6, d: BASE_DEPTH * 0.9 },
      feet: { w: BASE_DEPTH * 0.9, h: 0.5, d: BASE_DEPTH * 1.2 },
      fingers: { w: BASE_WIDTH * 0.1, h: 2, d: BASE_WIDTH * 0.1 },

      wheel: { radius: BASE_DEPTH, thickness: 1 },
      radarSphere: { radius: BASE_DEPTH / 10 },
      radarDisc: { radius: BASE_DEPTH * 0.8, thickness: 0.2 },
      radarPole: { radius: BASE_DEPTH / 12, height: BASE_DEPTH / 3 },
      exhausts: { radius: BASE_DEPTH * 0.23, height: 1.7 }
    })

    // ---------- CREATING EVERYTHING ----------
    const dims = this.dimentions;

    const self = new THREE.Group();
    self.name = this.#name;

    // ---------- CLAC THE HEIGHT OF HIM/HER
    const height = dims.torso.h / 2
      + dims.upperLegs.h
      + dims.lowerLegs.h
      + dims.feet.h;

    self.position.y = height;

    // ---------- TORSO
    const torsoDims = dims.torso;
    const torso = this.#createTorso("torso");

    // ---------- NECK
    const neckDims = dims.neck;
    const neck = this.#createNeck("neck");
    neck.position.set(0, torsoDims.h / 2 + neckDims.h / 2, 0);
    torso.add(neck);

    // ---------- HEAD
    const headDims = dims.head;
    const {
      head,
      rightHeadLight,
      leftHeadLight
    } = this.#createHead("head");
    head.position.set(0, neckDims.h / 2 + headDims.h / 2, 0);

    neck.add(head);

    const leftHeadLightHelper = new THREE.SpotLightHelper(leftHeadLight);
    leftHeadLightHelper.visible = false;
    const rightHeadLightHelper = new THREE.SpotLightHelper(rightHeadLight);
    rightHeadLightHelper.visible = false;

    head.add(leftHeadLightHelper);
    head.add(rightHeadLightHelper);
    leftHeadLightHelper.update();
    rightHeadLightHelper.update();

    // ---------- RADAR
    const radarHeight = dims.radarPole.height / 2 + dims.head.h / 2 + 0.01;
    const radar = this.#createRadar("radar");
    radar.position.set(0, radarHeight, 0);
    head.add(radar);

    // ---------- LEFT ARM
    const lowerArmDims = this.dimentions.lowerArms;
    const {
      shoulder: leftShoulder,
      elbow: leftElbow,
      lowerArm: leftLowerArm,
      exhaust: leftExhaust,
      fingers: leftArmFingers,
    } = this.#createArm('leftArm');

    leftShoulder.position.set(-torsoDims.w / 2, torsoDims.h / 2, 0);

    leftShoulder.rotation.z = -this.animationParameters.shoulderRotZ.max;
    this.animations.leftShoulderRot.z = this.animationParameters.shoulderRotZ.max;

    torso.add(leftShoulder);

    // ---------- RIGHT ARM
    const {
      shoulder: rightShoulder,
      elbow: rightElbow,
      lowerArm: rightLowerArm,
      exhaust: rightExhaust,
      fingers: rightArmFingers,
    } = this.#createArm('rightArm');

    rightShoulder.position.set(torsoDims.w / 2, torsoDims.h / 2, 0);

    rightShoulder.rotation.z = this.animationParameters.shoulderRotZ.max;
    this.animations.rightShoulderRot.z = this.animationParameters.shoulderRotZ.max;

    torso.add(rightShoulder);

    // ---------- LEFT LEG
    const thighDims = dims.upperLegs;
    const lowerLegDims = dims.lowerLegs;
    const legToTorsoXOffset = (torsoDims.w - thighDims.w + 0.01) / 2;

    const {
      hip: leftHip,
      knee: leftKnee,
      lowerLeg: leftLowerLeg,
    } = this.#createLeg('leftLeg');

    leftHip.position.set(-legToTorsoXOffset , -torsoDims.h / 2, thighDims.d / 2);
    torso.add(leftHip);

    // ---------- RIGHT LEG
    const {
      hip: rightHip,
      knee: rightKnee,
      lowerLeg: rightLowerLeg,
    } = this.#createLeg('rightLeg');

    rightHip.position.set(legToTorsoXOffset, -torsoDims.h / 2, thighDims.d / 2);
    torso.add(rightHip);

    // ---------- WHEELS
    const wheelDims = dims.wheel;

    const wheel1 = this.#createWheel("wheel1");
    wheel1.position.set(-(lowerArmDims.w / 2 + wheelDims.thickness / 2), -lowerArmDims.h / 4, 0);
    leftLowerArm.add(wheel1);

    const wheel2 = this.#createWheel("wheel2");
    wheel2.position.set(lowerArmDims.w / 2 + wheelDims.thickness / 2, -lowerArmDims.h / 4, 0);
    rightLowerArm.add(wheel2);

    const wheel3 = this.#createWheel("wheel3");
    wheel3.position.set(-(lowerLegDims.w / 2 + wheelDims.thickness / 2), 0, 0);
    leftLowerLeg.add(wheel3);

    const wheel4 = this.#createWheel("wheel4");
    wheel4.position.set(lowerLegDims.w / 2 + wheelDims.thickness / 2, 0, 0);
    rightLowerLeg.add(wheel4);

    self.add(torso);

    // ---------- EXPOSING TO THE USER OF CLASS ----------
    this.#height = height;

    this.#neckUp = {
      radar: radar,
      head: head,
      neck: neck,
      leftHeadLight: leftHeadLight,
      rightHeadLight: rightHeadLight
    }
    this.#leftHeadLightHelper = leftHeadLightHelper;
    this.#rightHeadLightHelper = rightHeadLightHelper;

    this.#leftArm = {
      exhaust: leftExhaust,
      shoulder: leftShoulder,
      elbow: leftElbow,
      wheel: wheel1,
      fingers: leftArmFingers
    }

    this.#rightArm = {
      exhaust: rightExhaust,
      shoulder: rightShoulder,
      elbow: rightElbow,
      wheel: wheel2,
      fingers: rightArmFingers
    }

    this.#torso = torso;

    this.#leftLeg = {
      hip: leftHip,
      knee: leftKnee,
      wheel: wheel3,
    }

    this.#rightLeg = {
      hip: rightHip,
      knee: rightKnee,
      wheel: wheel4,
    }

    this.#self = self;
  }


  // ##############################################################################
  //                              ANIMATION FUNCTIONS
  // ##############################################################################

  /** Main purpose is to sync up external changes made to the class' `animations` object. */
  update() {
    const anim = this.animations;

    if (this.#state === 'standing') {
      this.#neckUp.head.rotation.y = anim.headRotY;
      this.#neckUp.neck.rotation.y = anim.neckRotY;

      this.#leftArm.shoulder.rotation.x = anim.leftShoulderRot.x;
      this.#leftArm.shoulder.rotation.z = -anim.leftShoulderRot.z; // Rot mirrored
      this.#leftArm.elbow.rotation.x = anim.leftElbowRot.x;
      this.#leftArm.elbow.rotation.y = anim.leftElbowRot.y;
      this.#leftArm.elbow.rotation.z = -anim.leftElbowRot.z; // Rot mirrored
      this.#leftArm.fingers.left.rotation.z = anim.leftFingersRotZ;
      this.#leftArm.fingers.right.rotation.z = -anim.leftFingersRotZ; // Rot mirrored on itself.

      this.#rightArm.shoulder.rotation.x = anim.rightShoulderRot.x;
      this.#rightArm.shoulder.rotation.z = anim.rightShoulderRot.z;
      this.#rightArm.elbow.rotation.x = anim.rightElbowRot.x;
      this.#rightArm.elbow.rotation.y = anim.rightElbowRot.y;
      this.#rightArm.elbow.rotation.z = anim.rightElbowRot.z;
      this.#rightArm.fingers.left.rotation.z = anim.rightFingersRotZ;
      this.#rightArm.fingers.right.rotation.z = -anim.rightFingersRotZ; // Rot mirrored on itself.

      this.#leftLeg.hip.rotation.x = anim.leftHipRot.x;
      this.#leftLeg.hip.rotation.z = -anim.leftHipRot.z; // Rot mirrored
      this.#leftLeg.knee.rotation.x = anim.leftKneeRot.x;
      this.#leftLeg.knee.rotation.z = -anim.leftKneeRot.z; // Rot mirrored

      this.#rightLeg.hip.rotation.x = anim.rightHipRot.x;
      this.#rightLeg.hip.rotation.z = anim.rightHipRot.z;
      this.#rightLeg.knee.rotation.x = anim.rightKneeRot.x;
      this.#rightLeg.knee.rotation.z = anim.rightKneeRot.z;
    }
  }

  /**
   * @param {number} amount
   * @returns {number} current rotation value
   */
  radarRotateY(amount) {
    const radar = this.#neckUp.radar;
    radar.rotateY(amount);

    return radar.rotation.y;
  }

  /**
   * @param {number} amount
   * @returns {number} current rotation value
   */
  headRotateY(amount) {
    const rotation = this.#neckUp.head.rotation;
    if (this.#state !== 'standing') return rotation.y; // If not correct state, dont do anything

    const params = this.animationParameters.headRotY;

    rotation.y = clamp(rotation.y + amount, params.min, params.max);

    this.animations.headRotY = rotation.y; // To sync it with outside

    return rotation.y;
  }

  /**
   * @param {number} amount
   * @returns {number} current rotation value
   */
  neckRotateY(amount) {
    const rotation = this.#neckUp.neck.rotation;
    if (this.#state !== 'standing') return rotation.y; // If not correct state, dont do anything

    const params = this.animationParameters.neckRotY;

    rotation.y = clamp(rotation.y + amount, params.min, params.max);

    this.animations.neckRotY = rotation.y; // To sync it with outside

    return rotation.y;
  }

  /**@param {number} pos */
  neckSetPositionY(pos) {
    this.#neckUp.neck.position.setY(pos);
  }


  /**
   * @param {number} amount
   * @returns {number} current rotation value
   */
  leftShoulderRotateX(amount) {
    const rotation = this.#leftArm.shoulder.rotation;
    if (this.#state !== 'standing') return rotation.x;

    const params = this.animationParameters.shoulderRotX;

    rotation.x = clamp(rotation.x + amount, params.min, params.max)

    this.animations.leftShoulderRot.x = rotation.x; // To sync it with outside

    return rotation.x
  }

  /**
   * @param {number} amount
   * @returns {number} current rotation value
   */
  leftElbowRotateX(amount) {
    const rotation = this.#leftArm.elbow.rotation;
    if (this.#state !== 'standing') return rotation.x;

    const params = this.animationParameters.elbowRotX;

    rotation.x = clamp(rotation.x + amount, params.min, params.max)

    this.animations.leftElbowRot.x = rotation.x; // To sync it with outside

    return rotation.x;
  }

  /**
   * @param {[number, number, number]} amounts
   */
  leftElbowRotate(amounts) {
    if (this.#state !== 'standing' && (this.#state !== 'driving' && amounts[0] !== 0 && amounts[2] !== 0)) return;
    const [x, y, z] = amounts;

    const rotation = this.#leftArm.elbow.rotation;

    if (x !== 0) {
      const paramsX = this.animationParameters.elbowRotX;
      rotation.x = clamp(rotation.x + x, paramsX.min, paramsX.max);

      this.animations.leftElbowRot.x = rotation.x; // To sync it with outside
    }
    if (y !== 0) {
      const paramsY = this.animationParameters.elbowRotY;
      rotation.x = clamp(rotation.y + y, paramsY.min, paramsY.max);

      this.animations.leftElbowRot.y = rotation.y; // To sync it with outside
    }
    if (z !== 0) {
      const paramsZ = this.animationParameters.elbowRotZ;
      rotation.x = clamp(rotation.z + z, paramsZ.min, paramsZ.max);

      this.animations.leftElbowRot.z = rotation.z; // To sync it with outside
    }
  }

  /**
   * @param {number} amount
   * @returns {number} current rotation value of one of the fingers. Other one is the same, but opposite sign
   */
  leftArmFingersRotateZ(amount) {
    const fingers = this.#leftArm.fingers;
    const leftRot = fingers.left.rotation;
    const rightRot = fingers.right.rotation;

    if (this.#state !== 'standing') return leftRot.z;

    const params = this.animationParameters.fingersRotZ;

    const rotValue = clamp(leftRot.z + amount, params.min, params.max);
    rightRot.z = -rotValue;
    leftRot.z = rotValue;

    this.animations.leftFingersRotZ = rotValue;

    return rotValue;
  }

  /**
   * @param {number} amount
   * @returns {number} current rotation value
   */
  rightShoulderRotateX(amount) {
    const rotation = this.#rightArm.shoulder.rotation;
    if (this.#state !== 'standing') return rotation.x;

    const params = this.animationParameters.shoulderRotX;

    rotation.x = clamp(rotation.x + amount, params.min, params.max)

    this.animations.rightShoulderRot.x = rotation.x; // To sync it with outside

    return rotation.x
  }

  /**
   * @param {number} amount
   * @returns {number} current rotation value
   */
  rightElbowRotateX(amount) {
    const rotation = this.#rightArm.elbow.rotation;
    if (this.#state !== 'standing') return rotation.x;

    const params = this.animationParameters.elbowRotX;

    rotation.x = clamp(rotation.x + amount, params.min, params.max)

    this.animations.rightElbowRot.x = rotation.x; // To sync it with outside

    return rotation.x
  }

  /**
   * @param {number} amount
   * @returns {number} current rotation value of one of the fingers. Other one is the same, but opposite sign
   */
  rightArmFingersRotateZ(amount) {
    const fingers = this.#rightArm.fingers;
    const leftRot = fingers.left.rotation;
    const rightRot = fingers.right.rotation;

    if (this.#state !== 'standing') return leftRot.z;

    const params = this.animationParameters.fingersRotZ;

    const rotValue = clamp(leftRot.z + amount, params.min, params.max);
    rightRot.z = -rotValue;
    leftRot.z = rotValue;

    this.animations.rightFingersRotZ = rotValue; // To sync it with outside

    return rotValue;
  }

  /**@param {number} amount */
  rotateWheels(amount) {
    if (this.#state !== 'driving') return;

    this.#leftArm.wheel.rotateZ(amount);
    this.#rightArm.wheel.rotateZ(amount);
    this.#leftLeg.wheel.rotateZ(amount);
    this.#rightLeg.wheel.rotateZ(amount);
  }

  // ---------- FUNCTIONS ON SELF

  /** @param {number} amount */
  translateY(amount) {
    this.#self.translateY(amount);
  }

  /**@returns ('standing' | 'transitioning' | 'driving') state */
  getState() {
    return this.#state;
  }

  getSelf() {
    return this.#self;
  }

  log() {
    const v = () => new THREE.Vector3();

    const leftHeadLight = getOrThrow(this.#neckUp.head.getObjectByName("leftHeadLight"));
    if (!(leftHeadLight instanceof THREE.SpotLight)) return;

    console.table({
      headLocal: this.#neckUp.head.position.toArray(),
      headWorld: this.#neckUp.head.getWorldPosition(v()).toArray(),
      leftLightLocal: leftHeadLight.position.toArray(),
      leftLightWorld: leftHeadLight.getWorldPosition(v()).toArray(),
      leftTargetLocal: leftHeadLight.target.position.toArray(),
      leftTargetWorld: leftHeadLight.target.getWorldPosition(v()).toArray(),

    });
  }

  // ##############################################################################
  //                              PRIVATE FUNCTIONS
  // ##############################################################################

  /**
   * @param {number[]} xyz
   * @returns {[number, number, number]} xyz
   */
  #getXYZorThrow(xyz) {
    const [x, y, z] = [xyz[0], xyz[1], xyz[2]];
    if (x === undefined || y === undefined || z === undefined) throw Error("X, Y, or Z is undefined.");
    return [x, y, z];
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
    const discGeometry = new THREE.LatheGeometry(discPoints, 40);
    const circleGeometry = new THREE.SphereGeometry(sphereDims.radius, 20, 20);

    const lowerPoleMesh = new THREE.Mesh(poleGeometry, radarBaseMaterial);
    const upperPoleMesh = lowerPoleMesh.clone();
    const discMesh = new THREE.Mesh(discGeometry, radarBaseMaterial);
    const circleMesh = new THREE.Mesh(circleGeometry, radarCircleMaterial);

    const upperPoleYScaleFactor = 1.1;
    const upperPoleYOffset = poleDims.height / 2 * upperPoleYScaleFactor;

    upperPoleMesh.scale.y = upperPoleYScaleFactor;
    upperPoleMesh.scale.x = 0.4;
    upperPoleMesh.scale.z = 0.4;

    discMesh.rotateZ(Math.PI / 10);

    discMesh.position.setY(poleDims.height / 2);
    upperPoleMesh.position.setY(upperPoleYOffset + discDims.thickness / 2);
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
   * @returns {{
   *  head:THREE.Mesh,
   *  leftHeadLight: THREE.SpotLight,
   *  rightHeadLight: THREE.SpotLight,
   * }} head
  */
  #createHead(subName) {
    const headDims = this.dimentions.head;
    const name = this.#name + "_" + subName;

    const headMainMaterial = this.#basicMetallicStandardMaterial.clone();
    const headGlassMaterial = new THREE.MeshLambertMaterial({
      color: 0x0000ff,
      opacity: 0.2,
      transparent: true,
      depthTest: false,
    })
    headMainMaterial.side = THREE.DoubleSide;

    const head = this.#boxGeometryTemplate(name, headDims, [
      headMainMaterial, headMainMaterial, headMainMaterial,
      headMainMaterial, headGlassMaterial, headMainMaterial
    ])

    const leftHeadLight = basicSpotLight({
      position: [headDims.w / 2, headDims.h / 2, headDims.d / 2],
      lookAt: [headDims.w / 2, headDims.h / 2, 100],
      intensity: 5000,
    });
    leftHeadLight.name = "leftHeadLight";
    head.add(leftHeadLight);
    head.add(leftHeadLight.target);

    const rightHeadLight = basicSpotLight({
      position: [-headDims.w / 2, headDims.h / 2, headDims.d / 2],
      lookAt: [-headDims.w / 2, headDims.h / 2, 100],
      intensity: 5000,
    });
    rightHeadLight.name = "rightHeadLight";
    head.add(rightHeadLight);
    head.add(rightHeadLight.target);

    return {head, leftHeadLight: leftHeadLight, rightHeadLight: rightHeadLight};
  }

  /**
   * @param {'leftArm' | 'rightArm'} subName
   * @returns {{
   *  shoulder: THREE.Group;
   *  elbow: THREE.Group;
   *  lowerArm: THREE.Mesh;
   *  exhaust: THREE.Mesh;
   *  fingers: { left: THREE.Mesh; right: THREE.Mesh }
   * }}
   */
  #createArm(subName) {
    const upperDims = this.dimentions.upperArms;
    const lowerDims = this.dimentions.lowerArms;
    const fingerDims = this.dimentions.fingers;
    const exhaustDims = this.dimentions.exhausts;
    const name = this.#name + "_" + subName;

    /**@type {number} */
    let sign;
    subName === 'leftArm' ? sign = -1 : sign = 1;

    const basicMaterial = this.#basicMetallicStandardMaterial.clone();
    basicMaterial.side = THREE.DoubleSide;
    basicMaterial.color = this.#metalColor.clone().add(new THREE.Color(0x804000));

    // ---------- SHOULDER
    const shoulder = new THREE.Group();
    shoulder.name = name;

    // ---------- UPPER-ARM
    const customMaterial = new THREE.ShaderMaterial({
      fragmentShader: this.#upperArmFrag,
      vertexShader: this.#upperArmVert,
      glslVersion: THREE.GLSL3,
      transparent: true,
      depthTest: true,
      uniforms: {
        uColor: { value: new THREE.Color(this.#metalColor) },
        alphaMapSampler: new THREE.Uniform(this.#upperArmAlphaMap),
        mainTextureSampler: new THREE.Uniform(this.#metalnessTexture),
      },
    })
    const upperArm = this.#boxGeometryTemplate(name + "_upper", upperDims, [
      basicMaterial, basicMaterial, basicMaterial,
      basicMaterial, customMaterial, basicMaterial,
    ])
    upperArm.position.x = sign * upperDims.w / 2;
    upperArm.position.y = -upperDims.h / 2;

    shoulder.add(upperArm);

    // ---------- EXHAUST
    const exhaustMaterial = new THREE.MeshStandardMaterial({
      color: this.#metalColor.clone().sub(new THREE.Color(0x808080)),
      metalnessMap: this.#metalnessTexture,
      metalness: 1.0,
      roughness: 0.1,
      side: THREE.DoubleSide
    });
    const exhaustGeometry = new THREE.CylinderGeometry(
      exhaustDims.radius * 0.9,
      exhaustDims.radius,
      exhaustDims.height,
      48, 1,
      true
    );

    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.name = subName + "_exhaust";
    exhaust.position.y = upperDims.h / 2 + exhaustDims.height / 2;

    upperArm.add(exhaust);

    // ---------- ELBOW
    const elbow = new THREE.Group();
    elbow.name = subName + "_elbow";
    elbow.position.x = sign * upperDims.w / 2;
    elbow.position.y = -upperDims.h / 2;

    // elbow.rotation.z = sign * Math.PI / 8;

    upperArm.add(elbow);

    // ---------- LOWER-ARM
    const lowerArm = this.#boxGeometryTemplate(name + "_lower", lowerDims, basicMaterial);
    lowerArm.position.x = -sign * lowerDims.w / 2;
    lowerArm.position.y = -lowerDims.h / 2;

    elbow.add(lowerArm);

    // ---------- FINGERS
    const leftFinger = this.#boxGeometryTemplate(name + "_leftFinger", fingerDims, basicMaterial);
    const rightFinger = this.#boxGeometryTemplate(name + "_rightFinger", fingerDims, basicMaterial);

    leftFinger.position.y = -lowerDims.h / 2;
    leftFinger.position.x = -lowerDims.w / 4;
    // leftFinger.rotation.z = -sign * Math.PI / 8;
    rightFinger.position.y = -lowerDims.h / 2;
    rightFinger.position.x = lowerDims.w / 4;
    // rightFinger.rotation.z = sign * Math.PI / 8;

    lowerArm.add(leftFinger);
    lowerArm.add(rightFinger);

    return {
      shoulder,
      elbow,
      lowerArm,
      fingers: { left: leftFinger, right: rightFinger },
      exhaust,
    };
  }

  /**
   * @param {'leftLeg' | 'rightLeg'} subName
   * @returns {{hip: THREE.Group, knee: THREE.Group, lowerLeg: THREE.Mesh}}
   */
  #createLeg(subName) {
    const thighDims = this.dimentions.upperLegs;
    const legDims = this.dimentions.lowerLegs;
    const feetDims = this.dimentions.feet;
    const name = this.#name = subName;

    const basicMaterial = this.#basicMetallicStandardMaterial;

    // ---------- HIP
    const hip = new THREE.Group();
    hip.name = name;

    // hip.rotation.x = Math.PI / 4;

    // ---------- THIGH
    const thigh = this.#boxGeometryTemplate(name + "_thigh", thighDims, basicMaterial);
    thigh.position.y = -thighDims.h / 2;
    thigh.position.z = -thighDims.d / 2;

    hip.add(thigh);

    // ---------- KNEE
    const knee = new THREE.Group();
    knee.name = name + "_knee";
    knee.position.y = -thighDims.h / 2;
    knee.position.z = -thighDims.d / 2;

    // knee.rotation.x = Math.PI / 6;

    thigh.add(knee);

    // ---------- LEG
    const leg = this.#boxGeometryTemplate(name + "_leg", legDims, basicMaterial);
    leg.position.y = -legDims.h / 2;
    leg.position.z = thighDims.d / 2;

    knee.add(leg);

    // ---------- FOOT
    const foot = this.#boxGeometryTemplate(name + "_foot", feetDims, basicMaterial);
    foot.position.y = -(legDims.h + feetDims.h) / 2;
    foot.position.z = (Math.abs(feetDims.d - legDims.d) / 2)

    leg.add(foot);

    return {
      hip: hip,
      knee: knee,
      lowerLeg: leg,
    };
  }

  // ---------- HELPER FOR THE HELPERS LOL ----------

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
