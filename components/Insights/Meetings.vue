<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

const { user } = useDirectusAuth()
const meetingsCollection = useDirectusItems('meetings', { requireAuth: false })

const meetings = await meetingsCollection.list({
  fields: [
    'id,status,title,category,description,date,time,files.directus_files_id.id,files.directus_files_id.tags,files.directus_files_id.description,files.directus_files_id.title,url,presentations.*,people.people_id.unit.units_id.number,people.people_id.board_member.status,people.people_id.first_name,people.people_id.last_name,people.people_id.email,people.people_id.board_member.title,people.people_id.board_member.start,people.people_id.board_member.finish,people.people_id.board_member.person',
  ],
  sort: '-date',
})

const pastMeetings = computed(() => {
  if (meetings) {
    return meetings.filter((meeting) => {
      return new Date(meeting.date) < new Date()
    })
  } else {
    return []
  }
})

const futureMeetings = computed(() => {
  if (meetings) {
    return meetings.filter((meeting) => {
      return new Date(meeting.date) >= new Date()
    })
  } else {
    return []
  }
})

const attendance = computed(() => {
  let count = 0

  meetings.forEach((meeting) => {
    meeting.people.forEach((person) => {
      if (person.people_id.email === user.value?.email) {
        count++
      }
    })
  })

  return count
})

function formatDate(date: string) {
  if (date) {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    const [year, month, day] = date.split('-')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('en-US', options)
  }
}

function formatTime(time: string) {
  if (time) {
    const [hour, minute] = time.split(':')
    const newTime = new Date()
    newTime.setHours(parseInt(hour))
    newTime.setMinutes(parseInt(minute))
    return newTime.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: 'numeric',
    })
  }
}

function minutes(files: any[]) {
  if (files.length) {
    return files
      .filter((file) => {
        if (file.directus_files_id.tags?.length) {
          return file.directus_files_id.tags.includes('Minutes')
        } else {
          return false
        }
      })
      .map((file) => {
        return file.directus_files_id.id
      })
      .join(', ')
  } else {
    return false
  }
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base inline-flex items-center gap-2">
            Board Meetings
            <Badge variant="secondary" class="text-xs">
              {{ pastMeetings.length }}
            </Badge>
          </CardTitle>
          <CardDescription>Upcoming and past meetings</CardDescription>
        </div>
        <Icon name="heroicons:calendar" class="h-5 w-5 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Next Meeting Banner -->
      <div
        v-if="futureMeetings.length > 0"
        class="p-4 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 text-white"
      >
        <p class="text-xs uppercase tracking-wide opacity-80 mb-1">Next Meeting</p>
        <p class="font-bold">
          {{ formatDate(futureMeetings[0].date) }}
          <span v-if="futureMeetings[0].time"> @ {{ formatTime(futureMeetings[0].time) }}</span>
        </p>
        <p class="text-sm opacity-80 mt-1">
          Location: {{ futureMeetings[0].location || 'Community Room' }}
        </p>
      </div>

      <!-- Attendance Stats -->
      <div v-if="user" class="text-sm text-muted-foreground">
        You have attended <span class="font-bold text-foreground">{{ attendance }}</span> out of
        <span class="font-bold text-foreground">{{ pastMeetings.length }}</span> meetings.
      </div>

      <!-- Recent Meetings -->
      <div v-if="pastMeetings.length > 0">
        <p class="text-xs text-muted-foreground uppercase tracking-wide mb-3">Recent Meetings</p>
        <div class="space-y-3">
          <div
            v-for="(item, index) in pastMeetings.slice(0, 5)"
            :key="index"
            class="flex items-start justify-between gap-2 p-3 rounded-lg border"
          >
            <div>
              <p class="font-medium text-sm">
                {{ formatDate(item.date) }}
                <span v-if="item.time" class="text-muted-foreground">@ {{ formatTime(item.time) }}</span>
              </p>
              <MeetingsPeopleCalculator v-if="item.people?.length" :people="item.people" :date="item.date" class="mt-1" />
            </div>
            <a
              v-if="minutes(item.files)"
              :href="'https://admin.1033lenox.com/assets/' + minutes(item.files)"
              target="_blank"
              class="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
            >
              Minutes
            </a>
          </div>
        </div>
      </div>

      <div class="flex justify-center pt-2">
        <nuxt-link
          to="/meetings/"
          class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View All Meetings
          <Icon name="heroicons:arrow-right" class="h-3 w-3" />
        </nuxt-link>
      </div>
    </CardContent>
  </Card>
</template>
