export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@vueuse/motion/nuxt', '@nuxt/eslint'],
  devtools: { enabled: true },
  css: ['~/app/assets/css/tailwind.css'],
  runtimeConfig: {
    ticketmasterApiKey: process.env.TICKETMASTER_API_KEY,
    setlistFmKey: process.env.SETLIST_FM_KEY
  },
  compatibilityDate: '2026-05-25'
})
