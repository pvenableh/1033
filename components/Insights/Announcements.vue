<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

const announcementsCollection = useDirectusItems('announcements', { requireAuth: false })

const announcements = await announcementsCollection.list({
  fields: ['*'],
  filter: {
    status: {
      _eq: 'sent',
    },
  },
  sort: '-date_sent',
  limit: 7,
})

const filteredAnnouncements = computed(() => {
  let possibleStrings = ['Minutes', 'Agenda', 'Board Meeting']

  return announcements
    .map((item) => {
      if (item.tags) {
        if (!possibleStrings.some((possibleString) => item.tags.includes(possibleString))) {
          return item
        }
        return null
      } else {
        return item
      }
    })
    .filter(Boolean)
})

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
          <CardTitle class="text-base inline-flex items-center gap-2">
            Announcements
            <Badge variant="secondary" class="text-xs">
              {{ announcements.length }}
            </Badge>
          </CardTitle>
          <CardDescription>Latest community updates</CardDescription>
        </div>
        <Icon name="heroicons:megaphone" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="filteredAnnouncements.length > 0" class="space-y-3">
        <a
          v-for="(item, index) in filteredAnnouncements"
          :key="index"
          :href="'https://1033lenox.com/announcements/email/' + item.url"
          target="_blank"
          class="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-sm truncate">
                {{ item.title }}
              </h3>
              <p v-if="item.subtitle" class="text-xs text-muted-foreground mt-1 line-clamp-1">
                {{ item.subtitle }}
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ formatDate(item.date_sent) }}
              </p>
            </div>
            <Icon name="heroicons:arrow-right" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </a>
      </div>
      <div v-else class="py-8 text-center text-muted-foreground">
        <Icon name="heroicons:megaphone" class="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p class="text-sm">No announcements yet</p>
      </div>
      <div class="mt-4 flex justify-center">
        <nuxt-link
          to="/announcements/"
          class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View All Announcements
          <Icon name="heroicons:arrow-right" class="h-3 w-3" />
        </nuxt-link>
      </div>
    </CardContent>
  </Card>
</template>
