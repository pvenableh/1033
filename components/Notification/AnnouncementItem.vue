<template>
	<div
		class="announcement-item group relative px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
		:class="{'bg-yellow-50/50 dark:bg-yellow-900/10': !isRead}"
		@click="handleClick">
		<!-- Unread indicator -->
		<div
			v-if="!isRead"
			class="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-500" />

		<div class="flex items-start gap-3">
			<!-- Icon -->
			<div class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30">
				<UIcon name="i-heroicons-megaphone" class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
			</div>

			<!-- Content -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2">
					<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
						{{ announcement.title }}
					</p>
					<UBadge
						v-if="!isRead"
						size="xs"
						color="yellow"
						variant="soft"
						class="flex-shrink-0">
						New
					</UBadge>
				</div>
				<p
					v-if="announcement.subtitle"
					class="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
					{{ announcement.subtitle }}
				</p>
				<p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
					{{ formattedDate }}
				</p>
			</div>

			<!-- View indicator -->
			<div class="flex-shrink-0 flex items-center">
				<UIcon
					name="i-heroicons-arrow-top-right-on-square"
					class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Announcement } from '~/composables/useNotificationCenter';

const props = defineProps<{
	announcement: Announcement;
	isRead: boolean;
}>();

const emit = defineEmits<{
	markAsRead: [id: string];
	click: [announcement: Announcement];
}>();

// Computed: formatted date
const formattedDate = computed(() => {
	const date = new Date(props.announcement.date_sent);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffDays < 1) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	if (diffDays < 7) return `${diffDays} days ago`;

	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
	});
});

// Handle click
const handleClick = () => {
	// Mark as read
	if (!props.isRead) {
		emit('markAsRead', props.announcement.id);
	}
	emit('click', props.announcement);

	// Navigate to announcement
	if (props.announcement.url) {
		window.open(`/announcements/email/${props.announcement.url}`, '_blank');
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
