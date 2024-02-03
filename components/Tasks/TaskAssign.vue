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
if (props.task.assigned_to.length) {
	props.task.assigned_to.map((person) => {
		selectedUsers.value.push(person)
	})
}
const options = computed(() => {
	let arr = []
	users.value.map((person) => {
		arr.push({
			id: person.id,
			status: person.status,
			name: person.first_name + ' ' + person.last_name,
			avatar: { src: person.avatar }
		})
	})
	return arr;
})
function updateTask() {
	console.log("updating")
}
</script>
<template>
	<div class="task-card__assign">
		<UAvatar v-if="task.category === 'Completed'" color="green" icon="i-heroicons-check" size="xs"
			class="shadow border" />
		<UPopover v-else  @hide="updateTask()">
			<UAvatar icon="i-heroicons-user-plus" size="xs" class="shadow border" />
			<template #panel>
				<div class="p-4 h-60">
					<div class="w-full" v-if="selectedUsers.length">
						<UAvatarGroup size="sm">
							<UAvatar v-for="(person, index) in selectedUsers" :key="index"
								:src="'https://avatars.githubusercontent.com/u/739984?v=4'"
								:alt="person.first_name + ' ' + person.last_name" />

						</UAvatarGroup>
					</div>
					<h5>Assign users to task:</h5>

					<USelectMenu v-model="selectedUsers" :options="options" value-attribute="id"
    option-attribute="name" multiple
						placeholder="Select people" selected-icon="i-heroicons-check">
						<template #label>
							<span
								:class="[selected.status ? 'bg-green-400' : 'bg-gray-200', 'inline-block h-2 w-2 flex-shrink-0 rounded-full']"
								aria-hidden="true" />
							<span > {{ selected.name }} </span>
						</template>

						<template #option="{ option: person }">
							<span
								:class="[person.status ? 'bg-green-400' : 'bg-gray-200', 'inline-block h-2 w-2 flex-shrink-0 rounded-full']"
								aria-hidden="true" />
							<span >{{ person.name }} </span>
						</template>
						<!-- <template #leading>
							 <UIcon v-if="selected.icon" :name="selected.first_name" class="w-4 h-4 mx-0.5" />
							<UAvatar v-else-if="selected.avatar" v-bind="selected.avatar" size="3xs"
								class="mx-0.5" /> 
							
						</template>  -->
					</USelectMenu>

				</div>
			</template>
		</UPopover>
	</div></template>
<style></style>
