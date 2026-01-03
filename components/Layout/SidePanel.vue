<template>
	<div>
		<!-- Trigger slot -->
		<slot name="trigger" :toggle="togglePanel" :is-open="isOpen">
			<UButton variant="ghost" @click="togglePanel">
				Open Panel
			</UButton>
		</slot>

		<!-- Teleport the panel to body -->
		<Teleport to="body">
			<!-- Overlay -->
			<Transition
				enter-active-class="transition-opacity duration-300 ease-out"
				leave-active-class="transition-opacity duration-200 ease-in"
				enter-from-class="opacity-0"
				leave-to-class="opacity-0">
				<div
					v-if="isOpen"
					class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 z-40"
					@click="closeOnClickOutside && closePanel()" />
			</Transition>

			<!-- Side Panel -->
			<div
				ref="sidePanel"
				class="fixed top-0 right-0 bottom-0 z-50 transform translate-x-full"
				:class="[widthClass, {'pointer-events-none': !isOpen}]">
				<div
					ref="panelContent"
					class="bg-white dark:bg-gray-900 shadow-xl h-full flex flex-col overflow-hidden"
					:class="[contentClass]">
					<!-- Header -->
					<div
						v-if="$slots.header || showCloseButton"
						class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
						<slot name="header">
							<span class="font-semibold text-gray-900 dark:text-white">{{ title }}</span>
						</slot>
						<button
							v-if="showCloseButton"
							@click="closePanel"
							class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							aria-label="Close panel">
							<UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
						</button>
					</div>

					<!-- Content -->
					<div class="flex-1 overflow-y-auto no-scrollbar">
						<slot />
					</div>

					<!-- Footer slot -->
					<div v-if="$slots.footer" class="border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
						<slot name="footer" />
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import gsap from 'gsap';

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: undefined,
	},
	title: {
		type: String,
		default: '',
	},
	width: {
		type: String,
		default: 'w-full sm:w-96 md:w-[420px]',
	},
	contentClass: {
		type: String,
		default: '',
	},
	showCloseButton: {
		type: Boolean,
		default: true,
	},
	closeOnClickOutside: {
		type: Boolean,
		default: true,
	},
	closeOnEscape: {
		type: Boolean,
		default: true,
	},
});

const emit = defineEmits(['update:modelValue', 'opened', 'closed']);

// Refs
const sidePanel = ref<HTMLElement | null>(null);
const panelContent = ref<HTMLElement | null>(null);

// Use v-model if provided, otherwise internal state
const isControlled = computed(() => props.modelValue !== undefined);
const internalOpen = ref(false);

const isOpen = computed({
	get: () => (isControlled.value ? props.modelValue : internalOpen.value),
	set: (value: boolean) => {
		if (isControlled.value) {
			emit('update:modelValue', value);
		} else {
			internalOpen.value = value;
		}
	},
});

// Computed
const widthClass = computed(() => props.width);

// Watch for controlled open state changes
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue !== undefined) {
			if (newValue) {
				openPanelAnimation();
			} else {
				closePanelAnimation();
			}
		}
	}
);

// Watch internal open state
watch(isOpen, (newValue) => {
	if (newValue) {
		document.body.style.overflow = 'hidden';
	} else {
		resetBodyOverflow();
	}
});

// Function to reset body overflow
const resetBodyOverflow = () => {
	if (typeof document !== 'undefined' && document.body) {
		document.body.style.removeProperty('overflow');
	}
};

// Animation functions
const openPanelAnimation = () => {
	if (sidePanel.value) {
		gsap.to(sidePanel.value, {
			x: '0%',
			duration: 0.3,
			ease: 'power3.out',
			onComplete: () => emit('opened'),
		});
	}
};

const closePanelAnimation = () => {
	if (sidePanel.value) {
		gsap.to(sidePanel.value, {
			x: '100%',
			duration: 0.25,
			ease: 'power3.in',
			onComplete: () => emit('closed'),
		});
	}
};

// Methods
const openPanel = () => {
	isOpen.value = true;
	nextTick(() => {
		openPanelAnimation();
	});
};

const closePanel = () => {
	closePanelAnimation();
	nextTick(() => {
		isOpen.value = false;
	});
};

const togglePanel = () => {
	if (isOpen.value) {
		closePanel();
	} else {
		openPanel();
	}
};

// Keyboard handling
const handleKeydown = (e: KeyboardEvent) => {
	if (props.closeOnEscape && e.key === 'Escape' && isOpen.value) {
		closePanel();
	}
};

onMounted(() => {
	document.addEventListener('keydown', handleKeydown);
	// Initialize panel position
	if (sidePanel.value) {
		gsap.set(sidePanel.value, { x: '100%' });
	}
});

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown);
	resetBodyOverflow();
});

// Expose methods for parent component access
defineExpose({
	isOpen,
	openPanel,
	closePanel,
	togglePanel,
});
</script>
