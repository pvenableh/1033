<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "~/lib/utils"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
    icon?: string
  }
}

const props = defineProps<{
  config: ChartConfig
  class?: HTMLAttributes["class"]
}>()

// Generate CSS custom properties from config
const chartStyles = computed(() => {
  const styles: Record<string, string> = {}
  Object.entries(props.config).forEach(([key, value], index) => {
    styles[`--color-${key}`] = value.color
  })
  return styles
})
</script>

<template>
  <div
    :class="cn('relative', props.class)"
    :style="chartStyles"
  >
    <slot />
  </div>
</template>
