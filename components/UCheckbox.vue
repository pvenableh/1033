<script setup lang="ts">
/**
 * UCheckbox - NuxtUI-compatible Checkbox wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI Checkbox API
 */
import type { HTMLAttributes } from "vue"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"
import { cn } from "~/lib/utils"

interface Props {
  modelValue?: boolean
  label?: string
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  indeterminate?: boolean
  color?: string
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
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

// Color classes
const colorClasses = computed(() => {
  if (!props.color) return ""
  const colors: Record<string, string> = {
    primary: "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
    green: "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500",
    red: "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500",
    blue: "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500",
  }
  return colors[props.color] || ""
})

const checkboxId = computed(() => props.id || props.name || `checkbox-${Math.random().toString(36).substr(2, 9)}`)
</script>

<template>
  <div :class="containerClasses">
    <Checkbox
      :id="checkboxId"
      v-model:checked="checked"
      :disabled="disabled"
      :required="required"
      :name="name"
      :class="colorClasses"
    />
    <Label v-if="label" :for="checkboxId" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {{ label }}
    </Label>
    <slot />
  </div>
</template>
