import * as THREE from "three";
import { BasicAppContext } from "../base/threeHelpers/basicAppContext.js";
import { loadTexSRGB, loadVideoTexture } from "./oblig3helpers";

/**
 * @param {BasicAppContext} ctx
 * @returns {Promise<THREE.Group>} JUST STRAIGHT BS
 */
export const addTmpExamples = async (ctx) => {

  const {
    videoHandle: _,
    texture: howToVideoTexture
  } = loadVideoTexture('../../base/videos/howTo.webm');

  const wheelRimTexture = await loadTexSRGB(ctx, '../../base/textures/tireRim.jpg');
  const sideFaceTexture = await loadTexSRGB(ctx, '../../base/textures/tireSideFace.png');
  const metalnessTexture = await loadTexSRGB(ctx, '../../base/textures/metalnessTexture500x500.jpg');
  const shatterAlphaMap = await ctx.loadTexture('../../base/textures/shatterAlphaMapInverted.png');
  shatterAlphaMap.colorSpace = THREE.NoColorSpace;

  // ---------- METAL CUBE
  const qb = ctx.geometries.get("basicCube");
  const qbMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f9f9f,
    metalness: 1.0,
    metalnessMap: metalnessTexture,
    alphaMap: shatterAlphaMap,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 1,
  })
  const qbVideoMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f9f9f,
    metalness: 1.0,
    metalnessMap: metalnessTexture,
    map: howToVideoTexture,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
  });
  const basicCube = new THREE.Mesh(qb, [
    qbVideoMaterial, qbMaterial, qbMaterial,
    qbMaterial,      qbMaterial, qbMaterial
  ]);
  basicCube.castShadow = true;
  basicCube.name = "basicCube";
  basicCube.translateY(10);

  // ---------- WHEEL
  const wheelCylinderHeight = 3;
  const wheel = new THREE.Group();
  wheel.name = "wheel1";

  const rimGeometry = new THREE.CylinderGeometry(5, 5, wheelCylinderHeight, 20, 20, true);
  const rimMaterial = new THREE.MeshStandardMaterial({ map: wheelRimTexture });
  const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
  rimMesh.name = "wheel1Rim";
  rimMesh.castShadow = true;
  rimMesh.rotateX(Math.PI / 2);

  const sideFaceGeometry = new THREE.CircleGeometry(5, 20);
  const sideFaceMaterial = new THREE.MeshStandardMaterial({ map: sideFaceTexture });

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
  wheel.position.set(-7.5, 5, -7.5);

  // ---------- EXTRUDE GEOMETRY EXAMPLE
  const extrudeLength = 2;
  const extrudeHeight = 8;
  const halfExtrudeLength = extrudeLength / 2;
  const halfExtrudeHeight = extrudeHeight / 2;

  const extrudePoints = [
    new THREE.Vector2(-halfExtrudeLength, -halfExtrudeHeight),
    new THREE.Vector2(-halfExtrudeLength,  halfExtrudeHeight),
    new THREE.Vector2(halfExtrudeLength,   halfExtrudeHeight),
    new THREE.Vector2(halfExtrudeLength,  -halfExtrudeHeight),
    new THREE.Vector2(-halfExtrudeLength, -halfExtrudeHeight),
  ]

  const extrudeShape = new THREE.Shape(extrudePoints);
  const extrudeGeometry = new THREE.ExtrudeGeometry(extrudeShape, { bevelThickness: 0.4, bevelSize: 1.0});
  const extrudeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
  const extrudeMesh = new THREE.Mesh(extrudeGeometry, extrudeMaterial);
  extrudeMesh.name = "extrudeMesh";
  extrudeMesh.castShadow = true;

  extrudeMesh.position.set(-7, halfExtrudeHeight, 5);

  // ---------- GROUP
  const bsGroup = new THREE.Group();
  bsGroup.name = "bsGroup";
  
  bsGroup.add(basicCube);
  bsGroup.add(wheel);
  bsGroup.add(extrudeMesh);

  return bsGroup;
}
