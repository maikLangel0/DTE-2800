import * as THREE from "three";
import { createSquareGeometry } from "../base/threeHelpers/geometryFunctions";
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";
import { basicDirectionalLight } from "../base/threeHelpers/helpers";

/**
 * @param {Object} options
 * @param {string} options.fragmentShader,
 * @param {Record<string, THREE.IUniform<any>>} options.uniforms,
 * @param {string} options.vertexShader,
 * @param {number} options.groundSize,
 * @returns {{ground: THREE.Mesh<THREE.BufferGeometry>, lightOverlay: THREE.Mesh<THREE.BufferGeometry>}}
*/
export const createCustomGround = ({
  groundSize,
  vertexShader,
  fragmentShader,
  uniforms
}) => {
  const groundGeometry = createSquareGeometry();
  groundGeometry.scale(groundSize, groundSize, 1);

  const grassCustomMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
    glslVersion: THREE.GLSL3,
    transparent: true,
    side: THREE.FrontSide,
  });

  const ground = new THREE.Mesh(groundGeometry, grassCustomMaterial);
  ground.name = "ground";
  ground.rotateX(-Math.PI / 2);
  ground.receiveShadow = true;

  const lightOverlayMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    blending: THREE.MultiplyBlending,
    premultipliedAlpha: true,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    opacity: 0.5,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const lightOverlay = new THREE.Mesh(groundGeometry, lightOverlayMaterial);
  lightOverlay.name = "lightOverlay";
  lightOverlay.rotateX(-Math.PI / 2);
  lightOverlay.translateZ(0.067);
  lightOverlay.receiveShadow = true;
  lightOverlay.renderOrder = 1;

  return {ground, lightOverlay};
}


/**@returns {{mainPointLight: THREE.PointLight, mainAmbientLight: THREE.AmbientLight, mainDirectionalLight: THREE.DirectionalLight}} */
export const createMainSceneLights = () => {
  const mainDirectionalLight = basicDirectionalLight({
    color: 0xffffff,
    intensity: 1,
    position: [60, 80, 40],
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


/**
 * @param {BasicAppContext} ctx
 * @param {string} pathToTex
 * @returns {Promise<THREE.Texture<HTMLImageElement>>}
 */
export const loadTexSRGB = async (ctx, pathToTex) => {
  return await ctx.loadTexture(
    pathToTex,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    }
  )
}


export const createFallbackTexture = () => {
  const data = new Uint8Array([
    255, 0, 255, 255,     0, 0,   0, 255,
      0, 0,   0, 255,   255, 0, 255, 255,
  ]);
  const tex = new THREE.DataTexture(data, 2, 2, THREE.RGBAFormat);

  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;

  return tex;
}


/**
 * @param {string} pathToVideo
 */
export const loadVideoTexture = (pathToVideo) => {
  const video = document.createElement('video');
  video.id = 'howToVideo';
  video.src = pathToVideo;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.play();

  const tex = new THREE.VideoTexture(video);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  return {videoHandle: video, texture: tex};
}
