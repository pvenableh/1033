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
		'nuxt-directus-next',
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
		public: {
			assetsUrl: process.env.DIRECTUS_ASSETS_URL || 'https://admin.1033lenox.com/assets/',
			websocketUrl: process.env.DIRECTUS_WEBSOCKET_URL || 'wss://admin.1033lenox.com/websocket',
			staticToken: process.env.DIRECTUS_SERVER_TOKEN || 'cb66quXi2vneyEhG8OtAFJ1jOIO31Pff',
			siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
			adminUrl: process.env.DIRECTUS_URL || 'https://admin.1033lenox.com',
			directusUrl: process.env.DIRECTUS_URL || 'https://admin.1033lenox.com',
		},
	},

	directus: {
		url: process.env.DIRECTUS_URL,
		staticToken: process.env.DIRECTUS_SERVER_TOKEN,
		authConfig: {
			cookieSameSite: 'lax',
			cookieSecure: process.env.NODE_ENV === 'production',
		},
		moduleConfig: {
			devtools: true,
			autoImport: true,
			autoRefresh: {
				enableMiddleware: true,
				global: true,
				middlewareName: 'auth',
				redirectTo: '/auth/signin',
				to: ['/*'],
			},
			readMeQuery: {
				fields: [
					// User basics
					'id,status,first_name,last_name,email,phone,token,avatar',
					// Role info
					'role.id,role.name,role.admin_access,role.app_access',
					// Direct person link (requires person_id field on directus_users)
					'person_id.id,person_id.first_name,person_id.last_name,person_id.email,person_id.phone,person_id.category,person_id.is_owner,person_id.is_resident,person_id.image,person_id.mailing_address,person_id.board_member.id,person_id.board_member.title,person_id.board_member.start,person_id.board_member.finish,person_id.board_member.status',
					// Units with nested data
					'units.units_id.id,units.units_id.number,units.units_id.occupant,units.units_id.parking_spot',
					'units.units_id.pets.*',
					'units.units_id.vehicles.*',
					// People in units (fallback for person matching by email)
					'units.units_id.people.people_id.id,units.units_id.people.people_id.first_name,units.units_id.people.people_id.last_name,units.units_id.people.people_id.email,units.units_id.people.people_id.phone,units.units_id.people.people_id.category,units.units_id.people.people_id.is_owner,units.units_id.people.people_id.is_resident,units.units_id.people.people_id.image,units.units_id.people.people_id.board_member.id,units.units_id.people.people_id.board_member.title,units.units_id.people.people_id.board_member.start,units.units_id.people.people_id.board_member.finish,units.units_id.people.people_id.board_member.status,units.units_id.people.people_id.leases.start,units.units_id.people.people_id.leases.finish',
				],
				updateState: true,
			},
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
