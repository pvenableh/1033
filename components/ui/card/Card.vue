<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-md border bg-card text-card-foreground px-4 py-4 glass-card',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
