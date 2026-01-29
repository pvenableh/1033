<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import type { Task } from '~/types/directus'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
})

const route = useRoute()
const router = useRouter()
const { user } = useDirectusAuth()
const { isAdmin, isBoardMember } = useRoles()

const {
  updateTask,
  deleteTask,
  fetchRelatedTasks,
  priorityLabel,
  priorityColor,
  statusLabel,
  statusColor,
  categoryLabel,
  formatAssignee,
  isOverdue,
} = useTasks()

const collection = useDirectusItems<Task>('tasks')
const usersCollection = useDirectusItems('directus_users')

const task = ref<Task | null>(null)
const loading = ref(true)
const users = ref<any[]>([])
const editing = ref(false)
const relatedTasks = ref<Task[]>([])

// Edit form
const form = ref({
  title: '',
  description: '',
  priority: 'medium',
  category: 'other',
  due_date: '',
  assigned_to: '',
  notes: '',
  task_status: 'open',
})

// Load task
async function loadTask() {
  loading.value = true
  try {
    task.value = await collection.get(route.params.id as string, {
      fields: [
        'id', 'status', 'date_created', 'date_updated',
        'user_created.id', 'user_created.first_name', 'user_created.last_name',
        'title', 'description', 'task_status', 'priority',
        'assigned_to.id', 'assigned_to.first_name', 'assigned_to.last_name', 'assigned_to.email', 'assigned_to.avatar',
        'due_date', 'completed_at',
        'completed_by.id', 'completed_by.first_name', 'completed_by.last_name',
        'category', 'related_collection', 'related_id', 'notes', 'ai_generated',
      ],
    })

    if (task.value) {
      useHead({ title: task.value.title || 'Task Details' })
      populateForm()
      // Load related tasks from the same collection/item
      if (task.value.related_collection && task.value.related_id) {
        relatedTasks.value = await fetchRelatedTasks(
          task.value.related_collection,
          task.value.related_id
        )
      }
    }
  } catch (e) {
    console.error('Failed to load task:', e)
  } finally {
    loading.value = false
  }
}

function populateForm() {
  if (!task.value) return
  form.value = {
    title: task.value.title || '',
    description: task.value.description || '',
    priority: task.value.priority || 'medium',
    category: task.value.category || 'other',
    due_date: task.value.due_date?.split('T')[0] || '',
    assigned_to: typeof task.value.assigned_to === 'string'
      ? task.value.assigned_to
      : (task.value.assigned_to as any)?.id || '',
    notes: task.value.notes || '',
    task_status: task.value.task_status || 'open',
  }
}

async function handleSave() {
  if (!task.value) return
  await updateTask(task.value.id, {
    title: form.value.title,
    description: form.value.description || null,
    priority: form.value.priority as any,
    category: form.value.category as any,
    due_date: form.value.due_date || null,
    assigned_to: form.value.assigned_to || null,
    notes: form.value.notes || null,
    task_status: form.value.task_status as any,
  })
  editing.value = false
  await loadTask()
}

async function handleStatusChange(newStatus: string) {
  if (!task.value) return
  await updateTask(task.value.id, { task_status: newStatus as any })
  await loadTask()
}

