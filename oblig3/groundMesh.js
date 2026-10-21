import * as THREE from "three";
import { createSquareGeometry } from "../base/threeHelpers/geometryFunctions";

/**
 * @param {Object} options
 * @param {string} options.fragmentShader,
 * @param {Record<string, THREE.IUniform<any>>} options.uniforms,
 * @param {string} options.vertexShader,
 * @param {number} options.groundSize,
 * @returns {Promise<[THREE.Mesh<THREE.BufferGeometry>, THREE.Mesh<THREE.BufferGeometry>]>}
*/
export const createCustomGround = async ({
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

  return [ground, lightOverlay];
}
