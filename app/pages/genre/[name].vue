<script setup lang="ts">
import { computed } from 'vue'
import ErrorPanel from '../../components/ErrorPanel.vue'
import FeedList from '../../components/FeedList.vue'
import FeedSkeleton from '../../components/FeedSkeleton.vue'
import { useMusicCacheStore } from '../../stores/music-cache'
import type { MergedEventsResult, TicketmasterEvent } from '../../types/music'
import { allSourcesFailed, fetchMergedGenreEvents } from '../../utils/events'
import { readRouteValue } from '../../utils/route'

const route = useRoute()
const cacheStore = useMusicCacheStore()

const genre = computed<string>(() => readRouteValue(route.params.name).trim())

const { data, pending, refresh } = await useAsyncData<MergedEventsResult>(
  () => `genre-page:${genre.value}`,
  async () => {
    const cached = cacheStore.getGenreDiscovery(genre.value)
    if (cached) return cached
    const result = await fetchMergedGenreEvents(genre.value)
    if (!allSourcesFailed(result)) cacheStore.setGenreDiscovery(genre.value, result)
    return result
  },
  { watch: [genre] }
)

const events = computed<TicketmasterEvent[]>(() => data.value?.events ?? [])
const failed = computed<boolean>(() => Boolean(data.value && allSourcesFailed(data.value)))

useHead(() => ({ title: `${genre.value} shows · Live Music Tracker` }))
</script>

<template>
  <main class="mx-auto max-w-screen-2xl pb-16">
    <header class="px-[18px] pt-8 md:px-10 md:pt-10">
      <h1 class="text-balance font-display text-52 font-bold leading-[0.9] tracking-[-0.015em] text-ink md:text-64">
        {{ genre || 'Unknown genre' }}
      </h1>
      <p class="mt-3 text-sm text-muted">
        <template v-if="data?.usedKeywordFallback">
          Ticketmaster has no “{{ genre }}” category, so these are shows that mention it.
        </template>
        <template v-else>Upcoming shows in every city · Ticketmaster + SeatGeek</template>
      </p>
    </header>

    <section class="pt-6 lg:px-6" aria-live="polite" :aria-busy="pending">
      <FeedSkeleton v-if="pending" />
      <ErrorPanel v-else-if="failed" class="mx-[18px] lg:mx-4" @retry="refresh()" />
      <p v-else-if="events.length === 0" class="mx-[18px] border-t border-line py-6 text-15 text-ink-3 lg:mx-4">
        No upcoming {{ genre }} shows found.
      </p>
      <FeedList v-else :events="events" />
    </section>
  </main>
</template>