async function handleDelete() {
  if (!task.value) return
  if (!confirm(`Delete task "${task.value.title}"?`)) return
  await deleteTask(task.value.id)
  router.push('/tasks')
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

onMounted(async () => {
  await Promise.all([
    loadTask(),
    usersCollection.list({
      fields: ['id', 'first_name', 'last_name', 'email'],
      filter: { status: { _eq: 'active' } },
      sort: ['first_name'],
      limit: -1,
    }).then((u: any) => { users.value = u }).catch(() => {}),
  ])
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Back -->
    <NuxtLink to="/tasks" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <Icon name="heroicons:arrow-left" class="h-4 w-4" />
      Back to Tasks
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Not Found -->
    <div v-else-if="!task" class="text-center py-16">
      <Icon name="heroicons:exclamation-circle" class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p class="text-muted-foreground">Task not found</p>
    </div>

    <!-- Task Detail -->
    <template v-else>
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-2">
            <span
              v-if="task.priority"
              class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium"
              :class="priorityColor[task.priority]"
            >
              {{ priorityLabel[task.priority] }}
            </span>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium"
              :class="statusColor[task.task_status || 'open']"
            >
              {{ statusLabel[task.task_status || 'open'] }}
            </span>
            <span v-if="task.ai_generated" class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Icon name="heroicons:sparkles" class="h-3 w-3" />
              AI Generated
            </span>
            <span v-if="isOverdue(task)" class="text-xs text-red-600 dark:text-red-400 font-semibold">
              OVERDUE
            </span>
          </div>
          <h1 class="text-xl font-bold">{{ task.title }}</h1>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            class="px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors"
            @click="editing = !editing; if (!editing) populateForm()"
          >
            {{ editing ? 'Cancel' : 'Edit' }}
          </button>
          <button
            class="px-3 py-1.5 text-sm rounded-lg bg-red-50 dark:bg-red-950 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
            @click="handleDelete"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Edit Mode -->
      <Card v-if="editing">
        <CardContent class="p-6">
          <form class="space-y-4" @submit.prevent="handleSave">
            <div>
              <label class="text-sm font-medium">Title</label>
              <input v-model="form.title" type="text" required class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background" />
            </div>
            <div>
              <label class="text-sm font-medium">Description</label>
              <textarea v-model="form.description" rows="4" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background resize-none" />
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label class="text-sm font-medium">Status</label>
                <select v-model="form.task_status" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium">Priority</label>
                <select v-model="form.priority" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium">Category</label>
                <select v-model="form.category" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background">
                  <option value="maintenance">Maintenance</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="inspection">Inspection</option>
                  <option value="communication">Communication</option>
                  <option value="financial">Financial</option>
                  <option value="administrative">Administrative</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">Due Date</label>
                <input v-model="form.due_date" type="date" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background" />
              </div>
              <div>
                <label class="text-sm font-medium">Assigned To</label>
                <select v-model="form.assigned_to" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background">
                  <option value="">Unassigned</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">{{ u.first_name }} {{ u.last_name }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium">Notes</label>
              <textarea v-model="form.notes" rows="3" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background resize-none" placeholder="Resolution notes, comments..." />
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-muted" @click="editing = false; populateForm()">Cancel</button>
              <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90">Save Changes</button>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- View Mode -->
      <template v-else>
        <!-- Quick Status Actions -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm text-muted-foreground mr-1">Change status:</span>
          <button
            v-for="s in ['open', 'in_progress', 'on_hold', 'completed', 'cancelled']"
            :key="s"
            class="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
            :class="task.task_status === s ? statusColor[s] + ' border-current' : 'hover:bg-muted'"
            @click="handleStatusChange(s)"
          >
            {{ statusLabel[s] }}
          </button>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Main Info -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-if="task.description">
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                <p class="text-sm whitespace-pre-line">{{ task.description }}</p>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                  <p class="text-sm">{{ categoryLabel[task.category || ''] || task.category || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Due Date</p>
                  <p class="text-sm" :class="{ 'text-red-600 font-medium': isOverdue(task) }">
                    {{ formatDate(task.due_date) }}
                  </p>
                </div>
              </div>
              <div v-if="task.notes">
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p class="text-sm whitespace-pre-line">{{ task.notes }}</p>
              </div>
              <div v-if="task.related_collection" class="pt-2 border-t">
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Related Item</p>
                <NuxtLink
                  :to="`/${task.related_collection}/${task.related_id}`"
                  class="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Icon name="heroicons:link" class="h-3.5 w-3.5" />
                  {{ task.related_collection }} #{{ task.related_id }}
                </NuxtLink>
              </div>
            </CardContent>
          </Card>

          <!-- Assignment & Timeline -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Assignment & Timeline</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div>
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Assigned To</p>
                <p class="text-sm font-medium">{{ formatAssignee(task.assigned_to) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created By</p>
                <p class="text-sm">{{ formatAssignee(task.user_created) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                <p class="text-sm">{{ formatDateTime(task.date_created) }}</p>
              </div>
              <div v-if="task.completed_at">
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
                <p class="text-sm">{{ formatDateTime(task.completed_at) }}</p>
              </div>
              <div v-if="task.completed_by">
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Completed By</p>
                <p class="text-sm">{{ formatAssignee(task.completed_by) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Updated</p>
                <p class="text-sm">{{ formatDateTime(task.date_updated) }}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Related Tasks (from same parent) -->
        <Card v-if="relatedTasks.length > 1">
          <CardHeader class="pb-3">
            <CardTitle class="text-base">Related Tasks</CardTitle>
            <CardDescription>Other tasks linked to the same item</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <NuxtLink
                v-for="rt in relatedTasks.filter((t: any) => t.id !== task?.id)"
                :key="rt.id"
                :to="`/tasks/${rt.id}`"
                class="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
              >
                <Icon
                  :name="rt.task_status === 'completed' ? 'heroicons:check-circle-solid' : 'heroicons:circle'"
                  class="h-4 w-4"
                  :class="rt.task_status === 'completed' ? 'text-green-500' : 'text-muted-foreground'"
                />
                <span class="text-sm flex-1" :class="{ 'line-through text-muted-foreground': rt.task_status === 'completed' }">
                  {{ rt.title }}
                </span>
                <span v-if="rt.priority" class="text-xs px-1.5 py-0.5 rounded" :class="priorityColor[rt.priority]">
                  {{ priorityLabel[rt.priority] }}
                </span>
              </NuxtLink>
            </div>
          </CardContent>
        </Card>
      </template>
    </template>
  </div>
</template>
