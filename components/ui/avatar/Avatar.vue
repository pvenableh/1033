<script setup lang="ts">
import { computed } from 'vue'
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  fallback?: string
  chip?: boolean
  chipColor?: string
  chipText?: string
  chipPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  class?: string
}>(), {
  size: 'sm',
  chipPosition: 'top-right',
})

const sizeClasses = {
  'xs': 'h-6 w-6 text-xs',
  'sm': 'h-8 w-8 text-sm',
  'md': 'h-10 w-10 text-base',
  'lg': 'h-12 w-12 text-lg',
  'xl': 'h-14 w-14 text-xl',
  '2xl': 'h-16 w-16 text-2xl',
  '3xl': 'h-20 w-20 text-3xl',
}

const chipPositionClasses = {
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
}

const chipColorClasses: Record<string, string> = {
  'sky': 'bg-sky-500',
  'blue': 'bg-blue-500',
  'green': 'bg-green-500',
  'red': 'bg-red-500',
  'yellow': 'bg-yellow-500',
  'purple': 'bg-purple-500',
  'pink': 'bg-pink-500',
  'gray': 'bg-gray-500',
}

const initials = computed(() => {
  if (props.fallback) return props.fallback
  if (!props.alt) return '?'
  return props.alt
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>

<template>
  <div class="relative inline-block">
    <AvatarRoot
      :class="cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        props.class
      )"
    >
      <AvatarImage
        v-if="src"
        :src="src"
        :alt="alt"
        class="aspect-square h-full w-full object-cover"
      />
      <AvatarFallback
        class="flex h-full w-full items-center justify-center rounded-full bg-muted"
      >
        {{ initials }}
      </AvatarFallback>
    </AvatarRoot>

    <!-- Chip/Badge -->
    <span
      v-if="chip"
      :class="cn(
        'absolute flex items-center justify-center rounded-full border-2 border-background text-[10px] text-white font-medium',
        chipPositionClasses[chipPosition],
        chipColorClasses[chipColor || 'gray'],
        chipText ? 'h-5 min-w-5 px-1' : 'h-3 w-3'
      )"
    >
      {{ chipText }}
    </span>
  </div>
</template>
