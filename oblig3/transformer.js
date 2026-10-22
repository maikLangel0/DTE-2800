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
  
  #built = false;
  constructor() {
    
  }
}
