import { mount } from './mount';

// const bootPromises: Array<Promise<any>> = [];
const bootPromises = [];

if (!('fetch' in window)) {
  //@ts-ignore
  bootPromises.push(import(/* webpackChunkName: "vendor-polyfill-fetch" */ 'whatwg-fetch'));
}

if (bootPromises.length) {
  Promise.all(bootPromises).then(mount);
} else {
  mount();
}
