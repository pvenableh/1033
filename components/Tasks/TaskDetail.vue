<script setup lang="ts">
const { user } = useDirectusAuth();

const props = defineProps({
	task: {
		type: Object,
		default: () => ({
			id: '',
			title: '',
			description: '',
			category: '',
			due_date: '',
			project: '',
		}),
	},
	action: {
		type: String,
		default: 'create',
	},
});

const state = ref({
	id: '',
	title: '',
	description: '',
	category: '',
	due_date: '',
	project: '',
});

if (props.action === 'create') {
	state.value = {
		category: 'Scheduled',
	};
}

if (props.action === 'update') {
	state.value = {
		id: props.id,
		title: props.title,
		description: props.description,
		category: props.category,
		due_date: props.due_date,
		project: props.project,
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
		const result = await useDirectus(
			createItem('tasks', {
				status: 'published',
				title: event.data.title,
				description: event.data.description,
				category: event.data.category,
				due_date: event.data.due_date,
				project: event.data.project,
				user_created: user?.id,
			}),
		);
		console.log(result);
	} else if (props.action === 'update') {
		const result = await useDirectus(
			updateItem('tasks', props.id, {
				title: event.data.title,
				description: event.data.description,
				category: event.data.category,
				due_date: event.data.due_date,
				project: event.data.project,
				user_updated: user?.id,
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
				<USelect v-model="state.category" :options="['Scheduled', 'In Progress', 'Completed']" required/>
			</UFormGroup>
			<UFormGroup label="Title" name="title">
				<UInput v-model="state.title" required />
			</UFormGroup>
			<UFormGroup label="Description" name="description">
				<UTextarea v-model="state.description" />
			</UFormGroup>
			<UFormGroup label="Due Date" name="due_date">
				<UInput v-model="state.due_date" type="datetime-local"/>
			</UFormGroup>
			<UButton type="submit">Submit</UButton>
		</UForm>
	</div>
</template>
<style></style>
