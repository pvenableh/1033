<script setup lang="ts">
/**
 * UTextarea - NuxtUI-compatible Textarea wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI Textarea API
 */
import type { HTMLAttributes } from "vue"
import { Textarea } from "~/components/ui/textarea"
import { cn } from "~/lib/utils"

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autofocus?: boolean
  rows?: number | string
  name?: string
  id?: string
  resize?: boolean
  autoresize?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  color?: string
  variant?: string
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  resize: true,
  size: "md",
})

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const textareaValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value as string),
})

// Handle NuxtUI's ui prop for custom styling
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})

// Size classes
const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  }
  return sizes[props.size] || sizes.md
})

const textareaClasses = computed(() => {
  return cn(
    sizeClasses.value,
    !props.resize && "resize-none",
    uiClasses.value,
    props.class
  )
})
</script>

<template>
  <Textarea
    v-model="textareaValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :autofocus="autofocus"
    :rows="Number(rows)"
    :name="name"
    :id="id"
    :class="textareaClasses"
  />
</template>
