<script setup lang="ts">
/**
 * UFormGroup - NuxtUI-compatible FormGroup wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI FormGroup API
 */
import type { HTMLAttributes } from "vue"
import { Label } from "~/components/ui/label"
import { cn } from "~/lib/utils"

interface Props {
  label?: string
  name?: string
  description?: string
  hint?: string
  help?: string
  error?: string | boolean
  required?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
})

// Handle NuxtUI's ui prop for custom styling
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})

const formGroupClasses = computed(() => {
  return cn("space-y-2", uiClasses.value, props.class)
})

// Size classes for label
const labelSizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  }
  return sizes[props.size] || sizes.md
})

const hasError = computed(() => {
  return props.error && typeof props.error === "string"
})
</script>

<template>
  <div :class="formGroupClasses">
    <Label v-if="label" :for="name" :class="cn('font-medium', labelSizeClasses)">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </Label>
    <p v-if="description" class="text-sm text-muted-foreground">
      {{ description }}
    </p>
    <slot />
    <p v-if="hint || help" class="text-xs text-muted-foreground">
      {{ hint || help }}
    </p>
    <p v-if="hasError" class="text-xs text-red-500">
      {{ error }}
    </p>
  </div>
</template>
