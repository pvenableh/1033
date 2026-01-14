<script setup lang="ts">
/**
 * UIcon - NuxtUI-compatible Icon wrapper for @nuxt/icon
 * This component provides backward compatibility with the NuxtUI Icon API
 *
 * Converts NuxtUI icon names (i-heroicons-check) to @nuxt/icon format (heroicons:check)
 */
import type { HTMLAttributes } from "vue"

interface Props {
  name: string
  class?: HTMLAttributes["class"]
  size?: string | number
}

const props = defineProps<Props>()

/**
 * Convert NuxtUI icon name format to @nuxt/icon format
 * NuxtUI: i-heroicons-check-circle
 * @nuxt/icon: heroicons:check-circle
 *
 * Also handles:
 * - i-heroicons-solid-check -> heroicons-solid:check
 * - i-material-symbols-xxx -> material-symbols:xxx
 * - i-lucide-xxx -> lucide:xxx
 * - i-wi-xxx -> wi:xxx
 * - i-meteocons-xxx -> meteocons:xxx
 * - i-fluent-emoji-flat-xxx -> fluent-emoji-flat:xxx
 */
const convertedName = computed(() => {
  if (!props.name) return ""

  let iconName = props.name

  // Remove the 'i-' prefix if present
  if (iconName.startsWith("i-")) {
    iconName = iconName.substring(2)
  }

  // Handle icon collections with known prefixes
  const collections = [
    "heroicons-outline",
    "heroicons-solid",
    "heroicons",
    "material-symbols",
    "lucide",
    "mdi",
    "wi",
    "meteocons",
    "fluent-emoji-flat",
    "logos",
  ]

  for (const collection of collections) {
    if (iconName.startsWith(`${collection}-`)) {
      const icon = iconName.substring(collection.length + 1)
      return `${collection}:${icon}`
    }
  }

  // If no known collection found, try to split at the first hyphen after the collection name
  // This handles cases like "heroicons-check-circle" -> "heroicons:check-circle"
  const parts = iconName.split("-")
  if (parts.length >= 2) {
    const collection = parts[0]
    const icon = parts.slice(1).join("-")
    return `${collection}:${icon}`
  }

  // Return as-is if no conversion needed (already in correct format)
  return iconName
})

// Compute size style if provided
const sizeStyle = computed(() => {
  if (!props.size) return {}
  const size = typeof props.size === "number" ? `${props.size}px` : props.size
  return { width: size, height: size }
})
</script>

<template>
  <Icon :name="convertedName" :class="props.class" :style="sizeStyle" />
</template>
