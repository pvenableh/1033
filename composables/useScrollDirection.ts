import {useThrottleFn} from '@vueuse/core';

// Shared scroll state across components
const isScrollingDown = ref(false);
const scrollY = ref(0);
const previousScrollY = ref(0);
const isScrolled = ref(false);

let isInitialized = false;

export function useScrollDirection() {
	const handleScroll = useThrottleFn(() => {
		const currentScrollY = window.scrollY;

		// Only update direction if we've scrolled more than 10px (debounce small movements)
		if (Math.abs(currentScrollY - previousScrollY.value) > 10) {
			isScrollingDown.value = currentScrollY > previousScrollY.value && currentScrollY > 10;
			previousScrollY.value = currentScrollY;
		}

		scrollY.value = currentScrollY;
		isScrolled.value = currentScrollY > 10;
	}, 50);

	onMounted(() => {
		if (!isInitialized) {
			window.addEventListener('scroll', handleScroll, {passive: true});
			isInitialized = true;
		}
	});

	onUnmounted(() => {
		// Don't remove listener - it's shared across components
	});

	return {
		isScrollingDown: readonly(isScrollingDown),
		scrollY: readonly(scrollY),
		isScrolled: readonly(isScrolled),
	};
}
