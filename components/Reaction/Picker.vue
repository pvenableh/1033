<template>
	<UPopover :popper="{ placement: 'top' }" @update:open="onPopoverOpen">
		<slot name="trigger">
			<UButton
				size="xs"
				color="gray"
				variant="ghost"
				icon="i-heroicons-face-smile"
				:class="buttonClass"
				aria-label="Add reaction" />
		</slot>

		<template #panel>
			<div class="p-2 min-w-[200px]">
				<!-- Loading state -->
				<div v-if="loading" class="flex items-center justify-center py-4">
					<UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
				</div>

				<!-- Reaction grid -->
				<div v-else class="grid grid-cols-6 gap-1">
					<button
						v-for="reactionType in types"
						:key="reactionType.id"
						class="relative p-1.5 rounded-md transition-all duration-200 hover:scale-110"
						:class="getButtonClass(reactionType)"
						:title="reactionType.name"
						@click="handleSelect(reactionType)">
						<!-- Emoji display -->
						<span v-if="reactionType.emoji" class="text-xl">
							{{ reactionType.emoji }}
						</span>
						<!-- Icon display with filled variant when selected -->
						<UIcon
							v-else-if="reactionType.icon"
							:name="getIconName(reactionType)"
							class="w-5 h-5 transition-all duration-200"
							:class="getIconClass(reactionType)" />

						<!-- Selected indicator -->
						<span
							v-if="isSelected(reactionType)"
							class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
					</button>
				</div>

				<!-- Empty state -->
				<div v-if="!loading && types.length === 0" class="text-center py-4 text-gray-500 text-sm">
					No reactions available
				</div>
			</div>
		</template>
	</UPopover>
</template>

<script setup lang="ts">
import type { ReactionTypeRecord } from '~/types/reactions';
import { getReactionIcon, getReactionIconFilled } from '~/types/reactions';

const props = defineProps<{
	selectedTypeIds?: number[];
	buttonClass?: string;
}>();

const emit = defineEmits<{
	(e: 'select', reactionType: ReactionTypeRecord): void;
}>();

const { getReactionTypes } = useReactions();

const types = ref<ReactionTypeRecord[]>([]);
const loading = ref(false);
const loaded = ref(false);

const selectedTypeIds = computed(() => props.selectedTypeIds || []);

const onPopoverOpen = async (open: boolean) => {
	if (open && !loaded.value) {
		loading.value = true;
		try {
			types.value = await getReactionTypes();
			loaded.value = true;
		} catch (error) {
			console.error('Failed to load reaction types:', error);
		} finally {
			loading.value = false;
		}
	}
};

const isSelected = (reactionType: ReactionTypeRecord) => {
	return selectedTypeIds.value.includes(reactionType.id);
};

const getButtonClass = (reactionType: ReactionTypeRecord) => {
	if (isSelected(reactionType)) {
		return 'bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50';
	}
	return 'hover:bg-gray-100 dark:hover:bg-gray-700';
};

const getIconName = (reactionType: ReactionTypeRecord) => {
	// Use filled variant if selected
	if (isSelected(reactionType)) {
		return getReactionIconFilled(reactionType);
	}
	return getReactionIcon(reactionType);
};

const getIconClass = (reactionType: ReactionTypeRecord) => {
	if (isSelected(reactionType)) {
		return 'text-primary-600 dark:text-primary-400';
	}
	return 'text-gray-600 dark:text-gray-400';
};

const handleSelect = (reactionType: ReactionTypeRecord) => {
	emit('select', reactionType);
};
</script>
