// import { formatFonts } from './utils/fonts';
// import { theme } from './theme';

export default defineNuxtConfig({
	ssr: true,

	nitro: {
		preset: 'vercel',
		externals: {
			inline: ['unhead'],
		},
	},

	app: {
		pageTransition: {name: 'page', mode: 'out-in'},
		head: {
			charset: 'utf-8',
			htmlAttrs: {
				lang: 'en',
			},
			meta: [
				{
					name: 'viewport',
					content: 'width=device-width, initial-scale=1.0, maximum-scale=5, viewport-fit=cover',
				},
				{
					name: 'mobile-web-app-capable',
					content: 'yes',
				},
			],
			link: [
				{
					rel: 'icon',
					type: 'image/x-icon',
					href: '/favicon.ico',
				},
				{
					rel: 'icon',
					type: 'image/png',
					sizes: '32x32',
					href: '/favicon-32x32.png',
				},
				{
					rel: 'icon',
					type: 'image/png',
					sizes: '16x16',
					href: '/favicon-16x16.png',
				},
				{
					rel: 'apple-touch-icon',
					sizes: '180x180',
					href: '/apple-icon-180x180.png',
				},
			],
		},
	},

	components: {
		dirs: [
			{
				path: '~/components',
				pathPrefix: false,
			},
		],
	},

	css: ['~/assets/css/tailwind.css', '~/assets/css/main.css'],

	modules: [
		'@formkit/nuxt', // https://formkit.com/getting-started/installation#with-nuxt
		'@nuxt/devtools', // https://devtools.nuxtjs.org/
		'@nuxt/icon',
		'@nuxt/image',
		[
			'@nuxt/ui',
			{
				icons: ['heroicons', 'wi', 'meteocons', 'material-symbols', 'lucide', 'fluent-emoji-flat'],
			},
		],
		'@nuxtjs/color-mode',
		'@nuxtjs/seo', // https://nuxtseo.com/
		'@vite-pwa/nuxt', // https://vite-pwa-org.netlify.app/frameworks/nuxt
		'@vueuse/motion/nuxt', // https://motion.vueuse.org/nuxt.html
		'@vueuse/nuxt', // https://vueuse.org/
		'nuxt-auth-utils', // https://github.com/atinux/nuxt-auth-utils
		[
			'nuxt-gtag',
			{
				id: 'G-JTR8V7XBN1',
				debug: true, // Set to true for debugging in the console
				initialConsent: true,
			},
		],
		// '@nuxtjs/plausible',
		// '@nuxtjs/tailwindcss', // https://tailwindcss.nuxtjs.org/ Removed because of Nuxt UI already includes this
	],

	// experimental: {
	// 	componentIslands: true,
	// 	asyncContext: true, // https://nuxt.com/docs/guide/going-further/experimental-features#asynccontext
	// },

	runtimeConfig: {
		// Server-only (not exposed to client)
		// nuxt-auth-utils session secret - set NUXT_SESSION_PASSWORD env var in production
		session: {
			password: process.env.NUXT_SESSION_PASSWORD || 'at-least-32-characters-long-secret-key-for-development',
		},
		sendgridAccessRequestAdminTemplate: process.env.SENDGRID_ACCESS_REQUEST_ADMIN_TEMPLATE || '',
		sendgridAccessRequestUserTemplate: process.env.SENDGRID_ACCESS_REQUEST_USER_TEMPLATE || '',
		staticToken: process.env.DIRECTUS_SERVER_TOKEN || 'cb66quXi2vneyEhG8OtAFJ1jOIO31Pff',
		public: {
			assetsUrl: process.env.DIRECTUS_ASSETS_URL || 'https://admin.1033lenox.com/assets/',
			websocketUrl: process.env.DIRECTUS_WEBSOCKET_URL || 'wss://admin.1033lenox.com/websocket',
			siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
			adminUrl: process.env.DIRECTUS_URL || 'https://admin.1033lenox.com',
			directusUrl: process.env.DIRECTUS_URL || 'https://admin.1033lenox.com',
		},
	},

	devtools: {enabled: true},

	colorMode: {
		preference: 'light',
		classSuffix: '',
	},

	image: {
		provider: 'directus',
		directus: {
			baseURL: `${process.env.DIRECTUS_URL}/assets/`,
		},
	},

	// Site configuration for SEO - https://nuxtseo.com/
	site: {
		url: process.env.NUXT_PUBLIC_SITE_URL || 'https://1033lenox.com',
		name: '1033 Lenox',
		description: 'Luxury living in the heart of Miami Beach - 1033 Lenox Ave Miami Beach, FL',
		defaultLocale: 'en',
	},

	// SEO module configuration
	seo: {
		fallbackTitle: false,
	},

	// PWA configuration - https://vite-pwa-org.netlify.app/frameworks/nuxt
	pwa: {
		registerType: 'autoUpdate',
		manifest: {
			name: '1033 Lenox',
			short_name: '1033 Lenox',
			description: 'Luxury living in the heart of Miami Beach',
			theme_color: '#00efd1',
			background_color: '#FDFCFA',
			display: 'standalone',
			orientation: 'portrait',
			icons: [
				{
					src: '/android-icon-36x36.png',
					sizes: '36x36',
					type: 'image/png',
				},
				{
					src: '/android-icon-48x48.png',
					sizes: '48x48',
					type: 'image/png',
				},
				{
					src: '/android-icon-72x72.png',
					sizes: '72x72',
					type: 'image/png',
				},
				{
					src: '/android-icon-96x96.png',
					sizes: '96x96',
					type: 'image/png',
				},
				{
					src: '/android-icon-144x144.png',
					sizes: '144x144',
					type: 'image/png',
				},
				{
					src: '/android-icon-192x192.png',
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: '/android-icon-192x192.png',
					sizes: '192x192',
					type: 'image/png',
					purpose: 'maskable',
				},
			],
		},
		workbox: {
			navigateFallback: '/',
			globPatterns: ['**/*.{js,css,html,png,jpg,svg,ico,woff,woff2}'],
			runtimeCaching: [
				{
					urlPattern: /^https:\/\/admin\.1033lenox\.com\/assets\/.*/i,
					handler: 'CacheFirst',
					options: {
						cacheName: 'directus-assets',
						expiration: {
							maxEntries: 100,
							maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
						},
						cacheableResponse: {
							statuses: [0, 200],
						},
					},
				},
			],
		},
		client: {
			installPrompt: true,
		},
		devOptions: {
			enabled: false,
			type: 'module',
		},
	},

	postcss: {
		plugins: {
			'postcss-import': {},
			'tailwindcss/nesting': {},
			tailwindcss: {},
			autoprefixer: {},
		},
	},

	build: {
		transpile: [
			'chart.js',
			'@yeger/vue-masonry-wall',
			'vue-chartjs',
			'@sendgrid/mail',
			'swiper',
			'gsap',
			'@vueuse/core',
			'v-calendar',
		],
	},

	compatibilityDate: '2025-01-07',
});
