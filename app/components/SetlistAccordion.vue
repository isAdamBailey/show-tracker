<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SetlistItem } from '../types/music'
import { formatLongDate, parseSetlistDate } from '../utils/dates'
import { countSongs, formatSetlistCity, getDisplaySets, type DisplaySet } from '../utils/setlists'

const props = defineProps<{
  setlists: SetlistItem[]
}>()

interface AccordionEntry {
  id: string
  date: string
  isoDate: string | null
  venue: string
  city: string
  tour: string | null
  sets: DisplaySet[]
  songCount: number
}

const entries = computed<AccordionEntry[]>(() =>
  props.setlists.map((setlist) => {
    const isoDate = parseSetlistDate(setlist.eventDate)
    const sets = getDisplaySets(setlist)
    return {
      id: setlist.id,
      date: isoDate ? formatLongDate(isoDate) : (setlist.eventDate ?? 'Unknown date'),
      isoDate,
      venue: setlist.venue?.name ?? 'Unknown venue',
      city: formatSetlistCity(setlist),
      tour: setlist.tour?.name?.trim() || null,
      sets,
      songCount: countSongs(sets)
    }
  })
)

/**
 * One open at a time. The most recent setlist with songs opens by default:
 * the newest entry is often tonight's show, which has no songs yet.
 */
const getDefaultOpenId = (): string | null =>
  (entries.value.find((entry) => entry.songCount > 0) ?? entries.value[0])?.id ?? null

const openSetlistId = ref<string | null>(getDefaultOpenId())

watch(
  () => props.setlists[0]?.id,
  () => {
    openSetlistId.value = getDefaultOpenId()
  }
)

const toggle = (id: string): void => {
  openSetlistId.value = openSetlistId.value === id ? null : id
}
</script>

<template>
  <ul>
    <li v-for="entry in entries" :key="entry.id" class="border-t border-line">
      <h3>
        <button
          type="button"
          class="grid min-h-[60px] w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 px-3 py-[18px] text-left transition-colors hover:bg-surface focus-visible:bg-surface md:grid-cols-[120px_minmax(0,1fr)_auto] md:gap-x-5"
          :aria-expanded="openSetlistId === entry.id"
          :aria-controls="`setlist-${entry.id}`"
          @click="toggle(entry.id)"
        >
          <time :datetime="entry.isoDate ?? undefined" class="text-15 text-ink md:pt-px">{{ entry.date }}</time>
          <span class="col-start-1 row-start-2 min-w-0 md:col-start-2 md:row-start-1">
            <span class="block text-15 text-ink">
              {{ entry.venue }}<span v-if="entry.city" class="text-muted"> · {{ entry.city }}</span>
            </span>
            <span v-if="entry.tour" class="mt-0.5 block text-13 text-muted">{{ entry.tour }}</span>
          </span>
          <span
            class="tabular col-start-2 row-start-1 whitespace-nowrap pt-0.5 text-13 md:col-start-3"
            :class="openSetlistId === entry.id ? 'text-accent-text' : 'text-muted'"
          >
            {{
              openSetlistId === entry.id
                ? 'Hide songs'
                : entry.songCount === 0
                  ? 'No songs'
                  : entry.songCount === 1
                    ? '1 song'
                    : `${entry.songCount} songs`
            }}
          </span>
        </button>
      </h3>

      <div
        v-if="openSetlistId === entry.id"
        :id="`setlist-${entry.id}`"
        class="px-3 pb-8 md:pl-[152px]"
      >
        <p v-if="entry.sets.length === 0" class="pt-1 text-15 text-muted">No songs listed for this setlist</p>
        <section v-for="(set, setIndex) in entry.sets" :key="setIndex" class="pt-3 first:pt-1">
          <h4 class="flex items-center gap-4 pb-3">
            <span
              class="font-display text-20 font-semibold leading-none"
              :class="set.encore ? 'text-accent-text' : 'text-ink'"
            >{{ set.label }}</span>
            <span aria-hidden="true" class="h-px flex-1 bg-line" />
          </h4>
          <ol class="space-y-2.5 pb-4">
            <li
              v-for="(song, index) in set.songs"
              :key="`${setIndex}-${index}`"
              class="grid grid-cols-[32px_minmax(0,1fr)] items-baseline gap-x-2"
            >
              <span class="tabular text-right text-13 text-faint">{{ song.number ?? '' }}</span>
              <span :class="song.tape ? 'text-muted' : 'text-ink'" class="text-15">
                {{ song.name }}<span v-if="song.note" class="text-13 text-muted"> ({{ song.note }})</span>
              </span>
            </li>
          </ol>
        </section>
      </div>
    </li>
  </ul>
</template>
