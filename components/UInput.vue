<script setup lang="ts">
/**
 * UInput - NuxtUI-compatible Input wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI Input API
 */
import type { HTMLAttributes } from "vue"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"

interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autofocus?: boolean
  autocomplete?: string
  name?: string
  id?: string
  icon?: string
  leadingIcon?: string
  trailingIcon?: string
  loading?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  color?: string
  variant?: string
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  size: "md",
})

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void
}>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value as string | number),
})

// Handle NuxtUI's ui prop for custom styling
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})

// Size classes
const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: "h-8 text-xs",
    md: "h-9 text-sm",
    lg: "h-10 text-base",
    xl: "h-12 text-lg",
  }
  return sizes[props.size] || sizes.md
})

const inputClasses = computed(() => {
  return cn(sizeClasses.value, uiClasses.value, props.class)
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

const leadingIconName = computed(() => convertIconName(props.icon || props.leadingIcon))
const trailingIconName = computed(() => convertIconName(props.trailingIcon))
</script>

<template>
  <div class="relative">
    <Icon
      v-if="leadingIconName"
      :name="leadingIconName"
      class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
    />
    <Input
      v-model="inputValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autofocus="autofocus"
      :autocomplete="autocomplete"
      :name="name"
      :id="id"
      :class="cn(inputClasses, leadingIconName && 'pl-10', trailingIconName && 'pr-10')"
    />
    <Icon
      v-if="loading"
      name="lucide:loader-2"
      class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
    />
    <Icon
      v-else-if="trailingIconName"
      :name="trailingIconName"
      class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
    />
  </div>
</template>
