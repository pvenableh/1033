import { f as useNuxtApp } from '../server.mjs';

async function useDirectus(options) {
  const nuxtApp = useNuxtApp();
  const $directus = nuxtApp.$directus;
  return await $directus.request(options);
}

export { useDirectus as u };
//# sourceMappingURL=useDirectus-a7bab9cf.mjs.map
