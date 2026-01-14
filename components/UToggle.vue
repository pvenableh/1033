<script setup lang="ts">
/**
 * UToggle - NuxtUI-compatible Toggle wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI Toggle API
 * Uses the Switch component from shadcn-vue
 */
import type { HTMLAttributes } from "vue"
import { Switch } from "~/components/ui/switch"
import { Label } from "~/components/ui/label"
import { cn } from "~/lib/utils"

interface Props {
  modelValue?: boolean
  label?: string
  name?: string
  id?: string
  disabled?: boolean
  loading?: boolean
  onIcon?: string
  offIcon?: string
  color?: string
  size?: "sm" | "md" | "lg" | "xl"
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  loading: false,
  size: "md",
})

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "change", value: boolean): void
}>()

const checked = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:modelValue", value)
    emit("change", value)
  },
})

// Handle NuxtUI's ui prop for custom styling
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})

const containerClasses = computed(() => {
  return cn("flex items-center space-x-2", uiClasses.value, props.class)
})

// Size classes
const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: "h-4 w-7",
    md: "h-5 w-9",
    lg: "h-6 w-11",
    xl: "h-7 w-14",
  }
  return sizes[props.size] || sizes.md
})

// Color classes
const colorClasses = computed(() => {
  if (!props.color) return ""
  const colors: Record<string, string> = {
    primary: "data-[state=checked]:bg-primary",
    green: "data-[state=checked]:bg-green-500",
    red: "data-[state=checked]:bg-red-500",
    blue: "data-[state=checked]:bg-blue-500",
    sky: "data-[state=checked]:bg-sky-500",
  }
  return colors[props.color] || ""
})

const toggleId = computed(() => props.id || props.name || `toggle-${Math.random().toString(36).substr(2, 9)}`)
</script>

<template>
  <div :class="containerClasses">
    <Switch
      :id="toggleId"
      v-model:checked="checked"
      :disabled="disabled || loading"
      :name="name"
      :class="cn(sizeClasses, colorClasses)"
    />
    <Label v-if="label" :for="toggleId" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {{ label }}
    </Label>
    <slot />
  </div>
</template>
