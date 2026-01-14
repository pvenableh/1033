<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import type { BadgeVariants } from "."
import { cn } from "~/lib/utils"
import { badgeVariants } from "."

interface Props {
  variant?: BadgeVariants["variant"]
  color?: BadgeVariants["color"]
  size?: BadgeVariants["size"]
  class?: HTMLAttributes["class"]
}

const props = withDefaults(defineProps<Props>(), {
  variant: "solid",
  color: "default",
  size: "default",
})
</script>

<template>
  <span :class="cn(badgeVariants({ variant, color, size }), props.class)">
    <slot />
  </span>
</template>
