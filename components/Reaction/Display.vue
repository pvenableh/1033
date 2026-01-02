<template>
	<div v-if="hasReactions || showPicker" class="flex flex-wrap items-center gap-1.5 mt-2">
		<!-- Existing reactions -->
		<UTooltip
			v-for="reaction in summary.reactions"
			:key="reaction.reaction_type"
			:text="getTooltipText(reaction)">
			<button
				class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all"
				:class="getReactionButtonClass(reaction)"
				:disabled="loading || !loggedIn"
				@click="handleToggle(reaction.reaction_type)">
				<span>{{ getEmoji(reaction.reaction_type) }}</span>
				<span>{{ reaction.count }}</span>
			</button>
		</UTooltip>

		<!-- Add reaction button (only if logged in) -->
		<ReactionPicker
			v-if="showPicker && loggedIn"
			:selected-types="userReactionTypes"
			:button-class="pickerButtonClass"
			@select="handleToggle" />
	</div>
</template>

<script setup lang="ts">
import type { ReactionType, ReactionSummary, ReactionCount, ReactableCollection } from '~/types/reactions';
import { getReactionMeta } from '~/types/reactions';

const props = defineProps<{
	collection: ReactableCollection;
	itemId: string;
	ownerUserId?: string;
	itemContext?: { title?: string; channelName?: string };
	showPicker?: boolean;
	compact?: boolean;
}>();

const emit = defineEmits<{
	(e: 'reaction-changed', summary: ReactionSummary): void;
}>();

const { toggleReaction, getReactionSummary } = useReactions();
const { loggedIn, user } = useDirectusAuth();

const loading = ref(false);
const summary = ref<ReactionSummary>({
	item_id: props.itemId,
	collection: props.collection,
	reactions: [],
	totalCount: 0,
});

const hasReactions = computed(() => summary.value.reactions.length > 0);

const userReactionTypes = computed(() => {
	return summary.value.reactions
		.filter((r) => r.hasReacted)
		.map((r) => r.reaction_type);
});

const pickerButtonClass = computed(() => {
	return props.compact
		? 'opacity-0 group-hover:opacity-100'
		: '';
});

const getEmoji = (type: ReactionType) => {
	return getReactionMeta(type).emoji;
};

const getReactionButtonClass = (reaction: ReactionCount) => {
	if (reaction.hasReacted) {
		return 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700 hover:bg-primary-200 dark:hover:bg-primary-900/60';
	}
	return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700';
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

const handleToggle = async (type: ReactionType) => {
	if (!loggedIn.value || loading.value) return;

	loading.value = true;
	try {
		await toggleReaction(
			{
				collection: props.collection,
				item_id: props.itemId,
				reaction_type: type,
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
defineExpose({ refresh });
</script>
