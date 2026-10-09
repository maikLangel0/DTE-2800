import * as THREE from "three";
import { ExtendedObj3DMap } from "./object3DMap";

/**@extends {ExtendedObj3DMap<THREE.Mesh>} */
export class MeshMap extends ExtendedObj3DMap {
  /**@param {{label: string; value: THREE.Mesh}[] | null} entries */
  constructor(entries) {
    super(entries);
  }
}

/**@extends {ExtendedObj3DMap<THREE.Light>} */
export class LightMap extends ExtendedObj3DMap {
  /**@param {{label: string; value: THREE.Light}[] | null} entries */
  constructor(entries) {
    super(entries);
  }
}

/**@extends {ExtendedObj3DMap<THREE.BufferGeometry>} */
export class GeometryMap extends ExtendedObj3DMap {
  /**@param {{label: string; value: THREE.BufferGeometry}[] | null} entries */
  constructor(entries) {
    super(entries);
  }
}

/**@extends {ExtendedObj3DMap<THREE.Material>} */
export class MaterialMap extends ExtendedObj3DMap {
  /**@param {{label: string; value: THREE.Material}[] | null} entries */
  constructor(entries) {
    super(entries);
  }
}

/**@extends {ExtendedObj3DMap<THREE.Object3D>} */
export class ObjectMap extends ExtendedObj3DMap {
  /**@param {{label: string; value: THREE.Object3D}[] | null} entries */
  constructor(entries) {
    super(entries);
  }
}