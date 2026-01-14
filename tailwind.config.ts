import type {Config} from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import tailwindcssForms from '@tailwindcss/forms';
import tailwindcssSafeArea from 'tailwindcss-safe-area';
import defaultTheme from 'tailwindcss/defaultTheme';

module.exports = {
	darkMode: 'class',
	container: {
		center: true,
	},
	content: [
		'./components/**/*.{vue,js,ts}',
		'./layouts/**/*.vue',
		'./pages/**/*.vue',
		'./app.vue',
		'./plugins/**/*.{js,ts}',
		`./App.{js,ts,vue}`,
		`./app.{js,ts,vue}`,
		`./nuxt.config.{js,ts}`,
	],
	theme: {
		extend: {
			borderRadius: {
				large: '30px',
				card: 'var(--border-radius-card)',
				button: 'var(--border-radius-button)',
				input: 'var(--border-radius-input)',
				panel: 'var(--border-radius-panel)',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			colors: {
				// shadcn-vue CSS variable based colors
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				// Project-specific colors
				turquoise: {
					100: '#edfffc',
					200: '#c0fff8',
					300: '#81fff3',
					400: '#3affed',
					500: '#00efd1',
					600: '#00e2c7',
					700: '#00b7a5',
					800: '#009184',
					900: '#00726a',
				},
				// Sell-sheet color palette
				gold: {
					DEFAULT: '#C9A96E',
					light: '#D4BA8A',
					dark: '#8B7355',
				},
				cream: {
					DEFAULT: '#FDFCFA',
					alt: '#F5F3EF',
				},
				divider: '#E5E0D8',
			},
			fontFamily: {
				body: ['Proxima Nova W01 Light', 'Helvetica Neue', 'Helvetica', 'Roboto', 'Arial', 'sans-serif'],
				bold: ['Proxima Nova W01 Regular', 'Helvetica Neue', 'Helvetica', 'Roboto', 'Arial', 'sans-serif'],
				sans: ['Proxima Nova W01 Light', 'Helvetica Neue', 'Helvetica', 'Roboto', 'Arial', 'sans-serif'],
				// Added serif font for Bauer Bodoni
				serif: ['Bauer Bodoni Pro_1 W05 Roman', 'Times New Roman', 'Times', 'serif'],
				display: ['var(--font-display)', ...defaultTheme.fontFamily.serif],
				mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
				signature: ['var(--font-signature)', 'cursive', 'sans-serif'],
			},
			letterSpacing: {
				tightest: '-.075em',
				tighter: '-.05em',
				tight: '-.025em',
				normal: '0',
				wide: '.1em',
				wider: '.2em',
				widest: '.4em',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--reka-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--reka-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [
		tailwindcssForms,
		tailwindcssSafeArea,
		// Formkit Plugin for Tailwind
		// https://formkit.com/guides/create-a-tailwind-theme
		// require('@formkit/themes/tailwindcss'),
		plugin(function ({addUtilities}) {
			addUtilities({
				'.no-scrollbar': {
					'-ms-overflow-style': 'none' /* IE and Edge */,
					'scrollbar-width': 'none' /* Firefox */,
					'&::-webkit-scrollbar': {
						display: 'none' /* Chrome, Safari and Opera */,
					},
				},
			});
		}),
	],
} satisfies Config;
