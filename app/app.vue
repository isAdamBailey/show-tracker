<script setup lang="ts">
import GlobalSearch from './components/GlobalSearch.vue'

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header
      class="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-amber-950/30"
    >
      <div
        v-motion
        :initial="{ opacity: 0, y: -12 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 280 } }"
        class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6"
      >
        <div class="flex items-start justify-between gap-3">
          <NuxtLink
            to="/"
            class="group"
          >
            <h1
              class="font-display text-3xl font-bold leading-none tracking-tight text-white transition group-hover:text-amber-300 md:text-5xl"
            >
              Live Music Tracker
            </h1>
          </NuxtLink>
        </div>
        <p class="max-w-2xl text-sm text-slate-400">
          Search by artist or genre — jump straight to show details and setlist history.
        </p>
        <GlobalSearch />
      </div>
    </header>

    <div
      v-motion
      :initial="{ opacity: 0, y: 10 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 260, delay: 80 } }"
    >
      <NuxtPage />
    </div>

    <footer class="border-t border-slate-800 bg-slate-950/95">
      <div class="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-400">
        Copyright {{ currentYear }} ·
        <a
          href="https://adambailey.io"
          target="_blank"
          rel="noreferrer noopener"
          class="text-amber-400 hover:text-amber-300"
        >
          Adam Bailey
        </a>
      </div>
    </footer>
  </div>
</template>
