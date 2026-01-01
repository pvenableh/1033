<template>
	<div class="comment-thread">
		<!-- Header -->
		<div v-if="showHeader" class="flex items-center justify-between mb-4">
			<h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
				<UIcon name="i-heroicons-chat-bubble-left-right" class="w-4 h-4" />
				Comments
				<UBadge v-if="commentCount > 0" size="xs" color="gray">
					{{ commentCount }}
				</UBadge>
			</h3>

			<div v-if="showFilters" class="flex items-center gap-2">
				<USelectMenu
					v-model="sortOrder"
					:options="sortOptions"
					size="xs"
					class="w-32" />
			</div>
		</div>

		<!-- Comment Editor -->
		<div v-if="showEditor" class="mb-6">
			<CommentEditor
				ref="editorRef"
				:folder-id="folderId"
				:submitting="submitting"
				@submit="handleSubmit" />
		</div>

		<!-- Loading State -->
		<div v-if="loading" class="space-y-4">
			<div v-for="i in 3" :key="i" class="flex gap-3">
				<USkeleton class="w-8 h-8 rounded-full" />
				<div class="flex-1 space-y-2">
					<USkeleton class="h-4 w-1/4" />
					<USkeleton class="h-12 w-full" />
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else-if="comments.length === 0" class="text-center py-8">
			<UIcon
				name="i-heroicons-chat-bubble-left-right"
				class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{{ emptyMessage }}
			</p>
		</div>

		<!-- Comments List -->
		<div v-else class="space-y-4">
			<CommentItem
				v-for="comment in sortedComments"
				:key="comment.id"
				:comment="comment"
				:show-replies="showReplies"
				:can-resolve="canResolve"
				@reply="handleReply"
				@edit="handleEdit"
				@delete="handleDelete"
				@toggle-resolved="handleToggleResolved" />
		</div>

		<!-- Reply Modal -->
		<UModal v-model="showReplyModal">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Reply to comment</h3>
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-x-mark"
							@click="showReplyModal = false" />
					</div>
				</template>

				<div v-if="replyingTo" class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<div class="flex items-center gap-2 mb-1">
						<span class="text-sm font-medium">
							{{ getAuthorName(replyingTo) }}
						</span>
						<span class="text-xs text-gray-500">
							{{ formatTime(replyingTo.date_created) }}
						</span>
					</div>
					<div
						class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
						v-html="replyingTo.content" />
				</div>

				<CommentEditor
					ref="replyEditorRef"
					:show-avatar="false"
					submit-label="Reply"
					:submitting="submittingReply"
					@submit="submitReply" />
			</UCard>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import type {CommentWithRelations, CreateCommentPayload} from '~/types/comments';

const props = defineProps({
	targetCollection: {
		type: String,
		required: true,
	},
	targetId: {
		type: String,
		required: true,
	},
	showHeader: {
		type: Boolean,
		default: true,
	},
	showEditor: {
		type: Boolean,
		default: true,
	},
	showFilters: {
		type: Boolean,
		default: false,
	},
	showReplies: {
		type: Boolean,
		default: true,
	},
	canResolve: {
		type: Boolean,
		default: false,
	},
	folderId: {
		type: String,
		default: null,
	},
	emptyMessage: {
		type: String,
		default: 'No comments yet. Be the first to comment!',
	},
});

const emit = defineEmits(['comment-added', 'comment-updated', 'comment-deleted']);

const {
	getComments,
	createComment,
	updateComment,
	deleteComment,
	toggleResolved,
	useCommentsSubscription,
	COMMENT_UPLOADS_FOLDER,
} = useComments();
const toast = useToast();

const comments = ref<CommentWithRelations[]>([]);
const loading = ref(true);
const submitting = ref(false);
const submittingReply = ref(false);
const showReplyModal = ref(false);
const replyingTo = ref<CommentWithRelations | null>(null);
const sortOrder = ref('newest');

const editorRef = ref<any>(null);
const replyEditorRef = ref<any>(null);

const sortOptions = [
	{value: 'newest', label: 'Newest first'},
	{value: 'oldest', label: 'Oldest first'},
];

const commentCount = computed(() => comments.value.length);

const sortedComments = computed(() => {
	const sorted = [...comments.value];
	if (sortOrder.value === 'newest') {
		sorted.sort((a, b) => new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime());
	} else {
		sorted.sort((a, b) => new Date(a.date_created || 0).getTime() - new Date(b.date_created || 0).getTime());
	}
	return sorted;
});

const effectiveFolderId = computed(() => props.folderId || COMMENT_UPLOADS_FOLDER);

