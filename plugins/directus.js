import { Directus } from '@directus/sdk';
const directus = new Directus('https://admin.1033lenox.com');

export default defineNuxtPlugin(() => {
	return {
		provide: { directus },
	};
});