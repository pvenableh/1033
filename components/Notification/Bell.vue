<template>
	<div class="notification-bell relative">
		<button
			@click="handleBellClick"
			class="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10"
			:class="{'bg-black/5 dark:bg-white/5': isOpen}"
			aria-label="Notifications"
			:title="user ? `${totalUnreadCount} unread notifications` : 'Sign in to view notifications'">
			<!-- Bell icon -->
			<Icon
				name="i-heroicons-bell"
				class="w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform"
				:class="{'animate-ring': hasNewNotification}" />

			<!-- Badge (only shown for authenticated users with unread notifications) -->
			<Transition
				enter-active-class="transition-all duration-200 ease-out"
				leave-active-class="transition-all duration-150 ease-in"
				enter-from-class="opacity-0 scale-50"
				leave-to-class="opacity-0 scale-50">
				<span
					v-if="user && totalUnreadCount > 0"
					class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
					{{ displayCount }}
				</span>
			</Transition>
		</button>

		<!-- Notification Panel -->
		<NotificationPanel />
	</div>
</template>

<script setup lang="ts">
const {user} = useDirectusAuth();
const toast = useToast();

const {
	isOpen,
	totalUnreadCount,
	togglePanel,
	initialize,
	startAutoRefresh,
	stopAutoRefresh,
	startRealtimeSubscription,
	stopRealtimeSubscription,
} = useNotificationCenter();

// Handle bell click - show toast if not authenticated
const handleBellClick = () => {
	if (!user.value) {
		toast.add({
			title: 'Sign in required',
			description: 'Please sign in to view notifications',
			icon: 'i-heroicons-lock-closed',
			color: 'amber',
			timeout: 4000,
		});
		return;
	}
	togglePanel();
};

// Display count (max 99+)
const displayCount = computed(() => {
	if (totalUnreadCount.value > 99) {
		return '99+';
	}
	return totalUnreadCount.value.toString();
});

// Track new notifications for animation
const previousCount = ref(0);
const hasNewNotification = ref(false);

watch(totalUnreadCount, (newCount, oldCount) => {
	if (newCount > oldCount) {
		hasNewNotification.value = true;
		setTimeout(() => {
			hasNewNotification.value = false;
		}, 1000);
	}
	previousCount.value = newCount;
});

// Initialize on mount
onMounted(() => {
	initialize();
	startAutoRefresh(60000); // Refresh every 60 seconds
	startRealtimeSubscription(); // Enable realtime updates for authenticated users
});

onUnmounted(() => {
	stopAutoRefresh();
	stopRealtimeSubscription();
});
</script>

<style scoped>
@keyframes ring {
	0% {
		transform: rotate(0deg);
	}
	10% {
		transform: rotate(15deg);
	}
	20% {
		transform: rotate(-15deg);
	}
	30% {
		transform: rotate(10deg);
	}
	40% {
		transform: rotate(-10deg);
	}
	50% {
		transform: rotate(5deg);
	}
	60% {
		transform: rotate(-5deg);
	}
	70% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(0deg);
	}
}

.animate-ring {
	animation: ring 0.8s ease-in-out;
}
</style>
