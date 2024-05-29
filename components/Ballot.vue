<!-- eslint-disable no-console -->
<script setup lang="ts">
import { isOpen, closeModal } from '~/composables/useTaskModal';

const { user } = useDirectusAuth();

const units = ref(['201', '202', '203', '204']);

const props = defineProps({
	option: {
		type: Object,
		default: () => ({
			id: '',
			title: '',
			building_color: '',
			gate_color: '',
			railings_color: '',
			cost: '',
			extra_cost: '',
		}),
	},
});

const state = ref({
	id: '',
	title: '',
	building_color: '',
	gate_color: '',
	railings_color: '',
	cost: '',
	extra_cost: '',
	date_updated: format(new Date(), 'YYYY-MM-DD') + 'T17:00';
});

const action = ref('');

onMounted(() => {
	if (props.option.id) {
		action.value = 'update';
		state.value = {
			id: props.option.id,
			title: props.option.title,
			building_color: props.option.building_color,
			gate_color: props.option.gate_color,
			railings_color: props.option.railings_color,
			cost: props.option.cost,
			extra_cost: props.option.extra_cost,
		};
	} else {
		action.value = 'create';
	}
});

if (action.value === 'create') {
	state.value.due_date = format(new Date(), 'YYYY-MM-DD') + 'T17:00';
}

if (action.value === 'update') {
	state.value = {
		title: props.task.title,
		description: props.task.description,
		category: props.task.category,
		due_date: props.task.due_date,
		project: props.task.project,
	};
}

const validate = (state: any): FormError[] => {
	const errors = [];
	if (!state.title) errors.push({ path: 'title', message: 'Required' });
	if (!state.category) errors.push({ path: 'category', message: 'Required' });
	return errors;
};

async function onSubmit(event: FormSubmitEvent<any>) {
		if (props.action === 'create') {
			console.log(event.data.title);

			const result = await useDirectus(
				createItem('tasks', {
					status: 'published',
					title: event.data.title,
					description: event.data.description,
					category: event.data.category,
					due_date: event.data.due_date,
				}),
			);

		} else if (props.action === 'update') {
			const result = await useDirectus(
				updateItem('tasks', props.task.id, {
					title: event.data.title,
					description: event.data.description,
					category: event.data.category,
					due_date: event.data.due_date,
					project: event.data.project,
					user_updated: user.value.id,
				}),
			);

			console.log(result);
		}
}
</script>

<template>
	<div class="w-full h-full p-6">
		<UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
			<UFormGroup label="Status" name="category">
				<USelect v-model="state.category" :options="['Pending', 'Scheduled', 'In Progress', 'Completed']" required />
			</UFormGroup>
			<UFormGroup label="Title" name="title">
				<UInput v-model="state.title" required />
			</UFormGroup>
			<UFormGroup label="Description" name="description">
				<FormTiptap v-model="state.description" />
			</UFormGroup>
			<UFormGroup label="Due Date" name="due_date">
				<UInput v-model="state.due_date" type="datetime-local" />
			</UFormGroup>

			<UButton type="submit">Submit</UButton>
		</UForm>
	</div>
</template>
<style></style>
