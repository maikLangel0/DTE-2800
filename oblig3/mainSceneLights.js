import * as THREE from "three";
import { basicDirectionalLight } from "../base/threeHelpers/helpers";

/**@returns {{mainPointLight: THREE.PointLight, mainAmbientLight: THREE.AmbientLight, mainDirectionalLight: THREE.DirectionalLight}} */
export const createMainSceneLights = () => {
  const mainDirectionalLight = basicDirectionalLight({
    color: 0xffffff,
    intensity: 1,
    position: [80, 80, 80],
    lookAt: [0, 0, 0],
    shadowMapSize: 2048,
    shadowCameraBounds: 60,
  });
  mainDirectionalLight.name = "mainDirectionalLight";

  const mainAmbientLight = new THREE.AmbientLight(0xafafaf, 1);
  mainAmbientLight.name = "ambientLight";

  const mainPointLight = new THREE.PointLight(0xffffff, 1, 0, 1.7);
  mainPointLight.name = "pointLight";
  mainPointLight.translateY(10);

  return { mainPointLight, mainAmbientLight, mainDirectionalLight };
}
