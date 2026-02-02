<script setup lang="ts">
/**
 * UAlert - NuxtUI-compatible Alert wrapper for shadcn-vue
 * Provides backward compatibility with the NuxtUI UAlert API
 */
import Alert from '~/components/ui/alert/Alert.vue'

const props = defineProps<{
  title?: string
  description?: string
  icon?: string
  color?: string
  variant?: string
  class?: string
}>()
</script>

<template>
  <Alert
    :title="title"
    :icon="icon"
    :color="color"
    :class="props.class"
  >
    <template v-if="description">
      <p class="text-sm">{{ description }}</p>
    </template>
    <slot name="description" />
    <slot />
  </Alert>
</template>
