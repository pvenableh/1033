<template>
	<div
		class="channel-message group rounded-lg transition-colors"
		:class="[
			isHighlighted ? 'bg-primary-50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
			isReply ? 'ml-4 sm:ml-8' : ''
		]">
		<!-- Reply Indicator - shows parent message preview -->
		<div
			v-if="isReply && parentMessage"
			class="flex items-center gap-2 px-3 pt-2 pb-1 text-xs text-gray-500 dark:text-gray-400">
			<div class="flex items-center gap-1.5">
				<div class="w-4 h-4 border-l-2 border-t-2 border-gray-300 dark:border-gray-600 rounded-tl-md -mb-2"></div>
				<UIcon name="i-heroicons-arrow-uturn-left" class="w-3 h-3 rotate-180" />
				<UAvatar
					:src="parentAuthorAvatar"
					:alt="parentAuthorName"
					size="2xs"
					class="flex-shrink-0" />
				<span class="font-medium text-gray-600 dark:text-gray-300">{{ parentAuthorName }}</span>
			</div>
			<span class="truncate max-w-[200px] sm:max-w-[300px] italic">
				{{ parentMessagePreview }}
			</span>
		</div>

		<!-- Reply visual connector line -->
		<div
			v-if="isReply"
			class="absolute left-2 sm:left-6 top-0 bottom-1/2 w-0.5 bg-gradient-to-b from-primary-300 to-primary-500 dark:from-primary-700 dark:to-primary-500 rounded-full hidden sm:block"
			style="height: 20px; margin-top: -4px;" />

		<!-- Main message content -->
		<div class="flex gap-3 p-2" :class="{'border-l-2 border-primary-400 dark:border-primary-600 pl-3': isReply}">
			<!-- Avatar -->
			<UAvatar
				:src="authorAvatar"
				:alt="authorName"
				:size="isReply ? 'xs' : 'sm'"
				class="flex-shrink-0 mt-0.5" />

			<!-- Content -->
			<div class="flex-1 min-w-0">
			<!-- Header -->
			<div class="flex items-center gap-2 mb-1">
				<span class="font-medium text-gray-900 dark:text-white">
					{{ authorName }}
				</span>
				<span class="text-xs text-gray-500 dark:text-gray-400">
					{{ formatTime(message.date_created) }}
				</span>
				<UBadge v-if="message.is_edited" size="xs" color="gray" variant="subtle">
					edited
				</UBadge>
			</div>

			<!-- Message Content -->
			<div
				v-if="!isEditing"
				class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 message-content"
				v-html="sanitizedContent" />

			<!-- Edit Form -->
			<div v-else class="space-y-2">
				<UTextarea
					v-model="editContent"
					:rows="3"
					autofocus
					@keydown.esc="cancelEdit"
					@keydown.enter.ctrl="saveEdit" />
				<div class="flex gap-2">
					<UButton size="xs" color="primary" @click="saveEdit">Save</UButton>
					<UButton size="xs" color="gray" variant="ghost" @click="cancelEdit">Cancel</UButton>
				</div>
			</div>

			<!-- File Attachments -->
			<div v-if="files.length > 0" class="mt-2 flex flex-wrap gap-2">
				<a
					v-for="file in files"
					:key="file.id"
					:href="getFileUrl(file)"
					target="_blank"
					class="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
					<UIcon :name="getFileIcon(file)" class="w-4 h-4 text-gray-500" />
					<span class="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
						{{ file.directus_files_id?.filename_download || 'File' }}
					</span>
				</a>
			</div>

			<!-- Mentions Badge -->
			<div v-if="mentionedUsers.length > 0" class="mt-2 flex flex-wrap gap-1">
				<UBadge
					v-for="mention in mentionedUsers"
					:key="mention.id"
					size="xs"
					color="sky"
					variant="subtle">
					@{{ mention.user_id?.first_name }} {{ mention.user_id?.last_name }}
				</UBadge>
			</div>

			<!-- Reactions / Thread indicator (future feature) -->
			<div v-if="replyCount > 0" class="mt-2">
				<button
					class="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
					@click="$emit('reply', message)">
					<UIcon name="i-heroicons-chat-bubble-left" class="w-4 h-4" />
					{{ replyCount }} {{ replyCount === 1 ? 'reply' : 'replies' }}
				</button>
			</div>
		</div>

			<!-- Actions -->
			<div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
				<UDropdown :items="messageActions" :popper="{placement: 'bottom-end'}">
					<UButton
						size="xs"
						color="gray"
						variant="ghost"
						icon="i-heroicons-ellipsis-horizontal" />
				</UDropdown>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type {ChannelMessageWithRelations} from '~/types/channels';

const props = defineProps<{
	message: ChannelMessageWithRelations;
	isHighlighted?: boolean;
	parentMessage?: ChannelMessageWithRelations | null;
}>();

const emit = defineEmits(['reply', 'edit', 'delete']);

const config = useRuntimeConfig();
const {user} = useDirectusAuth();
const {sanitizeSync, initSanitizer} = useSanitize();

const isEditing = ref(false);
const editContent = ref('');

// Initialize DOMPurify on client
onMounted(() => {
	initSanitizer();
});

