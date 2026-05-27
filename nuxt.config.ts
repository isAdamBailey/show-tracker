export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@vueuse/motion/nuxt', '@nuxt/eslint', 'nuxt-gtag'],
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
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