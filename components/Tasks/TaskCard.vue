<!-- eslint-disable no-console -->
<script setup>
import { openModal } from '~/composables/useTaskModal';

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

function editableFunction() {
	console.log('here');
}
</script>
<template>
	<div
		class="w-full flex flex-col items-center justify-between border bg-white dark:border-gray-800 dark:bg-gray-900 task-card"
		:class="{ alert: alert }"
		:data-id="task.id"
	>
		<div class="relative w-full flex flex-col items-start justify-start">
			<UButton
				icon="i-heroicons-pencil-square"
				size="xs"
				color="gray"
				variant="solid"
				:trailing="true"
				class="absolute right-[0px] -top-[2px]"
				@click.prevent="openModal(task, 'update')"
			/>

			<div class="w-full flex flex-row mb-2 task-card__category">
				<p class="uppercase inline-block font-bold tracking-wide" :class="slugify(task.category)">
					{{ task.category }}
				</p>
				<UIcon v-if="alert" name="i-heroicons-exclamation-triangle-solid" />
			</div>

			<h3 class="uppercase relative task-card__title">
				<UPopover mode="hover" :popper="{ placement: 'bottom', arrow: true }" class="inline-block mr-1">
					<UIcon name="i-heroicons-information-circle-solid" />
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
				{{ task.title }}
			</h3>

			<div class="task-card__description" v-html="task.description"></div>

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

			<TasksUsers :item="task.id" collection="tasks" />
		</div>
		<CommentsContainer :item="task.id" collection="tasks" />
	</div>
</template>
<style>
.task-card {
	animation: updated 0.35s var(--curve);

	@apply p-4 rounded-md shadow-lg mb-6;

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
		@apply font-bold pb-1;
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
		@apply w-full pb-2;

		strong {
			font-weight: 900;
			font-family: var(--font-bold);
		}

		ul,
		ol {
			list-style-type: disc;
			padding: 0 1rem;
		}

		blockquote {
			padding-left: 1rem;
			border-left: 2px solid rgba(#0d0d0d, 0.1);
		}
	}

	&__created {
		font-size: 10px;
		background: var(--grey);
		@apply text-white font-bold flex flex-col items-start justify-between uppercase;
	}
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
