<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import type { Task } from '~/types/directus'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
})

useSeoMeta({
  title: 'Request Details - Admin',
})

const { params } = useRoute()
const { user } = useDirectusAuth()
const { isAdmin, isBoardMember } = useRoles()

const requestsCollection = useDirectusItems('requests')
const usersCollection = useDirectusItems('directus_users')

const {
  createTask,
  fetchRelatedTasks,
  updateTask: updateTaskFn,
  priorityLabel,
  priorityColor,
  statusLabel,
  statusColor,
  categoryLabel,
  formatAssignee,
  isOverdue,
} = useTasks()

const request = ref<any>(null)
const relatedTasks = ref<Task[]>([])
const users = ref<any[]>([])
const loading = ref(true)
const showTaskDialog = ref(false)

// Request status management
const requestStatusOptions = ['new', 'in progress', 'resolved', 'closed']

const statusBadge: Record<string, string> = {
  'new': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'in progress': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'resolved': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  'closed': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const priorityBadge: Record<string, string> = {
  'low': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  'medium': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'high': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'urgent': 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
}

// Task creation form
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium',
  category: 'follow_up',
  due_date: '',
  assigned_to: '',
})

async function loadRequest() {
  loading.value = true
  try {
    request.value = await requestsCollection.get(params.id, {
      fields: ['*'],
    })

    if (request.value) {
      await loadRelatedTasks()
    }
  } catch (e) {
    console.error('Failed to load request:', e)
  } finally {
    loading.value = false
  }
}

async function loadRelatedTasks() {
  if (!request.value) return
  relatedTasks.value = await fetchRelatedTasks('requests', String(request.value.id))
}

async function loadUsers() {
  try {
    users.value = await usersCollection.list({
      fields: ['id', 'first_name', 'last_name', 'email'],
      filter: { status: { _eq: 'active' } },
      sort: ['first_name'],
      limit: -1,
    })
  } catch {
    users.value = []
  }
}

// Update request status
async function updateRequestStatus(newStatus: string) {
  if (!request.value) return
  try {
    await requestsCollection.update(request.value.id, { status: newStatus })
    request.value.status = newStatus
  } catch (e) {
    console.error('Failed to update status:', e)
  }
}

// Update request priority
async function updateRequestPriority(newPriority: string) {
  if (!request.value) return
  try {
    await requestsCollection.update(request.value.id, { priority: newPriority })
    request.value.priority = newPriority
  } catch (e) {
    console.error('Failed to update priority:', e)
  }
}

// Create task from request
function openCreateTask() {
  taskForm.value = {
    title: `Follow up: ${request.value?.subject || 'Request'}`,
    description: request.value?.description ? `Request from ${request.value.name || 'Unknown'}:\n${request.value.description.replace(/<[^>]*>/g, '').substring(0, 300)}` : '',
    priority: request.value?.priority || 'medium',
    category: 'follow_up',
    due_date: '',
    assigned_to: '',
  }
  showTaskDialog.value = true
}

async function handleCreateTask() {
  if (!taskForm.value.title.trim() || !request.value) return

  await createTask({
    title: taskForm.value.title,
    description: taskForm.value.description || null,
    priority: taskForm.value.priority as any,
    category: taskForm.value.category as any,
    due_date: taskForm.value.due_date || null,
    assigned_to: taskForm.value.assigned_to || user.value?.id,
    related_collection: 'requests',
    related_id: String(request.value.id),
  })

  showTaskDialog.value = false

  // Auto-update request to "in progress" if it's new
  if (request.value.status === 'new') {
    await updateRequestStatus('in progress')
  }

  await loadRelatedTasks()
}

