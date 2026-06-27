<script setup lang="ts">
defineProps<{
  to: string | null
}>()
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
  >
    Show &amp; Setlists
  </NuxtLink>
  <p
    v-else
    class="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-500"
  >
    Setlist Unavailable
  </p>
</template>
