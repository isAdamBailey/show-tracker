<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CITY_OPTIONS, type CityOption } from '../data/cities'

const props = defineProps<{
  label: string
  pending: boolean
}>()

const emit = defineEmits<{
  select: [city: CityOption]
  useLocation: []
}>()

const open = ref<boolean>(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const close = (returnFocus = false): void => {
  open.value = false
  if (returnFocus) trigger.value?.focus()
}

const choose = (city: CityOption): void => {
  emit('select', city)
  close(true)
}

const chooseLocation = (): void => {
  emit('useLocation')
  close(true)
}

const onDocumentPointer = (event: PointerEvent): void => {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && open.value) {
    event.stopPropagation()
    close(true)
  }
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointer))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointer))
</script>

<template>
  <span ref="root" class="relative inline-block" @keydown="onKeydown">
    <button
      ref="trigger"
      type="button"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-label="`Change city, currently ${props.label}`"
      class="inline-flex items-center gap-[0.18em] border-b-[3px] border-accent text-accent-text transition-colors hover:text-accent-hover"
      :class="{ 'text-muted': props.pending }"
      @click="open = !open"
    >
      {{ props.label }}
      <span aria-hidden="true" class="text-[0.8em] leading-none">▾</span>
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-30 mt-3 w-60 rounded-lg border border-line-strong bg-surface py-2 font-sans text-sm font-normal tracking-normal shadow-popover"
    >
      <button
        type="button"
        class="block w-full border-b border-line px-4 pb-2.5 pt-1.5 text-left text-accent-text hover:bg-surface-hi focus-visible:bg-surface-hi"
        @click="chooseLocation"
      >
        Use my location
      </button>
      <ul class="max-h-72 overflow-y-auto pt-1" aria-label="Cities">
        <li v-for="city in CITY_OPTIONS" :key="city.name">
          <button
            type="button"
            class="block w-full px-4 py-[9px] text-left text-ink hover:bg-surface-hi focus-visible:bg-surface-hi"
            @click="choose(city)"
          >
            {{ city.name }}
          </button>
        </li>
      </ul>
    </div>
  </span>
</template>
