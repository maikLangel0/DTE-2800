import * as THREE from "three";
import { Tween } from "three/examples/jsm/libs/tween.module.js";

const BASE_WIDTH = 5;
const BASE_DEPTH = 3;

/**
 * @typedef {{w: number; h: number; d: number}} Dimention
 */

export class Transformer {

  /**@type {('tenToes' | 'inMotion' | 'vroom')} */
  #state = 'tenToes';
  /**@type {string} */
  #name = "MichaelAfton";

  /**@type {THREE.Texture | null} */
  #fallbackTexture;

  /**@type {THREE.Texture | null} */
  #wheelRimTexture = null;
  /**@type {THREE.Texture | null} */
  #wheelSideTexture = null;
  /**@type {THREE.Texture | null} */
  #chestTexture = null;
  
  #dimentions = {
    /**@type {Dimention} */
    head: { w: BASE_WIDTH, h: 2, d: BASE_DEPTH / 3 },
    /**@type {Dimention} */
    neck: { w: 0.5, h: 0.5, d: 0.5 },

    /**@type {Dimention} */
    torso: { w: BASE_WIDTH, h: 6, d: BASE_DEPTH / 3},
    /**@type {Dimention} */
    upperArms: { w: 0.6, h: 3.5, d: 0.6 },
    /**@type {Dimention} */
    lowerArms: { w: 0.5, h: 3.5, d: 0.5 },
    /**@type {Dimention} */
    upperLegs: { w: 0.7, h: 8, d: 0.5 },
    /**@type {Dimention} */
    lowerLegs: { w: 0.5, h: 0.5, d: 0.5 },
    /**@type {Dimention} */
    feet: { w: 0.5, h: 0.5, d: 0.5 },

  }
  
  /**
   * @param {Object} options
   * @param {THREE.Texture | null} options.fallbackTexture
   * @param {THREE.Texture | null} options.wheelRimTexture
   * @param {THREE.Texture | null} options.wheelSideTexture
   * @param {THREE.Texture | null} options.chestTexture
   */
  constructor({
    fallbackTexture = null,
    wheelRimTexture = null,
    wheelSideTexture = null,
    chestTexture = null,

  }) {
    this.#fallbackTexture = fallbackTexture;
    this.#wheelRimTexture = wheelRimTexture ? wheelRimTexture : fallbackTexture;
    this.#wheelSideTexture = wheelSideTexture ? wheelSideTexture : fallbackTexture;
    this.#chestTexture = chestTexture ? chestTexture : fallbackTexture;
  }

  /**
   * 
   * @returns {THREE.Group} wheel
   */
  createWheel() {
    const wheelCylinderHeight = 3;
    
    const wheel = new THREE.Group();
    wheel.name = "wheel1";
    
    const rimGeometry = new THREE.CylinderGeometry(5, 5, wheelCylinderHeight, 20, 20, true);
    const rimMaterial = new THREE.MeshStandardMaterial({ map: this.#wheelRimTexture });
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.name = "wheel1Rim";
    rimMesh.castShadow = true;
    rimMesh.rotateX(Math.PI / 2);
  
    const sideFaceGeometry = new THREE.CircleGeometry(5, 20);
    const sideFaceMaterial = new THREE.MeshStandardMaterial({ map: this.#wheelSideTexture });
  
    const sideFaceFrontMesh = new THREE.Mesh(sideFaceGeometry, sideFaceMaterial);
    sideFaceFrontMesh.name = "wheel1FrontFace";
    sideFaceFrontMesh.castShadow = true;
    sideFaceFrontMesh.translateZ(wheelCylinderHeight / 2);
  
    const sideFaceBackMesh = new THREE.Mesh(sideFaceGeometry, sideFaceMaterial);
    sideFaceBackMesh.name = "wheel1BackFace";
    sideFaceBackMesh.castShadow = true;
    sideFaceBackMesh.translateZ(-wheelCylinderHeight / 2);
    sideFaceBackMesh.rotateY(Math.PI)
    
    wheel.add(rimMesh);
    wheel.add(sideFaceFrontMesh);
    wheel.add(sideFaceBackMesh);

    return wheel;
  }
}
