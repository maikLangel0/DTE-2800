import * as THREE from "three";
import { clamp } from "../lib/utility-functions";

export class SpriteBook {
  /**@type {THREE.Texture} */
  #spriteMap;

  #currIndex = 0;
  #totalIndices = 0;
  
  #width = 0;
  #height = 0;

  #offsetX = 0;
  #offsetY = 0;

  #loopTimer = 0;
  #loopInterval = 1000;
  #iterationPerLoopInterval = 0;

  #reversed = false;

  /**@type {number[]} */
  #allIndices = [];

  /**
   * @param {THREE.Texture} spriteMap
   * @param {string} spriteName
   * @param {number} heightCount
   * @param {number} widthCount
   */
  constructor(spriteMap, spriteName, heightCount, widthCount) {
    this.#height = heightCount;
    this.#width = widthCount;

    for (let i = 0; i < widthCount * heightCount; i++) {
      this.#allIndices.push(i)
    };
    this.#totalIndices = this.#allIndices.length;

    this.setLoopInterval(this.#loopInterval);

    this.#calculateOffsets();
    spriteMap.repeat.set(1 / widthCount, 1 / heightCount);
    spriteMap.magFilter = THREE.NearestFilter;
    spriteMap.offset.x = this.#offsetX;
    spriteMap.offset.y = this.#offsetY;
    this.#spriteMap = spriteMap;

    const spriteMat = new THREE.SpriteMaterial({ map: spriteMap });
    
    /**@type {THREE.Sprite} */
    this.sprite = new THREE.Sprite(spriteMat); // public
    this.sprite.name = spriteName;
  }


  // ---------- SET N GET ----------
  getSprite() {
    return this.sprite;
  }

  reverseIteration() {
    this.#reversed = true;
    this.#currIndex = this.#totalIndices - 1;
  }

  /** @param {number} timeInMs */
  setLoopInterval(timeInMs) {
    this.#loopInterval = timeInMs;
    this.#iterationPerLoopInterval = timeInMs / this.#totalIndices;
  }

  /** @param {number} tileIdx */
  setCurrentTile(tileIdx) {
    const idx = clamp(tileIdx, 0, this.#totalIndices - 1);
    this.#currIndex = idx;
  }
  
  /** @param {number[] | number} indices */
  excludeIndices(indices) {
    if (typeof indices === 'number') {
      this.#allIndices = this.#allIndices.filter((v) => v !== indices);
    } else {
      indices.forEach((index) => {
        this.#allIndices = this.#allIndices.filter((v) => v !== index);
      })
    }
    this.#totalIndices = this.#allIndices.length;

    this.setLoopInterval(this.#loopInterval); // Re-calc
  }

  // ---------- LOOP N UPDATE ----------
  /**
   * @param {number} dt 
   */
  loop(dt) {
    this.#loopTimer += dt * 1000;

    if (this.#loopTimer >= this.#iterationPerLoopInterval) {
      this.#loopTimer = 0;

      if (this.#reversed) {
        this.#currIndex = (this.#currIndex - 1) < 0 ? (this.#totalIndices - 1) : (this.#currIndex - 1);
      } else {
        this.#currIndex = (this.#currIndex + 1) % (this.#totalIndices - 1);
      }
      this.#calculateOffsets();
      this.#spriteMap.offset.x = this.#offsetX;
      this.#spriteMap.offset.y = this.#offsetY;
    }
  }

  // ---------- LOG ----------
  log() {
    console.table({
      currIndex: this.#currIndex,
      totalIndices: this.#totalIndices,
      offsetX: this.#offsetX,
      offsetY: this.#offsetY,
      loopTimer: this.#loopTimer,
      loopInterval: this.#loopInterval,
      iterPerLoopInterval: this.#iterationPerLoopInterval
    })
    console.log(`All indices: ${this.#allIndices}`)
  }
  
  // ---------- PRIVATE ----------

  #calculateOffsets() {
    const actualIndex = this.#allIndices[this.#currIndex];
    if (actualIndex === undefined) throw Error("HOW");
    
    this.#offsetX = (actualIndex % this.#width) / this.#width;
    this.#offsetY = (this.#height - Math.floor(actualIndex / this.#width) - 1) / this.#height;
  }
}
