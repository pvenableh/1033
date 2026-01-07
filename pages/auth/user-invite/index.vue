<template>
	<div class="flex items-center justify-center flex-col min-h-screen px-4">
		<div
			v-motion="{
				initial: {
					y: -100,
					opacity: 0,
				},
				enter: {
					y: 0,
					opacity: 1,
				},
			}"
			class="w-full max-w-md">
			<!-- Success State -->
			<div v-if="success" class="text-center">
				<UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mx-auto mb-4" />
				<h2 class="text-2xl font-bold mb-2">Welcome to 1033 Lenox!</h2>
				<p class="text-gray-600 dark:text-gray-400 mb-6">
					Your account has been set up successfully. You can now sign in with your new password.
				</p>
				<UButton
					to="/auth/signin"
					size="lg"
					label="Sign In"
					trailing-icon="i-heroicons-arrow-right"
					block />
			</div>

			<!-- Expired Token State -->
			<div v-else-if="!isValid" class="text-center">
				<UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-amber-500 mx-auto mb-4" />
				<h2 class="text-2xl font-bold mb-2">Link Expired</h2>
				<p class="text-gray-600 dark:text-gray-400 mb-6">
					This invitation link has expired. Please contact an administrator to request a new invitation.
				</p>
				<UButton
					to="/auth/signin"
					size="lg"
					variant="outline"
					label="Go to Sign In"
					block />
			</div>

			<!-- Form State -->
			<div v-else>
				<div class="text-center mb-8">
					<h2 class="text-2xl font-bold mb-2">Set Your Password</h2>
					<p class="text-gray-600 dark:text-gray-400">
						Welcome, <span class="font-medium">{{ decodedEmail }}</span>!
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
						Link expires {{ getRelativeTime(expiresAt) }}
					</p>
				</div>

				<Alert
					v-if="error"
					class="mb-4"
					:description="error"
					color="red"
					variant="subtle"
					icon="i-heroicons-exclamation-triangle">
					{{ error }}
				</Alert>

				<UForm :validate="validate" :state="state" class="grid gap-4" @submit="handleSubmit">
					<UFormGroup label="Password" name="password" required>
						<UInput
							v-model="state.password"
							type="password"
							size="lg"
							:loading="loading"
							icon="i-heroicons-lock-closed"
							placeholder="Enter your password" />
					</FormGroup>

					<UFormGroup label="Confirm Password" name="confirmPassword" required>
						<UInput
							v-model="state.confirmPassword"
							type="password"
							size="lg"
							:loading="loading"
							icon="i-heroicons-lock-closed"
							placeholder="Confirm your password" />
					</FormGroup>

					<div class="text-xs text-gray-500 dark:text-gray-400">
						Password must be at least 8 characters long.
					</div>

					<UButton
						type="submit"
						:loading="loading"
						:disabled="!state.password || !state.confirmPassword"
						size="lg"
						label="Set Password"
						trailing-icon="i-heroicons-arrow-right"
						block />
				</Form>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { jwtDecode } from 'jwt-decode';
import type { FormError } from '#ui/types';

definePageMeta({
	layout: 'auth',
});

const route = useRoute();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const state = reactive({
	password: '',
	confirmPassword: '',
});

// Token handling
const token = computed(() => (route.query.token as string) || '');
const decodedToken = computed(() => {
	if (!token.value) return null;
	try {
		return jwtDecode<{ email: string; exp: number }>(token.value);
	} catch {
		return null;
	}
});

const decodedEmail = computed(() => decodedToken.value?.email || '');
const expiresAt = computed(() => {
	if (!decodedToken.value?.exp) return null;
	return new Date(decodedToken.value.exp * 1000);
});

const isValid = computed(() => {
	if (!decodedToken.value || !expiresAt.value) return false;
	return expiresAt.value > new Date();
});

// Validation
const validate = (state: any): FormError[] => {
	const errors: FormError[] = [];

	if (!state.password) {
		errors.push({ path: 'password', message: 'Password is required' });
	} else if (state.password.length < 8) {
		errors.push({ path: 'password', message: 'Password must be at least 8 characters' });
	}

	if (!state.confirmPassword) {
		errors.push({ path: 'confirmPassword', message: 'Please confirm your password' });
	} else if (state.password !== state.confirmPassword) {
		errors.push({ path: 'confirmPassword', message: 'Passwords do not match' });
	}

	return errors;
};

// Submit handler
async function handleSubmit() {
	loading.value = true;
	error.value = null;

	try {
		await $fetch('/api/directus/users/accept-invite', {
			method: 'POST',
			body: {
				token: token.value,
				password: state.password,
			},
		});

		success.value = true;
	} catch (err: any) {
		if (err?.data?.message) {
			error.value = err.data.message;
		} else if (err?.message) {
			error.value = err.message;
		} else {
			error.value = 'Failed to set password. The invitation may be invalid or expired.';
		}
	} finally {
		loading.value = false;
	}
}
</script>
