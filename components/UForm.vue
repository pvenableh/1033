<script setup lang="ts">
/**
 * UForm - NuxtUI-compatible Form wrapper
 * This component provides backward compatibility with the NuxtUI Form API
 * Uses native HTML form with validation support
 */
import type { HTMLAttributes } from "vue"
import { cn } from "~/lib/utils"

interface FormError {
  path: string
  message: string
}

interface Props {
  state?: Record<string, any>
  validate?: (state: Record<string, any>) => FormError[]
  validateOn?: string[]
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  validateOn: () => ["submit"],
})

const emit = defineEmits<{
  (e: "submit", event: Event): void
  (e: "error", errors: FormError[]): void
}>()

const errors = ref<FormError[]>([])

// Provide errors to child form groups
provide("formErrors", errors)

// Handle NuxtUI's ui prop for custom styling
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})

const formClasses = computed(() => {
  return cn(uiClasses.value, props.class)
})

function handleSubmit(event: Event) {
  event.preventDefault()

  // Run validation if provided
  if (props.validate && props.state) {
    const validationErrors = props.validate(props.state)
    errors.value = validationErrors

    if (validationErrors.length > 0) {
      emit("error", validationErrors)
      return
    }
  }

  emit("submit", event)
}
</script>

<template>
  <form :class="formClasses" @submit="handleSubmit">
    <slot />
  </form>
</template>
