// import { formatFonts } from './utils/fonts';
import { theme } from './theme';

export default defineNuxtConfig({
	app: {
		pageTransition: { name: 'page', mode: 'out-in' },
	},
	components: [
		// Disable prefixing base components with `Base`
		// { path: '~/components/base', pathPrefix: false },
		// Auto import components from `~/components`
		'~/components',
	],

	css: ['~/assets/css/tailwind.css', '~/assets/css/main.css'],

	modules: [
		// '@formkit/nuxt', // https://formkit.com/getting-started/installation#with-nuxt
		'@nuxt/devtools', // https://devtools.nuxtjs.org/
		'@nuxt/image',
		'@nuxt/ui',
		'@nuxtjs/color-mode',
		'@nuxtjs/google-fonts',
		'@vueuse/motion/nuxt', // https://motion.vueuse.org/nuxt.html
		'@vueuse/nuxt', // https://vueuse.org/
		'nuxt-icon', // https://github.com/nuxt-modules/icon
		'nuxt-schema-org', // https://nuxtseo.com/schema-org/guides/quick-setup
		'nuxt-simple-sitemap', // https://nuxtseo.com/sitemap/getting-started/how-it-works
		// '@nuxtjs/tailwindcss', // https://tailwindcss.nuxtjs.org/ Removed because of Nuxt UI already includes this
	],

	runtimeConfig: {
		public: {
			siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
		},
	},

	// Directus Configuration
	directus: {
		rest: {
			baseUrl: process.env.DIRECTUS_URL,
			nuxtBaseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
		},
		auth: {
			enabled: true,
			enableGlobalAuthMiddleware: false, // Enable auth middleware on every page
			userFields: ['id,first_name,last_name,email,avatar,units.units_id.id,units.units_id.number,units.units_id.occupant,units.units_id.pets.name,units.units_id.pets.category,units.units_id.pets.image,units.units_id.pets.breed,units.units_id.people.*,units.units_id.vehicles.make,units.units_id.vehicles.model,units.units_id.vehicles.image,units.units_id.vehicles.license_plate'], // Select user fields
			redirect: {
				login: '/auth/signin', // Path to redirect when login is required
				logout: '/', // Path to redirect after logout
				home: '/account', // Path to redirect after successful login
				resetPassword: '/auth/reset-password', // Path to redirect for password reset
				callback: '/auth/callback', // Path to redirect after login with provider
			},
		},
	},

	plugins: ['~/plugins/veevalidate-components.ts', '~/plugins/veevalidate-rules.ts'],

	// Nuxt DevTools - https://devtools.nuxtjs.org/
	devtools: { enabled: false },

	ui: {
		icons: 'all',
	},

	// Color Mode Configuration - https://color-mode.nuxtjs.org/
	colorMode: {
		classSuffix: '', // This is so we play nice with TailwindCSS
	},

	// Image Configuration - https://image.nuxt.com/providers/directus
	image: {
		provider: 'directus',
		directus: {
			baseURL: `${process.env.DIRECTUS_URL}/assets/`,
		},
	},

	// Google Fonts Configuration - https://google-fonts.nuxtjs.org/
	googleFonts: {
		families: theme.googleFonts,
		display: 'swap',
		download: true,
	},

	site: {
		url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
		name: 'hue',
	},

	// Sitemap Configuration - https://nuxtseo.com/sitemap/getting-started/how-it-works
	sitemap: {
		// sitemaps: {
		// 	pages: {
		// 		exclude: ['/posts/**', '/help/**'],
		// 	},
		// 	posts: {
		// 		include: ['/posts/**'],
		// 	},
		// 	help: {
		// 		include: ['/help/**'],
		// 	},
		// },
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
		transpile: ['chart.js', 'v-perfect-signature', '@vee-validate/rules', '@sendgrid/mail'],
	},
});
