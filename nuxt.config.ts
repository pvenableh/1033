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
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  buildModules: [
    
  ],
  plausible: {
    domain: '1033lenox.com',
  },
  directus: {
    url: 'https://admin.1033lenox.com',
    // token: '04tXzze0O5HBQScnlFn3FBLgx5QgtBNh',
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
})
