<script setup lang="ts">
import { computed } from 'vue'
import ErrorPanel from '../../components/ErrorPanel.vue'
import FeedList from '../../components/FeedList.vue'
import FeedSkeleton from '../../components/FeedSkeleton.vue'
import SetlistHistory from '../../components/SetlistHistory.vue'
import type { MergedEventsResult, SetlistItem, TicketmasterEvent } from '../../types/music'
import { allSourcesFailed } from '../../utils/events'
import { readRouteValue } from '../../utils/route'

interface ArtistPagePayload {
  upcoming: MergedEventsResult
  setlists: SetlistItem[]
  setlistError: boolean
}

const route = useRoute()
const { loadArtistUpcoming, loadSetlistHistory } = useArtistData()

const artistName = computed<string>(() => readRouteValue(route.params.artistName))

const { data, pending, refresh } = await useAsyncData<ArtistPagePayload>(
  () => `artist-page:${artistName.value}`,
  async () => {
    const [upcomingResult, setlistResult] = await Promise.allSettled([
      loadArtistUpcoming(artistName.value),
      loadSetlistHistory(artistName.value)
    ])
    return {
      upcoming:
        upcomingResult.status === 'fulfilled'
          ? upcomingResult.value
          : { events: [], ticketmaster: 'failed', seatgeek: 'failed' },
      setlists: setlistResult.status === 'fulfilled' ? setlistResult.value : [],
      setlistError: setlistResult.status === 'rejected'
    }
  },
  { watch: [artistName] }
)

const events = computed<TicketmasterEvent[]>(() => data.value?.upcoming.events ?? [])
const failed = computed<boolean>(() => Boolean(data.value && allSourcesFailed(data.value.upcoming)))

useHead(() => ({ title: `${artistName.value} · Live Music Tracker` }))
</script>

<template>
  <main class="mx-auto max-w-screen-2xl pb-16">
    <header class="px-[18px] pt-8 md:px-10 md:pt-10">
      <h1 class="text-balance font-display text-52 font-bold leading-[0.9] tracking-[-0.015em] text-ink md:text-64">
        {{ artistName }}
      </h1>
      <p class="mt-3 text-sm text-muted">Upcoming shows in every city · Ticketmaster + SeatGeek</p>
    </header>

    <section class="pt-6 lg:px-6" aria-live="polite" :aria-busy="pending">
      <FeedSkeleton v-if="pending" />
      <ErrorPanel v-else-if="failed" class="mx-[18px] lg:mx-4" @retry="refresh()" />
      <p v-else-if="events.length === 0" class="mx-[18px] border-t border-line py-6 text-15 text-ink-3 lg:mx-4">
        No upcoming shows for {{ artistName }}.
      </p>
      <FeedList v-else :events="events" />
    </section>

    <SetlistHistory
      class="px-[18px] pt-14 md:px-10"
      :setlists="data?.setlists ?? []"
      :artist-name="artistName"
      :pending="pending"
      :failed="data?.setlistError ?? false"
      @retry="refresh()"
    />
  </main>
</template>
