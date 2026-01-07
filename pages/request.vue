<script setup>
import {useField, useForm} from 'vee-validate';
import * as yup from 'yup';
const unitsCollection = useDirectusItems('units');
const requestsCollection = useDirectusItems('requests');
const isSubmitting = ref(false);
import confetti from 'canvas-confetti';

function randomInRange(min, max) {
	return Math.random() * (max - min) + min;
}

const launchConfetti = () => {
	confetti({
		angle: randomInRange(55, 125),
		spread: randomInRange(50, 70),
		particleCount: randomInRange(50, 100),
		origin: {y: 0.6},
	});
};

// Define validation schema
const validationSchema = yup.object({
	name: yup.string().required('Name is required'),
	email: yup.string().email('Please enter a valid email').required('Email is required'),
	unit: yup.string().required('Unit selection is required'),
	subject: yup.string().required('Subject is required'),
	description: yup
		.string()
		.required('Description is required')
		.min(10, 'Description must be at least 10 characters')
		.max(1000, 'Description cannot exceed 1000 characters'),
});

// Initialize form with validation schema
const {handleSubmit, resetForm} = useForm({
	validationSchema,
});

// Setup individual field validation
const {value: name, errorMessage: nameError} = useField('name');
const {value: email, errorMessage: emailError} = useField('email');
const {value: unit, errorMessage: unitError} = useField('unit');
const {value: subject, errorMessage: subjectError} = useField('subject');
const {value: description, errorMessage: descriptionError} = useField('description');

const units = await unitsCollection.list({
	fields: ['id,number,status,people.people_id.first_name,people.people_id.last_name,people.people_id.email'],
	filter: {
		status: {
			_eq: 'published',
		},
	},
});

const formattedOptions = computed(() => {
	return units
		.map((item) => ({
			value: item.id,
			label: item.number,
		}))
		.sort((a, b) => parseInt(a.label) - parseInt(b.label));
});

const categories = ref(['Structural', 'Electrical', 'Paint', 'Windows and Doors', 'Other']);
const category = 'question';
const direction = ref('forward');
const panel = ref('1');

const handleNext = () => {
	direction.value = 'forward';
	panel.value = '2';
	launchConfetti();
};

const handleReset = () => {
	direction.value = 'backward';
	panel.value = '1';
	resetForm();
};

const handleLimitExceeded = (isExceeded) => {
	// Example: disable your form submit button

	// Or show a warning message
	if (isExceeded) {
		toast.add({
			title: 'Character limit exceeded',
			description: 'Please reduce the text length to continue',
			color: 'red',
		});
	}
};

const onSubmit = handleSubmit(async (values) => {
	if (Object.keys(errors).length > 0) {
		console.error('Validation failed:', errors);
		return; // Stop execution if there are errors
	}

	try {
		isSubmitting.value = true;

		// Submit to Directus
		await requestsCollection.create({
			...values,
			status: 'published',
			category: 'question',
			priority: 'medium',
		});

		// Show success message
		useToast().add({
			title: 'Request Submitted',
			description: `Your ${category} has been submitted successfully.`,
			color: 'green',
		});
	} catch (error) {
		console.error('Error submitting request:', error);
		useToast().add({
			title: 'Error',
			description: `There was an error submitting your ${category}. Please try again.`,
			color: 'red',
		});
	} finally {
		isSubmitting.value = false;
		handleNext();
	}
});
</script>

