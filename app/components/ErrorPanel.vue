<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
  }>(),
  {
    title: 'Couldn’t load shows.',
    message: 'Neither Ticketmaster nor SeatGeek responded. This is usually temporary.'
  }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="rounded-lg border border-error-line px-6 py-7">
    <h2 class="font-display text-34 font-semibold leading-none text-ink">{{ props.title }}</h2>
    <p v-if="props.message" class="mt-2.5 text-sm text-ink-3">{{ props.message }}</p>
    <button
      type="button"
      class="mt-5 whitespace-nowrap rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-ink-2"
      @click="emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
