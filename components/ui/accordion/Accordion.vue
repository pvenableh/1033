<script setup lang="ts">
import { computed } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'
import { cn } from '~/lib/utils'
import { ChevronDown } from 'lucide-vue-next'

interface AccordionItemType {
  label: string
  content?: string
  slot?: string
  disabled?: boolean
  defaultOpen?: boolean
  icon?: string
}

const props = withDefaults(defineProps<{
  items?: AccordionItemType[]
  type?: 'single' | 'multiple'
  collapsible?: boolean
  defaultValue?: string | string[]
  class?: string
}>(), {
  items: () => [],
  type: 'single',
  collapsible: true,
})

const defaultOpenItems = computed(() => {
  return props.items
    .filter(item => item.defaultOpen)
    .map((_, idx) => `item-${idx}`)
})
</script>

<template>
  <AccordionRoot
    :type="type"
    :collapsible="collapsible"
    :default-value="defaultValue || (type === 'single' ? defaultOpenItems[0] : defaultOpenItems)"
    :class="cn('w-full', props.class)"
  >
    <AccordionItem
      v-for="(item, index) in items"
      :key="index"
      :value="`item-${index}`"
      :disabled="item.disabled"
      class="border-b"
    >
      <AccordionHeader class="flex">
        <AccordionTrigger
          class="flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180"
        >
          <div class="flex items-center gap-2">
            <Icon v-if="item.icon" :name="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </div>
          <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent
        class="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      >
        <div class="pb-4 pt-0">
          <slot :name="item.slot || `item-${index}`" :item="item">
            {{ item.content }}
          </slot>
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
