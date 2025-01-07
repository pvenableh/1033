import { useEventListener, useDebounceFn } from '@vueuse/core';

export function useSwipe(elementRef, options = {}) {
	// Default options
	const defaultOptions = {
		minSwipeDistance: 50, // Minimum distance for a swipe to be registered
		maxSwipeTime: 300, // Maximum time (in ms) for a valid swipe
		preventScroll: false, // Prevent scrolling while swiping
		swipeDirection: 'horizontal', // 'horizontal', 'vertical', or 'both'
	};

	const config = { ...defaultOptions, ...options };

	// Touch and swipe state tracking
	const startX = ref(0);
	const startY = ref(0);
	const deltaX = ref(0);
	const deltaY = ref(0);
	const isSwiping = ref(false);
	const startTime = ref(0);

	// Directional swipe states
	const isSwipingLeft = ref(false);
	const isSwipingRight = ref(false);
	const isSwipingUp = ref(false);
	const isSwipingDown = ref(false);

	// Emit custom swipe events
	const emitSwipeEvent = useDebounceFn((direction) => {
		elementRef.value?.dispatchEvent(new CustomEvent('swipe', { detail: { direction } }));
	}, 200);

	// Touch event handlers
	const touchstart = (event) => {
		const touch = event.touches[0];
		startX.value = touch.clientX;
		startY.value = touch.clientY;
		startTime.value = Date.now();
		isSwiping.value = true;

		// Reset swipe states
		isSwipingLeft.value = false;
		isSwipingRight.value = false;
		isSwipingUp.value = false;
		isSwipingDown.value = false;

		if (config.preventScroll) {
			event.preventDefault();
		}
	};

	const touchmove = (event) => {
		if (!isSwiping.value) return;

		const touch = event.touches[0];
		deltaX.value = touch.clientX - startX.value;
		deltaY.value = touch.clientY - startY.value;

		// Update swipe directions based on configuration
		if (config.swipeDirection !== 'vertical') {
			isSwipingLeft.value = deltaX.value < -config.minSwipeDistance;
			isSwipingRight.value = deltaX.value > config.minSwipeDistance;
		}

		if (config.swipeDirection !== 'horizontal') {
			isSwipingUp.value = deltaY.value < -config.minSwipeDistance;
			isSwipingDown.value = deltaY.value > config.minSwipeDistance;
		}

		if (config.preventScroll) {
			event.preventDefault();
		}
	};

	const touchend = () => {
		const swipeDuration = Date.now() - startTime.value;

		// Only emit swipe events if the swipe is within the allowed time
		if (swipeDuration <= config.maxSwipeTime) {
			if (isSwipingLeft.value) emitSwipeEvent('left');
			if (isSwipingRight.value) emitSwipeEvent('right');
			if (isSwipingUp.value) emitSwipeEvent('up');
			if (isSwipingDown.value) emitSwipeEvent('down');
		}

		// Reset swipe state
		isSwiping.value = false;
		startTime.value = 0;
	};

	// Mouse event handlers
	const mousedown = (event) => {
		startX.value = event.clientX;
		startY.value = event.clientY;
		startTime.value = Date.now();
		isSwiping.value = true;
	};

	const mousemove = (event) => {
		if (!isSwiping.value) return;

		deltaX.value = event.clientX - startX.value;
		deltaY.value = event.clientY - startY.value;

		isSwipingLeft.value = deltaX.value < -config.minSwipeDistance;
		isSwipingRight.value = deltaX.value > config.minSwipeDistance;
		isSwipingUp.value = deltaY.value < -config.minSwipeDistance;
		isSwipingDown.value = deltaY.value > config.minSwipeDistance;
	};

	const mouseup = () => {
		touchend(); // Reuse the touchend logic
	};

	// Computed properties for swipe states
	const isHorizontalSwipe = computed(
		() => Math.abs(deltaX.value) >= config.minSwipeDistance && Math.abs(deltaX.value) > Math.abs(deltaY.value),
	);

	const isVerticalSwipe = computed(
		() => Math.abs(deltaY.value) >= config.minSwipeDistance && Math.abs(deltaY.value) > Math.abs(deltaX.value),
	);

	// Setup event listeners
	onMounted(() => {
		if (elementRef.value) {
			// Touch events
			useEventListener(elementRef.value, 'touchstart', touchstart, { passive: !config.preventScroll });
			useEventListener(elementRef.value, 'touchmove', touchmove, { passive: !config.preventScroll });
			useEventListener(elementRef.value, 'touchend', touchend);
			useEventListener(elementRef.value, 'touchcancel', touchend);

			// Mouse events
			useEventListener(elementRef.value, 'mousedown', mousedown);
			useEventListener(document, 'mousemove', mousemove);
			useEventListener(document, 'mouseup', mouseup);
		}
	});

	// Return swipe states and methods
	return {
		// Basic swipe data
		deltaX,
		deltaY,
		isSwiping,

		// Directional swipe states
		isSwipingLeft,
		isSwipingRight,
		isSwipingUp,
		isSwipingDown,

		// Computed states
		isHorizontalSwipe,
		isVerticalSwipe,
	};
}
