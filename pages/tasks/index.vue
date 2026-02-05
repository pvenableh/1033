<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'
import type { UnifiedTask } from '~/composables/useTasks'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

useHead({ title: 'My Tasks' })

const { user } = useDirectusAuth()

const {
  myTasks,
  loading,
  fetchMyTasks,
  createTask,
  updateTask,
  updateProjectTask,
  deleteTask,
  priorityLabel,
  priorityColor,
  statusLabel,
  statusColor,
  categoryLabel,
  formatAssignee,
  isOverdue,
  getMyTaskCounts,
} = useTasks()

// Filters
const filterStatus = ref<string>('active')
const filterPriority = ref<string>('')
const searchQuery = ref('')

// Task counts
const taskCounts = ref({ open: 0, in_progress: 0, on_hold: 0, completed: 0 })

// Create/Edit dialog
const showCreateDialog = ref(false)
const editingTask = ref<any | null>(null)
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium' as string,
  category: 'other' as string,
  due_date: '',
})

// Status filter options
const statusFilterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: '', label: 'All' },
]

// Filtered tasks
const displayTasks = computed(() => {
  let filtered = [...myTasks.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (t: any) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    )
  }

  return filtered
})

// Overdue count
const overdueCount = computed(() => displayTasks.value.filter((t: any) => isOverdue(t)).length)

// Load data
async function loadTasks() {
  const statusMap: Record<string, string | string[]> = {
    active: ['open', 'in_progress', 'on_hold'],
    open: 'open',
    in_progress: 'in_progress',
    on_hold: 'on_hold',
    completed: 'completed',
  }

  const filters: Record<string, any> = {}
  if (filterStatus.value && statusMap[filterStatus.value]) {
    filters.task_status = statusMap[filterStatus.value]
  }
  if (filterPriority.value) {
    filters.priority = filterPriority.value
  }

  await fetchMyTasks(filters)
  taskCounts.value = await getMyTaskCounts()
}

// Create task
function openCreateDialog() {
  editingTask.value = null
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
    due_date: '',
  }
  showCreateDialog.value = true
}

// Edit task
function openEdit(task: any) {
  editingTask.value = task
  taskForm.value = {
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    category: task.category || 'other',
    due_date: task.due_date?.split('T')[0] || '',
  }
  showCreateDialog.value = true
}

// Save task
async function handleCreateTask() {
  if (!taskForm.value.title.trim()) return

  const data: Record<string, any> = {
    title: taskForm.value.title,
    description: taskForm.value.description || null,
    priority: taskForm.value.priority || 'medium',
    category: taskForm.value.category || 'other',
    due_date: taskForm.value.due_date || null,
    assigned_to: user.value?.id,
  }

  if (editingTask.value) {
    await updateTask(editingTask.value.id, data)
  } else {
    await createTask(data)
  }

  showCreateDialog.value = false
  editingTask.value = null
  await loadTasks()
}

// Status change
async function handleStatusChange(task: UnifiedTask, newStatus: string) {
  if (task._source === 'project_tasks') {
    await updateProjectTask(task.id, newStatus === 'completed')
  } else {
    await updateTask(task.id, { task_status: newStatus as any })
  }
  await loadTasks()
}

// Delete task
async function handleDelete(task: UnifiedTask) {
  if (task._source === 'project_tasks') return
  if (!confirm(`Delete task "${task.title}"?`)) return
  await deleteTask(task.id)
  await loadTasks()
}

// Get link for a task
function getTaskLink(task: UnifiedTask): string {
  if (task._source === 'project_tasks' && task._project_event_id) {
    return `/projects?event=${task._project_event_id}`
  }
  return `/tasks/${task.id}`
}

// Format date
function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Initialize
onMounted(async () => {
  await loadTasks()
})

