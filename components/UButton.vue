<script setup lang="ts">
/**
 * UButton - NuxtUI-compatible Button wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI Button API
 */
import type { HTMLAttributes } from "vue"
import { Button, type ButtonVariants } from "~/components/ui/button"
import { cn } from "~/lib/utils"

interface Props {
  type?: "button" | "submit" | "reset"
  variant?: ButtonVariants["variant"] | "link" | "soft"
  size?: ButtonVariants["size"]
  color?: string
  icon?: string
  trailing?: boolean
  trailingIcon?: string
  loading?: boolean
  loadingIcon?: string
  disabled?: boolean
  block?: boolean
  square?: boolean
  padded?: boolean
  to?: string
  target?: string
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  type: "button",
  variant: "default",
  size: "default",
  loading: false,
  disabled: false,
  block: false,
  square: false,
  padded: true,
})

// Map NuxtUI variants to shadcn variants
const mappedVariant = computed((): ButtonVariants["variant"] => {
  // Handle color + variant combinations
  if (props.variant === "soft") {
    return "secondary"
  }
  if (props.variant === "link") {
    return "link"
  }
  if (props.variant === "ghost") {
    return "ghost"
  }
  if (props.variant === "outline") {
    return "outline"
  }
  // Default to solid/default
  return "default"
})

// Map NuxtUI sizes to shadcn sizes
const mappedSize = computed((): ButtonVariants["size"] => {
  if (props.square) {
    return props.size === "xs" ? "icon-sm" : props.size === "lg" ? "icon-lg" : "icon"
  }
  return props.size as ButtonVariants["size"]
})

// Generate color classes for NuxtUI color compatibility
const colorClasses = computed(() => {
  if (!props.color) return ""

  const colorMap: Record<string, string> = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
    sky: "bg-sky-500 hover:bg-sky-600 text-white",
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
    orange: "bg-orange-500 hover:bg-orange-600 text-white",
    gray: "bg-gray-500 hover:bg-gray-600 text-white",
    white: "bg-white hover:bg-gray-100 text-gray-900",
  }

  // Handle soft variant with colors
  if (props.variant === "soft") {
    const softColorMap: Record<string, string> = {
      primary: "bg-primary/20 hover:bg-primary/30 text-primary",
      sky: "bg-sky-100 hover:bg-sky-200 text-sky-700",
      blue: "bg-blue-100 hover:bg-blue-200 text-blue-700",
      red: "bg-red-100 hover:bg-red-200 text-red-700",
      green: "bg-green-100 hover:bg-green-200 text-green-700",
      yellow: "bg-yellow-100 hover:bg-yellow-200 text-yellow-700",
      orange: "bg-orange-100 hover:bg-orange-200 text-orange-700",
      gray: "bg-gray-100 hover:bg-gray-200 text-gray-700",
    }
    return softColorMap[props.color] || ""
  }

  // Handle ghost variant with colors
  if (props.variant === "ghost") {
    const ghostColorMap: Record<string, string> = {
      primary: "hover:bg-primary/10 text-primary",
      sky: "hover:bg-sky-100 text-sky-700",
      blue: "hover:bg-blue-100 text-blue-700",
      red: "hover:bg-red-100 text-red-700",
      green: "hover:bg-green-100 text-green-700",
      yellow: "hover:bg-yellow-100 text-yellow-700",
      orange: "hover:bg-orange-100 text-orange-700",
      gray: "hover:bg-gray-100 text-gray-700",
    }
    return ghostColorMap[props.color] || ""
  }

  return colorMap[props.color] || ""
})

// Convert icon name format
const convertIconName = (name?: string) => {
  if (!name) return ""
  if (name.startsWith("i-")) {
    const iconName = name.substring(2)
    const parts = iconName.split("-")
    if (parts.length >= 2) {
      const collection = parts[0]
      const icon = parts.slice(1).join("-")
      return `${collection}:${icon}`
    }
    return iconName
  }
  return name
}

const convertedIcon = computed(() => convertIconName(props.icon))
const convertedTrailingIcon = computed(() => convertIconName(props.trailingIcon))

// Handle NuxtUI's ui prop for custom styling
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})

const buttonClasses = computed(() => {
  return cn(
    props.block && "w-full",
    colorClasses.value,
    uiClasses.value,
    props.class
  )
})

const isLoading = computed(() => props.loading)
</script>

<template>
  <NuxtLink v-if="to" :to="to" :target="target">
    <Button
      :type="type"
      :variant="mappedVariant"
      :size="mappedSize"
      :disabled="disabled || isLoading"
      :class="buttonClasses"
    >
      <Icon v-if="isLoading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
      <Icon v-else-if="convertedIcon && !trailing" :name="convertedIcon" class="h-4 w-4" :class="{ 'mr-2': $slots.default }" />
      <slot />
      <Icon v-if="convertedTrailingIcon || (convertedIcon && trailing)" :name="convertedTrailingIcon || convertedIcon" class="h-4 w-4" :class="{ 'ml-2': $slots.default }" />
    </Button>
  </NuxtLink>
  <Button
    v-else
    :type="type"
    :variant="mappedVariant"
    :size="mappedSize"
    :disabled="disabled || isLoading"
    :class="buttonClasses"
  >
    <Icon v-if="isLoading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
    <Icon v-else-if="convertedIcon && !trailing" :name="convertedIcon" class="h-4 w-4" :class="{ 'mr-2': $slots.default }" />
    <slot />
    <Icon v-if="convertedTrailingIcon || (convertedIcon && trailing)" :name="convertedTrailingIcon || convertedIcon" class="h-4 w-4" :class="{ 'ml-2': $slots.default }" />
  </Button>
</template>
