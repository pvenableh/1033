<template>
	<div class="w-full flex items-start justify-start flex-row password-request">
		<VForm class="w-full" @submit="submit">
			<FormVInput name="email" type="email" rules="emailExists" label="Email" v-model="email" class="my-6" />

			<FormVButton class="w-full mb-6" type="submit">Send Email</FormVButton>
		</VForm>
	</div>
</template>

<script setup lang="ts">
import { createDirectus, rest, passwordRequest } from '@directus/sdk';

const client = createDirectus('https://admin.1033lenox.com').with(rest());
const email = ref();

async function submit() {
	const result = await client.request(passwordRequest(email.value, 'https://1033lenox.com/auth/password-reset'));
	console.log(result);
}
const onSubmit = async () => {
	loader.value = true;
	openScreen();
	const resetPassword = await $fetch('/api/passwordreset', {
		body: {
			email: email.value,
		},
	}).catch((error) => error.data);
	response.value = resetPassword;
	closeScreen();
	if (response.value) {
		// toast.add({ title: 'An email was sent to ' + email.value + '.', click: () => alert('Clicked!') })
	}
	// try {
	//   const { data, pending, error, refresh } = await useFetch(
	//     '/api/email/passwordreset?email=' + email.value,
	//     {
	//       onResponse({ request, response, options }) {
	//         return response._data
	//       },
	//     }
	//   )
	//   response.value = data
	//   closeScreen()

	// } catch (e) {}
};
</script>
<style></style>
