import * as THREE from "three";

/**
 * @param {number} angle
 */
export const degreeToRad = (angle) => {
  return THREE.MathUtils.degToRad(angle);
}

/**
 *
 * @param {THREE.Scene} scene
 * @param {string | number} identifier
 */
export const getFromSceneChecked = (scene, identifier) => {
  /**@type {THREE.Object3D | undefined} */
  let res = undefined;

  switch (typeof identifier) {
    case "string":
      res = scene.getObjectByName(identifier);
      break;
    case "number":
      res = scene.getObjectById(identifier);
      break;
    default:
      throw Error("Invalid type of identifier " + identifier + ".");
  }

  if (res === undefined) throw Error("Couldnt find object in scene with identifier " + identifier + ".")
  else return res
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
  position = [0, 100, 0],
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
  directionalLight.lookAt(camx, camy, camz);
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