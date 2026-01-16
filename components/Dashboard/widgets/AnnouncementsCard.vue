<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

interface Announcement {
  id: string | number
  title: string
  subtitle?: string
  content?: string
  date_sent?: string
  url?: string
  announcement_type?: string | null
  is_pinned?: boolean
  publish_date?: string | null
  date_created?: string | null
  tags?: string[]
}

const props = defineProps<{
  announcements: Announcement[]
  maxItems?: number
}>()

const displayedAnnouncements = computed(() => {
  const max = props.maxItems || 5
  return props.announcements.slice(0, max)
})

const getTypeIcon = (type: string | null | undefined) => {
  const icons: Record<string, string> = {
    urgent: "heroicons:exclamation-triangle",
    maintenance: "heroicons:wrench-screwdriver",
    event: "heroicons:calendar",
    reminder: "heroicons:bell",
    general: "heroicons:megaphone",
  }
  return icons[type || "general"] || icons.general
}

const getTypeColor = (type: string | null | undefined) => {
  const colors: Record<string, string> = {
    urgent: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",
    maintenance: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
    event: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
    reminder: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
    general: "text-muted-foreground bg-muted",
  }
  return colors[type || "general"] || colors.general
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">Announcements</CardTitle>
          <CardDescription>Latest community updates</CardDescription>
        </div>
        <Icon name="heroicons:megaphone" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="displayedAnnouncements.length > 0" class="space-y-3">
        <a
          v-for="announcement in displayedAnnouncements"
          :key="announcement.id"
          :href="announcement.url ? `https://1033lenox.com/announcements/email/${announcement.url}` : undefined"
          target="_blank"
          class="flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50"
          :class="{ 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10': announcement.announcement_type === 'urgent' }"
        >
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            :class="getTypeColor(announcement.announcement_type)"
          >
            <Icon :name="getTypeIcon(announcement.announcement_type)" class="h-4 w-4" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="font-medium text-sm truncate">{{ announcement.title }}</h4>
              <span
                v-if="announcement.is_pinned"
                class="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded"
              >
                Pinned
              </span>
            </div>
            <p
              v-if="announcement.subtitle"
              class="text-xs text-muted-foreground line-clamp-2 mt-1"
            >
              {{ announcement.subtitle }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ formatDate(announcement.date_sent || announcement.publish_date || announcement.date_created) }}
            </p>
          </div>
          <Icon name="heroicons:arrow-right" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </a>
      </div>
      <div v-else class="py-8 text-center text-muted-foreground">
        <Icon name="heroicons:megaphone" class="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p class="text-sm">No announcements yet</p>
      </div>
      <div class="mt-4 flex justify-center">
        <nuxt-link
          to="/announcements/"
          class="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          View All Announcements
          <Icon name="heroicons:arrow-right" class="h-3 w-3" />
        </nuxt-link>
      </div>
    </CardContent>
  </Card>
</template>
