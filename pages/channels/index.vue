<template>
	<div class="channels-page flex border-b-2 border-gray-200 dark:border-gray-700">
		<!-- Channel Sidebar -->
		<div class="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
			<ChannelList :selected-channel-id="selectedChannelId" @select="selectChannel" @created="selectChannel" />
		</div>

		<!-- Main Content -->
		<div class="flex-1 flex flex-col bg-white dark:bg-gray-900">
			<template v-if="selectedChannelId">
				<ChannelView :channel-id="selectedChannelId" @channel-updated="handleChannelUpdated" />
			</template>

			<template v-else>
				<div class="flex-1 flex items-center justify-center">
					<div class="text-center">
						<UIcon
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

const selectedChannelId = ref<string | null>(null);

const selectChannel = (channel: Channel) => {
	selectedChannelId.value = channel.id;
	router.replace({query: {channel: channel.id}});
};

const handleChannelUpdated = () => {
	// Handle channel updates if needed
};

// Initialize from URL query
onMounted(() => {
	if (route.query.channel) {
		selectedChannelId.value = route.query.channel as string;
	}
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
</style>
