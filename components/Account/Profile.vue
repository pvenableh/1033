<template>
	<div class="px-10 account__profile">
		<h2>Profile</h2>
		<form class="grid gap-4" @submit.prevent="updatePerson()">
			<UFormGroup label="First Name" name="first_name">
				<UInput
					v-model="formState.first_name"
					name="first_name"
					type="text"
					placeholder="First Name"
					size="lg" />
			</UFormGroup>

			<UFormGroup label="Last Name" name="last_name">
				<UInput
					v-model="formState.last_name"
					name="last_name"
					type="text"
					placeholder="Last Name"
					size="lg" />
			</UFormGroup>

			<UFormGroup label="Email" name="email">
				<UInput
					v-model="formState.email"
					name="email"
					type="email"
					placeholder="Email"
					size="lg"
					disabled />
			</UFormGroup>

			<UButton
				class="w-full mt-4"
				type="submit"
				size="lg"
				label="Update Profile"
				:loading="loading"
				block />
		</form>
	</div>
</template>

<script setup lang="ts">
const { user } = useDirectusAuth();
const { updateProfile } = useDirectusUser();
const toast = useToast();
const loading = ref(false);

// Create a reactive form state initialized from user
const formState = reactive({
	first_name: '',
	last_name: '',
	email: '',
});

// Initialize form state when user data is available
watchEffect(() => {
	if (user.value) {
		formState.first_name = user.value.first_name || '';
		formState.last_name = user.value.last_name || '';
		formState.email = user.value.email || '';
	}
});

async function updatePerson() {
	loading.value = true;

	try {
		await updateProfile({
			first_name: formState.first_name,
			last_name: formState.last_name,
		});

		toast.add({
			icon: 'i-heroicons-check-circle-solid',
			title: 'Success!',
			description: 'Profile updated.',
			color: 'green',
		});

		// Refresh user session to get updated data
		const { refreshUser } = useDirectusAuth();
		await refreshUser();
	} catch (error: any) {
		console.error(error);
		toast.add({
			icon: 'i-heroicons-exclamation-triangle',
			title: 'Error',
			description: error.message || 'Failed to update profile',
			color: 'red',
		});
	} finally {
		loading.value = false;
	}
}
</script>
