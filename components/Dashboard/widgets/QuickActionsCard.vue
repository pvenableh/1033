<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

interface QuickAction {
  label: string
  to: string
  icon: string
  description?: string
}

defineProps<{
  title?: string
  description?: string
  actions: QuickAction[]
}>()
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="text-base">{{ title || 'Quick Actions' }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <nuxt-link
          v-for="action in actions"
          :key="action.to"
          :to="action.to"
          class="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors min-h-[100px]"
        >
          <Icon :name="action.icon" class="h-6 w-6 mb-2 text-muted-foreground" />
          <span class="text-sm font-medium text-center">{{ action.label }}</span>
          <span v-if="action.description" class="text-xs text-muted-foreground text-center mt-1">
            {{ action.description }}
          </span>
        </nuxt-link>
      </div>
    </CardContent>
  </Card>
</template>