// Watch filters
watch([filterStatus, filterPriority], () => {
  loadTasks()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">My Tasks</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Tasks assigned to you and your project tasks
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
        @click="openCreateDialog"
      >
        <Icon name="heroicons:plus" class="h-4 w-4" />
        New Task
      </button>
    </div>

    <!-- Task Count Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="filterStatus = 'open'">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">Open</p>
              <p class="text-2xl font-bold mt-1">{{ taskCounts.open }}</p>
            </div>
            <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Icon name="heroicons:inbox" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="filterStatus = 'in_progress'">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">In Progress</p>
              <p class="text-2xl font-bold mt-1">{{ taskCounts.in_progress }}</p>
            </div>
            <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
              <Icon name="heroicons:play" class="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="filterStatus = 'on_hold'">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">On Hold</p>
              <p class="text-2xl font-bold mt-1">{{ taskCounts.on_hold }}</p>
            </div>
            <div class="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <Icon name="heroicons:pause" class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="filterStatus = 'completed'">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
              <p class="text-2xl font-bold mt-1">{{ taskCounts.completed }}</p>
            </div>
            <div class="p-2 rounded-lg bg-green-50 dark:bg-green-950">
              <Icon name="heroicons:check-circle" class="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Overdue Warning -->
    <div
      v-if="overdueCount > 0"
      class="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
    >
      <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-600 dark:text-red-400" />
      <p class="text-sm text-red-700 dark:text-red-300 font-medium">
        {{ overdueCount }} task{{ overdueCount > 1 ? 's are' : ' is' }} overdue
      </p>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <select v-model="filterStatus" class="text-sm border rounded-lg px-3 py-1.5 bg-background">
            <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <select v-model="filterPriority" class="text-sm border rounded-lg px-3 py-1.5 bg-background">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div class="relative flex-1 min-w-48">
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search tasks..."
              class="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg bg-background"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Empty -->
    <div v-else-if="displayTasks.length === 0" class="text-center py-16">
      <Icon name="heroicons:clipboard-document-check" class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p class="text-muted-foreground">No tasks found</p>
      <p class="text-sm text-muted-foreground mt-1">Create a new task to get started</p>
    </div>

    <!-- Task List -->
    <div v-else class="space-y-2">
      <Card
        v-for="task in displayTasks"
        :key="`${task._source}-${task.id}`"
        class="hover:shadow-md transition-shadow"
        :class="{ 'border-red-300 dark:border-red-700': isOverdue(task) }"
      >
        <CardContent class="p-4">
          <div class="flex items-start gap-3">
            <!-- Status checkbox -->
            <button
              class="mt-0.5 shrink-0"
              @click="handleStatusChange(task, task.task_status === 'completed' ? 'open' : 'completed')"
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
                  :to="getTaskLink(task)"
                  class="font-medium text-sm hover:text-primary transition-colors"
                  :class="{ 'line-through text-muted-foreground': task.task_status === 'completed' }"
                >
                  {{ task.title }}
                </NuxtLink>
                <span
                  v-if="task._source === 'project_tasks'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                >
                  <Icon name="heroicons:squares-2x2" class="h-3 w-3" />
                  Project
                </span>
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
                <span v-if="isOverdue(task)" class="text-xs text-red-600 dark:text-red-400 font-medium">
                  Overdue
                </span>
              </div>

              <p v-if="task._source === 'project_tasks' && (task._project_name || task._event_title)" class="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                {{ task._project_name }}<span v-if="task._event_title"> &mdash; {{ task._event_title }}</span>
              </p>

              <p v-if="task.description" class="text-xs text-muted-foreground mt-1 line-clamp-1">
                {{ task.description }}
              </p>

              <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                <span v-if="task.category" class="flex items-center gap-1">
                  <Icon name="heroicons:tag" class="h-3 w-3" />
                  {{ categoryLabel[task.category] || task.category }}
                </span>
                <span v-if="task.due_date" class="flex items-center gap-1" :class="{ 'text-red-600 dark:text-red-400': isOverdue(task) }">
                  <Icon name="heroicons:calendar" class="h-3 w-3" />
                  {{ formatDate(task.due_date) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <template v-if="task._source === 'project_tasks'">
                <button
                  class="px-2 py-1 text-xs font-medium rounded border transition-colors"
                  :class="task.task_status === 'completed'
                    ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                    : 'hover:bg-muted'"
                  @click="handleStatusChange(task, task.task_status === 'completed' ? 'open' : 'completed')"
                >
                  {{ task.task_status === 'completed' ? 'Done' : 'Mark Done' }}
                </button>
              </template>
              <template v-else>
                <select
                  :value="task.task_status"
                  class="text-xs border rounded px-1.5 py-1 bg-background"
                  @change="handleStatusChange(task, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  class="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Edit"
                  @click="openEdit(task)"
                >
                  <Icon name="heroicons:pencil-square" class="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  title="Delete"
                  @click="handleDelete(task)"
                >
                  <Icon name="heroicons:trash" class="h-4 w-4 text-red-500" />
                </button>
              </template>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create/Edit Dialog -->
    <Teleport to="body">
      <div
        v-if="showCreateDialog"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showCreateDialog = false" />
        <Card class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
          <CardContent class="p-6">
            <h3 class="text-lg font-semibold mb-4">{{ editingTask ? 'Edit Task' : 'New Task' }}</h3>
            <form class="space-y-4" @submit.prevent="handleCreateTask">
              <div>
                <label class="text-sm font-medium">Title *</label>
                <input
                  v-model="taskForm.title"
                  type="text"
                  required
                  class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label class="text-sm font-medium">Description</label>
                <textarea
                  v-model="taskForm.description"
                  rows="3"
                  class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background resize-none"
                  placeholder="Task description..."
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

              <div>
                <label class="text-sm font-medium">Due Date</label>
                <input
                  v-model="taskForm.due_date"
                  type="date"
                  class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  class="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
                  @click="showCreateDialog = false"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {{ editingTask ? 'Update' : 'Create' }} Task
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Teleport>
  </div>
</template>
