<script setup lang="ts">
import { computed } from 'vue'
import {
  RadioGroupIndicator,
  RadioGroupItem,
  RadioGroupRoot,
} from 'reka-ui'
import { cn } from '~/lib/utils'

interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: string
  options?: (string | RadioOption)[]
  name?: string
  disabled?: boolean
  class?: string
}>(), {
  options: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedValue = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val)
})

const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })
})
</script>

<template>
  <RadioGroupRoot
    v-model="selectedValue"
    :name="name"
    :disabled="disabled"
    :class="cn('grid gap-2', props.class)"
  >
    <div v-for="option in normalizedOptions" :key="option.value" class="flex items-center space-x-2">
      <RadioGroupItem
        :id="`${name}-${option.value}`"
        :value="option.value"
        :disabled="option.disabled"
        class="aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RadioGroupIndicator class="flex items-center justify-center">
          <div class="h-2.5 w-2.5 rounded-full bg-primary" />
        </RadioGroupIndicator>
      </RadioGroupItem>
      <label
        :for="`${name}-${option.value}`"
        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {{ option.label }}
      </label>
    </div>
  </RadioGroupRoot>
</template>
