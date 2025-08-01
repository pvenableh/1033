<script setup>
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';
const { createItem, readItems } = useDirectusItems();
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
		origin: { y: 0.6 },
	});
};

const validationSchema = yup.object({
	name: yup.string().required('Name is required'),
	email: yup.string().email('Please enter a valid email').required('Email is required'),
	contact_preference: yup.string().required('Required'),
	subject: yup.string().required('Category is required'),
	// description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
});

// Initialize form with validation schema
const { handleSubmit, resetForm } = useForm({
	validationSchema,
});

// Setup individual field validation
const { value: name, errorMessage: nameError } = useField('name');
const { value: email, errorMessage: emailError } = useField('email');
const { value: phone } = useField('phone');
const { value: unit, errorMessage: unitError } = useField('unit');
const { value: subject, errorMessage: subjectError } = useField('subject');
const { value: contact_preference, errorMessage: preferenceError } = useField('contact_preference');
const { value: description } = useField('description');

const units = await readItems('units', {
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

const categories = ref(['Landscape Volunteer', 'Cleaning Volunteer', 'Anything Volunteer']);
const category = 'volunteer';
const direction = ref('forward');
const panel = ref('1');

const availablePreferenceOptions = ref(['Email', 'Phone', 'Text']);

const selectSubject = (selectedOption) => {
	subject.value = selectedOption;
};

onMounted(() => {
	watch(
		[phone, email],
		([newPhone, newEmail]) => {
			const hasPhone = newPhone && newPhone.trim() !== '';
			const hasEmail = newEmail && newEmail.trim() !== '';

			if (hasPhone && hasEmail) {
				availablePreferenceOptions.value = ['Email', 'Phone', 'Text'];
			} else if (hasPhone && !hasEmail) {
				availablePreferenceOptions.value = ['Phone', 'Text'];
				// Only change preference if it's currently set to Email
				if (contact_preference.value === 'Email') {
					contact_preference.value = 'Phone';
				}
			} else if (!hasPhone && hasEmail) {
				availablePreferenceOptions.value = ['Email'];
				contact_preference.value = 'Email';
			} else if (!hasPhone && !hasEmail) {
				// If both are empty, keep all options but don't reset the preference
				availablePreferenceOptions.value = ['Email', 'Phone', 'Text'];
			}
		},
		{ immediate: false }, // Don't run immediately
	);
});

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

const onSubmit = handleSubmit(async (values) => {
	try {
		isSubmitting.value = true;

		// Submit to Directus
		const request = await createItem('requests', {
			...values,
			status: 'published',
			category: 'volunteer',
			priority: 'medium',
			date_created: new Date().toISOString(),
		});

		const unitDetails = units.find((u) => u.id === parseInt(values.unit));
		const unitNumber = unitDetails?.number || values.unit;

		const emailResponse = await useFetch('/api/email/request', {
			method: 'POST',
			body: {
				id: request.id,
				name: values.name,
				email: values.email,
				phone: values.phone,
				unit: unitNumber,
				subject: values.subject,
				description: values.description,
				permission: values.permission,
				preference: values.contact_preference,
				category: 'volunteer',
				priority: 'medium',
				date_created: request.date_created,
			},
		});
		console.log(emailResponse);
		// if (!emailResponse.ok) {
		// 	throw new Error('Failed to send email notification');
		// }

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
	<div class="w-full max-w-[650px] py-10 px-3 md:px-0 mx-auto relative flex items-center justify-center flex-col">
		<h5 class="uppercase tracking-wider font-bold w-full text-center">Volunteer Form 🙋🙋🏽‍♀️🙋🏻‍♂️</h5>
		<p class="leading-3 text-[12px] mb-6 mt-1 w-full text-center max-w-[350px] mx-auto">
			Complete the form below to volunteer at 1033 Lenox.
		</p>
		<TransitionGroup
			:enter-active-class="'transition duration-300 ease-out'"
			:enter-from-class="direction === 'forward' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'"
			:enter-to-class="'translate-x-0 opacity-100'"
			:leave-active-class="'transition duration-300 ease-in absolute w-full'"
			:leave-from-class="'translate-x-0 opacity-100'"
			:leave-to-class="direction === 'forward' ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'"
			mode="out-in"
		>
			<div v-if="panel === '1'" class="w-full min-h-[500px] flex items-center justify-center flex-col">
				<form @submit.prevent="onSubmit" class="grid gap-2 sm:gap-4 w-full">
					<div class="w-full">
						<UFormGroup label="Select a category:" required :error="subjectError">
							<div class="w-full button-group-wrapper">
								<div class="button-group">
									<button
										type="button"
										class="subject-button"
										:class="{ active: subject === 'Landscape Volunteer' }"
										@click="selectSubject('Landscape Volunteer')"
									>
										Landscape 🪴🌴
									</button>
									<button
										type="button"
										class="subject-button"
										:class="{ active: subject === 'Cleaning Volunteer' }"
										@click="selectSubject('Cleaning Volunteer')"
									>
										Cleaning 🧹🧽
									</button>
									<button
										type="button"
										class="subject-button"
										:class="{ active: subject === 'Anything Volunteer' }"
										@click="selectSubject('Anything Volunteer')"
									>
										Anything ✨
									</button>
								</div>
							</div>
						</UFormGroup>
					</div>
					<div class="grid grid-cols-2 gap-2 sm:gap-4 w-full">
						<UFormGroup label="Name" required :error="nameError">
							<UInput v-model="name" />
						</UFormGroup>
						<UFormGroup label="Email" required :error="emailError">
							<UInput v-model="email" type="email" placeholder="name@domain.com" />
						</UFormGroup>
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 w-full">
						<UFormGroup label="Unit" :error="unitError">
							<USelect v-model="unit" :options="formattedOptions" placeholder="Select a unit" />
						</UFormGroup>
						<UFormGroup label="Phone">
							<UInput v-model="phone" type="text" placeholder="(555) 555-5555" />
						</UFormGroup>
						<UFormGroup label="Contact by:" required :error="preferenceError">
							<USelect
								v-model="contact_preference"
								:options="availablePreferenceOptions"
								:disabled="availablePreferenceOptions.length === 1"
							/>
						</UFormGroup>
					</div>
					<!-- <div class="grid grid-cols-2 gap-2 sm:gap-4">
						<UFormGroup label="Subject" required :error="subjectError">
							<USelect v-model="subject" :options="categories" placeholder="Select a subject" />
						</UFormGroup> 
					</div>-->
					<!-- Description -->
					<UFormGroup label="Comments">
						<TipTap v-model="description" :allow-uploads="false" rows="4" />
					</UFormGroup>

					<div class="flex justify-end space-x-3 pt-4 w-full pb-12">
						<UButton type="button" color="gray" variant="soft" @click="handleReset">Reset</UButton>
						<UButton type="submit" color="primary" :loading="isSubmitting" :disabled="isSubmitting">
							{{ isSubmitting ? 'Submitting...' : 'Submit' }}
						</UButton>
					</div>
				</form>
				<!-- <UButton @click="handleNext" color="primary">Next</UButton> -->
			</div>
			<div v-else class="w-full min-h-[500px] flex items-center justify-center flex-col">
				<h5 class="uppercase tracking-wider">
					Thank you
					<span v-if="name" class="font-bold text-[var(--cyan)]">{{ name.split(' ')[0] }}</span>
					.
				</h5>
				<p class="my-20">
					Your
					<span class="font-bold text-[var(--cyan)]" v-if="subject">{{ subject.toLowerCase() }}</span>
					request was submitted successfully.
				</p>
				<UButton @click="handleReset" color="primary">Reset Form</UButton>
			</div>
		</TransitionGroup>
	</div>
</template>

<style>
.button-group {
	display: flex;
	width: 100%;
	@apply rounded-sm overflow-hidden;
	.subject-button {
		@apply w-1/3 text-center uppercase bg-gray-300 text-xs py-2 text-gray-950 transition-all duration-300 sm:tracking-wide;
	}
	.subject-button:nth-of-type(2) {
		border-left: 1px solid #e5e7eb;
		border-right: 1px solid #e5e7eb;
	}
	.subject-button.active {
		@apply shadow-inner bg-[var(--cyan)] text-white font-bold;
	}
}
.transition-group {
	position: relative;
}

.transition-group > * {
	transition: all 0.3s ease-in-out;
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
