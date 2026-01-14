<script setup lang="ts">
/**
 * UBadge - NuxtUI-compatible Badge wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI Badge API
 */
import type { HTMLAttributes } from "vue"
import { Badge, type BadgeVariants } from "~/components/ui/badge"
import { cn } from "~/lib/utils"

interface Props {
  variant?: BadgeVariants["variant"]
  color?: BadgeVariants["color"]
  size?: BadgeVariants["size"]
  class?: HTMLAttributes["class"]
  // NuxtUI-specific props that we handle
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  variant: "solid",
  color: "default",
  size: "default",
})

// Handle NuxtUI's ui prop for custom styling like rounded
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})
</script>

<template>
  <Badge
    :variant="variant"
    :color="color"
    :size="size"
    :class="cn(props.class, uiClasses)"
  >
    <slot />
  </Badge>
</template>
