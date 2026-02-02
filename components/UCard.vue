<script setup lang="ts">
/**
 * UCard - NuxtUI-compatible Card wrapper for shadcn-vue
 * This component provides backward compatibility with the NuxtUI Card API
 *
 * When used inside a modal (UModal), the card strips its own border/shadow
 * to avoid double borders and shadows from the migration to shadcn-vue.
 */
import type { HTMLAttributes } from "vue"
import { Card, CardHeader, CardContent, CardFooter } from "~/components/ui/card"
import { cn } from "~/lib/utils"
import { inject } from 'vue'

interface Props {
  class?: HTMLAttributes["class"]
  ui?: Record<string, string>
}

const props = defineProps<Props>()

const slots = useSlots()

// Detect if we're inside a modal context (provided by UModal)
const isInsideModal = inject('umodal-context', false)

// Handle NuxtUI's ui prop for custom styling
const uiClasses = computed(() => {
  if (!props.ui) return ""
  return Object.values(props.ui).join(" ")
})

const cardClasses = computed(() => {
  return cn(
    isInsideModal ? 'border-0 shadow-none rounded-none bg-transparent' : '',
    props.class,
    uiClasses.value,
  )
})

const hasHeader = computed(() => !!slots.header)
const hasFooter = computed(() => !!slots.footer)
</script>

<template>
  <Card :class="cardClasses">
    <CardHeader v-if="hasHeader" class="p-4 sm:p-6">
      <slot name="header" />
    </CardHeader>
    <CardContent :class="hasHeader ? 'pt-0' : 'p-4 sm:p-6'">
      <slot />
    </CardContent>
    <CardFooter v-if="hasFooter" class="p-4 sm:p-6 pt-0">
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>
