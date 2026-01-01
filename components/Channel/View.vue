<template>
	<div class="channel-view h-full flex flex-col">
		<!-- Header -->
		<div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<UIcon
						:name="channelIcon"
						class="w-6 h-6 text-gray-500 dark:text-gray-400" />
					<div>
						<h2 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
							#{{ channel?.name }}
							<UBadge v-if="channel?.is_private" size="xs" color="gray" variant="subtle">
								Private
							</UBadge>
						</h2>
						<p v-if="channel?.description" class="text-sm text-gray-500 dark:text-gray-400">
							{{ channel.description }}
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<UButton
						size="sm"
						color="gray"
						variant="ghost"
						icon="i-heroicons-users"
						@click="showMembersPanel = !showMembersPanel">
						{{ memberCount }}
					</UButton>
					<UDropdown :items="channelActions" :popper="{placement: 'bottom-end'}">
						<UButton
							size="sm"
							color="gray"
							variant="ghost"
							icon="i-heroicons-ellipsis-vertical" />
					</UDropdown>
				</div>
			</div>
		</div>

		<div class="flex-1 flex overflow-hidden">
			<!-- Messages Area -->
			<div class="flex-1 flex flex-col overflow-hidden">
				<!-- Messages List -->
				<div
					ref="messagesContainer"
					class="flex-1 overflow-y-auto p-4 space-y-4"
					@scroll="handleScroll">
					<div v-if="loadingMessages" class="flex items-center justify-center py-8">
						<UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
					</div>

					<div v-else-if="messages.length === 0" class="text-center py-12">
						<UIcon name="i-heroicons-chat-bubble-left-right" class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
						<p class="text-gray-500 dark:text-gray-400">No messages yet</p>
						<p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
							Be the first to send a message!
						</p>
					</div>

					<template v-else>
						<ChannelMessage
							v-for="message in messages"
							:key="message.id"
							:message="message"
							@reply="handleReply"
							@edit="handleEditMessage"
							@delete="handleDeleteMessage" />
					</template>
				</div>

				<!-- Message Input -->
				<div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
					<ChannelMessageEditor
						v-model="newMessageContent"
						:channel-id="channelId"
						:folder-id="uploadFolderId"
						@send="handleSendMessage"
						@mention="handleMention" />
				</div>
			</div>

			<!-- Members Sidebar -->
			<Transition name="slide">
				<div
					v-if="showMembersPanel"
					class="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
					<ChannelMembers
						:channel-id="channelId"
						:members="members"
						@invite="handleInviteMember"
						@remove="handleRemoveMember"
						@close="showMembersPanel = false" />
				</div>
			</Transition>
		</div>

		<!-- Invite Member Modal -->
		<UModal v-model="showInviteModal">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Invite to #{{ channel?.name }}</h3>
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-x-mark"
							@click="showInviteModal = false" />
					</div>
				</template>

				<div class="space-y-4">
					<UFormGroup label="Select User">
						<USelectMenu
							v-model="selectedUserToInvite"
							:options="invitableUsers"
							option-attribute="label"
							searchable
							searchable-placeholder="Search users..."
							:search-attributes="['label', 'email']"
							:loading="loadingUsers">
							<template #label>
								<span v-if="selectedUserToInvite">
									{{ selectedUserToInvite.label }}
								</span>
								<span v-else class="text-gray-400">Select a user</span>
							</template>
							<template #option="{ option }">
								<div class="flex items-center gap-2">
									<UAvatar
										:src="option.avatar"
										:alt="option.label"
										size="xs" />
									<div>
										<div class="font-medium">{{ option.label }}</div>
										<div class="text-xs text-gray-500">{{ option.email }}</div>
									</div>
								</div>
							</template>
						</USelectMenu>
					</UFormGroup>

					<UFormGroup label="Role">
						<USelectMenu
							v-model="inviteRole"
							:options="roleOptions" />
					</UFormGroup>
				</div>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton color="gray" variant="ghost" @click="showInviteModal = false">
							Cancel
						</UButton>
						<UButton
							color="primary"
							:disabled="!selectedUserToInvite"
							:loading="inviting"
							@click="confirmInvite">
							Invite
						</UButton>
					</div>
				</template>
			</UCard>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import type {Channel, ChannelMember, ChannelMessageWithRelations} from '~/types/channels';

