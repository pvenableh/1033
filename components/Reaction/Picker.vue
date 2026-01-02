<template>
	<UPopover :popper="{ placement: 'top' }">
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
			<div class="p-2">
				<div class="grid grid-cols-6 gap-1">
					<button
						v-for="reaction in availableReactions"
						:key="reaction.type"
						class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xl"
						:class="{
							'bg-primary-100 dark:bg-primary-900/30': selectedTypes.includes(reaction.type)
						}"
						:title="reaction.label"
						@click="handleSelect(reaction.type)">
						{{ reaction.emoji }}
					</button>
				</div>
			</div>
		</template>
	</UPopover>
</template>

<script setup lang="ts">
import type { ReactionType } from '~/types/reactions';
import { getAllReactionTypes } from '~/types/reactions';

const props = defineProps<{
	selectedTypes?: ReactionType[];
	buttonClass?: string;
}>();

const emit = defineEmits<{
	(e: 'select', type: ReactionType): void;
}>();

const availableReactions = getAllReactionTypes();

const selectedTypes = computed(() => props.selectedTypes || []);

const handleSelect = (type: ReactionType) => {
	emit('select', type);
};
</script>
