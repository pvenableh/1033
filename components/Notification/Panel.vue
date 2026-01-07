<template>
	<LayoutSidePanel
		:model-value="isOpen"
		@update:model-value="handlePanelToggle"
		title="Notifications"
		@closed="handleClosed">
		<!-- Empty trigger slot - Bell.vue provides the trigger -->
		<!-- <template #trigger></template> -->
		<template #header>
			<div class="flex items-center justify-between w-full">
				<h2 class="font-semibold text-gray-900 dark:text-white">Notifications</h2>
				<div class="flex items-center gap-2">
					<Button
						v-if="totalUnreadCount > 0"
						variant="ghost"
						size="xs"
						color="gray"
						@click="handleMarkAllAsRead"
						:loading="markingAllAsRead">
						Mark all read
					</UButton>
				</div>
			</div>
		</template>

		<!-- Tabs -->
		<div class="flex border-b border-gray-200 dark:border-gray-700 px-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
			<button
				v-for="tab in tabs"
				:key="tab.value"
				@click="activeTab = tab.value"
				class="relative px-4 py-2.5 text-sm font-medium transition-colors"
				:class="[
					activeTab === tab.value
						? 'text-primary dark:text-primary'
						: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
				]">
				{{ tab.label }}
				<span
					v-if="tab.count > 0"
					class="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full"
					:class="[
						activeTab === tab.value
							? 'bg-primary-100 text-primary dark:bg-primary-900/30 dark:text-primary'
							: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
					]">
					{{ tab.count }}
				</span>
				<!-- Active indicator -->
				<div
					v-if="activeTab === tab.value"
					class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary" />
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1">
			<!-- Loading state -->
			<div v-if="loading" class="p-4 space-y-3">
				<div v-for="i in 5" :key="i" class="flex items-start gap-3">
					<USkeleton class="w-9 h-9 rounded-full" />
					<div class="flex-1 space-y-2">
						<USkeleton class="h-4 w-3/4" />
						<USkeleton class="h-3 w-1/2" />
					</div>
				</div>
			</div>

			<!-- Empty state -->
			<div
				v-else-if="displayedItems.length === 0"
				class="flex flex-col items-center justify-center py-12 px-4 text-center">
				<div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
					<Icon :name="emptyStateIcon" class="w-8 h-8 text-gray-400" />
				</div>
				<p class="text-sm font-medium text-gray-900 dark:text-white">{{ emptyStateTitle }}</p>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ emptyStateMessage }}</p>
			</div>

			<!-- Notifications list -->
			<div v-else>
				<!-- Announcements tab -->
				<template v-if="activeTab === 'announcements'">
					<NotificationAnnouncementItem
						v-for="announcement in displayedAnnouncements"
						:key="announcement.id"
						:announcement="announcement"
						:is-read="isAnnouncementRead(announcement.id)"
						@mark-as-read="markAnnouncementAsRead"
						@click="handleAnnouncementClick" />
				</template>

				<!-- All/Unread tabs -->
				<template v-else>
					<NotificationItem
						v-for="notification in displayedNotifications"
						:key="notification.id"
						:notification="notification"
						@mark-as-read="handleMarkAsRead"
						@mark-as-unread="handleMarkAsUnread"
						@delete="handleDelete"
						@click="handleNotificationClick" />
				</template>
			</div>
		</div>

		<!-- Footer -->
		<template #footer>
			<div class="p-4 flex items-center justify-between">
				<!-- <Buttonv-if="isAuthenticated" variant="ghost" size="xs" color="gray" to="/notifications" @click="closePanel">
					View all notifications
					<Icon name="i-heroicons-arrow-right" class="w-3 h-3 ml-1" />
				</UButton> -->
				<Buttonvariant="ghost" size="xs" color="gray" @click="refresh" :loading="loading">
					<Icon name="i-heroicons-arrow-path" class="w-3 h-3" :class="{'animate-spin': loading}" />
				</UButton>
			</div>
		</template>
	</LayoutSidePanel>
</template>

<script setup lang="ts">
import type {DirectusNotification} from '~/composables/useDirectusNotifications';
import type {Announcement} from '~/composables/useNotificationCenter';

const {
	isOpen,
	activeTab,
	notifications,
	announcements,
	loading,
	totalUnreadCount,
	unreadNotificationCount,
	unreadAnnouncementCount,
	closePanel,
	markAsRead,
	markAllAsRead,
	markAsUnread,
	deleteNotification,
	markAnnouncementAsRead,
	isAnnouncementRead,
	refresh,
} = useNotificationCenter();

const {user} = useDirectusAuth();

const isAuthenticated = computed(() => !!user.value);

// Tabs configuration
const tabs = computed(() => [
	{
		value: 'unread' as const,
		label: 'Unread',
		count: unreadNotificationCount.value,
	},
	{
		value: 'all' as const,
		label: 'All',
		count: 0,
	},
	{
		value: 'announcements' as const,
		label: 'Notices',
		count: unreadAnnouncementCount.value,
	},
]);

// Filtered notifications based on active tab
const displayedNotifications = computed(() => {
	if (activeTab.value === 'unread') {
		return notifications.value.filter((n) => n.status === 'inbox');
	}
	return notifications.value;
});

const displayedAnnouncements = computed(() => announcements.value);

// Combined displayed items for empty state check
const displayedItems = computed(() => {
	if (activeTab.value === 'announcements') {
		return displayedAnnouncements.value;
	}
	return displayedNotifications.value;
});

// Empty state content
const emptyStateIcon = computed(() => {
	switch (activeTab.value) {
		case 'unread':
			return 'i-heroicons-inbox';
		case 'announcements':
			return 'i-heroicons-megaphone';
		default:
			return 'i-heroicons-bell-slash';
	}
});

const emptyStateTitle = computed(() => {
	switch (activeTab.value) {
		case 'unread':
			return 'All caught up!';
		case 'announcements':
			return 'No notices';
		default:
			return 'No notifications';
	}
});

const emptyStateMessage = computed(() => {
	switch (activeTab.value) {
		case 'unread':
			return 'You have no unread notifications';
		case 'announcements':
			return 'Check back later for updates';
		default:
			return 'Notifications will appear here';
	}
});

// Actions
const markingAllAsRead = ref(false);

const handleMarkAllAsRead = async () => {
	markingAllAsRead.value = true;
	try {
		await markAllAsRead();
	} finally {
		markingAllAsRead.value = false;
	}
};

const handleMarkAsRead = (id: string) => {
	markAsRead(id);
};

const handleMarkAsUnread = (id: string) => {
	markAsUnread(id);
};

const handleDelete = (id: string) => {
	deleteNotification(id);
};

const handleNotificationClick = (notification: DirectusNotification) => {
	// Mark as read and close panel
	if (notification.status === 'inbox') {
		markAsRead(notification.id);
	}
	closePanel();
};

const handleAnnouncementClick = (announcement: Announcement) => {
	markAnnouncementAsRead(announcement.id);
};

const handleClosed = () => {
	// Panel was closed
};

const handlePanelToggle = (value: boolean) => {
	if (value) {
		// Panel should open - but this is handled by Bell.vue
	} else {
		closePanel();
	}
};
</script>