const props = defineProps({
	channelId: {
		type: String,
		required: true,
	},
});

const emit = defineEmits(['channel-updated']);

const {
	getChannel,
	getMessages,
	sendMessage,
	updateMessage,
	deleteMessage,
	getChannelMembers,
	inviteMember,
	removeMember,
	markChannelAsRead,
	useChannelMessagesSubscription,
	CHANNEL_UPLOADS_FOLDER,
} = useChannels();
const {listUsers} = useDirectusUser();
const {isBoardMember, isAdmin} = useRoles();
const {user} = useDirectusAuth();
const toast = useToast();

const channel = ref<Channel | null>(null);
const messages = ref<ChannelMessageWithRelations[]>([]);
const members = ref<ChannelMember[]>([]);
const loadingMessages = ref(true);
const loadingChannel = ref(true);
const showMembersPanel = ref(false);
const showInviteModal = ref(false);
const newMessageContent = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const uploadFolderId = ref<string | null>(null);

// Invite modal state
const invitableUsers = ref<any[]>([]);
const selectedUserToInvite = ref<any>(null);
const inviteRole = ref('member');
const loadingUsers = ref(false);
const inviting = ref(false);

const roleOptions = [
	{value: 'member', label: 'Member'},
	{value: 'moderator', label: 'Moderator'},
];

const channelIcon = computed(() => {
	if (channel.value?.icon) {
		return channel.value.icon.startsWith('i-')
			? channel.value.icon
			: `i-heroicons-${channel.value.icon}`;
	}
	return channel.value?.is_private
		? 'i-heroicons-lock-closed'
		: 'i-heroicons-chat-bubble-left-right';
});

const memberCount = computed(() => {
	return members.value.length;
});

const canManageChannel = computed(() => {
	return isBoardMember.value || isAdmin.value;
});

const channelActions = computed(() => {
	const actions: any[][] = [
		[
			{
				label: 'Mark as read',
				icon: 'i-heroicons-check',
				click: () => markChannelAsRead(props.channelId),
			},
		],
	];

	if (canManageChannel.value) {
		actions.push([
			{
				label: 'Invite members',
				icon: 'i-heroicons-user-plus',
				click: () => openInviteModal(),
			},
			{
				label: 'Channel settings',
				icon: 'i-heroicons-cog-6-tooth',
				click: () => {/* TODO: open settings */},
			},
		]);
	}

	return actions;
});

const loadChannel = async () => {
	loadingChannel.value = true;
	try {
		channel.value = await getChannel(props.channelId);
		members.value = channel.value.members || [];
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to load channel', color: 'red'});
	} finally {
		loadingChannel.value = false;
	}
};

const loadMessages = async () => {
	loadingMessages.value = true;
	try {
		messages.value = await getMessages(props.channelId, {parentId: null});
		scrollToBottom();
		await markChannelAsRead(props.channelId);
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to load messages', color: 'red'});
	} finally {
		loadingMessages.value = false;
	}
};

const scrollToBottom = () => {
	nextTick(() => {
		if (messagesContainer.value) {
			messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
		}
	});
};

const handleScroll = () => {
	// TODO: Implement infinite scroll for older messages
};

const handleSendMessage = async (payload: {content: string; mentionedUserIds: string[]}) => {
	try {
		const message = await sendMessage({
			channel_id: props.channelId,
			content: payload.content,
			mentioned_user_ids: payload.mentionedUserIds,
		});

		// Create optimistic message with current user data for immediate display
		// The real-time subscription will update this with complete data
		const optimisticMessage = {
			...message,
			user_created: user.value,
		};

		// Check if message already exists (from real-time subscription race)
		const existingIndex = messages.value.findIndex(m => m.id === message.id);
		if (existingIndex === -1) {
			messages.value.push(optimisticMessage as any);
		}

		newMessageContent.value = '';
		scrollToBottom();
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to send message', color: 'red'});
	}
};

