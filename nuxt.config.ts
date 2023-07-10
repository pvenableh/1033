export default defineNuxtConfig({
  ssr: true,

  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
  },

  css: [
    {
      src: '~/assets/css/main.css',
      lang: 'postcss',
    },
  ],

  modules: [
    '@nuxthq/ui',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'nuxt-directus',
    'nuxt-icon',
    '@nuxtjs/plausible',
    '@vueuse/nuxt',
  ],

  buildModules: [
    
  ],

  plausible: {
    domain: '1033lenox.com',
  },

  directus: {
    url: 'https://admin.1033lenox.com',
    token: 'rpS9FnBjatOHHUyDye4W4LCqwqV2vhlE',
    autoFetch: true
  },

  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss/nesting': {},
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      directusUrl: 'https://admin.1033lenox.com',
      plausible: {
        domain: '1033lenox.com',
      },
    },
  },
  pinia: {
    autoImports: [
      // automatically imports `defineStore`
      'defineStore', // import { defineStore } from 'pinia'
      ['defineStore', 'definePiniaStore'], // import { defineStore as definePiniaStore } from 'pinia'
    ],
  },
  //   Currently still needed
  build: {
    transpile: ['@vee-validate/rules', '@sendgrid/mail'],
  },

  vite: {
    optimizeDeps: {
      include: [
        'vue',
        'pinia',
      ],
    },
  },

  plugins: [
    '~/plugins/veevalidate-components.ts',
    '~/plugins/directus.js',
    '~/plugins/veevalidate-rules.ts',
  ],
})
