<template>
	<div
		class="notification-item group relative px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
		:class="{'bg-blue-50/50 dark:bg-blue-900/10': !isRead}">
		<!-- Unread indicator -->
		<div
			v-if="!isRead"
			class="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />

		<div class="flex items-start gap-3">
			<!-- Icon based on notification type -->
			<div
				class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
				:class="iconBgClass">
				<UIcon :name="iconName" class="w-4 h-4" :class="iconColorClass" />
			</div>

			<!-- Content -->
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
					{{ notification.subject }}
				</p>
				<p
					v-if="notification.message"
					class="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
					{{ notification.message }}
				</p>
				<p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
					{{ formattedTime }}
				</p>
			</div>

			<!-- Actions -->
			<div class="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				<button
					v-if="!isRead"
					@click.stop="$emit('markAsRead', notification.id)"
					class="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					title="Mark as read">
					<UIcon name="i-heroicons-check" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
				</button>
				<button
					v-else
					@click.stop="$emit('markAsUnread', notification.id)"
					class="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					title="Mark as unread">
					<UIcon name="i-heroicons-envelope" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
				</button>
				<button
					@click.stop="$emit('delete', notification.id)"
					class="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
					title="Delete">
					<UIcon name="i-heroicons-trash" class="w-4 h-4 text-gray-500 hover:text-red-500 dark:text-gray-400" />
				</button>
			</div>
		</div>

		<!-- Click target for navigation -->
		<nuxt-link
			v-if="linkTo"
			:to="linkTo"
			class="absolute inset-0"
			@click="handleClick" />
	</div>
</template>

<script setup lang="ts">
import type { DirectusNotification } from '~/composables/useDirectusNotifications';

const props = defineProps<{
	notification: DirectusNotification;
}>();

const emit = defineEmits<{
	markAsRead: [id: string];
	markAsUnread: [id: string];
	delete: [id: string];
	click: [notification: DirectusNotification];
}>();

// Computed: is read
const isRead = computed(() => props.notification.status === 'archived');

// Computed: formatted time
const formattedTime = computed(() => {
	const date = new Date(props.notification.timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;

	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
});

// Computed: icon based on collection type
const iconName = computed(() => {
	const collection = props.notification.collection;

	switch (collection) {
		case 'channels':
			return 'i-heroicons-chat-bubble-left-right';
		case 'comments':
			return 'i-heroicons-chat-bubble-oval-left';
		case 'tasks':
			return 'i-heroicons-clipboard-document-check';
		case 'projects':
			return 'i-heroicons-folder';
		case 'reactions':
			return 'i-heroicons-heart';
		case 'announcements':
			return 'i-heroicons-megaphone';
		default:
			return 'i-heroicons-bell';
	}
});

const iconBgClass = computed(() => {
	const collection = props.notification.collection;

	switch (collection) {
		case 'channels':
			return 'bg-blue-100 dark:bg-blue-900/30';
		case 'comments':
			return 'bg-green-100 dark:bg-green-900/30';
		case 'tasks':
			return 'bg-purple-100 dark:bg-purple-900/30';
		case 'projects':
			return 'bg-orange-100 dark:bg-orange-900/30';
		case 'reactions':
			return 'bg-pink-100 dark:bg-pink-900/30';
		case 'announcements':
			return 'bg-yellow-100 dark:bg-yellow-900/30';
		default:
			return 'bg-gray-100 dark:bg-gray-800';
	}
});

const iconColorClass = computed(() => {
	const collection = props.notification.collection;

	switch (collection) {
		case 'channels':
			return 'text-blue-600 dark:text-blue-400';
		case 'comments':
			return 'text-green-600 dark:text-green-400';
		case 'tasks':
			return 'text-purple-600 dark:text-purple-400';
		case 'projects':
			return 'text-orange-600 dark:text-orange-400';
		case 'reactions':
			return 'text-pink-600 dark:text-pink-400';
		case 'announcements':
			return 'text-yellow-600 dark:text-yellow-400';
		default:
			return 'text-gray-600 dark:text-gray-400';
	}
});

// Computed: link destination based on collection and item
const linkTo = computed(() => {
	const { collection, item } = props.notification;

	if (!collection || !item) return null;

	switch (collection) {
		case 'channels':
			return `/channels/${item}`;
		case 'tasks':
			return `/tasks/${item}`;
		case 'projects':
			return `/projects/${item}`;
		case 'announcements':
			return `/announcements/${item}`;
		default:
			return null;
	}
});

// Handle click
const handleClick = () => {
	emit('click', props.notification);
	// Auto-mark as read on click if unread
	if (!isRead.value) {
		emit('markAsRead', props.notification.id);
	}
};
</script>

<style scoped>
.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>
