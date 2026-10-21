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
  const grassCustomMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
    glslVersion: THREE.GLSL3,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const ground = new THREE.Mesh(groundGeometry, grassCustomMaterial);
  ground.name = "ground";
  ground.rotateX(-Math.PI / 2);
  ground.scale.set(groundSize, groundSize, 1);
  ground.receiveShadow = true;

  const shadowMaterial = new THREE.ShadowMaterial({
    opacity: 1.0,
  });

  const groundShadow = new THREE.Mesh(groundGeometry, shadowMaterial);
  groundShadow.name = "groundShadow";
  groundShadow.translateY(0.05);
  groundShadow.rotateX(-Math.PI / 2);
  groundShadow.scale.set(groundSize, groundSize, 1);
  groundShadow.receiveShadow = true;

  return [ground, groundShadow];
}