// Update linked task status
async function handleTaskStatusChange(task: Task, newStatus: string) {
  await updateTaskFn(task.id, { task_status: newStatus as any })
  await loadRelatedTasks()

  // If all tasks are completed, suggest resolving the request
  const allCompleted = relatedTasks.value.every((t: any) => t.task_status === 'completed' || t.task_status === 'cancelled')
  if (allCompleted && relatedTasks.value.length > 0 && request.value?.status !== 'resolved') {
    if (confirm('All tasks are completed. Mark this request as resolved?')) {
      await updateRequestStatus('resolved')
    }
  }
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
  await Promise.all([loadRequest(), loadUsers()])
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Back -->
    <NuxtLink to="/admin/requests" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <Icon name="heroicons:arrow-left" class="h-4 w-4" />
      Back to Requests
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Not Found -->
    <div v-else-if="!request" class="text-center py-16">
      <Icon name="heroicons:exclamation-circle" class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p class="text-muted-foreground">Request not found</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-2">
            <span
              v-if="request.status"
              class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium capitalize"
              :class="statusBadge[request.status] || 'bg-gray-100'"
            >
              {{ request.status }}
            </span>
            <span
              v-if="request.priority"
              class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium capitalize"
              :class="priorityBadge[request.priority] || 'bg-gray-100'"
            >
              {{ request.priority }}
            </span>
            <span v-if="request.category" class="text-xs text-muted-foreground">
              {{ request.category }}
            </span>
          </div>
          <h1 class="text-xl font-bold">{{ request.subject || 'Untitled Request' }}</h1>
        </div>

        <!-- Admin Actions -->
        <div v-if="isBoardMember || isAdmin" class="flex items-center gap-2 shrink-0">
          <button
            class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            @click="openCreateTask"
          >
            <Icon name="heroicons:plus" class="h-4 w-4" />
            Create Task
          </button>
        </div>
      </div>

      <!-- Admin Workflow Bar -->
      <Card v-if="isBoardMember || isAdmin">
        <CardContent class="p-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <!-- Status Change -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">Status:</span>
              <div class="flex items-center gap-1">
                <button
                  v-for="s in requestStatusOptions"
                  :key="s"
                  class="px-3 py-1 text-xs font-medium rounded-full border transition-colors capitalize"
                  :class="request.status === s ? (statusBadge[s] || '') + ' border-current' : 'hover:bg-muted'"
                  @click="updateRequestStatus(s)"
                >
                  {{ s }}
                </button>
              </div>
            </div>

            <!-- Priority Change -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">Priority:</span>
              <select
                :value="request.priority || ''"
                class="text-xs border rounded-lg px-2 py-1 bg-background"
                @change="updateRequestPriority(($event.target as HTMLSelectElement).value)"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Request Details -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Main Content -->
        <Card class="md:col-span-2">
          <CardHeader class="pb-3">
            <CardTitle class="text-base">Request Details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="request.description" class="prose prose-sm max-w-none dark:prose-invert" v-html="request.description" />
            <p v-else class="text-sm text-muted-foreground italic">No description provided</p>
          </CardContent>
        </Card>

        <!-- Sidebar Info -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base">Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-if="request.name">
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Submitted By</p>
              <p class="text-sm font-medium">{{ request.name }}</p>
            </div>
            <div v-if="request.email">
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
              <a :href="`mailto:${request.email}`" class="text-sm text-primary hover:underline flex items-center gap-1">
                <Icon name="heroicons:envelope" class="h-3.5 w-3.5" />
                {{ request.email }}
              </a>
            </div>
            <div v-if="request.unit">
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unit</p>
              <p class="text-sm">{{ request.unit }}</p>
            </div>
            <div v-if="request.category">
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
              <p class="text-sm">{{ request.category }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Submitted</p>
              <p class="text-sm">{{ formatDateTime(request.date_created) }}</p>
            </div>
            <div v-if="request.date_updated">
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Updated</p>
              <p class="text-sm">{{ formatDateTime(request.date_updated) }}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Linked Tasks Section -->
      <Card>
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-base">Tasks</CardTitle>
              <CardDescription>Tasks created to follow up on this request</CardDescription>
            </div>
            <button
              v-if="isBoardMember || isAdmin"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              @click="openCreateTask"
            >
              <Icon name="heroicons:plus" class="h-3.5 w-3.5" />
              Add Task
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="relatedTasks.length === 0" class="text-center py-6 text-sm text-muted-foreground">
            <Icon name="heroicons:clipboard-document-list" class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tasks created yet</p>
            <p v-if="isBoardMember || isAdmin" class="mt-1">Click "Add Task" to create a follow-up task</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="task in relatedTasks"
              :key="task.id"
              class="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <!-- Status toggle -->
              <button
                class="mt-0.5 shrink-0"
                @click="handleTaskStatusChange(task, task.task_status === 'completed' ? 'open' : 'completed')"
              >
                <Icon
                  :name="task.task_status === 'completed' ? 'heroicons:check-circle-solid' : 'heroicons:circle'"
                  class="h-5 w-5"
                  :class="task.task_status === 'completed' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'"
                />
              </button>

              <!-- Task content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <NuxtLink
                    :to="`/tasks/${task.id}`"
                    class="font-medium text-sm hover:text-primary transition-colors"
                    :class="{ 'line-through text-muted-foreground': task.task_status === 'completed' }"
                  >
                    {{ task.title }}
                  </NuxtLink>
                  <span
                    v-if="task.priority"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="priorityColor[task.priority]"
                  >
                    {{ priorityLabel[task.priority] }}
                  </span>
                  <span
                    v-if="task.task_status && task.task_status !== 'open' && task.task_status !== 'completed'"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="statusColor[task.task_status]"
                  >
                    {{ statusLabel[task.task_status] }}
                  </span>
                  <span v-if="isOverdue(task)" class="text-xs text-red-600 font-medium">Overdue</span>
                </div>

                <div class="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:user" class="h-3 w-3" />
                    {{ formatAssignee(task.assigned_to) }}
                  </span>
                  <span v-if="task.due_date" class="flex items-center gap-1" :class="{ 'text-red-600': isOverdue(task) }">
                    <Icon name="heroicons:calendar" class="h-3 w-3" />
                    {{ formatDate(task.due_date) }}
                  </span>
                </div>
              </div>

              <!-- Task status dropdown -->
              <select
                v-if="isBoardMember || isAdmin"
                :value="task.task_status"
                class="text-xs border rounded px-1.5 py-1 bg-background shrink-0"
                @change="handleTaskStatusChange(task, ($event.target as HTMLSelectElement).value)"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Create Task Dialog -->
    <Teleport to="body">
      <div
        v-if="showTaskDialog"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showTaskDialog = false" />

        <Card class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
          <CardHeader>
            <CardTitle>Create Task from Request</CardTitle>
            <CardDescription>Create a follow-up task linked to this request</CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="handleCreateTask">
              <div>
                <label class="text-sm font-medium">Title *</label>
                <input
                  v-model="taskForm.title"
                  type="text"
                  required
                  class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background"
                />
              </div>
              <div>
                <label class="text-sm font-medium">Description</label>
                <textarea
                  v-model="taskForm.description"
                  rows="3"
                  class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background resize-none"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium">Priority</label>
                  <select v-model="taskForm.priority" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm font-medium">Category</label>
                  <select v-model="taskForm.category" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background">
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
                  <input v-model="taskForm.due_date" type="date" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background" />
                </div>
                <div>
                  <label class="text-sm font-medium">Assign To</label>
                  <select v-model="taskForm.assigned_to" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background">
                    <option value="">Myself</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">
                      {{ u.first_name }} {{ u.last_name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-muted" @click="showTaskDialog = false">
                  Cancel
                </button>
                <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90">
                  Create Task
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Teleport>
  </div>
</template>

<style>
.prose img {
  max-width: 100%;
}
</style>
