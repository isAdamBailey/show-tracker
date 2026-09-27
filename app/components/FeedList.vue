<script setup lang="ts">
import FeedRow from './FeedRow.vue'
import type { TicketmasterEvent } from '../types/music'
import { isFirstOfDay } from '../utils/events'

const props = withDefaults(
  defineProps<{
    events: TicketmasterEvent[]
    /** Tonight/Tomorrow badges are redundant on the Tonight tab. */
    showBadge?: boolean
    /** Feed city, so venues in that city show their street instead of repeating it. */
    feedCity?: string
  }>(),
  { showBadge: true, feedCity: '' }
)
</script>

<template>
  <ul>
    <FeedRow
      v-for="(event, index) in props.events"
      :key="event.id"
      :event="event"
      :show-date="isFirstOfDay(props.events, index)"
      :show-badge="props.showBadge"
      :feed-city="props.feedCity"
    />
  </ul>
</template>
