<script setup lang="ts">
import GlobalSearch from './components/GlobalSearch.vue'

const currentYear = new Date().getFullYear()
const { initLocation } = useUserLocation()

onMounted(() => {
  initLocation()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-canvas text-ink">
    <!-- z-20: v-motion leaves a transform on both wrappers, so each is its own stacking
         context; the header's must sit above the page's or page text paints over the search dropdown. -->
    <header class="relative z-20 border-b border-line">
      <div
        v-motion
        :initial="{ opacity: 0, y: -12 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 280 } }"
        class="motion-guard mx-auto flex max-w-screen-2xl flex-col gap-4 px-[18px] py-5 md:flex-row md:items-center md:gap-10 md:px-10 md:py-[18px]"
      >
        <NuxtLink
          to="/"
          class="shrink-0 rounded-sm font-display text-24 font-bold leading-none tracking-[-0.01em] text-ink transition-colors hover:text-accent-text md:text-30"
        >
          Live Music Tracker
        </NuxtLink>
        <GlobalSearch />
      </div>
    </header>

    <div
      v-motion
      :initial="{ opacity: 0, y: 10 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 260, delay: 80 } }"
      class="motion-guard flex-1"
    >
      <NuxtPage />
    </div>

    <footer class="border-t border-line">
      <div class="mx-auto max-w-screen-2xl px-[18px] py-4 text-center text-xs text-muted md:px-10">
        Copyright {{ currentYear }} ·
        <a
          href="https://adambailey.io"
          target="_blank"
          rel="noreferrer noopener"
          class="text-accent-text transition-colors hover:text-accent-hover"
        >
          Adam Bailey
        </a>
      </div>
    </footer>
  </div>
</template>
