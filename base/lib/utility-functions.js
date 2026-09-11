import { Matrix4 } from "./cuon-matrix";

/**
 * Gets called in the function that includes the recursive callback
 * to itself via
 * window.requestAnimationFrame( (currTime) => { itself(); } )
 *
 * @param {number} dt
 * @param {{frameCount: number; dtTotal: number}} fpsInfo
 * @param {string} documentIdName
 */
export function iterateAndShowFps(dt, fpsInfo, documentIdName) {
  fpsInfo.frameCount++;
  fpsInfo.dtTotal += dt;

  // Only updates the innerHTML when 1 second has elapsed
  if (fpsInfo.dtTotal >= 1.0) {
    const rawFps = fpsInfo.frameCount / fpsInfo.dtTotal;

    document.getElementById(documentIdName).innerHTML = Math.round(rawFps);

    fpsInfo.frameCount = 0;
    fpsInfo.dtTotal = 0;
  }
}
/**
 * Mutates timeInfo.dtTotal = 0 AND timeInfo.fps = 0.
 * @param {{ previousTime: number; dt: number; dtTotal: number; fps: number; }} timeInfo
 * @param {string} name 
 */
export function showFps(timeInfo, name) {

  if (timeInfo.dtTotal >= 1.0) {
    const fps = Math.round(timeInfo.fps);
    
    const fpsInHtml = document.getElementById(name);
    fpsInHtml.innerHTML = `FPS: ${fps}`;
    
    timeInfo.dtTotal = 0;
    timeInfo.fps = 0;
  }
}

/**
 * @param {{ previousTime: number; dt: number; dtTotal: number; fps: number; }} timeInfo
 * @param {number} currentTime 
 */
export function updateFps(timeInfo, currentTime) {
  timeInfo.dt = (currentTime - timeInfo.previousTime) / 1000;

  timeInfo.previousTime = currentTime;
  timeInfo.dtTotal += timeInfo.dt;
  timeInfo.fps++;
}

/**
 * Gets called in the function that includes the recursive callback
 * to itself via
 * window.requestAnimationFrame( (currTime) => { itself(); } )
 *
 * @param {number} lastTime
 * @param {number} currTime
 */
export function getDt(lastTime, currTime) {
  return currTime - lastTime;
}

/**
 * Creates listeners for keyup and keydown events, and
 * populates or updates the currPressedKeys[keycode] given
 * the event.
 * @param {Record<string, boolean>} currPressedKeys
 */
export function initKeyPress(currPressedKeys) {
  document.addEventListener('keyup', (event) => {
    currPressedKeys[event.code] = false;
  });

  document.addEventListener('keydown', (event) => {
    currPressedKeys[event.code] = true;
  });
}

/**
 * Roterer gitt vektor delta antall grader om gitt akse.
 * @param {number} delta
 * @param {vec3} vector
 * @param {{x: number; y: number; z: number}} axis
 */
export function rotateVector(delta, vector, axis) {
	var matrix = new Matrix4();
	matrix.setIdentity();
	matrix.rotate(delta, axis.x, axis.y, axis.z);
	vec3.transformMat4(vector, vector, matrix.elements);
}

/**
 * Fra radianer til grader.
 * @param {number} angle
 * @returns {number}
 */
export function toDegrees(angle) {
	return angle * (180 / Math.PI);
}

/**
 * Fra grader til radianer.
 * @param {number} angle
 * @returns {number}
 */
export function toRadians(angle) {
	return angle * (Math.PI / 180);
}

/**
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomIntBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sjekker om value er POT
export function isPowerOfTwo1(value) {
	if (value === 0)
		return false;
	while (value !== 1)
	{
		if (value % 2 !== 0)
			return false;
		value = value/2;
	}
	return true;
}

// Sjekker om value er POT
export function isPowerOfTwo2(value) {
	return (value & (value - 1)) == 0;  //?
}

/**
 * Returnerer en String-versjon av et objekt.
 * @param vector
 * @returns {string}
 */
export function vectorToString(vector) {
	let props = Object.getOwnPropertyNames(vector);
  let retVal = '';

	for (let i=0; i<props.length; i++) {
		retVal += props[i] + ': ' + String(vector[props[i]].toFixed(1)) + ' ';
	}
	return retVal;
}

// FRA: http://learnwebgl.brown37.net/10_surface_properties/surface_properties_color.html
export const niceColors = {
	gold: {
		ambient: {r: .24725, g:	0.1995, b: 0.0745, a:0.4},
		diffuse:  {r: 0.75164, g: 0.60648, b:0.22648, a:0.4},
		specular: {r: 0.628281, g:0.555802, b: 0.366065, a:0.4},
		shininess: 51.2,
		intensity: 1.0
	},
	chrome: {
		ambient: {r: 0.25, g: 0.25, b:0.25, a:1.0},
		diffuse: {r: 0.4, g: 0.4, b:0.4, a:1.0},
		specular: {r: 0.774597, g: 0.774597, b:0.774597, a:1.0},
		shininess: 76.8,
		intensity: 1.0
	},
	pewter: {
		ambient: {r: 0.105882, g:0.058824, b:0.113725, a:0.5},
		diffuse: {r:0.427451, g:0.470588, b:0.541176, a:0.5},
		specular: {r:0.333333, g:0.333333, b:0.521569, a: 0.5},
		shininess: 9.84615,
		intensity: 1.0
	},
	jade: {
		ambient: {r:0.135, g:0.2225, b:0.1575, a:0.95},
		diffuse: {r:0.54, g:0.89, b:0.63, a:0.95},
		specular: {r:0.316228, g:0.316228, b:0.316228, a:0.95},
		shininess: 12.8,
		intensity: 1.0
	}
}
