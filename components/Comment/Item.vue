<template>
	<div
		class="comment-item group"
		:class="{'pl-8 border-l-2 border-gray-200 dark:border-gray-700 ml-4': isReply}">
		<div class="flex gap-3">
			<!-- Avatar -->
			<UAvatar
				:src="authorAvatar"
				:alt="authorName"
				size="sm"
				class="flex-shrink-0 mt-0.5" />

			<!-- Content -->
			<div class="flex-1 min-w-0">
				<!-- Header -->
				<div class="flex items-center gap-2 mb-1">
					<span class="font-medium text-gray-900 dark:text-white text-sm">
						{{ authorName }}
					</span>
					<span class="text-xs text-gray-500 dark:text-gray-400">
						{{ formatTime(comment.date_created) }}
					</span>
					<UBadge v-if="comment.is_edited" size="xs" color="gray" variant="subtle">
						edited
					</UBadge>
					<UBadge v-if="comment.is_resolved" size="xs" color="green" variant="subtle">
						<UIcon name="i-heroicons-check" class="w-3 h-3 mr-0.5" />
						Resolved
					</UBadge>
				</div>

				<!-- Comment Content -->
				<div
					v-if="!isEditing"
					class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 comment-content"
					v-html="sanitizedContent" />

				<!-- Edit Form -->
				<div v-else class="mt-2">
					<CommentEditor
						v-model="editContent"
						:show-avatar="false"
						:show-cancel="true"
						submit-label="Save"
						:submitting="saving"
						@submit="saveEdit"
						@cancel="cancelEdit" />
				</div>

				<!-- File Attachments -->
				<div v-if="files.length > 0" class="mt-2 flex flex-wrap gap-2">
					<a
						v-for="file in files"
						:key="file.id"
						:href="getFileUrl(file)"
						target="_blank"
						class="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
						<UIcon :name="getFileIcon(file)" class="w-4 h-4 text-gray-500" />
						<span class="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
							{{ file.directus_files_id?.filename_download || 'File' }}
						</span>
					</a>
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-3 mt-2">
					<button
						v-if="!isReply"
						class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
						@click="$emit('reply', comment)">
						Reply
					</button>

					<button
						v-if="canResolve && !isReply"
						class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
						@click="$emit('toggle-resolved', comment)">
						{{ comment.is_resolved ? 'Unresolve' : 'Resolve' }}
					</button>

					<!-- Reply count -->
					<span v-if="replyCount > 0" class="text-xs text-primary-600 dark:text-primary-400">
						{{ replyCount }} {{ replyCount === 1 ? 'reply' : 'replies' }}
					</span>

					<!-- More actions dropdown -->
					<UDropdown
						v-if="canEdit"
						:items="actionItems"
						:popper="{placement: 'bottom-end'}"
						class="opacity-0 group-hover:opacity-100 transition-opacity">
						<UButton
							size="xs"
							color="gray"
							variant="ghost"
							icon="i-heroicons-ellipsis-horizontal"
							class="ml-auto" />
					</UDropdown>
				</div>

				<!-- Replies -->
				<div v-if="showReplies && replies.length > 0" class="mt-4 space-y-4">
					<CommentItem
						v-for="reply in replies"
						:key="reply.id"
						:comment="reply"
						:is-reply="true"
						@edit="(c, content) => $emit('edit', c, content)"
						@delete="(c) => $emit('delete', c)" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type {CommentWithRelations} from '~/types/comments';

const props = defineProps<{
	comment: CommentWithRelations;
	isReply?: boolean;
	showReplies?: boolean;
	canResolve?: boolean;
}>();

const emit = defineEmits(['reply', 'edit', 'delete', 'toggle-resolved']);

const config = useRuntimeConfig();
const {user} = useDirectusAuth();
const {canEditComment} = useComments();
const {sanitizeSync, initSanitizer} = useSanitize();

const isEditing = ref(false);
const editContent = ref('');
const saving = ref(false);

// Initialize DOMPurify on client
onMounted(() => {
	initSanitizer();
});

const authorAvatar = computed(() => {
	const author = props.comment.user_created;
	if (!author || typeof author === 'string') return null;
	return author.avatar
		? `${config.public.directusUrl}/assets/${author.avatar}?key=small`
		: null;
});

const authorName = computed(() => {
	const author = props.comment.user_created;
	if (!author || typeof author === 'string') return 'Unknown';
	return `${author.first_name} ${author.last_name}`;
});

const canEdit = computed(() => canEditComment(props.comment));

const sanitizedContent = computed(() => {
	if (!props.comment.content) return '';
	return sanitizeSync(props.comment.content);
});

const files = computed(() => props.comment.files || []);
const replies = computed(() => props.comment.replies || []);
const replyCount = computed(() => props.comment.reply_count || replies.value.length);

const actionItems = computed(() => {
	const items: any[][] = [];

	if (canEdit.value) {
		items.push([
			{
				label: 'Edit',
				icon: 'i-heroicons-pencil',
				click: startEdit,
			},
			{
				label: 'Delete',
				icon: 'i-heroicons-trash',
				click: confirmDelete,
			},
		]);
	}

	return items;
});

const formatTime = (dateString: string | null) => {
	if (!dateString) return '';

	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;

	return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
};

const getFileUrl = (file: any) => {
	const fileId = file.directus_files_id?.id || file.directus_files_id;
	return `${config.public.directusUrl}/assets/${fileId}`;
};

const getFileIcon = (file: any) => {
	const type = file.directus_files_id?.type || '';

	if (type.startsWith('image/')) return 'i-heroicons-photo';
	if (type.startsWith('video/')) return 'i-heroicons-video-camera';
	if (type.includes('pdf')) return 'i-heroicons-document-text';
	return 'i-heroicons-paper-clip';
};

const startEdit = () => {
	editContent.value = props.comment.content || '';
	isEditing.value = true;
};

const cancelEdit = () => {
	isEditing.value = false;
	editContent.value = '';
};

const saveEdit = async (payload: {content: string}) => {
	saving.value = true;
	try {
		emit('edit', props.comment, payload.content);
		isEditing.value = false;
	} finally {
		saving.value = false;
	}
};

const confirmDelete = () => {
	if (confirm('Are you sure you want to delete this comment?')) {
		emit('delete', props.comment);
	}
};
</script>

<style scoped>
.comment-content :deep(.mention) {
	color: #0ea5e9;
	font-weight: 500;
	background: rgba(14, 165, 233, 0.1);
	padding: 0.1em 0.3em;
	border-radius: 0.25em;
}

.comment-content :deep(img) {
	max-width: 200px;
	max-height: 150px;
	border-radius: 0.375rem;
}

.comment-content :deep(a) {
	color: #0ea5e9;
	text-decoration: underline;
}

.comment-content :deep(ul),
.comment-content :deep(ol) {
	padding-left: 1.25rem;
}
</style>
