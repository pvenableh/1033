<script setup lang="ts">
/**
 * UTabs - NuxtUI-compatible Tabs wrapper for shadcn-vue
 * Provides backward compatibility with the NuxtUI UTabs API
 */
import Tabs from '~/components/ui/tabs/Tabs.vue'

interface TabItem {
  label: string
  slot?: string
  disabled?: boolean
  icon?: string
}

const props = withDefaults(defineProps<{
  modelValue?: number
  items?: TabItem[]
  class?: string
}>(), {
  items: () => [],
  modelValue: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [index: number]
}>()

const activeIndex = computed({
  get: () => props.modelValue,
  set: (val: number) => {
    emit('update:modelValue', val)
    emit('change', val)
  }
})
</script>

<template>
  <Tabs
    v-model="activeIndex"
    :items="items"
    :class="props.class"
  >
    <template v-for="item in items" :key="item.slot || item.label" #[item.slot||item.label]="slotProps">
      <slot :name="item.slot || item.label" v-bind="slotProps" />
    </template>
  </Tabs>
</template>
