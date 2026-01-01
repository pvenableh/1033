<template>
	<div class="channel-list h-full flex flex-col">
		<!-- Header -->
		<div class="p-4 border-b border-gray-200 dark:border-gray-700">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Channels</h2>
				<UButton
					v-if="canCreateChannel"
					size="xs"
					color="primary"
					variant="ghost"
					icon="i-heroicons-plus"
					@click="showCreateModal = true" />
			</div>
		</div>

		<!-- Channel List -->
		<div class="flex-1 overflow-y-auto">
			<div v-if="loading" class="p-4 space-y-2">
				<USkeleton class="h-10 w-full" v-for="i in 5" :key="i" />
			</div>

			<div v-else-if="error" class="p-4 text-center text-red-500">
				<UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 mx-auto mb-2" />
				<p>{{ error }}</p>
				<UButton size="xs" color="gray" class="mt-2" @click="loadChannels">Retry</UButton>
			</div>

			<div v-else-if="channels.length === 0" class="p-4 text-center text-gray-500">
				<UIcon name="i-heroicons-chat-bubble-left-right" class="w-12 h-12 mx-auto mb-2 opacity-50" />
				<p>No channels yet</p>
				<UButton
					v-if="canCreateChannel"
					size="sm"
					color="primary"
					class="mt-3"
					@click="showCreateModal = true">
					Create your first channel
				</UButton>
			</div>

			<nav v-else class="py-2">
				<button
					v-for="channel in channels"
					:key="channel.id"
					class="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
					:class="{'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500': selectedChannelId === channel.id}"
					@click="selectChannel(channel)">
					<UIcon
						:name="getChannelIcon(channel)"
						class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-medium text-gray-900 dark:text-white truncate">
								{{ channel.name }}
							</span>
							<UBadge
								v-if="channel.is_private"
								size="xs"
								color="gray"
								variant="subtle">
								Private
							</UBadge>
						</div>
						<p v-if="channel.description" class="text-xs text-gray-500 truncate">
							{{ channel.description }}
						</p>
					</div>
					<UBadge
						v-if="getUnreadCount(channel.id) > 0"
						size="xs"
						color="primary">
						{{ getUnreadCount(channel.id) }}
					</UBadge>
				</button>
			</nav>
		</div>

		<!-- Create Channel Modal -->
		<UModal v-model="showCreateModal">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Create Channel</h3>
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-x-mark"
							@click="showCreateModal = false" />
					</div>
				</template>

				<form @submit.prevent="handleCreateChannel" class="space-y-4">
					<UFormGroup label="Channel Name" required>
						<UInput
							v-model="newChannel.name"
							placeholder="e.g., General, Finance Committee"
							:disabled="creating" />
					</UFormGroup>

					<UFormGroup label="Description">
						<UTextarea
							v-model="newChannel.description"
							placeholder="What's this channel about?"
							:rows="2"
							:disabled="creating" />
					</UFormGroup>

					<UFormGroup label="Icon">
						<USelectMenu
							v-model="newChannel.icon"
							:options="iconOptions"
							:disabled="creating">
							<template #label>
								<div class="flex items-center gap-2">
									<UIcon :name="newChannel.icon || 'i-heroicons-chat-bubble-left-right'" class="w-4 h-4" />
									<span>{{ newChannel.icon?.replace('i-heroicons-', '') || 'chat-bubble-left-right' }}</span>
								</div>
							</template>
							<template #option="{ option }">
								<div class="flex items-center gap-2">
									<UIcon :name="option.value" class="w-4 h-4" />
									<span>{{ option.label }}</span>
								</div>
							</template>
						</USelectMenu>
					</UFormGroup>

					<UFormGroup>
						<UCheckbox
							v-model="newChannel.is_private"
							label="Private channel (require explicit invitation)"
							:disabled="creating" />
					</UFormGroup>
				</form>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton color="gray" variant="ghost" @click="showCreateModal = false" :disabled="creating">
							Cancel
						</UButton>
						<UButton color="primary" @click="handleCreateChannel" :loading="creating">
							Create Channel
						</UButton>
					</div>
				</template>
			</UCard>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import type {Channel} from '~/types/channels';

