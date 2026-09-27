<script setup lang="ts">
export interface SuggestionItem {
  id: string
  kind: 'artist' | 'genre'
  label: string
  meta: string
  to: string
}

export interface SuggestionGroup {
  title: string
  items: SuggestionItem[]
}

const props = defineProps<{
  groups: SuggestionGroup[]
  highlightId: string | null
  listboxId: string
  /** Full-screen mobile layout: taller rows with dividers. */
  touch?: boolean
}>()

const emit = defineEmits<{
  select: [item: SuggestionItem]
  hover: [id: string]
}>()
</script>

<template>
  <div :id="props.listboxId" role="listbox" aria-label="Search suggestions">
    <p
      class="border-b border-line pb-2 text-xs text-muted"
      :class="props.touch ? 'px-[18px] pt-4' : 'px-4 pt-1'"
    >
      Searching every city<span v-if="!props.touch"> · Ticketmaster + SeatGeek</span>
    </p>
    <div
      v-for="group in props.groups"
      :key="group.title"
      role="group"
      :aria-label="group.title"
      :class="props.touch ? 'pt-5' : 'pt-2'"
    >
      <p class="pb-1 text-xs font-semibold text-muted" :class="props.touch ? 'px-[18px]' : 'px-4'">
        {{ group.title }}
      </p>
      <NuxtLink
        v-for="item in group.items"
        :id="`${props.listboxId}-${item.id}`"
        :key="item.id"
        :to="item.to"
        role="option"
        :aria-selected="item.id === props.highlightId"
        class="flex items-center justify-between gap-4 outline-none"
        :class="[
          item.id === props.highlightId ? 'bg-surface-hi' : '',
          props.touch ? 'min-h-12 border-b border-skeleton-soft px-[18px] py-3 text-base' : 'px-4 py-2 text-15'
        ]"
        @mousedown.prevent
        @click.prevent="emit('select', item)"
        @mousemove="emit('hover', item.id)"
      >
        <span class="min-w-0 truncate text-ink">{{ item.label }}</span>
        <span class="tabular shrink-0 text-13 text-muted">{{ item.meta }}</span>
      </NuxtLink>
    </div>
  </div>
</template>
