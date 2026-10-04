/**
 * Laster et eller flere bilder og kaller på gitt callback-funksjon når alle bilder er lastet.
 * Bruker Promise.
 */
export class ImageLoader {
  constructor() {
    return this;
	}

	/**@param {string[]} urls  */
	load(urls) {
    const promises = [];
    /**@type {HTMLImageElement[]} */
    const images = [];

    for (let i = 0; i < urls.length; i++) {
      promises.push(
        new Promise((resolve, reject) => {

          images[i] = new Image();
          images[i].src = urls[i];

          images[i].onload = () => {
              resolve();
          };
          images[i].onerror = () => {
              reject();
          };
        })
      );
    }

    return Promise.all(promises).then(() => images);
	}
}

// Just better functions

/**@param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.src = url;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
  });
}

/**@param {string[]} urls
 * @returns {Promise<HTMLImageElement[]>}
 */
export async function loadImages(urls) {
  /**@type {Promise<HTMLImageElement>[]} */
  let futures = [];

  for (let url of urls) {
    futures.push(loadImage(url));
  }

  return Promise.all(futures);
}
