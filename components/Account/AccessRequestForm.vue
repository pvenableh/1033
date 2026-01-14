<template>
	<div
		v-motion="{
			initial: {y: -100, opacity: 0},
			enter: {y: 0, opacity: 1},
		}"
		class="w-full">
		<Alert
			v-if="submitError"
			type="error"
			class="my-4"
			:description="submitError"
			color="red"
			variant="subtle"
			icon="i-heroicons-exclamation-triangle" />

		<Alert
			v-if="submitSuccess"
			class="my-4"
			color="green"
			variant="subtle"
			icon="i-heroicons-check-circle"
			title="Request Submitted"
			description="Your access request has been submitted. You will receive an email once approved." />

		<Form v-if="!submitSuccess" :validate="validate" :state="state" class="grid gap-4" @submit="submitRequest">
			<div class="grid grid-cols-2 gap-4">
				<FormGroup label="First Name" name="first_name" required>
					<Input
						v-model="state.first_name"
						name="first_name"
						size="lg"
						:loading="loading"
						icon="i-heroicons-user"
						placeholder="John" />
				</FormGroup>
				<FormGroup label="Last Name" name="last_name" required>
					<Input v-model="state.last_name" name="last_name" size="lg" :loading="loading" placeholder="Doe" />
				</FormGroup>
			</div>

			<FormGroup label="Email" name="email" required>
				<Input
					v-model="state.email"
					name="email"
					type="email"
					size="lg"
					:loading="loading"
					icon="i-heroicons-envelope"
					placeholder="name@domain.com" />
			</FormGroup>

			<FormGroup label="Phone" name="phone">
				<Input
					v-model="state.phone"
					name="phone"
					type="tel"
					size="lg"
					:loading="loading"
					icon="i-heroicons-phone"
					placeholder="(555) 555-5555" />
			</FormGroup>

			<FormGroup label="Unit" name="unit_id" required hint="Your unit at 1033 Lenox">
				<SelectMenu
					v-model="state.unit_id"
					:options="unitOptions"
					value-attribute="id"
					option-attribute="label"
					size="lg"
					placeholder="Select your unit"
					:loading="unitsPending"
					searchable
					searchable-placeholder="Search units...">
					<template #leading>
						<Icon name="i-heroicons-home" class="w-5 h-5 text-gray-400" />
					</template>
				</SelectMenu>
			</FormGroup>

			<FormGroup label="Residency Type" name="residency_type" required>
				<SelectMenu
					v-model="state.residency_type"
					:options="residencyTypes"
					size="lg"
					placeholder="Select your residency type" />
			</FormGroup>

			<FormGroup label="Password" name="password" required>
				<Input
					v-model="state.password"
					type="password"
					size="lg"
					:loading="loading"
					icon="i-heroicons-lock-closed"
					placeholder="Create a password" />
			</FormGroup>

			<FormGroup label="Confirm Password" name="confirm_password" required>
				<Input
					v-model="state.confirm_password"
					type="password"
					size="lg"
					:loading="loading"
					icon="i-heroicons-lock-closed"
					placeholder="Confirm your password" />
			</FormGroup>

			<FormGroup name="agreement">
				<Checkbox
					v-model="state.agreement"
					name="agreement"
					label="I confirm that I am a resident or owner at 1033 Lenox" />
			</FormGroup>

			<Button
				type="submit"
				:loading="loading"
				:disabled="!isFormValid"
				size="lg"
				label="Request Access"
				trailing-icon="i-heroicons-arrow-right"
				block />
		</Form>
	</div>
</template>

<script setup lang="ts">
import type {FormError} from '#ui/types';

const loading = ref(false);
const submitError = ref<string | null>(null);
const submitSuccess = ref(false);

const residencyTypes = [
	{label: 'Owner (I own a unit)', value: 'Owner'},
	{label: 'Tenant (I rent/lease a unit)', value: 'Tenant'},
	{label: 'Property Manager', value: 'Property Manager'},
];

// Fetch units using server endpoint
const {data: unitsData, pending: unitsPending} = useLazyFetch<any[]>('/api/public/units', {
	server: false,
	default: () => [],
});

