// import { formatFonts } from './utils/fonts';
// import { theme } from './theme';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
	ssr: true,

	nitro: {
		preset: 'vercel',
		externals: {
			inline: ['unhead'],
		},
		// Set Vercel serverless function max duration globally.
		// Individual routes can override via defineRouteMeta({ maxDuration: ... }).
		vercel: {
			config: {
				maxDuration: 60,
			},
		},
	},

	// Route-specific overrides for endpoints that need longer timeouts (AI processing)
	routeRules: {
		'/api/admin/pdf-to-csv': { headers: { 'x-vercel-max-duration': '120' } },
		'/api/admin/extract-pdf-transactions': { headers: { 'x-vercel-max-duration': '120' } },
		'/api/admin/auto-categorize-transactions': { headers: { 'x-vercel-max-duration': '120' } },
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
					href: '/apple-touch-icon.png',
				},
			],
		},
	},

	css: ['~/assets/css/main.css'],

	modules: [
		'shadcn-nuxt', // https://www.shadcn-vue.com/docs/installation/nuxt
		'@nuxt/devtools', // https://devtools.nuxtjs.org/
		'@nuxt/icon', // https://nuxt.com/modules/icon - replaces NuxtUI icons
		'@nuxt/image',
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
				enabled: process.env.NUXT_PUBLIC_DISABLE_ANALYTICS !== 'true',
				debug: process.env.NODE_ENV === 'development' && process.env.NUXT_PUBLIC_ANALYTICS_DEBUG === 'true',
				initialConsent: true,
				config: {
					// Enhanced measurement settings
					send_page_view: false, // We handle this manually in the analytics plugin
					// Custom dimensions for better reporting
					custom_map: {
						dimension1: 'user_type',
						dimension2: 'page_category',
						dimension3: 'content_group',
					},
				},
			},
		],
		// '@nuxtjs/plausible',
	],

	// shadcn-nuxt configuration
	shadcn: {
		prefix: '',
		componentDir: './components/ui',
	},

	// Configure @nuxt/icon to support all icon sets used previously by NuxtUI
	icon: {
		serverBundle: 'remote',
		clientBundle: {
			scan: true,
		},
		collections: [
			'heroicons-outline',
			'heroicons-solid',
			'lucide',
			'fluent-emoji-flat',
			'mdi',
			'material-symbols',
			'wi',
			'meteocons',
			'logos',
		],
	},

	// experimental: {
	// 	componentIslands: true,
	// 	asyncContext: true, // https://nuxt.com/docs/guide/going-further/experimental-features#asynccontext
	// },

	runtimeConfig: {
		// Server-only (not exposed to client)
		// nuxt-auth-utils session secret - set NUXT_SESSION_PASSWORD env var in production
		session: {
			password: process.env.NUXT_SESSION_PASSWORD || '',
		},
		sendgridAccessRequestAdminTemplate: process.env.SENDGRID_ACCESS_REQUEST_ADMIN_TEMPLATE || '',
		sendgridAccessRequestUserTemplate: process.env.SENDGRID_ACCESS_REQUEST_USER_TEMPLATE || '',
		anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
		staticToken: process.env.DIRECTUS_SERVER_TOKEN || '',
		// Google Analytics Data API (for server-side analytics queries)
		ga4PropertyId: process.env.GA4_PROPERTY_ID || '', // e.g., "properties/123456789"
		googleAnalyticsCredentials: process.env.GOOGLE_ANALYTICS_CREDENTIALS || '', // JSON string of service account
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
		description:
			'Boutique condo and apartment building in Miami Beach. 28-unit residence in Flamingo Park with oversized balconies and walkable South Beach living.',
		defaultLocale: 'en',
	},

	// SEO module configuration
	seo: {
		fallbackTitle: false,
	},

	// Sitemap configuration - https://nuxtseo.com/sitemap
	sitemap: {
		exclude: [
			'/admin/**',
			'/account/**',
			'/auth/**',
			'/channels/**',
			'/tasks/**',
			'/meetings/**',
			'/documents/**',
			'/units/**',
			'/announcements/**',
		],
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
					src: '/icon-72x72.png',
					sizes: '72x72',
					type: 'image/png',
				},
				{
					src: '/icon-96x96.png',
					sizes: '96x96',
					type: 'image/png',
				},
				{
					src: '/icon-128x128.png',
					sizes: '128x128',
					type: 'image/png',
				},
				{
					src: '/icon-144x144.png',
					sizes: '144x144',
					type: 'image/png',
				},
				{
					src: '/icon-152x152.png',
					sizes: '152x152',
					type: 'image/png',
				},
				{
					src: '/icon-192x192.png',
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: '/icon-384x384.png',
					sizes: '384x384',
					type: 'image/png',
				},
				{
					src: '/icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
				},
				{
					src: '/maskable-icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable',
				},
			],
		},
		workbox: {
			navigateFallback: '/',
			globPatterns: ['**/*.{js,css,html,png,jpg,svg,ico,woff,woff2}'],
			cleanupOutdatedCaches: true,
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

	vite: {
		plugins: [tailwindcss()],
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
