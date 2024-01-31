<script setup>
const props = defineProps({
	task: {
		type: Object,
		default: null,
	},
});

const {
	data: users,
	pending,
	error,
} = await useAsyncData('users', () => {
	return useDirectus(
		readUsers({
			fields: ['*'],
		}),
	);
});

const selectedUsers = ref([]);
const selected = ref({});
</script>
<template>
	<div class="task-card__assign">
		<UAvatar
			v-if="task.category === 'Completed'"
			color="green"
			icon="i-heroicons-check"
			size="xs"
			class="shadow border"
		/>
		<UPopover v-else>
			<UAvatar icon="i-heroicons-user-plus" size="xs" class="shadow border" />
			<template #panel>
				<div class="p-4">
					<h5>Assign users to task:</h5>
					<USelectMenu v-model="selected" :options="users">
						<template #leading>
							<UAvatar v-if="selected.avatar" v-bind="selected.avatar" size="3xs" class="mx-0.5" />
						</template>
					</USelectMenu>
				</div>
			</template>
		</UPopover>
	</div>
</template>
<style></style>
