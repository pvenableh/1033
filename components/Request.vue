<!-- components/TenantRequestForm.vue -->
<template>
	<form @submit.prevent="submitRequest" class="space-y-6">

		<div class="space-y-4">
      <p>This is being submitted by {{ user }}</p>
			<!-- Request Category -->
			<UFormGroup label="Request Category" required>
				<USelect v-model="formData.category" :options="categories" placeholder="Select a category" required />
			</UFormGroup>

			<!-- Priority -->
			<UFormGroup label="Priority Level">
				<USelect v-model="formData.priority" :options="priorities" placeholder="Select priority" />
			</UFormGroup>

			<!-- Subject -->
			<UFormGroup label="Subject" required>
				<UInput v-model="formData.subject" placeholder="Brief description of the issue" required />
			</UFormGroup>

			<!-- Description -->
			<UFormGroup label="Description" required>
				<UTextarea
					v-model="formData.description"
					placeholder="Please provide detailed information about your request"
					rows="4"
					required
				/>
			</UFormGroup>

			<!-- Access Permission -->
			<UFormGroup>
				<UCheckbox
					v-model="formData.allowAccess"
					label="I give permission for maintenance to enter my unit when I'm not present"
				/>
			</UFormGroup>

			<!-- Preferred Contact Method -->
			<UFormGroup label="Preferred Contact Method">
				<URadio v-model="formData.contactMethod" :options="contactMethods" name="contact-method" />
			</UFormGroup>
		</div>

		<div class="flex justify-end space-x-3 pt-4">
			<UButton type="button" color="gray" variant="soft" @click="resetForm">Reset</UButton>
			<UButton type="submit" color="primary" :loading="isSubmitting" :disabled="isSubmitting">
				{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
			</UButton>
		</div>
	</form>
</template>

<script setup>
const { user } = useDirectusAuth();
const emit = defineEmits(['submitted']);
const { $directus } = useNuxtApp();
const isSubmitting = ref(false);

const categories = [
	{ label: 'Plumbing', value: 'plumbing' },
	{ label: 'Electrical', value: 'electrical' },
	{ label: 'HVAC', value: 'hvac' },
	{ label: 'Appliance', value: 'appliance' },
	{ label: 'Structural', value: 'structural' },
	{ label: 'Pest Control', value: 'pest_control' },
	{ label: 'Other', value: 'other' },
];

const priorities = [
	{ label: 'Emergency', value: 'emergency' },
	{ label: 'High', value: 'high' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'Low', value: 'low' },
];

const contactMethods = [
	{ label: 'Email', value: 'email' },
	{ label: 'Phone', value: 'phone' },
	{ label: 'SMS', value: 'sms' },
];

const formData = ref({
	category: '',
	priority: 'medium',
	subject: '',
	description: '',
	allowAccess: false,
	contactMethod: 'email',
});

const resetForm = () => {
	formData.value = {
		category: '',
		priority: 'medium',
		subject: '',
		description: '',
		allowAccess: false,
		contactMethod: 'email',
	};
};

const submitRequest = async () => {
	try {
		isSubmitting.value = true;

		// Submit to Directus
		await $directus.items('maintenance_requests').createOne({
			...formData.value,
			status: 'new',
			// Assuming you have the user's ID available in your auth state
			tenant: useDirectusUser().value?.id,
		});

		// Show success message
		useToast().add({
			title: 'Request Submitted',
			description: 'Your maintenance request has been submitted successfully.',
			color: 'green',
		});

		resetForm();
		emit('submitted');
	} catch (error) {
		console.error('Error submitting request:', error);
		useToast().add({
			title: 'Error',
			description: 'There was an error submitting your request. Please try again.',
			color: 'red',
		});
	} finally {
		isSubmitting.value = false;
	}
};
</script>
