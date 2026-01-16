<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { ProgressIndicator, ProgressRoot, type ProgressRootProps } from "reka-ui"
import { cn } from "~/lib/utils"

interface Props extends ProgressRootProps {
  class?: HTMLAttributes["class"]
  indicatorClass?: HTMLAttributes["class"]
  color?: "primary" | "green" | "red" | "yellow" | "blue" | "gray"
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
})

const colorClasses: Record<string, string> = {
  primary: "bg-primary",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  blue: "bg-blue-500",
  gray: "bg-gray-500",
}
</script>

<template>
  <ProgressRoot
    v-bind="props"
    :class="cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
      props.class,
    )"
  >
    <ProgressIndicator
      :class="cn(
        'h-full w-full flex-1 transition-all duration-300',
        colorClasses[props.color],
        props.indicatorClass,
      )"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%)`"
    />
  </ProgressRoot>
</template>
