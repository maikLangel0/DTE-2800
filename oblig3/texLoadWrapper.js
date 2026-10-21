import * as THREE from "three";
import { BasicAppContext } from "../base/threeHelpers/basicAppContext";

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