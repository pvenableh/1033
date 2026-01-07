<template>
	<div class="flex items-start gap-3 p-3 bg-gray-900/5 rounded-lg hover:bg-gray-900/10 transition-colors">
		<!-- Checkbox -->
		<button
			:disabled="isToggling"
			class="relative w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5"
			:class="[task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gold']"
			@click="handleToggle">
			<Icon v-if="task.completed && !isToggling" name="i-heroicons-check" class="w-3 h-3 text-white" />
			<Icon v-if="isToggling" name="i-heroicons-arrow-path" class="w-3 h-3 animate-spin text-gray-500" />
		</button>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<p class="text-sm transition-all" :class="[task.completed ? 'text-gray-400 line-through' : 'text-gray-900']">
				{{ task.title }}
			</p>

			<!-- Description -->
			<p v-if="task.description && !task.completed" class="text-xs text-gray-500 mt-1">
				{{ task.description }}
			</p>

			<!-- Meta row -->
			<div class="flex flex-wrap items-center gap-2 mt-1.5">
				<!-- Assignee -->
				<div v-if="task.assignee_id" class="flex items-center gap-1">
					<Avatar :src="getAvatarUrl(task.assignee_id)" :alt="task.assignee_id.first_name || 'User'" size="3xs" />
					<span class="text-xs text-gray-500">
						{{ task.assignee_id.first_name }}
					</span>
				</div>

				<!-- Due date -->
				<span
					v-if="task.due_date"
					class="text-xs flex items-center gap-1"
					:class="isOverdue ? 'text-red-500' : 'text-gray-400'">
					<Icon name="i-heroicons-clock" class="w-3 h-3" />
					{{ formatDueDate }}
				</span>

				<!-- Priority -->
				<span v-if="task.priority" class="text-xs px-1.5 py-0.5 rounded" :class="priorityClasses">
					{{ task.priority }}
				</span>

				<!-- Watchers -->
				<div v-if="task.watchers?.length" class="flex -space-x-1">
					<Avatar
						v-for="watcher in task.watchers.slice(0, 3)"
						:key="watcher.id"
						:src="getAvatarUrl(watcher.user_id)"
						:alt="watcher.user_id.first_name || 'User'"
						size="3xs"
						class="ring-2 ring-cream-alt"
						:title="`Watching: ${watcher.user_id.first_name}`" />
					<span
						v-if="task.watchers.length > 3"
						class="w-5 h-5 rounded-full bg-gray-200 text-xs flex items-center justify-center ring-2 ring-cream-alt">
						+{{ task.watchers.length - 3 }}
					</span>
				</div>
			</div>

			<!-- Completed info -->
			<p v-if="task.completed && task.completed_by" class="text-xs text-gray-400 mt-1">
				Completed by {{ task.completed_by.first_name }}
				{{ task.completed_at ? `on ${formatCompletedDate}` : '' }}
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue';
import type {ProjectTaskWithRelations} from '~/types/projects';
import type {DirectusUser} from '~/types/directus';

interface Props {
	task: ProjectTaskWithRelations;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	toggle: [taskId: string, completed: boolean];
}>();

const {getImageUrl} = useDirectusFiles();
const {celebrate} = useConfetti();

const isToggling = ref(false);

const handleToggle = async () => {
	if (isToggling.value) return;

	isToggling.value = true;
	const newCompleted = !props.task.completed;

	emit('toggle', props.task.id, newCompleted);

	// Celebrate if completing!
	if (newCompleted) {
		celebrate();
	}

	// Reset loading state after a short delay
	setTimeout(() => {
		isToggling.value = false;
	}, 500);
};

const isOverdue = computed(() => {
	if (!props.task.due_date || props.task.completed) return false;
	return new Date(props.task.due_date) < new Date();
});

const formatDueDate = computed(() => {
	if (!props.task.due_date) return '';
	const date = new Date(props.task.due_date);
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	if (date.toDateString() === today.toDateString()) return 'Today';
	if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

	return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
});

const formatCompletedDate = computed(() => {
	if (!props.task.completed_at) return '';
	return new Date(props.task.completed_at).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
});

const priorityClasses = computed(() => ({
	'bg-red-100 text-red-600': props.task.priority === 'high',
	'bg-yellow-100 text-yellow-700': props.task.priority === 'medium',
	'bg-gray-100 text-gray-500': props.task.priority === 'low',
}));

const getAvatarUrl = (user: DirectusUser | null) => {
	if (user?.avatar) {
		const avatarId = typeof user.avatar === 'string' ? user.avatar : user.avatar?.id;
		if (avatarId) return getImageUrl(avatarId);
	}
	return '/images/default-avatar.png';
};
</script>
