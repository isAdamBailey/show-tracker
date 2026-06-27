export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@vueuse/motion/nuxt', '@nuxt/eslint', 'nuxt-gtag'],
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Space+Grotesk:wght@400;500;600&display=swap'
        }
      ]
    }
  },
  runtimeConfig: {
    ticketmasterApiKey: process.env.TICKETMASTER_API_KEY,
    setlistFmKey: process.env.SETLIST_FM_KEY,
    seatgeekClientId: process.env.SEATGEEK_CLIENT_ID,
    public: {
      gtagId: process.env.NUXT_PUBLIC_GTAG_ID
    }
  },
  gtag: {
    enabled: process.env.NODE_ENV === 'production',
    id: process.env.NUXT_PUBLIC_GTAG_ID
  },
  compatibilityDate: '2026-05-25'
})