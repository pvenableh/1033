// Theme composable for managing design themes
// Two themes: 'classic' (cream/serif) and 'modern' (white/grey/sans-serif/cyan)
// Each theme has light and dark mode variants

export type ThemeStyle = 'classic' | 'modern';
export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
	style: ThemeStyle;
	mode: ThemeMode;
}

const THEME_STORAGE_KEY = 'design-theme';

// Get stored theme or default
function getStoredTheme(): ThemeState {
	if (import.meta.client) {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored) {
			try {
				return JSON.parse(stored);
			} catch {
				// Invalid stored value, use default
			}
		}
	}
	return {style: 'classic', mode: 'light'};
}

// Global reactive state
const themeState = reactive<ThemeState>(getStoredTheme());

export function useTheme() {
	const colorMode = useColorMode();

	// Computed theme class for the root element
	const themeClass = computed(() => {
		return `theme-${themeState.style}-${themeState.mode}`;
	});

	// Individual computed refs
	const themeStyle = computed(() => themeState.style);
	const themeMode = computed(() => themeState.mode);
	const isDark = computed(() => themeState.mode === 'dark');
	const isClassic = computed(() => themeState.style === 'classic');
	const isModern = computed(() => themeState.style === 'modern');

	// Set theme style (classic or modern)
	function setThemeStyle(style: ThemeStyle) {
		themeState.style = style;
		saveTheme();
		applyTheme();
	}

	// Set theme mode (light or dark)
	function setThemeMode(mode: ThemeMode) {
		themeState.mode = mode;
		// Sync with Nuxt color mode
		colorMode.preference = mode;
		saveTheme();
		applyTheme();
	}

	// Toggle between light and dark mode
	function toggleMode() {
		setThemeMode(themeState.mode === 'light' ? 'dark' : 'light');
	}

	// Toggle between classic and modern theme
	function toggleStyle() {
		setThemeStyle(themeState.style === 'classic' ? 'modern' : 'classic');
	}

	// Set full theme (style + mode)
	function setTheme(style: ThemeStyle, mode: ThemeMode) {
		themeState.style = style;
		themeState.mode = mode;
		colorMode.preference = mode;
		saveTheme();
		applyTheme();
	}

	// Save theme to localStorage
	function saveTheme() {
		if (import.meta.client) {
			localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeState));
		}
	}

	// Apply theme classes to document
	function applyTheme() {
		if (import.meta.client) {
			const html = document.documentElement;

			// Remove all theme classes
			html.classList.remove(
				'theme-classic-light',
				'theme-classic-dark',
				'theme-modern-light',
				'theme-modern-dark'
			);

			// Add current theme class
			html.classList.add(`theme-${themeState.style}-${themeState.mode}`);

			// Sync dark class for Tailwind
			if (themeState.mode === 'dark') {
				html.classList.add('dark');
			} else {
				html.classList.remove('dark');
			}
		}
	}

	// Initialize theme on mount
	function initTheme() {
		if (import.meta.client) {
			const stored = getStoredTheme();
			themeState.style = stored.style;
			themeState.mode = stored.mode;
			colorMode.preference = stored.mode;
			applyTheme();
		}
	}

	return {
		// State
		themeState,
		themeClass,
		themeStyle,
		themeMode,
		isDark,
		isClassic,
		isModern,

		// Actions
		setThemeStyle,
		setThemeMode,
		toggleMode,
		toggleStyle,
		setTheme,
		initTheme,
		applyTheme,
	};
}
