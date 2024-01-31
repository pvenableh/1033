<script setup>
const props = defineProps({
	task: {
		type: Object,
		default: null,
	},
});

const alert = computed(() => {
	if (props.task.due_date && props.task.category !== 'Completed') {
		if (isPastOrFuture(props.task.due_date) === 'past') {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
});
const editable = ref(false);

function makeEditable() {
      editable.value = !editable.value;
}
</script>
<template>
	<div class="w-full flex flex-col items-center justify-between bg-white dark:bg-gray-900 task-card" :class="{ alert: alert }">
		<div class="relative w-full flex flex-col items-start justify-start" :data-id="task.id">
			<UPopover mode="hover" :popper="{ placement: 'left', arrow: true }" class="absolute right-[0px] top-[0px]">
				<UIcon name="i-heroicons-information-circle" />
				<template #panel>
					<div class="p-4 task-card__created">
						<p v-if="task.date_updated" class="mb-1">
							Updated {{ getRelativeTime(task.date_updated) }} by {{ task.user_updated.first_name }}
							{{ getFirstLetter(task.user_updated.last_name) }}
						</p>
						<p class="">
							Created {{ getRelativeTime(task.date_created) }} by {{ task.user_created.first_name }}
							{{ getFirstLetter(task.user_created.last_name) }}
						</p>
					</div>
				</template>
			</UPopover>
			<div class="w-full flex flex-row mb-2 task-card__category">
				<p class="font-bold uppercase inline-block" :class="slugify(task.category)">{{ task.category }}</p>
				<UIcon v-if="alert" name="i-heroicons-exclamation-triangle-solid" />
			</div>

			<h3 class="uppercase task-card__title">{{ task.title }}</h3>
			<UTextarea class="task-card__description"  v-model="task.description" :disabled="editable" @dblclick="makeEditable()" />
		
			<input :disabled="!editable" placeholder="Editable input">
   			 <p :contentEditable="editable">Editable paragraph</p>
			<div class="flex flex-row items-center justify-between w-full">
				<div class="w-full flex flex-row items-center justify-between task-card__due">
					<h5
						v-if="task.due_date && task.category !== 'Completed'"
						class="uppercase leading-4"
						:class="{ 'alert font-bold': alert }"
					>
						<UIcon v-if="alert" name="i-heroicons-exclamation-triangle-solid" size="lg" class="-mb-[2px]" />
						Due {{ getRelativeTime(task.due_date) }}
						<UIcon v-if="alert" name="i-heroicons-exclamation-triangle-solid" size="lg" class="-mb-[2px]" />
					</h5>
					<h5 v-if="task.category === 'Completed'" class="uppercase">
						Completed on {{ getFriendlyDateThree(task.date_updated) }}
					</h5>
					<UAvatar
						v-if="task.category !== 'Completed' && !task.due_date"
						icon="i-heroicons-calendar-days"
						size="xs"
						class="shadow border"
					/>
				</div>
				<div v-if="task.assigned_to.length" class="task-card__people">
					<UTooltip
						v-for="(user, index) in task.assigned_to"
						:key="index"
						:text="user.directus_users_id.first_name + ' ' + user.directus_users_id.last_name"
						class="task-card__people-item"
					>
						<Avatar :key="index" :user="user.directus_users_id" size="xs" class="task-card__people-avatar" />
					</UTooltip>
				</div>
				<TasksTaskAssign v-else :task="task" />
			</div>
		</div>
		<div class="w-full border-t mt-4"></div>
		<CommentsContainer :item="task.id" collection="tasks" />
	</div>
</template>
<style>
.task-card {
	animation: updated 0.35s var(--curve);

	@apply p-4 rounded-md  shadow-lg mb-6;

	&__category {
		p {
			background: var(--lightGrey);
			color: var(--white);
			font-size: 7px;
			@apply font-bold uppercase px-2 py-1 rounded-full;
		}
		.scheduled {
			background: var(--cyan);
			color: var(--black);
		}
		.in-progress {
			background: var(--green);
			color: var(--black);
		}
		span {
			color: red;
			@apply inline-block ml-2 border-2 border-red-500;
		}
	}
	&__title {
		fonts-size: 16px;
		@apply font-bold;
	}
	&__due {
		font-size: 10px;
		@apply font-bold;
		.alert {
			@apply text-red-500;
		}
	}
	&__description {
		font-size: 12px;
		@apply my-4;
	}
	&__created {
		font-size: 10px;
		background: var(--grey);
		@apply text-white font-bold flex flex-col items-start justify-between uppercase;
	}
	&__people {
		@apply inline-flex flex-row-reverse justify-end uppercase;
		&-item {
			@apply -me-1.5 first:me-0;
		}
		&-avatar {
			@apply ring-2 ring-white dark:ring-gray-900;
		}
	}
	/* &:hover {
		cursor: grab;
	} */
}
.task-card.alert {
	@apply border-2 border-red-500;
}
.updated {
	animation: updated 0.35s var(--curve);
}

@keyframes updated {
	0% {
		transform: scale(1);
		background: #f9f9f9;
	}

	50% {
		transform: scale(1.02);
		background: var(--white);
	}

	to {
		transform: scale(1);
		background: #f9f9f9;
	}
}
</style>
