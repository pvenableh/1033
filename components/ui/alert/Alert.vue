<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        warning: 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600',
        success: 'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

type AlertVariants = VariantProps<typeof alertVariants>

const props = defineProps<{
  variant?: AlertVariants['variant']
  title?: string
  description?: string
  icon?: string
  color?: string
  class?: HTMLAttributes['class']
}>()

// Map NuxtUI color prop to variant
const computedVariant = computed(() => {
  if (props.variant) return props.variant
  if (props.color === 'red' || props.color === 'error') return 'destructive'
  if (props.color === 'yellow' || props.color === 'warning') return 'warning'
  if (props.color === 'green' || props.color === 'success') return 'success'
  return 'default'
})
</script>

<template>
  <div :class="cn(alertVariants({ variant: computedVariant }), props.class)" role="alert">
    <Icon v-if="icon" :name="icon" class="h-4 w-4" />
    <h5 v-if="title" class="mb-1 font-medium leading-none tracking-tight">
      {{ title }}
    </h5>
    <div v-if="description" class="text-sm [&_p]:leading-relaxed">
      {{ description }}
    </div>
    <slot />
  </div>
</template>
