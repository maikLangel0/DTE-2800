import GUI, { Controller } from "lil-gui";
import * as THREE from "three";

/**@type {Record<number, THREE.Side>} */
export const sideMap = {
  0: THREE.FrontSide,
  1: THREE.BackSide,
  2: THREE.DoubleSide
}

/**
 * @param {number} angle
 */
export const degreeToRad = (angle) => {
  return THREE.MathUtils.degToRad(angle);
}

/**
 *
 * @param {GUI} gui
 * @param {string} name
 * @returns {Controller}
 */
export const lilGuiControllerByName = (gui, name) => {
  const controller = gui.controllers.find((cont) => { return cont._name === name });

  if (controller === undefined) throw Error("No controller of name: " + name);
  return controller;
}

/**
 * @param {Object} [options]
 * @param {number} [options.color]
 * @param {number} [options.intensity]
 * @param {number[]} [options.position]
 * @param {number[]} [options.lookAt]
 * @param {number} [options.shadowMapSize]
 * @param {number} [options.near]
 * @param {number} [options.far]
 * @param {number} [options.shadowCameraBounds]
 * @requires {THREE.DirectionalLight}
 */
export const basicDirectionalLight = ({
  color = 0x808080,
  intensity = 5,
  position = [0, 0, 0],
  lookAt = [0, 0, 0],
  shadowMapSize = 2048,
  near = 0.1,
  far = 250,
  shadowCameraBounds = 100
} = {}) => {
  const [posx, posy, posz] = [position[0], position[1], position[2]];
  const [camx, camy, camz] = [lookAt[0], lookAt[1], lookAt[2]];

  if (posx === undefined || posy === undefined || camx === undefined || camy === undefined || camz === undefined)
    throw Error("`lookAt` or `position` is invalid.");

  const directionalLight = new THREE.DirectionalLight(color, intensity);

  directionalLight.position.set(posx, posy, posz);
  directionalLight.target.position.set(camx, camy, camz);
  directionalLight.castShadow = true;

  directionalLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  directionalLight.shadow.bias = -0.0001;
  directionalLight.shadow.normalBias = 0.02;

  const shadowCamera = directionalLight.shadow.camera;
  shadowCamera.near = near;
  shadowCamera.far = far;
  shadowCamera.left = -shadowCameraBounds;
  shadowCamera.right = shadowCameraBounds;
  shadowCamera.top = shadowCameraBounds;
  shadowCamera.bottom = -shadowCameraBounds;

  return directionalLight;
}

/**
 * @param {Object} [options]
 * @param {number} [options.color]
 * @param {number} [options.intensity]
 * @param {number} [options.distance]
 * @param {number} [options.angle]
 * @param {number} [options.penumbra]
 * @param {number} [options.decay]
 * @param {number[]} [options.position]
 * @param {number[]} [options.lookAt]
 * @param {number} [options.shadowMapSize]
 * @param {number} [options.near]
 * @param {number} [options.far]
 * @returns {THREE.SpotLight}
 */
export const basicSpotLight = ({
  color = 0xffffff,
  intensity = 1,
  distance = 0,
  angle = Math.PI / 3,
  penumbra = 0,
  decay = 2,
  position = [0, 0, 0],
  lookAt = [0, 0, 0],
  shadowMapSize = 2048,
  near = 0.1,
  far = 250,
} = {}) => {
  const [posx, posy, posz] = [position[0], position[1], position[2]];
  const [camx, camy, camz] = [lookAt[0], lookAt[1], lookAt[2]];

  if (posx === undefined || posy === undefined || camx === undefined || camy === undefined || camz === undefined)
    throw Error("`lookAt` or `position` is invalid.");

  const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);

  light.target.position.set(0, 0, 0);

  light.position.set(posx, posy, posz);
  light.target.position.set(camx, camy, camz);
  light.castShadow = true;

  light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  light.shadow.bias = -0.0001;
  light.shadow.normalBias = 0.02;

  const shadowCamera = light.shadow.camera;
  shadowCamera.near = near;
  shadowCamera.far = far;

  return light;
}
