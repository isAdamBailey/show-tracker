<script setup lang="ts">
import GlobalSearch from './components/GlobalSearch.vue'

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header
      class="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/50"
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
            <p class="text-xs uppercase tracking-[0.18em] text-sky-300/80">Discover Live Music</p>
            <h1
              class="text-2xl font-bold tracking-tight text-white transition group-hover:text-sky-300 md:text-3xl"
            >
              Live Music Tracker
            </h1>
          </NuxtLink>
        </div>
        <p class="max-w-3xl text-sm text-slate-300 md:text-base">
          Find upcoming shows fast with artist or genre search and jump straight into show details +
          setlist history.
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
          class="text-sky-400 hover:text-sky-300"
        >
          Adam Bailey
        </a>
      </div>
    </footer>
  </div>
</template>
