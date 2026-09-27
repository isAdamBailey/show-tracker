<script setup lang="ts">
import ErrorPanel from './ErrorPanel.vue'
import SetlistAccordion from './SetlistAccordion.vue'
import type { SetlistItem } from '../types/music'

const props = defineProps<{
  setlists: SetlistItem[]
  artistName: string
  pending: boolean
  failed: boolean
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section aria-labelledby="setlist-heading">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-4">
      <h2 id="setlist-heading" class="font-display text-34 font-bold leading-none text-ink lg:text-40">Setlist history</h2>
      <p v-if="props.setlists.length > 0" class="text-13 text-muted">
        Last {{ props.setlists.length }} {{ props.setlists.length === 1 ? 'show' : 'shows' }} · from setlist.fm
      </p>
    </div>

    <div v-if="props.pending && props.setlists.length === 0" aria-hidden="true">
      <div
        v-for="i in 5"
        :key="i"
        class="grid grid-cols-[120px_minmax(0,1fr)] gap-x-5 border-t border-line px-3 py-[18px]"
      >
        <div class="h-4 w-24 rounded-[3px] bg-skeleton motion-safe:animate-pulse" />
        <div class="h-4 w-2/3 rounded-[3px] bg-skeleton-soft motion-safe:animate-pulse" />
      </div>
    </div>

    <ErrorPanel
      v-else-if="props.failed"
      title="Couldn’t load setlists."
      message="setlist.fm didn’t respond. This is usually temporary."
      @retry="emit('retry')"
    />

    <p v-else-if="props.setlists.length === 0" class="border-t border-line px-3 py-6 text-15 text-muted">
      setlist.fm doesn’t have any setlists for {{ props.artistName }} yet.
    </p>

    <SetlistAccordion v-else :setlists="props.setlists" />
  </section>
</template>
