// import { formatFonts } from './utils/fonts';
// import { theme } from './theme';

export default defineNuxtConfig({
	ssr: true,

	nitro: {
		preset: 'vercel-edge',
	},
	app: {
		pageTransition: { name: 'page', mode: 'out-in' },
	},
	components: {
		global: true,
		dirs: ['~/components'],
	},

	css: ['~/assets/css/tailwind.css', '~/assets/css/main.css'],

	modules: [
		'@formkit/nuxt', // https://formkit.com/getting-started/installation#with-nuxt
		'@nuxt/devtools', // https://devtools.nuxtjs.org/
		'@nuxt/image',
		'@nuxt/ui',
		'@nuxtjs/color-mode',
		'@vueuse/motion/nuxt', // https://motion.vueuse.org/nuxt.html
		'@vueuse/nuxt', // https://vueuse.org/
		'nuxt-directus-next',
		'nuxt-icon', // https://github.com/nuxt-modules/icon
		'@nuxtjs/plausible',
		'nuxt-schema-org', // https://nuxtseo.com/schema-org/guides/quick-setup
		'@nuxtjs/sitemap', // https://nuxtseo.com/sitemap/getting-started/how-it-works
		// '@nuxtjs/tailwindcss', // https://tailwindcss.nuxtjs.org/ Removed because of Nuxt UI already includes this
	],

	experimental: {
		componentIslands: true,
		asyncContext: true, // https://nuxt.com/docs/guide/going-further/experimental-features#asynccontext
	},

	runtimeConfig: {
		public: {
			assetsUrl: process.env.DIRECTUS_ASSETS_URL || 'https://admin.1033lenox.com/assets/',
			websocketUrl: process.env.DIRECTUS_WEBSOCKET_URL || 'wss://admin.1033lenox.com/websocket',
			staticToken: process.env.DIRECTUS_SERVER_TOKEN || 'cb66quXi2vneyEhG8OtAFJ1jOIO31Pff',
			siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
			adminUrl: process.env.DIRECTUS_URL || 'https://admin.1033lenox.com',
		},
	},
	plausible: {
		domain: '1033lenox.com',
	},

	directus: {
		url: process.env.DIRECTUS_URL,
		moduleConfig: {
			devtools: true,
			readMeQuery: {
				fields: [
					'id,role,first_name,last_name,email,token,avatar,units.units_id.id,units.units_id.number,units.units_id.occupant,units.units_id.pets.name,units.units_id.pets.category,units.units_id.pets.image,units.units_id.pets.breed,units.units_id.people.*,units.units_id.vehicles.make,units.units_id.vehicles.model,units.units_id.vehicles.image,units.units_id.vehicles.license_plate,units.units_id.people.people_id.first_name,units.units_id.people.people_id.last_name,units.units_id.people.people_id.email,units.units_id.people.people_id.phone,units.units_id.people.people_id.category,units.units_id.people.people_id.image,units.units_id.people.people_id.mailing_address,units.units_id.people.people_id.board_member.title,units.units_id.people.people_id.board_member.start,units.units_id.people.people_id.board_member.finish,units.units_id.people.people_id.board_member.bio,units.units_id.people.people_id.board_member.experience,units.units_id.people.people_id.board_member.year,units.units_id.people.people_id.board_member.icon,units.units_id.people.people_id.board_member.image,units.units_id.people.people_id.leases.start,units.units_id.people.people_id.leases.finish,units.units_id.people.people_id.leases.file',
				],
				updateState: true,
			},
			autoRefresh: {
				redirectTo: '/auth/signin',
			},
		},
	},

	devtools: { enabled: true },

	ui: {
		icons: ['heroicons', 'wi', 'meteocons'],
	},

	colorMode: {
		preference: 'system',
		classSuffix: '',
	},

	image: {
		provider: 'directus',
		directus: {
			baseURL: `${process.env.DIRECTUS_URL}/assets/`,
		},
	},

	site: {
		url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
		name: '1033 Lenox',
	},

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
		transpile: ['chart.js', '@sendgrid/mail'],
	},
});
