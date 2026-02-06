<template>
	<div
		class="unified-message group relative"
		:data-message-id="message.id"
		:class="[isHighlighted ? 'bg-primary-50/50 dark:bg-primary-900/10' : '']">
		<!-- Reply connector - iOS style threading -->
		<div v-if="isReply && parentMessage" class="reply-thread-container mb-1">
			<!-- Vertical connector line -->
			<div class="reply-connector">
				<div class="connector-line"></div>
			</div>

			<!-- Parent message preview bubble -->
			<button class="reply-preview-bubble" @click="scrollToParent">
				<Avatar :src="parentAuthorAvatar" :alt="parentAuthorName" size="2xs" class="flex-shrink-0" />
				<span class="reply-author">{{ parentAuthorName }}</span>
				<span class="reply-text">{{ parentMessagePreview }}</span>
			</button>
		</div>

		<!-- Main message bubble -->
		<div class="message-bubble-wrapper" :class="{'is-reply': isReply}">
			<!-- Avatar (left side) -->
			<div class="message-avatar">
				<Avatar :src="authorAvatar" :alt="authorName" :size="isReply ? 'xs' : 'sm'" class="flex-shrink-0" />
			</div>

			<!-- Message content bubble -->
			<div class="message-bubble" :class="{'is-own': isOwnMessage}">
				<!-- Header -->
				<div class="message-header">
					<span class="author-name">{{ authorName }}</span>
					<span class="message-time">{{ formatTime(messageDate) }}</span>
					<Badge v-if="isEdited" size="xs" color="gray" variant="subtle">edited</Badge>
				</div>

				<!-- Message Content -->
				<div
					v-if="!isEditing"
					class="prose prose-sm dark:prose-invert max-w-none message-content"
					v-html="sanitizedContent" />

				<!-- Edit Form -->
				<div v-else class="space-y-2">
					<Textarea
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
						<Icon :name="getFileIcon(file)" class="w-4 h-4 text-gray-500" />
						<span class="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
							{{ getFileName(file) }}
						</span>
					</a>
				</div>

				<!-- Reactions Display -->
				<ReactionDisplay
					:collection="reactionCollection"
					:item-id="message.id"
					:owner-user-id="messageOwnerUserId"
					:item-context="itemContext"
					:show-picker="true"
					:compact="true" />

				<!-- Thread indicator -->
				<div v-if="replyCountValue > 0" class="mt-2">
					<button
						class="text-xs text-primary dark:text-primary hover:underline flex items-center gap-1"
						@click="$emit('reply', message)">
						<Icon name="i-heroicons-chat-bubble-left" class="w-4 h-4" />
						{{ replyCountValue }} {{ replyCountValue === 1 ? 'reply' : 'replies' }}
					</button>
				</div>
			</div>

			<!-- Actions -->
			<div class="message-actions">
				<Dropdown :items="messageActions" :popper="{placement: 'bottom-end'}">
					<UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
				</Dropdown>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type {ChannelMessageWithRelations} from '~/types/channels';
import type {Comment, CommentWithRelations} from '~/types/comments';

// Union type for both message types
type MessageType = ChannelMessageWithRelations | Comment | CommentWithRelations;

