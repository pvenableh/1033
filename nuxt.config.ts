import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  ssr: true,

  nitro: {
    preset: "vercel",
    externals: {
      inline: ["unhead"],
    },
  },

  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      charset: "utf-8",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0, maximum-scale=5, viewport-fit=cover",
        },
        {
          name: "mobile-web-app-capable",
          content: "yes",
        },
      ],
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/favicon.ico",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-icon-180x180.png",
        },
      ],
    },
  },

  css: ["~/assets/css/tailwind.css", "~/assets/css/main.css"],

  modules: [
    "@formkit/nuxt",
    "@nuxt/devtools",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/color-mode",
    "@nuxtjs/seo",
    "@vite-pwa/nuxt",
    "@vueuse/motion/nuxt",
    "@vueuse/nuxt",
    "@vee-validate/nuxt",
    "nuxt-auth-utils",
    "shadcn-nuxt",
    [
      "nuxt-gtag",
      {
        id: "G-JTR8V7XBN1",
        debug: true,
        initialConsent: true,
      },
    ],
  ],

  runtimeConfig: {
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || "at-least-32-characters-long-secret-key-for-development",
    },
    sendgridAccessRequestAdminTemplate: process.env.SENDGRID_ACCESS_REQUEST_ADMIN_TEMPLATE || "",
    sendgridAccessRequestUserTemplate: process.env.SENDGRID_ACCESS_REQUEST_USER_TEMPLATE || "",
    staticToken: process.env.DIRECTUS_SERVER_TOKEN || "cb66quXi2vneyEhG8OtAFJ1jOIO31Pff",
    public: {
      assetsUrl: process.env.DIRECTUS_ASSETS_URL || "https://admin.1033lenox.com/assets/",
      websocketUrl: process.env.DIRECTUS_WEBSOCKET_URL || "wss://admin.1033lenox.com/websocket",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
      adminUrl: process.env.DIRECTUS_URL || "https://admin.1033lenox.com",
      directusUrl: process.env.DIRECTUS_URL || "https://admin.1033lenox.com",
    },
  },

  devtools: { enabled: true },

  colorMode: {
    preference: "light",
    classSuffix: "",
  },

  image: {
    provider: "directus",
    directus: {
      baseURL: `${process.env.DIRECTUS_URL}/assets/`,
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "https://1033lenox.com",
    name: "1033 Lenox",
    description: "Luxury living in the heart of Miami Beach - 1033 Lenox Ave Miami Beach, FL",
    defaultLocale: "en",
  },

  seo: {
    fallbackTitle: false,
  },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "1033 Lenox",
      short_name: "1033 Lenox",
      description: "Luxury living in the heart of Miami Beach",
      theme_color: "#00efd1",
      background_color: "#FDFCFA",
      display: "standalone",
      orientation: "portrait",
      icons: [
        {
          src: "/android-icon-36x36.png",
          sizes: "36x36",
          type: "image/png",
        },
        {
          src: "/android-icon-48x48.png",
          sizes: "48x48",
          type: "image/png",
        },
        {
          src: "/android-icon-72x72.png",
          sizes: "72x72",
          type: "image/png",
        },
        {
          src: "/android-icon-96x96.png",
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: "/android-icon-144x144.png",
          sizes: "144x144",
          type: "image/png",
        },
        {
          src: "/android-icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,png,jpg,svg,ico,woff,woff2}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/admin\.1033lenox\.com\/assets\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "directus-assets",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30,
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
      type: "module",
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    transpile: [
      "chart.js",
      "@yeger/vue-masonry-wall",
      "vue-chartjs",
      "@sendgrid/mail",
      "swiper",
      "gsap",
      "@vueuse/core",
      "v-calendar",
    ],
  },

  shadcn: {
    prefix: "",
    componentDir: "./components/ui",
  },

  icon: {
    serverBundle: "remote",
    clientBundle: {
      scan: true,
    },
    collections: ["heroicons-outline", "heroicons-solid", "lucide", "material-symbols", "wi", "meteocons", "mdi"],
  },

  compatibilityDate: "2025-01-07",
});