<template>
	<div
		class="w-full max-w-[650px] px-4 py-10 mx-auto relative overflow-hidden flex items-center justify-center flex-col">
		<TransitionGroup
			:enter-active-class="'transition duration-300 ease-out'"
			:enter-from-class="direction === 'forward' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'"
			:enter-to-class="'translate-x-0 opacity-100'"
			:leave-active-class="'transition duration-300 ease-in absolute w-full'"
			:leave-from-class="'translate-x-0 opacity-100'"
			:leave-to-class="direction === 'forward' ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'"
			mode="out-in">
			<div
				v-if="panel === '1'"
				class="w-full min-h-[500px] max-h-[calc(100vh-120px)] overflow-y-scroll flex items-center justify-center flex-col">
				<h5 class="uppercase tracking-wider font-bold w-full text-center">40YR {{ category }} Submission</h5>
				<p class="leading-3 text-[12px] mb-6 mt-1 w-full text-justify max-w-[350px] mx-auto">
					Complete the form below to submit a question for the general contractor to review.
				</p>
				<form @submit.prevent="onSubmit" class="grid gap-4 w-full">
					<div class="grid sm:grid-cols-2 gap-4 w-full">
						<UFormGroup label="Name" required :error="nameError">
							<UInput v-model="name" />
							<template #error>
								<p class="error-class">
									{{ nameError }}
								</p>
							</template>
						</UFormGroup>
						<UFormGroup label="Email" required :error="emailError">
							<UInput v-model="email" type="email" placeholder="name@domain.com" />
							<template #error>
								<p class="error-class">
									{{ emailError }}
								</p>
							</template>
						</UFormGroup>
					</div>
					<div class="grid sm:grid-cols-2 gap-4">
						<UFormGroup label="Subject" required :error="subjectError">
							<USelect v-model="subject" :options="categories" placeholder="Select a subject" />
							<template #error>
								<p class="error-class">
									{{ subjectError }}
								</p>
							</template>
						</UFormGroup>
						<UFormGroup label="Unit" required :error="unitError">
							<USelect v-model="unit" :options="formattedOptions" placeholder="Select your unit" />
							<template #error>
								<p class="error-class">
									{{ unitError }}
								</p>
							</template>
						</UFormGroup>
					</div>
					<!-- Description -->
					<UFormGroup label="Description" required :error="descriptionError">
						<TipTap
							v-model="description"
							placeholder="Please provide detailed information about your request"
							rows="5"
							:character-limit="1000"
							:show-char-count="true"
							@limit-exceeded="handleLimitExceeded" />
						<template #error>
							<p class="error-class">
								{{ descriptionError }}
							</p>
						</template>
					</UFormGroup>

					<div class="flex justify-end space-x-3 pt-4 w-full">
						<UButton type="button" color="gray" variant="soft" @click="handleReset">Reset</UButton>
						<UButton type="submit" color="primary" :loading="isSubmitting" :disabled="isSubmitting">
							{{ isSubmitting ? 'Submitting...' : 'Submit' }}
						</UButton>
					</div>
				</form>
				<!-- <UButton @click="handleNext" color="primary">Next</UButton> -->
			</div>
			<div v-else class="w-full min-h-[500px] max-h-[calc(100vh-120px)] flex items-center justify-center flex-col">
				<h5 class="uppercase tracking-wider">
					Thank you
					<span v-if="name" class="font-bold text-[var(--cyan)]">{{ name.split(' ')[0] }}</span>
					.
				</h5>
				<p class="my-20">
					Your
					<span class="font-bold text-[var(--cyan)]" v-if="subject">{{ subject.toLowerCase() }} {{ category }}</span>
					was submitted successfully.
				</p>
				<UButton @click="handleReset" color="primary">Reset Form</UButton>
			</div>
		</TransitionGroup>
	</div>
</template>

<style>
@reference "~/assets/css/tailwind.css";
.transition-group {
	position: relative;
}

.transition-group > * {
	transition: all 0.3s ease-in-out;
}

/* Your existing styles */
.error-class {
	@apply absolute right-0 text-[10px] text-red-500 dark:text-red-400 uppercase tracking-wider mt-1;
}

.panel-enter-active,
.panel-leave-active {
	transition: all 0.3s ease;
}

.panel-enter-from {
	opacity: 0;
	transform: translateX(100%);
}

.panel-leave-to {
	opacity: 0;
	transform: translateX(-100%);
}

/* Error message transition classes */
.error-enter-active,
.error-leave-active {
	transition: all 0.3s ease;
	max-height: 50px;
}

.error-enter-from,
.error-leave-to {
	opacity: 0;
	transform: translateY(10px);
	max-height: 0;
}
</style>
