<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface Column {
  key: string
  label?: string
  sortable?: boolean
  class?: string
}

const props = defineProps<{
  rows?: Record<string, any>[]
  columns?: Column[]
  loading?: boolean
  emptyState?: { icon?: string; label?: string }
  class?: HTMLAttributes['class']
}>()

const slots = defineSlots<{
  [key: string]: (props: { row: Record<string, any>; column: Column; index: number }) => any
  'loading-state': () => any
  'empty-state': () => any
}>()
</script>

<template>
  <div class="relative w-full overflow-auto">
    <table :class="cn('w-full caption-bottom text-sm', props.class)">
      <thead class="[&_tr]:border-b">
        <tr class="border-b transition-colors hover:bg-muted/50">
          <th
            v-for="column in columns"
            :key="column.key"
            :class="cn(
              'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
              column.class
            )"
          >
            <slot :name="`${column.key}-header`" :column="column">
              {{ column.label || column.key }}
            </slot>
          </th>
        </tr>
      </thead>
      <tbody class="[&_tr:last-child]:border-0">
        <!-- Loading state -->
        <tr v-if="loading">
          <td :colspan="columns?.length" class="h-24 text-center">
            <slot name="loading-state">
              <div class="flex items-center justify-center">
                <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </slot>
          </td>
        </tr>
        <!-- Empty state -->
        <tr v-else-if="!rows?.length">
          <td :colspan="columns?.length" class="h-24 text-center">
            <slot name="empty-state">
              <div class="flex flex-col items-center justify-center text-muted-foreground">
                <Icon v-if="emptyState?.icon" :name="emptyState.icon" class="h-8 w-8 mb-2" />
                <span>{{ emptyState?.label || 'No data available' }}</span>
              </div>
            </slot>
          </td>
        </tr>
        <!-- Data rows -->
        <tr
          v-else
          v-for="(row, index) in rows"
          :key="index"
          class="border-b transition-colors hover:bg-muted/50"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :class="cn(
              'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
              column.class
            )"
          >
            <slot :name="`${column.key}-data`" :row="row" :column="column" :index="index">
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
