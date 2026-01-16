<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

interface BoardMember {
  year: string
  title: string
  start: string
  finish: string
}

defineProps<{
  boardMember: BoardMember
}>()
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Board Member Status</CardTitle>
          <CardDescription>Your current board position</CardDescription>
        </div>
        <Icon name="heroicons:shield-check" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex items-center gap-3 mb-4">
        <Badge variant="secondary" class="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          {{ boardMember.year }}
        </Badge>
        <span class="font-bold text-lg">{{ boardMember.title }}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Appointed</p>
          <p class="font-medium">{{ getFriendlyDateTwo(boardMember.start) }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Expires</p>
          <p class="font-medium">{{ getFriendlyDateTwo(boardMember.finish) }}</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
