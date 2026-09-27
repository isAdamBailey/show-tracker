<script setup lang="ts">
import { computed } from 'vue'
import type { TicketmasterEvent } from '../types/music'
import { getDateParts, getUrgencyLabel } from '../utils/dates'
import {
  buildShowRoute,
  formatPriceRange,
  getDoorsTime,
  getEventGenre,
  getEventVenue,
  getHeadliner,
  getShowTime,
  getSupportActs
} from '../utils/events'

const props = defineProps<{
  event: TicketmasterEvent
  /** Only the first row of each day shows the date. */
  showDate: boolean
  /** Tonight/Tomorrow badges are redundant on the Tonight tab. */
  showBadge: boolean
  /** Feed city, so venues in that city show their street instead of repeating it. */
  feedCity: string
}>()

const localDate = computed(() => props.event.dates?.start?.localDate ?? null)
const dateParts = computed(() => (localDate.value ? getDateParts(localDate.value) : null))
const badge = computed(() => (props.showBadge && localDate.value ? getUrgencyLabel(localDate.value) : null))
const headliner = computed(() => getHeadliner(props.event))
const support = computed(() => getSupportActs(props.event).join(', '))
const genre = computed(() => getEventGenre(props.event))
const venue = computed(() => getEventVenue(props.event))
const price = computed(() => formatPriceRange(props.event))
const doors = computed(() => getDoorsTime(props.event))
const showTime = computed(() => getShowTime(props.event))

/** The TM venue payload has no neighborhood: show the town for suburbs, the street otherwise. */
const venueDetail = computed<string | null>(() => {
  const city = venue.value?.city?.name
  if (city && city.toLowerCase() !== props.feedCity.toLowerCase()) return city
  return venue.value?.address?.line1 ?? null
})

const mobileMeta = computed<string>(() =>
  [venue.value?.name, venueDetail.value, doors.value ? `Doors ${doors.value}` : showTime.value ? `Show ${showTime.value}` : null]
    .filter(Boolean)
    .join(' · ')
)
</script>

<template>
  <li class="border-t border-line first:border-t-0">
    <NuxtLink
      :to="buildShowRoute(props.event)"
      class="grid grid-cols-[48px_minmax(0,1fr)] gap-x-3.5 px-[18px] py-3.5 transition-colors hover:bg-surface focus-visible:bg-surface lg:grid-cols-[88px_minmax(0,1fr)_240px_120px_96px] lg:gap-x-6 lg:px-4 lg:py-[18px]"
    >
      <!-- Date -->
      <div class="tabular">
        <template v-if="props.showDate && dateParts">
          <time :datetime="localDate ?? undefined" class="block">
            <span class="block text-xs text-muted lg:text-13">
              {{ dateParts.weekday }}<span class="hidden lg:inline"> · {{ dateParts.month }}</span>
            </span>
            <span class="block font-display text-30 font-bold leading-[0.9] text-ink lg:text-40">
              {{ dateParts.day }}
            </span>
          </time>
        </template>
        <span v-else-if="dateParts" class="sr-only">{{ dateParts.weekday }} {{ dateParts.month }} {{ dateParts.day }}</span>
      </div>

      <!-- Lineup -->
      <div class="min-w-0">
        <div class="flex items-start justify-between gap-3 lg:block">
          <p class="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <span class="font-display text-24 font-semibold leading-none text-ink lg:text-30">{{ headliner }}</span>
            <span
              v-if="badge"
              class="rounded-tag bg-accent-soft px-[7px] py-0.5 text-xs font-semibold text-accent-soft-ink"
            >{{ badge }}</span>
          </p>
          <span v-if="price" class="tabular shrink-0 pt-0.5 text-15 text-ink lg:hidden">{{ price }}</span>
        </div>
        <p class="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            v-if="genre"
            class="hidden rounded-tag border border-line-strong px-1.5 text-xs leading-5 text-ink-3 lg:inline-block"
          >{{ genre }}</span>
          <span v-if="support" class="text-13 text-ink-2 lg:text-sm">with {{ support }}</span>
        </p>
        <p class="mt-1 text-13 text-muted lg:hidden">{{ mobileMeta }}</p>
      </div>

      <!-- Venue -->
      <div class="hidden min-w-0 lg:block">
        <p class="text-15 text-ink">{{ venue?.name ?? 'Venue TBA' }}</p>
        <p v-if="venueDetail" class="mt-0.5 truncate text-13 text-muted">{{ venueDetail }}</p>
      </div>

      <!-- Time -->
      <div class="tabular hidden text-sm lg:block">
        <p v-if="doors" class="text-muted">Doors {{ doors }}</p>
        <p v-if="showTime" class="text-ink">Show {{ showTime }}</p>
        <p v-else class="text-muted">Time TBA</p>
      </div>

      <!-- Tickets -->
      <div class="hidden text-right lg:block">
        <p v-if="price" class="tabular text-15 text-ink">{{ price }}</p>
        <p class="mt-0.5 text-13 text-accent-text">Setlists →</p>
      </div>
    </NuxtLink>
  </li>
</template>
