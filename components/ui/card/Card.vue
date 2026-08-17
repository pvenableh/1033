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
        // bg-card omitted on purpose: .glass-card supplies a translucent surface,
        // and an opaque background behind it cancels the backdrop blur entirely.
        'rounded-md text-card-foreground px-4 py-4 glass-card',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
