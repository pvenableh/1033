// import { formatFonts } from './utils/fonts';
// import { theme } from './theme';
import tailwindcss from '@tailwindcss/vite';

/*
 * Resident-only and operational routes.
 *
 * These get BOTH treatments, because they do different jobs:
 *   - robots noindex is what actually keeps a page out of search results
 *   - sitemap exclusion only stops us advertising it; on its own a page still
 *     gets indexed if anything links to it
 *
 * Anything not listed here is public and indexable: /, /intro, /feed,
 * /board-meetings, /community-ideas.
 */
const PRIVATE_ROUTES = [
	// Sections
	'/account',
	'/account/**',
	'/admin',
	'/admin/**',
	'/announcements',
	'/announcements/**',
	'/auth/**',
	'/channels',
	'/channels/**',
	'/documents',
	'/documents/**',
	'/financials',
	'/financials/**',
	'/meetings',
	'/meetings/**',
	'/my-finances',
	'/my-finances/**',
	'/parking-garage',
	'/parking-garage/**',
	'/presentations/**',
	'/projects',
	'/projects/**',
	'/requests',
	'/requests/**',
	'/rules-regulations',
	'/rules-regulations/**',
	'/tasks',
	'/tasks/**',
	'/units/**',
	// Single resident pages — project votes, onboarding, operational screens
	'/2024-budget-surplus',
	'/access-control',
	'/corporation',
	'/dashboard',
	'/door-numbers',
	'/doorbell-cameras',
	'/elevator-interiors',
	'/exterior-floor-colors',
	'/index-landing',
	'/paint-railings',
	'/pending',
	'/request',
	'/security',
	'/volunteer',
	'/welcome',
];

export default defineNuxtConfig({
	ssr: true,

	nitro: {
		preset: 'vercel',
		externals: {
			inline: ['unhead'],
		},
		// Set Vercel serverless function max duration globally (Hobby plan max: 60s).
		// Individual routes can override via defineRouteMeta({ maxDuration: ... }).
		vercel: {
			config: {
				maxDuration: 60,
			},
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
			// Site-wide social share image (1200x630). Applied as the default in
			// app.vue; any page may override it with its own useSeoMeta({ ogImage }).
			defaultOgImage:
				process.env.NUXT_PUBLIC_DEFAULT_OG_IMAGE ||
				'https://admin.1033lenox.com/assets/7fef4bc4-9aad-4801-a430-670a2af7cbde',
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
			baseURL: `${process.env.DIRECTUS_URL || 'https://admin.1033lenox.com'}/assets/`,
		},
	},

	// Site configuration for SEO - https://nuxtseo.com/
	site: {
		url: process.env.NUXT_PUBLIC_SITE_URL || 'https://1033lenox.com',
		name: '1033 Lenox',
		description:
			"Boutique condo and apartment building at 1033 Lenox Avenue in Miami Beach's Flamingo Park, FL 33139. 28-unit residence with oversized balconies and walkable South Beach living.",
		defaultLocale: 'en',
	},

	// SEO module configuration
	seo: {
		fallbackTitle: false,
	},

	// noindex every private route. This is the part that actually keeps them out
	// of search; the sitemap exclusion below just keeps the sitemap honest.
	// The `robots` key is contributed by nuxt-robots' module augmentation, which
	// vue-tsc doesn't pick up on NitroRouteConfig here — cast rather than widen
	// the whole object. Verified at runtime: private routes emit both a noindex
	// meta tag and an X-Robots-Tag header, public ones emit index, follow.
	routeRules: Object.fromEntries(
		PRIVATE_ROUTES.map((route) => [route, {robots: 'noindex, nofollow'}])
	) as NonNullable<Parameters<typeof defineNuxtConfig>[0]>['routeRules'],

	// Sitemap configuration - https://nuxtseo.com/sitemap
	sitemap: {
		exclude: PRIVATE_ROUTES,
	},

	// PWA / service worker — DELIBERATELY DISABLED.
	//
	// The worker was causing unexplained page reloads in production:
	//   - registerType 'autoUpdate' reloads the page whenever a new worker
	//     activates, so every deploy refreshed anyone mid-session
	//   - navigateFallback: '/' told the worker to answer ANY uncached
	//     navigation with the cached home page. That is meant for SPAs; on an
	//     SSR app it hands back the wrong document and the client router then
	//     corrects itself, which reads as a random refresh
	//   - the precache manifest ended up with two entries for the same URL at
	//     different revisions, which makes install throw
	//     (add-to-cache-list-conflicting-entries) and retry in a loop
	//
	// selfDestroying ships a worker whose only job is to unregister itself and
	// delete every cache it owns. The module has to STAY for now: removing it
	// would leave the old worker installed on every device that already has it,
	// because a service worker persists until something replaces it. Once
	// clients have cycled through this build it can be dropped entirely.
	pwa: {
		selfDestroying: true,
		// Activate immediately rather than waiting for every tab to close, so the
		// cleanup actually happens on the next visit.
		registerType: 'autoUpdate',
		manifest: {
			name: '1033 Lenox',
			short_name: '1033 Lenox',
			description: 'Luxury living in the heart of Miami Beach',
			theme_color: '#1e3d67',
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
		// No installPrompt: there is no worker to back an installed app.
		client: {
			installPrompt: false,
		},
		devOptions: {
			enabled: false,
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
			'@unovis/vue',
			'@unovis/ts',
		],
	},

	compatibilityDate: '2025-01-07',
});
