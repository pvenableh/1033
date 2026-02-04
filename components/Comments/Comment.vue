<script setup>
const { user } = useDirectusAuth();

const props = defineProps({
	comment: {
		type: Object,
		default: null,
	},
	collection: {
		type: String,
		default: '',
	},
});

// Helper to get relative time
const getRelativeTime = (dateString) => {
	if (!dateString) return '';
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor((now - date) / 1000);

	if (diffInSeconds < 60) return 'just now';
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
	if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
	return date.toLocaleDateString();
};

// Support both old (junction table) and new (direct) comment structures
const commentData = computed(() => {
	const c = props.comment;
	// New structure from useComments
	if (c.content && c.user_created) {
		return {
			id: c.id,
			content: c.content,
			user: c.user_created,
			date_created: c.date_created,
		};
	}
	// Old structure with junction table
	if (c.comments_id) {
		return {
			id: c.comments_id.id || c.id,
			content: c.comments_id.comment || c.comments_id.content,
			user: c.comments_id.user || c.comments_id.user_created,
			date_created: c.comments_id.date_created,
		};
	}
	// Fallback - direct structure without nesting
	return {
		id: c.id,
		content: c.comment || c.content || '',
		user: c.user || c.user_created || {},
		date_created: c.date_created,
	};
});

const commentUser = computed(() => commentData.value.user || {});

const avatar = computed(() => {
	const u = commentUser.value;
	if (u.avatar) {
		return 'https://admin.1033lenox.com/assets/' + u.avatar + '?key=medium';
	}
	const firstName = u.first_name || 'User';
	const lastName = u.last_name || '';
	return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=eeeeee&color=00bfff`;
});

const userName = computed(() => {
	const u = commentUser.value;
	return `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User';
});

const isCurrentUser = computed(() => {
	return user.value?.id === commentUser.value?.id;
});
</script>
<template>
	<div class="w-full relative flex items-start justify-start flex-row pb-3 comment">
		<UAvatar
			class="comment__user-avatar"
			size="xs"
			:src="avatar"
			:alt="userName" />
		<div class="comment__comment">
			<div class="flex flex-row comment__comment-name">
				<h5>
					<span v-if="isCurrentUser">You</span>
					<span v-else>{{ userName }}</span>
				</h5>
			</div>
			<div class="comment__comment-text" v-html="commentData.content"></div>
		</div>
		<h5 class="absolute left-[40px] -bottom-[0px] uppercase font-condensed-bold text-left z-0 pl-1 comment__time">
			{{ getRelativeTime(commentData.date_created) }}
		</h5>
	</div>
</template>
<style>
@reference "~/assets/css/tailwind.css";

.comment__user-avatar {
	@apply mr-2;
}

.comment__comment {
	border-radius: 18px;
	background: #f5f5f5;
	font-size: 14px;
	word-break: break-word;
	word-wrap: break-word;
	@apply py-2 px-3 shadow-inner dark:bg-black dark:text-white;
}

.comment__comment-name {
	font-size: 10px;
	line-height: 10px;
	@apply font-bold;
}

.comment__time {
	font-size: 7px;
	@apply font-bold;
}
</style>
