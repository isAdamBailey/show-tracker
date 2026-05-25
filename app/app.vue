<script setup lang="ts">
import GlobalSearch from '~/app/components/GlobalSearch.vue'
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div
        v-motion
        :initial="{ opacity: 0, y: -12 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 280 } }"
        class="mx-auto flex max-w-6xl flex-col gap-3 p-4"
      >
        <div class="flex items-center justify-between gap-3">
          <NuxtLink
            to="/"
            class="text-lg font-semibold tracking-tight text-slate-100 hover:text-sky-400"
          >
            Live Music Tracker
          </NuxtLink>
        </div>
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
  </div>
</template>
