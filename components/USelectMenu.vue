<script setup lang="ts">
/**
 * USelectMenu - NuxtUI-compatible SelectMenu wrapper for shadcn-vue
 * Provides backward compatibility with the NuxtUI USelectMenu API
 */
import { computed } from 'vue'
import SelectMenu from '~/components/ui/select-menu/SelectMenu.vue'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: string | number | (string | number)[] | null
  options?: (string | number | Option)[]
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  multiple?: boolean
  disabled?: boolean
  size?: string
  class?: string
  by?: string
}>(), {
  options: () => [],
  placeholder: 'Select an option',
  searchPlaceholder: 'Search...',
  by: 'value',
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

// Normalize options to the format expected by the shadcn SelectMenu
const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) }
    }
    return opt
  })
})

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <SelectMenu
    v-model="selectedValue"
    :options="normalizedOptions"
    :placeholder="placeholder"
    :searchable="searchable"
    :search-placeholder="searchPlaceholder"
    :multiple="multiple"
    :disabled="disabled"
    :class="props.class"
    :by="by"
  />
</template>
