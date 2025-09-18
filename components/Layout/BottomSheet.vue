//BottomSheet.vue
<template>
	<div>
		<!-- Trigger slot -->
		<slot name="trigger" :toggle="toggleSheet">
			<FormVButton class="mb-6 m-3 w-full max-w-[450px]" type="button" variant="outline" @click="toggleSheet">
				Open Sheet
			</FormVButton>
		</slot>

		<!-- Teleport the sheet to body -->
		<Teleport to="body">
			<!-- Overlay -->
			<Transition
				enter-active-class="transition-opacity duration-300 ease-out"
				leave-active-class="transition-opacity duration-200 ease-in"
				enter-from-class="opacity-0"
				leave-to-class="opacity-0">
				<div v-if="isOpen" class="fixed inset-0 bg-gray-500 bg-opacity-75 z-40" @click="closeSheet" />
			</Transition>

			<!-- Bottom Sheet -->
			<div
				ref="bottomSheet"
				class="fixed left-0 right-0 bottom-0 z-50 transform translate-y-full"
				:class="[{'pointer-events-none': !isOpen}, maxWidthClass]">
				<div
					ref="sheetContent"
					class="bg-white rounded-t-2xl shadow-xl mx-auto w-full overflow-y-auto no-scrollbar"
					:class="[maxHeightClass]">
					<!-- Handle -->
					<div v-if="showHandle" class="w-full flex justify-center pt-4 pb-2 touch-none cursor-grab" ref="handle">
						<div class="w-12 h-1.5 bg-gray-300 rounded-full" />
					</div>

					<!-- Header slot -->
					<slot name="header" />

					<!-- Content -->
					<div
						:class="contentClass"
						class="flex-1"
						ref="content"
						@touchstart="onContentTouchStart"
						@touchmove="onContentTouchMove">
						<slot />
					</div>

					<!-- Footer slot -->
					<slot name="footer" />
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup>
import gsap from 'gsap';

const props = defineProps({
	maxWidth: {
		type: String,
		default: 'max-w-3xl',
	},
	maxHeight: {
		type: String,
		default: 'max-h-[90vh]',
	},
	contentClass: {
		type: String,
		default: 'px-4 py-2',
	},
	showHandle: {
		type: Boolean,
		default: true,
	},
	closeOnClickOutside: {
		type: Boolean,
		default: true,
	},
	swipeThreshold: {
		type: Number,
		default: 50,
	},
});

const emit = defineEmits(['update:modelValue', 'opened', 'closed']);

// Refs
const bottomSheet = ref(null);
const sheetContent = ref(null);
const handle = ref(null);
const content = ref(null);
const isOpen = ref(false);

// Touch handling state
const touchStart = ref(null);
const currentTranslateY = ref(0);
const isDragging = ref(false);

// Computed
const maxWidthClass = computed(() => props.maxWidth);
const maxHeightClass = computed(() => props.maxHeight);

watch(isOpen, (newValue) => {
	if (newValue) {
		document.body.style.overflow = 'hidden';
	} else {
		resetBodyOverflow();
	}
});

// Function to reset body overflow
const resetBodyOverflow = () => {
	if (document?.body) {
		document.body.style.removeProperty('overflow');
	}
};

// Touch handlers for the handle
onMounted(() => {
	if (handle.value) {
		handle.value.addEventListener('touchstart', onHandleTouchStart, {passive: false});
		handle.value.addEventListener('touchmove', onHandleTouchMove, {passive: false});
		handle.value.addEventListener('touchend', onTouchEnd, {passive: true});
	}
	document.addEventListener('touchend', onTouchEnd, {passive: true});
});

onUnmounted(() => {
	if (handle.value) {
		handle.value.removeEventListener('touchstart', onHandleTouchStart);
		handle.value.removeEventListener('touchmove', onHandleTouchMove);
		handle.value.removeEventListener('touchend', onTouchEnd);
	}
	document.removeEventListener('touchend', onTouchEnd);
	resetBodyOverflow();
});

// Handle touch handlers
function onHandleTouchStart(e) {
	e.preventDefault();
	touchStart.value = e.touches[0].clientY;
	isDragging.value = true;
}

function onHandleTouchMove(e) {
	if (!touchStart.value || !isDragging.value) return;

	e.preventDefault();
	const currentTouch = e.touches[0].clientY;
	const diff = currentTouch - touchStart.value;

	if (diff < 0) return; // Prevent dragging upwards

	currentTranslateY.value = diff;
	if (bottomSheet.value) {
		gsap.to(bottomSheet.value, {y: diff, duration: 0.1, ease: 'none'});
	}
}

// Content touch handlers
function onContentTouchStart(e) {
	const content = e.currentTarget;
	if (content.scrollTop <= 0) {
		touchStart.value = e.touches[0].clientY;
	}
}

function onContentTouchMove(e) {
	if (!touchStart.value || content.value.scrollTop > 0) return;

	const currentTouch = e.touches[0].clientY;
	const diff = currentTouch - touchStart.value;

	if (diff > 0) {
		// Prevent any upward movement
		e.preventDefault();
		currentTranslateY.value = diff;
		gsap.set(bottomSheet.value, {y: `${diff}px`});
	}
}

function onTouchEnd() {
	if (!isDragging.value && !touchStart.value) return;

	isDragging.value = false;
	touchStart.value = null;

	const shouldClose = currentTranslateY.value > props.swipeThreshold;

	gsap.to(bottomSheet.value, {
		y: shouldClose ? '100%' : '0%',
		duration: 0.3,
		ease: shouldClose ? 'power3.in' : 'power3.out',
		onComplete: () => {
			if (shouldClose) {
				isOpen.value = false;
				emit('closed');
			}
		},
	});

	currentTranslateY.value = 0;
}

// Animation timeline
let tl = null;

onMounted(() => {
	tl = gsap.timeline({paused: true}).fromTo(
		bottomSheet.value,
		{y: '100%'},
		{
			y: '0%',
			duration: 0.5,
			ease: 'power3.out',
			onComplete: () => emit('opened'),
		}
	);
});

// Method
const toggleSheet = () => {
	isOpen.value = !isOpen.value;
	if (isOpen.value) {
		gsap.to(bottomSheet.value, {y: '0%', duration: 0.5, ease: 'power3.out'});
		emit('opened');
	} else {
		gsap.to(bottomSheet.value, {
			y: '100%',
			duration: 0.3,
			ease: 'power3.in',
			onComplete: () => emit('closed'),
		});
	}
};

const closeSheet = () => {
	if (props.closeOnClickOutside && isOpen.value) {
		gsap.to(bottomSheet.value, {
			y: '100%',
			duration: 0.3,
			ease: 'power3.in',
			onComplete: () => {
				isOpen.value = false; // Only close after animation finishes
				emit('closed');
			},
		});
	}
};

// Expose methods
defineExpose({
	isOpen,
	toggleSheet,
	closeSheet,
});
</script>
