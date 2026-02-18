<script setup lang="ts">
import { computed, provide } from 'vue'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
} from 'reka-ui'
import { cn } from '~/lib/utils'

// Provide modal context so child UCard components can detect they're inside a modal
// and strip their own border/shadow to avoid double styling
provide('umodal-context', true)

interface ModalUI {
  width?: string
  overlay?: string
  container?: string
}

const props = withDefaults(defineProps<{
  modelValue?: boolean
  preventClose?: boolean
  fullscreen?: boolean
  ui?: ModalUI
}>(), {
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    if (!val) emit('close')
  }
})

const handleClose = () => {
  if (!props.preventClose) {
    isOpen.value = false
  }
}
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay
        :class="cn(
          'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          ui?.overlay
        )"
        @click="handleClose"
      />
      <DialogContent
        :class="cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-hidden',
          fullscreen ? 'w-screen h-screen max-w-none' : '',
          ui?.width,
          ui?.container
        )"
      >
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
