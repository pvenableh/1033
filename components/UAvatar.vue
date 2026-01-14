<script setup lang="ts">
/**
 * UAvatar - NuxtUI-compatible Avatar wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI Avatar API
 */
import type { HTMLAttributes } from "vue"
import { Avatar } from "~/components/ui/avatar"
import { cn } from "~/lib/utils"

interface Props {
  src?: string
  alt?: string
  text?: string // NuxtUI uses text for fallback
  icon?: string // NuxtUI icon prop (e.g., "i-heroicons-user")
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "2xs" | "3xs"
  chip?: boolean
  chipColor?: string
  chipText?: string
  chipPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  imgClass?: string
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  size: "sm",
  chipPosition: "top-right",
})

// Map NuxtUI sizes to our Avatar sizes
const mappedSize = computed(() => {
  const sizeMap: Record<string, "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"> = {
    "3xs": "xs",
    "2xs": "xs",
    "xs": "xs",
    "sm": "sm",
    "md": "md",
    "lg": "lg",
    "xl": "xl",
    "2xl": "2xl",
    "3xl": "3xl",
  }
  return sizeMap[props.size] || "sm"
})

// Handle NuxtUI's ui prop for custom styling
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})

const avatarClasses = computed(() => {
  return cn(uiClasses.value, props.class)
})

// Get fallback text from various props
const fallbackText = computed(() => {
  if (props.icon) return undefined // Use icon instead of text
  if (props.text) {
    // Generate initials from text
    return props.text
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  if (props.alt) {
    return props.alt
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  return "?"
})

// Convert NuxtUI icon format to @nuxt/icon format
const convertedIcon = computed(() => {
  if (!props.icon) return undefined
  // Convert i-heroicons-xxx to heroicons:xxx
  if (props.icon.startsWith('i-heroicons-')) {
    return props.icon.replace('i-heroicons-', 'heroicons:')
  }
  // Convert i-lucide-xxx to lucide:xxx
  if (props.icon.startsWith('i-lucide-')) {
    return props.icon.replace('i-lucide-', 'lucide:')
  }
  return props.icon
})
</script>

<template>
  <Avatar
    :src="src"
    :alt="alt || text"
    :size="mappedSize"
    :fallback="fallbackText"
    :icon="convertedIcon"
    :chip="chip"
    :chip-color="chipColor"
    :chip-text="chipText"
    :chip-position="chipPosition"
    :class="avatarClasses"
  />
</template>
