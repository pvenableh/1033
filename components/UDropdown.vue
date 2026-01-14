<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { cn } from '~/lib/utils'

interface DropdownItem {
  label?: string
  icon?: string
  click?: () => void
  disabled?: boolean
  slot?: string
}

const props = withDefaults(defineProps<{
  items?: (DropdownItem | DropdownItem[])[]
  mode?: 'click' | 'hover'
  class?: string
  popper?: { placement?: string }
}>(), {
  items: () => [],
  mode: 'click',
})

const flatItems = (items: (DropdownItem | DropdownItem[])[]) => {
  return items.map(item => Array.isArray(item) ? item : [item])
}

// Convert NuxtUI icon format to heroicons format
const convertIcon = (icon?: string): string | undefined => {
  if (!icon) return undefined
  // Convert i-heroicons-xxx to heroicons:xxx
  if (icon.startsWith('i-heroicons-')) {
    return icon.replace('i-heroicons-', 'heroicons:')
  }
  // Convert i-lucide-xxx to lucide:xxx
  if (icon.startsWith('i-lucide-')) {
    return icon.replace('i-lucide-', 'lucide:')
  }
  return icon
}
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :class="cn(
          'z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class
        )"
        :side-offset="4"
      >
        <template v-for="(group, groupIndex) in flatItems(items)" :key="groupIndex">
          <DropdownMenuSeparator v-if="groupIndex > 0" class="-mx-1 my-1 h-px bg-muted" />
          <DropdownMenuGroup>
            <DropdownMenuItem
              v-for="(item, itemIndex) in group"
              :key="itemIndex"
              :disabled="item.disabled"
              class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              @click="item.click?.()"
            >
              <slot :name="item.slot" :item="item">
                <Icon v-if="item.icon" :name="convertIcon(item.icon)" class="mr-2 h-4 w-4" />
                <span>{{ item.label }}</span>
              </slot>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