const units = computed(() => unitsData.value || []);

const unitOptions = computed(() => {
	return units.value
		.map((unit: any) => ({
			id: unit.id,
			label: unit.number,
		}))
		.sort((a: any, b: any) => parseInt(a.label) - parseInt(b.label));
});

const state = reactive({
	first_name: '',
	last_name: '',
	email: '',
	phone: '',
	unit_id: null as number | null,
	residency_type: null as {label: string; value: string} | null,
	password: '',
	confirm_password: '',
	agreement: false,
});

const isFormValid = computed(() => {
	return (
		state.first_name &&
		state.last_name &&
		state.email &&
		state.unit_id &&
		state.residency_type &&
		state.password &&
		state.confirm_password &&
		state.password === state.confirm_password &&
		state.agreement
	);
});

const validate = async (formState: typeof state): Promise<FormError[]> => {
	const errors: FormError[] = [];
	const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

	if (!formState.first_name) {
		errors.push({path: 'first_name', message: 'First name is required'});
	}

	if (!formState.last_name) {
		errors.push({path: 'last_name', message: 'Last name is required'});
	}

	if (!formState.email) {
		errors.push({path: 'email', message: 'Email is required'});
	} else if (!emailRegex.test(formState.email)) {
		errors.push({path: 'email', message: 'Please enter a valid email address'});
	}

	if (!formState.unit_id) {
		errors.push({path: 'unit_id', message: 'Please select a unit'});
	}

	if (!formState.residency_type) {
		errors.push({path: 'residency_type', message: 'Please select your residency type'});
	}

	if (!formState.password) {
		errors.push({path: 'password', message: 'Password is required'});
	} else if (formState.password.length < 8) {
		errors.push({path: 'password', message: 'Password must be at least 8 characters'});
	}

	if (formState.password !== formState.confirm_password) {
		errors.push({path: 'confirm_password', message: 'Passwords do not match'});
	}

	if (!formState.agreement) {
		errors.push({path: 'agreement', message: 'You must confirm your residency'});
	}

	// Check if email already exists
	if (formState.email && emailRegex.test(formState.email) && errors.filter((e) => e.path === 'email').length === 0) {
		try {
			const response: any = await $fetch('/api/public/check-email', {
				method: 'POST',
				body: {email: formState.email},
			});

			if (response.exists) {
				errors.push({path: 'email', message: 'This email is already registered'});
			}
		} catch (error) {
			// If we can't check, allow submission and let server handle it
			console.error('Failed to validate email uniqueness:', error);
		}
	}

	return errors;
};

async function submitRequest() {
	loading.value = true;
	submitError.value = null;

	try {
		// Get the unit number from the selected unit
		const selectedUnit = units.value.find((u) => u.id === state.unit_id);
		const unitNumber = selectedUnit?.number;

		// Create user via server endpoint
		await $fetch('/api/public/access-request', {
			method: 'POST',
			body: {
				first_name: state.first_name,
				last_name: state.last_name,
				email: state.email,
				phone: state.phone,
				password: state.password,
				unit_id: state.unit_id,
				unit_number: unitNumber,
				residency_type: state.residency_type?.value,
			},
		});

		submitSuccess.value = true;

		// Notify admins via email
		try {
			await $fetch('/api/email/access-request', {
				method: 'POST',
				body: {
					first_name: state.first_name,
					last_name: state.last_name,
					email: state.email,
					phone: state.phone,
					unit_number: unitNumber,
					residency_type: state.residency_type?.value,
				},
			});
		} catch (emailError) {
			// Don't fail registration if email fails
			console.error('Failed to send notification email:', emailError);
		}
	} catch (error: any) {
		console.error('Registration error:', error);
		if (error.data?.message) {
			submitError.value = error.data.message;
		} else if (error.data?.errors?.[0]?.message) {
			submitError.value = error.data.errors[0].message;
		} else {
			submitError.value = 'Failed to submit access request. Please try again.';
		}
	} finally {
		loading.value = false;
	}
}
</script>
