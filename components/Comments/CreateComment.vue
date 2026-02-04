<script setup>
const props = defineProps({
	item: {
		type: String,
		default: '',
	},
	collection: {
		type: String,
		default: '',
	},
	parent: {
		type: String,
		default: '',
	},
});

const emit = defineEmits(['comment-created']);

const { user } = useDirectusAuth();
const { createComment } = useComments();
const comment = ref(null);
const max = ref(255);
const isSubmitting = ref(false);

async function postComment() {
	if (!comment.value || !comment.value.trim() || isSubmitting.value) {
		return;
	}

	isSubmitting.value = true;

	try {
		const newComment = await createComment({
			content: comment.value.trim(),
			target_collection: props.collection,
			target_id: props.item,
			parent_id: props.parent || null,
		});

		comment.value = null;
		emit('comment-created', newComment);
	} catch (error) {
		console.error('Error posting comment:', error);
	} finally {
		isSubmitting.value = false;
	}
}
</script>
<template>
	<div class="relative w-full flex items-center justify-center flex-row">
		<AccountAvatar size="xs" />
		<div class="flex-grow relative">
			<input
				v-model="comment"
				type="text"
				:maxlength="max"
				class="w-full h-8 comment-input"
				placeholder="Write a comment..."
				@keyup.enter="postComment" />
			<a
				href="#"
				class="absolute right-0 font-bold py-2 px-2 uppercase blue cursor-pointer post-btn"
				@click.prevent="postComment">
				Post
			</a>
		</div>
	</div>
</template>
<style>
@reference "~/assets/css/tailwind.css";
.comment-input {
	border-radius: 18px;
	background: rgb(245, 245, 245);
	font-size: 14px;
	@apply px-4 border-none shadow-inner dark:bg-black dark:text-white;
	padding-right: 40px;
}
.post-btn {
	line-height: 18px;
	font-size: 15px;
	color: var(--cyan);
	top: calc(50% - 17px);
}
</style>
