<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import type { UnifiedTask } from '~/composables/useTasks'

const {
  myTasks,
  loading,
  fetchMyTasks,
  priorityColor,
  priorityLabel,
  statusLabel,
  statusColor,
  isOverdue,
  formatAssignee,
} = useTasks()

const topTasks = computed(() => {
  // Show up to 5 non-completed, non-cancelled tasks
  return myTasks.value
    .filter((t: UnifiedTask) => t.task_status !== 'completed' && t.task_status !== 'cancelled')
    .slice(0, 5)
})

const overdueCount = computed(() => {
  return topTasks.value.filter((t: UnifiedTask) => isOverdue(t)).length
})

onMounted(() => {
  fetchMyTasks({
    task_status: ['open', 'in_progress', 'on_hold'],
  })
})

function formatDueDate(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base">My Tasks</CardTitle>
          <CardDescription>
            <template v-if="overdueCount > 0">
              {{ overdueCount }} overdue
            </template>
            <template v-else>
              Your upcoming tasks
            </template>
          </CardDescription>
        </div>
        <nuxt-link to="/tasks" class="text-xs text-primary hover:underline">
          View all
        </nuxt-link>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="flex items-center justify-center py-8">
        <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="topTasks.length === 0" class="text-center py-8">
        <Icon name="heroicons:check-circle" class="h-8 w-8 text-green-500 mx-auto mb-2" />
        <p class="text-sm text-muted-foreground">All caught up!</p>
      </div>
      <div v-else class="space-y-2">
        <nuxt-link
          v-for="task in topTasks"
          :key="task.id"
          :to="`/tasks/${task.id}`"
          class="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors"
        >
          <!-- Priority indicator -->
          <div class="flex-shrink-0 mt-0.5">
            <span
              v-if="task.priority"
              class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
              :class="priorityColor[task.priority] || ''"
            >
              {{ priorityLabel[task.priority] || task.priority }}
            </span>
          </div>

          <!-- Task info -->
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium truncate">{{ task.title }}</p>
            <div class="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded"
                :class="statusColor[task.task_status] || ''"
              >
                {{ statusLabel[task.task_status] || task.task_status }}
              </span>
              <span v-if="task.due_date" :class="isOverdue(task) ? 'text-red-600 dark:text-red-400 font-medium' : ''">
                {{ formatDueDate(task.due_date) }}
              </span>
              <span v-if="task._source === 'project_tasks' && task._project_name" class="truncate">
                &middot; {{ task._project_name }}
              </span>
            </div>
          </div>

          <!-- Arrow -->
          <Icon name="heroicons:chevron-right" class="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
        </nuxt-link>
      </div>
    </CardContent>
  </Card>
</template>
