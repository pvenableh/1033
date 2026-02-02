<script setup lang="ts">
/**
 * URadioGroup - NuxtUI-compatible RadioGroup wrapper for shadcn-vue
 * Provides backward compatibility with the NuxtUI URadioGroup API
 */
import Radio from '~/components/ui/radio-group/Radio.vue'

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
  set: (val: string) => emit('update:modelValue', val)
})
</script>

<template>
  <Radio
    v-model="selectedValue"
    :options="options"
    :name="name"
    :disabled="disabled"
    :class="props.class"
  />
</template>
