<template>
	<div class="channels-page flex border-b-2 border-gray-200 dark:border-gray-700">
		<!-- Mobile Channel Sidebar Overlay -->
		<Transition name="fade">
			<div
				v-if="showMobileSidebar"
				class="fixed inset-0 bg-black/50 z-40 lg:hidden"
				@click="showMobileSidebar = false" />
		</Transition>

		<!-- Channel Sidebar - Desktop: always visible, Mobile: slide-in drawer -->
		<Transition name="slide-sidebar">
			<div
				v-show="showMobileSidebar || isDesktop"
				class="channel-sidebar w-72 lg:w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0
					   fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto lg:translate-x-0">
				<ChannelList
					:selected-channel-id="selectedChannelId"
					@select="handleChannelSelect"
					@created="handleChannelSelect" />
			</div>
		</Transition>

		<!-- Main Content -->
		<div class="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0">
			<template v-if="selectedChannelId">
				<!-- Mobile Header with Menu Button -->
				<div class="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
					<Button
						color="gray"
						variant="ghost"
						icon="i-heroicons-bars-3"
						size="sm"
						@click="showMobileSidebar = true" />
					<span class="font-semibold text-gray-900 dark:text-white truncate">
						#{{ currentChannelName }}
					</span>
				</div>
				<ChannelView
					:channel-id="selectedChannelId"
					:hide-header-on-mobile="true"
					@channel-updated="handleChannelUpdated"
					@channel-loaded="handleChannelLoaded" />
			</template>

			<template v-else>
				<div class="flex-1 flex items-center justify-center p-4">
					<div class="text-center">
						<!-- Mobile: Show button to open sidebar -->
						<Button
							class="lg:hidden mb-6"
							color="primary"
							@click="showMobileSidebar = true">
							<Icon name="i-heroicons-bars-3" class="w-5 h-5 mr-2" />
							Browse Channels
						</UButton>
						<Icon
							name="i-heroicons-chat-bubble-left-right"
							class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
						<h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to Channels</h2>
						<p class="text-gray-500 dark:text-gray-400 max-w-md">
							Select a channel from the sidebar to start communicating with your team. Use @mentions to alert specific
							members.
						</p>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import type {Channel} from '~/types/channels';

definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();

const selectedChannelId = ref<string | undefined>(undefined);
const showMobileSidebar = ref(false);
const currentChannelName = ref('');

// Detect desktop breakpoint (lg = 1024px)
const isDesktop = ref(true);

const updateIsDesktop = () => {
	isDesktop.value = window.innerWidth >= 1024;
};

const handleChannelSelect = (channel: Channel) => {
	selectedChannelId.value = channel.id;
	currentChannelName.value = channel.name;
	router.replace({query: {channel: channel.id}});
	// Close mobile sidebar after selection
	showMobileSidebar.value = false;
};

const handleChannelUpdated = () => {
	// Handle channel updates if needed
};

const handleChannelLoaded = (channel: Channel) => {
	currentChannelName.value = channel.name;
};

// Initialize from URL query
onMounted(() => {
	updateIsDesktop();
	window.addEventListener('resize', updateIsDesktop);

	if (route.query.channel) {
		selectedChannelId.value = route.query.channel as string;
	}
});

onUnmounted(() => {
	window.removeEventListener('resize', updateIsDesktop);
});

// Watch for URL changes
watch(
	() => route.query.channel,
	(channelId) => {
		if (channelId && channelId !== selectedChannelId.value) {
			selectedChannelId.value = channelId as string;
		}
	}
);
</script>

<style scoped>
.channels-page {
	/* Account for: header (52px) + secondary nav (~40px) + footer space */
	height: calc(100vh - 52px - 40px - 60px);
	min-height: 400px;
}

/* Mobile sidebar height adjustment */
.channel-sidebar {
	height: 100%;
}

@media (max-width: 1023px) {
	.channel-sidebar {
		height: 100vh;
		top: 0;
	}
}

/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

/* Slide transition for sidebar */
.slide-sidebar-enter-active,
.slide-sidebar-leave-active {
	transition: transform 0.3s ease;
}

.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
	transform: translateX(-100%);
}

@media (min-width: 1024px) {
	.slide-sidebar-enter-from,
	.slide-sidebar-leave-to {
		transform: translateX(0);
	}
}
</style>
