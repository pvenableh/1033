<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  label?: string
  description?: string
  hint?: string
  required?: boolean
  error?: string | boolean
  name?: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('space-y-2', props.class)">
    <div v-if="label" class="flex items-center justify-between">
      <label
        :for="name"
        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {{ label }}
        <span v-if="required" class="text-destructive ml-0.5">*</span>
      </label>
      <span v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</span>
    </div>

    <p v-if="description" class="text-sm text-muted-foreground">
      {{ description }}
    </p>

    <slot />

    <div v-if="error && typeof error === 'string'" class="text-sm text-destructive">
      {{ error }}
    </div>
    <slot v-else-if="error" name="error" />
  </div>
</template>
