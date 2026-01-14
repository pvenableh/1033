<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { TabsRoot } from 'reka-ui'
import { cn } from '~/lib/utils'

interface TabItem {
  label: string
  slot?: string
  disabled?: boolean
  icon?: string
}

const props = withDefaults(defineProps<{
  modelValue?: number | string
  items?: TabItem[]
  class?: string
  defaultValue?: string
}>(), {
  items: () => [],
  modelValue: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [index: number]
}>()

const activeIndex = ref(typeof props.modelValue === 'number' ? props.modelValue : 0)

watch(() => props.modelValue, (val) => {
  if (typeof val === 'number') {
    activeIndex.value = val
  }
})

const activeTab = computed({
  get: () => props.items[activeIndex.value]?.slot || `tab-${activeIndex.value}`,
  set: (val) => {
    const idx = props.items.findIndex(item => (item.slot || `tab-${props.items.indexOf(item)}`) === val)
    if (idx !== -1) {
      activeIndex.value = idx
      emit('update:modelValue', idx)
      emit('change', idx)
    }
  }
})

provide('tabItems', props.items)
</script>

<template>
  <TabsRoot v-model="activeTab" :class="cn('w-full', props.class)">
    <div class="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
      <button
        v-for="(item, index) in items"
        :key="index"
        type="button"
        :disabled="item.disabled"
        :class="cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1',
          activeIndex === index ? 'bg-background text-foreground shadow' : ''
        )"
        @click="activeTab = item.slot || `tab-${index}`"
      >
        <Icon v-if="item.icon" :name="item.icon" class="w-4 h-4 mr-2" />
        {{ item.label }}
      </button>
    </div>
    <div class="mt-2">
      <template v-for="(item, index) in items" :key="index">
        <div v-show="activeIndex === index">
          <slot :name="item.slot || `tab-${index}`" :item="item" :index="index" />
        </div>
      </template>
    </div>
  </TabsRoot>
</template>
