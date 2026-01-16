<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

const boardCollection = useDirectusItems('board_member', { requireAuth: false })

const board = await boardCollection.list({
  fields: ['*,person.*'],
  filter: {
    status: {
      _eq: 'published',
    },
  },
  sort: 'sort',
})
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Board of Directors</CardTitle>
          <CardDescription>Current board members</CardDescription>
        </div>
        <Icon name="heroicons:user-group" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="board && board.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div
          v-for="(item, index) in board"
          :key="index"
          class="text-center p-4 rounded-lg border bg-muted/30"
        >
          <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {{ item.title }}
          </p>
          <p class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            {{ item.person.first_name }}
          </p>
          <p class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            {{ item.person.last_name }}
          </p>
        </div>
      </div>
      <div v-else class="py-8 text-center text-muted-foreground">
        <Icon name="heroicons:user-group" class="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p class="text-sm">No board members found</p>
      </div>
    </CardContent>
  </Card>
</template>
