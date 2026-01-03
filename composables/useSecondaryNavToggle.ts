/**
 * Composable to manage secondary nav visibility toggle state
 * Persists user preference in localStorage
 */
export function useSecondaryNavToggle() {
	const STORAGE_KEY = 'secondary-nav-visible';

	// Track if we've already initialized from storage to avoid re-running
	const isInitialized = useState<boolean>('secondaryNavInitialized', () => false);

	// Initialize with true (visible by default)
	const isSecondaryNavVisible = useState<boolean>('secondaryNavVisible', () => true);

	// Load preference from localStorage on client side
	const initFromStorage = () => {
		if (import.meta.client && !isInitialized.value) {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored !== null) {
				isSecondaryNavVisible.value = stored === 'true';
			}
			isInitialized.value = true;
		}
	};

	// Toggle visibility and persist to localStorage
	const toggleSecondaryNav = () => {
		isSecondaryNavVisible.value = !isSecondaryNavVisible.value;
		if (import.meta.client) {
			localStorage.setItem(STORAGE_KEY, String(isSecondaryNavVisible.value));
		}
	};

	// Set visibility explicitly
	const setSecondaryNavVisible = (visible: boolean) => {
		isSecondaryNavVisible.value = visible;
		if (import.meta.client) {
			localStorage.setItem(STORAGE_KEY, String(visible));
		}
	};

	// Initialize from storage after hydration to avoid mismatch
	// Using nextTick ensures Vue has finished hydrating
	if (import.meta.client) {
		nextTick(() => {
			initFromStorage();
		});
	}

	return {
		isSecondaryNavVisible: readonly(isSecondaryNavVisible),
		toggleSecondaryNav,
		setSecondaryNavVisible,
	};
}
