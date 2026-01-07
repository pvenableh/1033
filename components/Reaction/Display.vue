<template>
	<div v-if="hasReactions || showPicker" class="flex flex-wrap items-center gap-1.5 mt-2">
		<!-- Existing reactions with animation -->
		<TransitionGroup name="reaction">
			<Tooltip v-for="reaction in summary.reactions" :key="reaction.reaction_type.id" :text="getTooltipText(reaction)">
				<button
					class="reaction-button inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200"
					:class="getReactionButtonClass(reaction)"
					:disabled="loading || !loggedIn"
					@click="handleToggle(reaction.reaction_type)">
					<!-- Emoji display -->
					<span
						v-if="reaction.reaction_type.emoji"
						class="transition-transform duration-200"
						:class="{'scale-110': reaction.hasReacted}">
						{{ reaction.reaction_type.emoji }}
					</span>
					<!-- Icon display - use filled variant when user has reacted -->
					<Icon
						v-else-if="reaction.reaction_type.icon"
						:name="getIconName(reaction)"
						class="w-3.5 h-3.5 transition-all duration-200"
						:class="{'scale-110': reaction.hasReacted}" />
					<span>{{ reaction.count }}</span>
				</button>
			</Tooltip>
		</TransitionGroup>

		<!-- Add reaction button (only if logged in) -->
		<ReactionPicker
			v-if="showPicker && loggedIn"
			:selected-type-ids="userReactionTypeIds"
			:button-class="pickerButtonClass"
			@select="handlePickerSelect" />
	</div>
</template>

<script setup lang="ts">
import type {ReactionTypeRecord, ReactionSummary, ReactionCount, ReactableCollection} from '~/types/reactions';
import {getReactionIcon, getReactionIconFilled} from '~/types/reactions';

const props = defineProps<{
	collection: ReactableCollection;
	itemId: string;
	ownerUserId?: string;
	itemContext?: {title?: string; channelName?: string};
	showPicker?: boolean;
	compact?: boolean;
}>();

const emit = defineEmits<{
	(e: 'reaction-changed', summary: ReactionSummary): void;
}>();

const {toggleReaction, getReactionSummary} = useReactions();
const {loggedIn} = useDirectusAuth();

const loading = ref(false);
const summary = ref<ReactionSummary>({
	item_id: props.itemId,
	collection: props.collection,
	reactions: [],
	totalCount: 0,
});

const hasReactions = computed(() => summary.value.reactions.length > 0);

const userReactionTypeIds = computed(() => {
	return summary.value.reactions.filter((r) => r.hasReacted).map((r) => r.reaction_type.id);
});

const pickerButtonClass = computed(() => {
	return props.compact ? 'opacity-0 group-hover:opacity-100' : '';
});

const getIconName = (reaction: ReactionCount) => {
	// Use filled variant if user has reacted
	if (reaction.hasReacted) {
		return getReactionIconFilled(reaction.reaction_type);
	}
	return getReactionIcon(reaction.reaction_type);
};

const getReactionButtonClass = (reaction: ReactionCount) => {
	if (reaction.hasReacted) {
		return 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700 hover:bg-primary-200 dark:hover:bg-primary-900/60 hover:scale-105';
	}
	return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105';
};

const getTooltipText = (reaction: ReactionCount) => {
	const names = reaction.users.slice(0, 5).map((u) => `${u.first_name} ${u.last_name}`);
	const remaining = reaction.count - names.length;

	let text = names.join(', ');
	if (remaining > 0) {
		text += ` and ${remaining} more`;
	}
	return text;
};

const handleToggle = async (reactionType: ReactionTypeRecord) => {
	if (!loggedIn.value || loading.value) return;

	loading.value = true;
	try {
		await toggleReaction(
			{
				collection: props.collection,
				item_id: props.itemId,
				reaction_type: reactionType.id,
			},
			{
				notifyOwner: true,
				ownerUserId: props.ownerUserId,
				itemContext: props.itemContext,
			}
		);

		// Refresh the summary
		await refresh();
	} catch (error) {
		console.error('Failed to toggle reaction:', error);
	} finally {
		loading.value = false;
	}
};

const handlePickerSelect = async (reactionType: ReactionTypeRecord) => {
	await handleToggle(reactionType);
};

const refresh = async () => {
	try {
		summary.value = await getReactionSummary(props.collection, props.itemId);
		emit('reaction-changed', summary.value);
	} catch (error) {
		console.error('Failed to fetch reactions:', error);
	}
};

// Initial fetch
onMounted(() => {
	refresh();
});

// Watch for itemId changes
watch(
	() => props.itemId,
	() => {
		refresh();
	}
);

// Expose refresh method for parent components
defineExpose({refresh});
</script>

<style scoped>
/* Reaction button animation */
.reaction-button:active {
	transform: scale(0.95);
}

/* TransitionGroup animations */
.reaction-enter-active {
	animation: reaction-pop 0.3s ease-out;
}

.reaction-leave-active {
	animation: reaction-pop 0.2s ease-in reverse;
}

.reaction-move {
	transition: transform 0.3s ease;
}

@keyframes reaction-pop {
	0% {
		opacity: 0;
		transform: scale(0.5);
	}
	50% {
		transform: scale(1.1);
	}
	100% {
		opacity: 1;
		transform: scale(1);
	}
}
</style>
