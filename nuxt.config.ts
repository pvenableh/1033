// import { formatFonts } from './utils/fonts';
// import { theme } from './theme';

export default defineNuxtConfig({
	ssr: true,

	nitro: {
		preset: 'vercel-edge',
	},

	app: {
		pageTransition: {name: 'page', mode: 'out-in'},
	},

	// components: {
	// 	global: true,
	// 	dirs: ['~/components'],
	// },

	css: ['~/assets/css/tailwind.css', '~/assets/css/main.css'],

	modules: [
		'@formkit/nuxt', // https://formkit.com/getting-started/installation#with-nuxt
		'@nuxt/devtools', // https://devtools.nuxtjs.org/
		'@nuxt/icon',
		'@nuxt/image',
		[
			'@nuxt/ui',
			{
				icons: ['heroicons', 'wi', 'meteocons', 'material-symbols', 'lucide'],
			},
		],
		'@nuxtjs/color-mode',
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

	// site: {
	// 	url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
	// 	name: '1033 Lenox',
	// },

	// Sitemap Configuration - https://nuxtseo.com/sitemap/getting-started/how-it-works
	// sitemap: {
	// 	sitemaps: {
	// 		pages: {
	// 			exclude: ['/posts/**', '/help/**'],
	// 		},
	// 		posts: {
	// 			include: ['/posts/**'],
	// 		},
	// 		help: {
	// 			include: ['/help/**'],
	// 		},
	// 	},
	// },
	// icon: {
	// 	customCollections: [
	// 		{
	// 			prefix: 'building',
	// 			dir: './assets/icons',
	// 		},
	// 	],
	// },

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
