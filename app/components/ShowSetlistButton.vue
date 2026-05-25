<script setup lang="ts">
defineProps<{
  to: string | null
}>()
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-900/40 transition hover:from-sky-500 hover:to-blue-500"
  >
    View Show + Setlist History
  </NuxtLink>
  <p
    v-else
    class="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-500"
  >
    Show + Setlist Unavailable
  </p>
</template>
