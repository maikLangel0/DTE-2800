// @ts-nocheck
// Nuclear approach to supress the "errors" in update()

import * as THREE from "three";

export class Particles {
  /**@type {number} */
  #particleCount;
  /**@type {number} */
  #lifetime;

  /**@type {{
   * initialVelocity: THREE.Vector3;
   * gravity: number;
   * spread: number;
  * }} */
  #settings;

  /**@type {Float32Array} */
  #positions;
  /**@type {Float32Array} */
  #colors;
  /**@type {Float32Array} */
  #velocities;
  /**@type {Float32Array} */
  #ages;

  constructor({
    particleCount = 200,
    initialVelocity = new THREE.Vector3(2, 0, 0),
    gravity = 10,
    spread = 0.5,
    lifetimeInMs = 2000,
  } = {}) {
    this.#particleCount = particleCount;
    this.#lifetime = lifetimeInMs;

    this.#settings = { initialVelocity, gravity, spread };

    this.#positions = new Float32Array(particleCount * 3);
    this.#colors = new Float32Array(particleCount * 4);
    this.#velocities = new Float32Array(particleCount * 3);
    this.#ages = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      this.#respawn(i);
      this.#ages[i] = Math.random() * lifetimeInMs;
    }

    /**@type {THREE.BufferGeometry} */
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.#positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.#colors, 4).setUsage(THREE.DynamicDrawUsage));
  }

  /** @param {number} index */
  #respawn(index) {
    const initialVelocity = this.#settings.initialVelocity;
    const spread = this.#settings.spread;

    const i3 = index * 3;
    const i4 = index * 4;
    const [ix, iy, iz] = [i3, i3 + 1, i3 + 2];
    const [ir, ig, ib, ia] = [i4, i4 + 1, i4 + 2, i4 + 3]; // as in rgba

    this.#positions[ix] = 0;
    this.#positions[iy] = 0;
    this.#positions[iz] = 0;

    this.#velocities[ix] = initialVelocity.x + (Math.random() - 0.5) * spread;
    this.#velocities[iy] = initialVelocity.y + (Math.random() - 0.5) * spread;
    this.#velocities[iz] = initialVelocity.z + (Math.random() - 0.5) * spread;

    this.#colors[ir] = 1;
    this.#colors[ig] = Math.random();
    this.#colors[ib] = 0;
    this.#colors[ia] = 1.0;

    this.#ages[index] = 0;
  }

  /** @param {number} deltaTime */
  update(deltaTime) {
    // Min dt of that in 60fps so no stutters in animation
    const dt = Math.min(deltaTime, 16.667 / 1000);

    const pos = this.#positions;
    const vel = this.#velocities;
    const gravity = this.#settings.gravity;
    const ages = this.#ages;

    for (let i = 0; i < this.#particleCount; i++) {
      ages[i] += dt * 1000;

      if (ages[i] > this.#lifetime) {
        this.#respawn(i);
        continue;
      }

      const i3 = i * 3;
      const i4 = i * 4;
      const [ix, iy, iz] = [i3, i3 + 1, i3 + 2];
      const ia = i4 + 3; // as in rgba

      vel[iy] -= gravity * dt;

      pos[ix] += vel[ix] * dt;
      pos[iy] += vel[iy] * dt;
      pos[iz] += vel[iz] * dt;

      const transparency = ages[i] / this.#lifetime;
      this.#colors[ia] = 1 - transparency * transparency;
    }

    if (this.geometry.attributes.position && this.geometry.attributes.color) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
    } else {
      throw Error("No position or color attribute wat");
    }
  }
}
