/* eslint-disable no-console */
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook('error', (error) => {
		console.error(error);
	});
});
