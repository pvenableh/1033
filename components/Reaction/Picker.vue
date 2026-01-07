<template>
	<UPopover
		v-model:open="isOpen"
		:popper="{ placement: 'top' }"
		@update:open="onPopoverOpen">
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
			<div class="reaction-picker-panel p-3 min-w-[240px]">
				<!-- Loading state with fun skeleton -->
				<div v-if="loading" class="flex items-center justify-center py-6">
					<div class="loading-emojis">
						<span class="loading-emoji">😊</span>
						<span class="loading-emoji">❤️</span>
						<span class="loading-emoji">🎉</span>
					</div>
				</div>

				<!-- Reaction grid with staggered animation -->
				<div v-else-if="types.length > 0" class="reaction-grid">
					<TransitionGroup name="emoji-pop">
						<button
							v-for="(reactionType, index) in types"
							:key="reactionType.id"
							class="reaction-item"
							:class="getButtonClass(reactionType)"
							:style="{ '--delay': `${index * 30}ms` }"
							:title="reactionType.name"
							@click="handleSelect(reactionType)">
							<!-- Emoji display -->
							<span v-if="reactionType.emoji" class="reaction-emoji">
								{{ reactionType.emoji }}
							</span>
							<!-- Icon display with filled variant when selected -->
							<UIcon
								v-else-if="reactionType.icon"
								:name="getIconName(reactionType)"
								class="w-5 h-5 transition-all duration-200"
								:class="getIconClass(reactionType)" />

							<!-- Selected indicator with bounce -->
							<span
								v-if="isSelected(reactionType)"
								class="selected-indicator" />

							<!-- Hover ripple effect -->
							<span class="ripple-bg" />
						</button>
					</TransitionGroup>
				</div>

				<!-- Empty state -->
				<div v-else class="text-center py-4 text-gray-500 text-sm">
					<span class="text-2xl mb-2 block">😕</span>
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
const isOpen = ref(false);

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
		return 'is-selected';
	}
	return '';
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
	// Close the popover after selection
	isOpen.value = false;
};
</script>

<style scoped>
.reaction-picker-panel {
	background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%);
	border-radius: 1rem;
	box-shadow:
		0 10px 40px -10px rgba(0, 0, 0, 0.15),
		0 0 0 1px rgba(0, 0, 0, 0.05);
}

:root.dark .reaction-picker-panel {
	background: linear-gradient(180deg, rgba(31,41,55,1) 0%, rgba(17,24,39,1) 100%);
	box-shadow:
		0 10px 40px -10px rgba(0, 0, 0, 0.5),
		0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Loading animation */
.loading-emojis {
	display: flex;
	gap: 0.5rem;
}

.loading-emoji {
	font-size: 1.5rem;
	animation: bounce-emoji 0.6s ease-in-out infinite;
}

.loading-emoji:nth-child(2) {
	animation-delay: 0.1s;
}

.loading-emoji:nth-child(3) {
	animation-delay: 0.2s;
}

@keyframes bounce-emoji {
	0%, 100% {
		transform: translateY(0) scale(1);
	}
	50% {
		transform: translateY(-8px) scale(1.1);
	}
}

/* Reaction grid */
.reaction-grid {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 0.25rem;
}

/* Individual reaction item */
.reaction-item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
	overflow: hidden;
}

.reaction-item:hover {
	transform: scale(1.25);
	z-index: 10;
}

.reaction-item:hover .ripple-bg {
	opacity: 1;
	transform: scale(1);
}

.reaction-item:active {
	transform: scale(1.1);
}

/* Reaction emoji */
.reaction-emoji {
	font-size: 1.375rem;
	transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
	position: relative;
	z-index: 2;
}

.reaction-item:hover .reaction-emoji {
	transform: scale(1.1) rotate(-5deg);
}

/* Selected state */
.reaction-item.is-selected {
	background: linear-gradient(135deg, rgb(var(--color-primary-100)), rgb(var(--color-primary-50)));
}

:root.dark .reaction-item.is-selected {
	background: linear-gradient(135deg, rgb(var(--color-primary-900) / 0.4), rgb(var(--color-primary-800) / 0.3));
}

/* Selected indicator dot */
.selected-indicator {
	position: absolute;
	bottom: 2px;
	left: 50%;
	transform: translateX(-50%);
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: rgb(var(--color-primary-500));
	animation: pulse-indicator 1.5s ease-in-out infinite;
	z-index: 3;
}

@keyframes pulse-indicator {
	0%, 100% {
		transform: translateX(-50%) scale(1);
		opacity: 1;
	}
	50% {
		transform: translateX(-50%) scale(1.3);
		opacity: 0.7;
	}
}

/* Ripple background effect */
.ripple-bg {
	position: absolute;
	inset: 0;
	background: radial-gradient(circle, rgba(var(--color-primary-500), 0.15) 0%, transparent 70%);
	opacity: 0;
	transform: scale(0.5);
	transition: all 0.2s ease;
	z-index: 1;
}

/* TransitionGroup animations - staggered pop-in effect */
.emoji-pop-enter-active {
	animation: emoji-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	animation-delay: var(--delay, 0ms);
	opacity: 0;
}

.emoji-pop-leave-active {
	animation: emoji-pop-out 0.2s ease-in forwards;
}

.emoji-pop-move {
	transition: transform 0.3s ease;
}

@keyframes emoji-pop-in {
	0% {
		opacity: 0;
		transform: scale(0) rotate(-180deg);
	}
	60% {
		opacity: 1;
		transform: scale(1.2) rotate(10deg);
	}
	100% {
		opacity: 1;
		transform: scale(1) rotate(0deg);
	}
}

@keyframes emoji-pop-out {
	0% {
		opacity: 1;
		transform: scale(1);
	}
	100% {
		opacity: 0;
		transform: scale(0.5) translateY(10px);
	}
}

/* Jiggle animation on hover for extra fun */
.reaction-item:hover .reaction-emoji {
	animation: jiggle 0.5s ease-in-out;
}

@keyframes jiggle {
	0%, 100% {
		transform: rotate(0deg) scale(1.1);
	}
	25% {
		transform: rotate(-10deg) scale(1.15);
	}
	50% {
		transform: rotate(10deg) scale(1.1);
	}
	75% {
		transform: rotate(-5deg) scale(1.15);
	}
}
</style>
