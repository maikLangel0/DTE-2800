/**
 * Laster et eller flere bilder og kaller på gitt callback-funksjon når alle bilder er lastet.
 * Bruker Promise.
 */
export class ImageLoader {
	constructor() {
	}

	load(urls) {
    const promises = [];
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