const props = defineProps({
	selectedChannelId: {
		type: String,
		default: null,
	},
});

const emit = defineEmits(['select', 'created']);

const {getChannels, createChannel, useChannelsSubscription, getUnreadCount: fetchUnreadCount} = useChannels();
const {isBoardMember, isAdmin} = useRoles();
const toast = useToast();

const channels = ref<Channel[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const showCreateModal = ref(false);
const creating = ref(false);
const unreadCounts = ref<Record<string, number>>({});

const newChannel = ref({
	name: '',
	description: '',
	icon: 'i-heroicons-chat-bubble-left-right',
	is_private: false,
});

const iconOptions = [
	{value: 'i-heroicons-chat-bubble-left-right', label: 'Chat'},
	{value: 'i-heroicons-users', label: 'Users'},
	{value: 'i-heroicons-briefcase', label: 'Briefcase'},
	{value: 'i-heroicons-currency-dollar', label: 'Finance'},
	{value: 'i-heroicons-calendar', label: 'Calendar'},
	{value: 'i-heroicons-clipboard-document-list', label: 'Tasks'},
	{value: 'i-heroicons-megaphone', label: 'Announcements'},
	{value: 'i-heroicons-light-bulb', label: 'Ideas'},
	{value: 'i-heroicons-wrench-screwdriver', label: 'Maintenance'},
	{value: 'i-heroicons-shield-check', label: 'Security'},
];

const canCreateChannel = computed(() => isBoardMember.value || isAdmin.value);

const getChannelIcon = (channel: Channel) => {
	if (channel.icon) {
		// Handle both 'chat' and 'i-heroicons-chat' formats
		return channel.icon.startsWith('i-') ? channel.icon : `i-heroicons-${channel.icon}`;
	}
	return channel.is_private ? 'i-heroicons-lock-closed' : 'i-heroicons-chat-bubble-left-right';
};

const getUnreadCount = (channelId: string) => {
	return unreadCounts.value[channelId] || 0;
};

const loadChannels = async () => {
	loading.value = true;
	error.value = null;

	try {
		channels.value = await getChannels();

		// Load unread counts
		for (const channel of channels.value) {
			try {
				unreadCounts.value[channel.id] = await fetchUnreadCount(channel.id);
			} catch (e) {
				// Ignore individual count errors
			}
		}
	} catch (e: any) {
		error.value = e.message || 'Failed to load channels';
	} finally {
		loading.value = false;
	}
};

const selectChannel = (channel: Channel) => {
	emit('select', channel);
};

const handleCreateChannel = async () => {
	if (!newChannel.value.name.trim()) {
		toast.add({title: 'Error', description: 'Channel name is required', color: 'red'});
		return;
	}

	creating.value = true;

	try {
		const channel = await createChannel({
			name: newChannel.value.name.trim(),
			description: newChannel.value.description.trim() || undefined,
			icon: newChannel.value.icon || undefined,
			is_private: newChannel.value.is_private,
		});

		channels.value.unshift(channel);
		showCreateModal.value = false;

		// Reset form
		newChannel.value = {
			name: '',
			description: '',
			icon: 'i-heroicons-chat-bubble-left-right',
			is_private: false,
		};

		toast.add({title: 'Success', description: `Channel #${channel.name} created`, color: 'green'});
		emit('created', channel);
		selectChannel(channel);
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to create channel', color: 'red'});
	} finally {
		creating.value = false;
	}
};

// Subscribe to real-time channel updates
const {data: realtimeChannels} = useChannelsSubscription();

watch(realtimeChannels, (newChannels) => {
	if (newChannels && newChannels.length > 0) {
		channels.value = newChannels as Channel[];
	}
});

onMounted(() => {
	loadChannels();
});
</script>

<style scoped>
.channel-list {
	min-width: 250px;
}
</style>
