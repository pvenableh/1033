import jwtDecode from 'jwt-decode';
import { readMe } from '@directus/sdk';
import type { RestClient, AuthenticationClient } from '@directus/sdk';
import type { Schema } from '~/types/schema';

import { useState, useRuntimeConfig, useRoute, navigateTo, clearNuxtData, useNuxtApp } from '#imports';

export default function useDirectusAuth<DirectusSchema extends object>() {
	const nuxtApp = useNuxtApp();
	const $directus = nuxtApp.$directus as RestClient<Schema> & AuthenticationClient<Schema>;

	const user = useState('user');

	const config = useRuntimeConfig();

	const _loggedIn = {
		get: () => process.client && localStorage.getItem('authenticated'),
		set: (value: boolean) => process.client && localStorage.setItem('authenticated', value.toString()),
	};

	// async function passwordRequest(email: string) {
	// 	await $directus.passwordRequest(email);
	// }

	async function login(email: string, password: string, otp?: string) {
		const route = useRoute();

		const response = await $directus.login(email, password);

		const returnPath = route.query.redirect?.toString();
		const redirect = returnPath ? returnPath : '/account/';

		_loggedIn.set(true);

		setTimeout(async () => {
			await fetchUser({ fields: ['id,first_name,last_name,email,avatar,units.units_id.id,units.units_id.number,units.units_id.occupant,units.units_id.pets.name,units.units_id.pets.category,units.units_id.pets.image,units.units_id.pets.breed,units.units_id.people.*,units.units_id.vehicles.make,units.units_id.vehicles.model,units.units_id.vehicles.image,units.units_id.vehicles.license_plate'] });
			await navigateTo(redirect);
		}, 100);
	}

	async function logout() {
		const token = await $directus.getToken();

		await $directus.logout();

		user.value = null;

		await clearNuxtData();
		await navigateTo(config.public?.directus?.auth?.redirect?.login || '/auth/signin');
	}

	async function fetchUser(params?: object) {
		const fields = config.public?.directus?.auth?.userFields || ['*'];

		const response = await $directus.request(
			readMe({
				// @ts-ignore
				fields,
				...params,
			}),
		);

		user.value = response;
	}

	async function isTokenExpired(token: string) {
		const decodedToken = jwtDecode(token) as { exp: number };
		const expirationDate = new Date(decodedToken.exp * 1000);
		return expirationDate < new Date();
	}

	return {
		user,
		login,
		logout,
		fetchUser,
		isTokenExpired,
		_loggedIn,
	};
}
