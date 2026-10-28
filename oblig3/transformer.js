import * as THREE from "three";
import { Tween } from "three/examples/jsm/libs/tween.module.js";
import { getOrThrow } from "../base/lib/utility-functions";

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
      lowerLegs: { w: BASE_DEPTH * 0.6, h: 5, d: BASE_DEPTH * 0.9 },
      feet: { w: BASE_DEPTH * 0.9, h: 0.5, d: BASE_DEPTH * 1.5 },
      fingers: { w: BASE_WIDTH * 0.1, h: 2, d: BASE_WIDTH * 0.1 },

      wheel: { radius: BASE_DEPTH, thickness: 1 },
      radarSphere: { radius: BASE_DEPTH / 10 },
      radarDisc: { radius: BASE_DEPTH * 0.8, thickness: 0.2 },
      radarPole: { radius: BASE_DEPTH / 12, height: BASE_DEPTH / 3 },
      exhausts: { radius: BASE_DEPTH * 0.23, height: 1.7 }
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
    // torso.add(wheel1);

    const wheel2 = this.#createWheel("wheel2");
    wheel2.position.set(-torsoDims.w / 2 - wheelDims.thickness / 2, 0, 0);
    // torso.add(wheel2);

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

    // ---------- LEFT ARM
    const {
      shoulder: leftShoulder,
      elbow: leftElbow,
      exhaust: leftExhaust,
      fingers: leftArmFingers,
    } = this.#createArm('leftArm');

    leftShoulder.position.set(-torsoDims.w / 2, torsoDims.h / 2, 0);
    torso.add(leftShoulder);

    // ---------- RIGHT ARM
    const {
      shoulder: rightShoulder,
      elbow: rightElbow,
      exhaust: rightExhaust,
      fingers: rightArmFingers,
    } = this.#createArm('rightArm');

    rightShoulder.position.set(torsoDims.w / 2, torsoDims.h / 2, 0);
    torso.add(rightShoulder);

    // ---------- LEFT LEG
    const thighDims = dims.upperLegs;
    const legToTorsoXOffset = (torsoDims.w - thighDims.w) / 2;
    
    const {
      hip: leftHip,
      knee: leftKnee
    } = this.#createLeg('leftLeg');
    
    leftHip.position.set(-legToTorsoXOffset , -torsoDims.h / 2, 0);
    torso.add(leftHip);

    // ---------- RIGHT LEG
    const {
      hip: rightHip,
      knee: rightKnee
    } = this.#createLeg('rightLeg');

    rightHip.position.set(legToTorsoXOffset, -torsoDims.h / 2, 0);
    torso.add(rightHip);
    
    // ---------- SETTING EVERYTHING IN A GROUP ----------
    const self = new THREE.Group();
    self.name = this.#name;

    self.add(torso);

    this.height = torsoDims.h / 2
      + thighDims.h
      + this.dimentions.lowerLegs.h
      + this.dimentions.feet.h;
    
    self.position.y = this.height;
    
    /**@type {THREE.Mesh} */
    this.torso = torso;

    /**@type {THREE.Group} */
    this.rightShoulder = rightShoulder;
    /**@type {THREE.Group} */
    this.rightElbow = rightElbow;
    /**@type {{left: THREE.Mesh, right: THREE.Mesh}} */
    this.rightArmFingers = rightArmFingers; 

    /**@type {THREE.Group} */
    this.leftShoulder = leftShoulder;
    /**@type {THREE.Group} */
    this.leftElbow = leftElbow;
    /**@type {{left: THREE.Mesh, right: THREE.Mesh}} */
    this.leftArmFingers = leftArmFingers;
    
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
   * @param {'leftArm' | 'rightArm'} subName
   * @returns {{
   *  shoulder: THREE.Group;
   *  elbow: THREE.Group;
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

    // shoulder.rotation.z =  sign * Math.PI / 8;

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
      fingers: { left: leftFinger, right: rightFinger },
      exhaust,
    };
  }

  /**
   * @param {'leftLeg' | 'rightLeg'} subName 
   * @returns {{hip: THREE.Group, knee: THREE.Group}}  
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