const loadComments = async () => {
	loading.value = true;
	try {
		comments.value = await getComments(props.targetCollection, props.targetId, {
			parentId: null, // Only root comments
			includeReplies: props.showReplies,
		});
	} catch (error: any) {
		toast.add({
			title: 'Error',
			description: error.message || 'Failed to load comments',
			color: 'red',
		});
	} finally {
		loading.value = false;
	}
};

const handleSubmit = async (payload: {content: string; mentionedUserIds: string[]}) => {
	submitting.value = true;
	try {
		const newComment = await createComment({
			content: payload.content,
			target_collection: props.targetCollection,
			target_id: props.targetId,
			mentioned_user_ids: payload.mentionedUserIds,
		});

		// Add to list
		comments.value.push(newComment as CommentWithRelations);

		// Clear editor
		editorRef.value?.clearEditor();

		emit('comment-added', newComment);

		toast.add({
			title: 'Comment added',
			color: 'green',
		});
	} catch (error: any) {
		toast.add({
			title: 'Error',
			description: error.message || 'Failed to add comment',
			color: 'red',
		});
	} finally {
		submitting.value = false;
	}
};

const handleReply = (comment: CommentWithRelations) => {
	replyingTo.value = comment;
	showReplyModal.value = true;
};

const submitReply = async (payload: {content: string; mentionedUserIds: string[]}) => {
	if (!replyingTo.value) return;

	submittingReply.value = true;
	try {
		const reply = await createComment({
			content: payload.content,
			target_collection: props.targetCollection,
			target_id: props.targetId,
			parent_id: replyingTo.value.id,
			mentioned_user_ids: payload.mentionedUserIds,
		});

		// Add reply to parent
		const parentIndex = comments.value.findIndex(c => c.id === replyingTo.value?.id);
		if (parentIndex !== -1) {
			if (!comments.value[parentIndex].replies) {
				comments.value[parentIndex].replies = [];
			}
			comments.value[parentIndex].replies.push(reply as CommentWithRelations);
		}

		showReplyModal.value = false;
		replyingTo.value = null;
		replyEditorRef.value?.clearEditor();

		toast.add({title: 'Reply added', color: 'green'});
	} catch (error: any) {
		toast.add({
			title: 'Error',
			description: error.message || 'Failed to add reply',
			color: 'red',
		});
	} finally {
		submittingReply.value = false;
	}
};

const handleEdit = async (comment: CommentWithRelations, newContent: string) => {
	try {
		await updateComment(comment.id, {content: newContent});

		// Update in list
		const index = comments.value.findIndex(c => c.id === comment.id);
		if (index !== -1) {
			comments.value[index].content = newContent;
			comments.value[index].is_edited = true;
		}

		emit('comment-updated', comment);
	} catch (error: any) {
		toast.add({
			title: 'Error',
			description: error.message || 'Failed to update comment',
			color: 'red',
		});
	}
};

const handleDelete = async (comment: CommentWithRelations) => {
	try {
		await deleteComment(comment.id);

		// Remove from list
		comments.value = comments.value.filter(c => c.id !== comment.id);

		emit('comment-deleted', comment);

		toast.add({title: 'Comment deleted', color: 'gray'});
	} catch (error: any) {
		toast.add({
			title: 'Error',
			description: error.message || 'Failed to delete comment',
			color: 'red',
		});
	}
};

const handleToggleResolved = async (comment: CommentWithRelations) => {
	try {
		await toggleResolved(comment.id, !comment.is_resolved);

		// Update in list
		const index = comments.value.findIndex(c => c.id === comment.id);
		if (index !== -1) {
			comments.value[index].is_resolved = !comment.is_resolved;
		}
	} catch (error: any) {
		toast.add({
			title: 'Error',
			description: error.message || 'Failed to update comment',
			color: 'red',
		});
	}
};

const getAuthorName = (comment: CommentWithRelations) => {
	const author = comment.user_created;
	if (!author || typeof author === 'string') return 'Unknown';
	return `${author.first_name} ${author.last_name}`;
};

const formatTime = (dateString: string | null) => {
	if (!dateString) return '';
	const date = new Date(dateString);
	return date.toLocaleDateString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
};

// Real-time subscription
const {data: realtimeComments} = useCommentsSubscription(props.targetCollection, props.targetId);

watch(realtimeComments, (newComments) => {
	if (newComments && newComments.length > 0) {
		comments.value = newComments as CommentWithRelations[];
	}
});

// Watch for prop changes
watch([() => props.targetCollection, () => props.targetId], () => {
	loadComments();
}, {immediate: true});
</script>
