<script setup lang="ts">
// Varying headliner widths so the skeleton reads as a list, not a grid of identical bars.
const HEADLINER_WIDTHS = ['w-44', 'w-36', 'w-52', 'w-28', 'w-40']
</script>

<template>
  <ul aria-hidden="true">
    <li
      v-for="(width, index) in HEADLINER_WIDTHS"
      :key="index"
      class="grid grid-cols-[48px_minmax(0,1fr)] gap-x-3.5 border-t border-line px-[18px] py-3.5 first:border-t-0 lg:grid-cols-[88px_minmax(0,1fr)_240px_120px_96px] lg:gap-x-6 lg:px-4 lg:py-[18px]"
    >
      <div class="space-y-1.5">
        <div class="h-3 w-7 rounded-[3px] bg-skeleton-soft motion-safe:animate-pulse" />
        <div class="h-7 w-9 rounded-[3px] bg-skeleton motion-safe:animate-pulse" />
      </div>
      <div class="space-y-2.5">
        <div class="h-6 max-w-full rounded-[3px] bg-skeleton motion-safe:animate-pulse" :class="width" />
        <div class="h-3.5 w-32 rounded-[3px] bg-skeleton-soft motion-safe:animate-pulse" />
      </div>
      <div class="hidden space-y-2 lg:block">
        <div class="h-4 w-36 rounded-[3px] bg-skeleton motion-safe:animate-pulse" />
        <div class="h-3 w-20 rounded-[3px] bg-skeleton-soft motion-safe:animate-pulse" />
      </div>
      <div class="hidden space-y-2 lg:block">
        <div class="h-3.5 w-20 rounded-[3px] bg-skeleton-soft motion-safe:animate-pulse" />
        <div class="h-3.5 w-16 rounded-[3px] bg-skeleton motion-safe:animate-pulse" />
      </div>
      <div class="hidden justify-items-end space-y-2 lg:grid">
        <div class="h-4 w-12 rounded-[3px] bg-skeleton motion-safe:animate-pulse" />
      </div>
    </li>
  </ul>
</template>
