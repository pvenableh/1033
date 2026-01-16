<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

interface Lease {
  start: string
  finish: string
  file?: string
}

const props = defineProps<{
  lease: Lease | null
}>()

const daysUntilExpires = computed(() => {
  if (props.lease?.finish) {
    const finish = new Date(props.lease.finish)
    const now = new Date()
    const diffTime = finish.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  return null
})

const urgencyClass = computed(() => {
  if (daysUntilExpires.value === null) return ''
  if (daysUntilExpires.value <= 7) return 'text-red-600 dark:text-red-400'
  if (daysUntilExpires.value <= 30) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Lease Status</CardTitle>
          <CardDescription>Your current lease information</CardDescription>
        </div>
        <Icon name="heroicons:document-text" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="lease" class="space-y-4">
        <div class="flex items-center gap-2">
          <Badge variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Icon name="heroicons:check-circle" class="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
            <p class="font-medium">{{ formatDate(lease.start) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">End Date</p>
            <p class="font-medium">{{ formatDate(lease.finish) }}</p>
          </div>
        </div>

        <div v-if="daysUntilExpires !== null">
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Time Remaining</p>
          <p class="text-lg font-bold" :class="urgencyClass">
            {{ daysUntilExpires }} days
          </p>
          <p v-if="daysUntilExpires <= 30" class="text-xs text-muted-foreground">
            Contact your landlord about renewal
          </p>
        </div>

        <a
          v-if="lease.file"
          :href="'https://admin.1033lenox.com/assets/' + lease.file"
          target="_blank"
          class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View Lease Document
          <Icon name="heroicons:arrow-top-right-on-square" class="h-3 w-3" />
        </a>
      </div>

      <div v-else class="py-8 text-center">
        <Icon name="heroicons:document-text" class="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
        <p class="text-sm font-medium text-destructive">No Active Lease Found</p>
        <p class="text-xs text-muted-foreground mt-1">
          Please contact your landlord or property manager.
        </p>
      </div>
    </CardContent>
  </Card>
</template>
