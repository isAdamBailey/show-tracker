<script setup lang="ts">
defineProps<{
  to: string | null
}>()
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="mt-3 inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
  >
    View Show + Setlist History
  </NuxtLink>
  <p
    v-else
    class="mt-3 inline-flex w-full items-center justify-center rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-500"
  >
    Show + Setlist Unavailable
  </p>
</template>