const handleMention = (mentionData: any) => {
	// Track mentions for notifications (handled by MessageEditor)
};

const handleReply = (message: ChannelMessageWithRelations) => {
	// TODO: Open thread view
};

const handleEditMessage = async (message: ChannelMessageWithRelations, newContent: string) => {
	try {
		await updateMessage(message.id, newContent);
		const index = messages.value.findIndex(m => m.id === message.id);
		if (index !== -1) {
			messages.value[index].content = newContent;
			messages.value[index].is_edited = true;
		}
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to edit message', color: 'red'});
	}
};

const handleDeleteMessage = async (message: ChannelMessageWithRelations) => {
	try {
		await deleteMessage(message.id);
		messages.value = messages.value.filter(m => m.id !== message.id);
		toast.add({title: 'Message deleted', color: 'gray'});
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to delete message', color: 'red'});
	}
};

const openInviteModal = async () => {
	showInviteModal.value = true;
	loadingUsers.value = true;

	try {
		// Use the dedicated channel users endpoint
		const allUsers = await $fetch<any[]>('/api/directus/users/list-for-channels');

		// Filter out existing members
		const memberIds = members.value.map(m =>
			typeof m.user_id === 'string' ? m.user_id : m.user_id.id
		);

		invitableUsers.value = (allUsers || [])
			.filter((u: any) => !memberIds.includes(u.id))
			.map((u: any) => ({
				value: u.id,
				label: `${u.first_name} ${u.last_name}`,
				email: u.email,
				avatar: u.avatar,
			}));
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to load users', color: 'red'});
	} finally {
		loadingUsers.value = false;
	}
};

const confirmInvite = async () => {
	if (!selectedUserToInvite.value) return;

	inviting.value = true;
	try {
		const newMember = await inviteMember(
			props.channelId,
			selectedUserToInvite.value.value,
			inviteRole.value as 'member' | 'moderator'
		);

		members.value.push(newMember);
		showInviteModal.value = false;
		selectedUserToInvite.value = null;
		inviteRole.value = 'member';

		toast.add({
			title: 'Member invited',
			description: `${selectedUserToInvite.value.label} has been invited to the channel`,
			color: 'green',
		});
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to invite member', color: 'red'});
	} finally {
		inviting.value = false;
	}
};

const handleInviteMember = () => {
	openInviteModal();
};

const handleRemoveMember = async (member: ChannelMember) => {
	try {
		await removeMember(member.id);
		members.value = members.value.filter(m => m.id !== member.id);
		toast.add({title: 'Member removed', color: 'gray'});
	} catch (e: any) {
		toast.add({title: 'Error', description: e.message || 'Failed to remove member', color: 'red'});
	}
};

// Real-time subscription
const {data: realtimeMessages} = useChannelMessagesSubscription(props.channelId);

watch(realtimeMessages, (newMessages) => {
	if (newMessages && newMessages.length > 0) {
		// Merge real-time messages with existing ones, preserving user data
		// WebSocket events may not include expanded user relations
		const existingMessagesMap = new Map(
			messages.value.map(m => [m.id, m])
		);

		const mergedMessages = newMessages.map((newMsg: any) => {
			const existing = existingMessagesMap.get(newMsg.id);
			// If existing message has user data and new one doesn't, preserve existing user data
			if (existing && existing.user_created && typeof existing.user_created === 'object') {
				if (!newMsg.user_created || typeof newMsg.user_created === 'string') {
					return {...newMsg, user_created: existing.user_created};
				}
			}
			return newMsg;
		});

		messages.value = mergedMessages as ChannelMessageWithRelations[];
		scrollToBottom();
	}
});

// Watch for channel ID changes
watch(() => props.channelId, async () => {
	await loadChannel();
	await loadMessages();
}, {immediate: true});
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
	transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
	transform: translateX(100%);
	opacity: 0;
}
</style>