// Reply-related computed properties
const isReply = computed(() => {
	return props.message.parent_id !== null && props.message.parent_id !== undefined;
});

const parentAuthorAvatar = computed(() => {
	if (!props.parentMessage) return null;
	const author = props.parentMessage.user_created;
	if (!author || typeof author === 'string') return null;
	return author.avatar
		? `${config.public.directusUrl}/assets/${author.avatar}?key=small`
		: null;
});

const parentAuthorName = computed(() => {
	if (!props.parentMessage) return 'Unknown';
	const author = props.parentMessage.user_created;
	if (!author || typeof author === 'string') return 'Unknown';
	return `${author.first_name} ${author.last_name}`;
});

const parentMessagePreview = computed(() => {
	if (!props.parentMessage || !props.parentMessage.content) return '';
	// Strip HTML and truncate
	const text = props.parentMessage.content.replace(/<[^>]*>/g, '');
	return text.length > 50 ? text.substring(0, 50) + '...' : text;
});

const authorAvatar = computed(() => {
	const author = props.message.user_created;
	if (!author || typeof author === 'string') return null;
	return author.avatar
		? `${config.public.directusUrl}/assets/${author.avatar}?key=small`
		: null;
});

const authorName = computed(() => {
	const author = props.message.user_created;
	if (!author || typeof author === 'string') return 'Unknown';
	return `${author.first_name} ${author.last_name}`;
});

const isOwnMessage = computed(() => {
	const author = props.message.user_created;
	if (!author || typeof author === 'string') return false;
	return author.id === user.value?.id;
});

const sanitizedContent = computed(() => {
	if (!props.message.content) return '';
	return sanitizeSync(props.message.content);
});

const files = computed(() => {
	return props.message.files || [];
});

const mentionedUsers = computed(() => {
	return props.message.mentions || [];
});

const replyCount = computed(() => {
	// TODO: Add reply count from API
	return 0;
});

const messageActions = computed(() => {
	const actions: any[][] = [];

	// Common actions
	actions.push([
		{
			label: 'Reply in thread',
			icon: 'i-heroicons-chat-bubble-left',
			click: () => emit('reply', props.message),
		},
		{
			label: 'Copy link',
			icon: 'i-heroicons-link',
			click: copyMessageLink,
		},
	]);

	// Own message actions
	if (isOwnMessage.value) {
		actions.push([
			{
				label: 'Edit message',
				icon: 'i-heroicons-pencil',
				click: startEdit,
			},
			{
				label: 'Delete message',
				icon: 'i-heroicons-trash',
				click: confirmDelete,
			},
		]);
	}

	return actions;
});

const formatTime = (dateString: string | null) => {
	if (!dateString) return '';

	const date = new Date(dateString);
	const now = new Date();
	const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
	} else if (diffDays === 1) {
		return `Yesterday at ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
	} else if (diffDays < 7) {
		return date.toLocaleDateString([], {weekday: 'short', hour: '2-digit', minute: '2-digit'});
	} else {
		return date.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'});
	}
};

const getFileUrl = (file: any) => {
	const fileId = file.directus_files_id?.id || file.directus_files_id;
	return `${config.public.directusUrl}/assets/${fileId}`;
};

const getFileIcon = (file: any) => {
	const type = file.directus_files_id?.type || '';

	if (type.startsWith('image/')) return 'i-heroicons-photo';
	if (type.startsWith('video/')) return 'i-heroicons-video-camera';
	if (type.startsWith('audio/')) return 'i-heroicons-musical-note';
	if (type.includes('pdf')) return 'i-heroicons-document-text';
	if (type.includes('word') || type.includes('document')) return 'i-heroicons-document';
	if (type.includes('sheet') || type.includes('excel')) return 'i-heroicons-table-cells';
	return 'i-heroicons-paper-clip';
};

const startEdit = () => {
	// Strip HTML tags for editing
	editContent.value = props.message.content?.replace(/<[^>]*>/g, '') || '';
	isEditing.value = true;
};

const cancelEdit = () => {
	isEditing.value = false;
	editContent.value = '';
};

const saveEdit = () => {
	if (!editContent.value.trim()) return;
	emit('edit', props.message, editContent.value);
	isEditing.value = false;
	editContent.value = '';
};

const confirmDelete = () => {
	if (confirm('Are you sure you want to delete this message?')) {
		emit('delete', props.message);
	}
};

const copyMessageLink = async () => {
	const url = `${window.location.origin}${window.location.pathname}?message=${props.message.id}`;
	await navigator.clipboard.writeText(url);
};
</script>

<style scoped>
.message-content :deep(.mention) {
	color: #0ea5e9;
	font-weight: 500;
	background: rgba(14, 165, 233, 0.1);
	padding: 0.1em 0.3em;
	border-radius: 0.25em;
}

.message-content :deep(img) {
	max-width: 300px;
	max-height: 200px;
	border-radius: 0.5rem;
	cursor: pointer;
}

.message-content :deep(a) {
	color: #0ea5e9;
	text-decoration: underline;
}

.message-content :deep(ul),
.message-content :deep(ol) {
	padding-left: 1.25rem;
}
</style>
