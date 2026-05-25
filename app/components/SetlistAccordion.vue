<script setup lang="ts">
import { ref } from 'vue'
import type { SetlistItem, SetlistSet, SetlistSong } from '~/app/types/music'

const props = defineProps<{
  setlists: SetlistItem[]
}>()

const openItemId = ref<string | null>(null)

const toggleItem = (id: string) => {
  openItemId.value = openItemId.value === id ? null : id
}

const toArray = <T,>(input: T | T[] | undefined): T[] => {
  if (!input) {
    return []
  }
  return Array.isArray(input) ? input : [input]
}

const getSongs = (entry: SetlistItem): SetlistSong[] => {
  const sets = toArray<SetlistSet>(entry.sets?.set)
  return sets
    .flatMap((item) => toArray<SetlistSong>(item.song))
    .filter((song) => Boolean(song.name))
}
</script>

<template>
  <div class="space-y-3">
    <article
      v-for="entry in props.setlists"
      :key="entry.id"
      class="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        @click="toggleItem(entry.id)"
      >
        <div>
          <p class="text-sm font-medium text-slate-100">{{ entry.eventDate ?? 'Unknown date' }}</p>
          <p class="text-xs text-slate-400">
            {{ entry.venue?.name ?? 'Unknown venue' }}
            <span v-if="entry.venue?.city?.name"> • {{ entry.venue.city.name }}</span>
            <span v-if="entry.venue?.city?.country?.name"
              >, {{ entry.venue.city.country.name }}</span
            >
          </p>
        </div>
        <span class="text-xs text-slate-400">
          {{ openItemId === entry.id ? 'Hide songs' : 'Show songs' }}
        </span>
      </button>

      <div v-if="openItemId === entry.id" class="border-t border-slate-800 px-4 py-3">
        <ul v-if="getSongs(entry).length > 0" class="space-y-1 text-sm text-slate-300">
          <li v-for="(song, index) in getSongs(entry)" :key="`${entry.id}-${song.name}-${index}`">
            {{ song.name }}
          </li>
        </ul>
        <p v-else class="text-sm text-slate-500">No songs listed for this setlist.</p>
      </div>
    </article>
  </div>
</template>