const props = defineProps<{
	message: MessageType;
	isHighlighted?: boolean;
	parentMessage?: MessageType | null;
	// Reply count override (when computed externally)
	replyCount?: number;
	// Collection type for reactions ('channel_messages' or 'comments')
	reactionCollection?: 'channel_messages' | 'comments' | 'project_events';
	// Context for reactions (e.g., channel name)
	itemContext?: Record<string, any>;
	// Show edit/delete actions
	showActions?: boolean;
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

// Helper to check if message is a channel message
const isChannelMessage = (msg: MessageType): msg is ChannelMessageWithRelations => {
	return 'channel_id' in msg;
};

// Reply-related computed properties
const isReply = computed(() => {
	return props.message.parent_id !== null && props.message.parent_id !== undefined;
});

const parentAuthorAvatar = computed(() => {
	if (!props.parentMessage) return null;
	const author = props.parentMessage.user_created;
	if (!author || typeof author === 'string') return null;
	return author.avatar ? `${config.public.directusUrl}/assets/${author.avatar}?key=small` : null;
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
	return author.avatar ? `${config.public.directusUrl}/assets/${author.avatar}?key=small` : null;
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

const messageDate = computed(() => {
	return props.message.date_created;
});

const isEdited = computed(() => {
	if ('is_edited' in props.message) {
		return props.message.is_edited;
	}
	return false;
});

const files = computed(() => {
	return props.message.files || [];
});

const replyCountValue = computed(() => {
	if (props.replyCount !== undefined) {
		return props.replyCount;
	}
	if ('replies' in props.message && Array.isArray(props.message.replies)) {
		return props.message.replies.length;
	}
	if ('reply_count' in props.message) {
		return (props.message as any).reply_count || 0;
	}
	return 0;
});

const messageOwnerUserId = computed(() => {
	const author = props.message.user_created;
	if (!author || typeof author === 'string') return undefined;
	return author.id;
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
	if (isOwnMessage.value && props.showActions !== false) {
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
	// Handle both channel message files and comment files
	const fileId = file.directus_files_id?.id || file.directus_files_id;
	return `${config.public.directusUrl}/assets/${fileId}`;
};

const getFileName = (file: any) => {
	return file.directus_files_id?.filename_download || file.directus_files_id?.title || 'File';
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

const scrollToParent = () => {
	// Find and scroll to parent message
	if (props.parentMessage) {
		const parentElement = document.querySelector(`[data-message-id="${props.parentMessage.id}"]`);
		if (parentElement) {
			parentElement.scrollIntoView({behavior: 'smooth', block: 'center'});
			parentElement.classList.add('highlight-flash');
			setTimeout(() => parentElement.classList.remove('highlight-flash'), 1500);
		}
	}
};
</script>

<style scoped>
.unified-message {
	padding: 0.5rem;
	border-radius: 0.75rem;
}

/* Reply thread container - iOS style */
.reply-thread-container {
	display: flex;
	align-items: flex-end;
	padding-left: 2.5rem;
	position: relative;
}

/* Connector line from parent to reply */
.reply-connector {
	position: absolute;
	left: 1.25rem;
	top: -0.5rem;
	bottom: 0;
	width: 1.5rem;
}

.connector-line {
	position: absolute;
	left: 0;
	top: 0;
	width: 1.25rem;
	height: calc(100% + 1rem);
	border-left: 2px solid;
	border-bottom: 2px solid;
	border-color: rgb(var(--color-primary-300));
	border-bottom-left-radius: 0.75rem;
}

:root.dark .connector-line {
	border-color: rgb(var(--color-primary-700));
}

/* Parent message preview bubble */
.reply-preview-bubble {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.75rem 0.25rem 0.375rem;
	background: linear-gradient(135deg, rgb(var(--color-gray-100)), rgb(var(--color-gray-50)));
	border: 1px solid rgb(var(--color-gray-200));
	border-radius: 1rem;
	font-size: 0.75rem;
	color: rgb(var(--color-gray-600));
	transition: all 0.2s ease;
	cursor: pointer;
	max-width: 100%;
}

.reply-preview-bubble:hover {
	background: linear-gradient(135deg, rgb(var(--color-gray-200)), rgb(var(--color-gray-100)));
	transform: translateY(-1px);
}

:root.dark .reply-preview-bubble {
	background: linear-gradient(135deg, rgb(var(--color-gray-800)), rgb(var(--color-gray-700)));
	border-color: rgb(var(--color-gray-600));
	color: rgb(var(--color-gray-300));
}

:root.dark .reply-preview-bubble:hover {
	background: linear-gradient(135deg, rgb(var(--color-gray-700)), rgb(var(--color-gray-600)));
}

.reply-author {
	font-weight: 600;
	color: rgb(var(--color-gray-700));
	white-space: nowrap;
}

:root.dark .reply-author {
	color: rgb(var(--color-gray-200));
}

.reply-text {
	color: rgb(var(--color-gray-500));
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 200px;
}

/* Message bubble wrapper */
.message-bubble-wrapper {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.25rem;
	border-radius: 0.75rem;
}

.message-bubble-wrapper.is-reply {
	margin-left: 1rem;
}

/* Avatar styling */
.message-avatar {
	flex-shrink: 0;
	margin-top: 0.125rem;
}

/* Message bubble */
.message-bubble {
	flex: 1;
	min-width: 0;
	padding: 0.5rem 0.75rem;
	background: rgb(var(--color-gray-50));
	border: 1px solid rgb(var(--color-gray-200));
	border-radius: 1rem;
	border-top-left-radius: 0.25rem;
}

:root.dark .message-bubble {
	background: rgb(var(--color-gray-800));
	border-color: rgb(var(--color-gray-600));
}

.message-bubble.is-own {
	background: linear-gradient(135deg, rgb(var(--color-primary-50)), rgb(var(--color-primary-100) / 0.5));
	border-color: rgb(var(--color-primary-200));
}

:root.dark .message-bubble.is-own {
	background: linear-gradient(135deg, rgb(var(--color-primary-900) / 0.3), rgb(var(--color-primary-800) / 0.2));
	border-color: rgb(var(--color-primary-800));
}

/* Message header */
.message-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.25rem;
	flex-wrap: wrap;
}

.author-name {
	font-weight: 600;
	font-size: 0.875rem;
	color: rgb(var(--color-gray-900));
}

:root.dark .author-name {
	color: white;
}

.message-time {
	font-size: 0.75rem;
	color: rgb(var(--color-gray-500));
}

/* Message actions */
.message-actions {
	opacity: 0;
	transition: opacity 0.15s ease;
	flex-shrink: 0;
}

.message-bubble-wrapper:hover .message-actions {
	opacity: 1;
}

/* Message content styling */
.message-content {
	color: rgb(var(--color-gray-700));
	font-size: 0.9375rem;
	line-height: 1.5;
}

:root.dark .message-content {
	color: rgb(var(--color-gray-300));
}

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

.message-content :deep(p) {
	margin: 0;
}

.message-content :deep(p + p) {
	margin-top: 0.5rem;
}

/* Highlight flash animation for scrolling to parent */
.highlight-flash {
	animation: flash 1.5s ease-out;
}

@keyframes flash {
	0%,
	50% {
		background-color: rgb(var(--color-primary-100));
	}
	100% {
		background-color: transparent;
	}
}

:root.dark .highlight-flash {
	animation: flash-dark 1.5s ease-out;
}

@keyframes flash-dark {
	0%,
	50% {
		background-color: rgb(var(--color-primary-900) / 0.3);
	}
	100% {
		background-color: transparent;
	}
}
</style>
