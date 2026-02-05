<script setup lang="ts">
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
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold t-text">My Tasks</h1>
        <p class="text-sm t-text-secondary mt-1">
          Track and manage your assigned tasks
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        @click="openCreateDialog"
      >
        <UIcon name="i-heroicons-plus" class="w-5 h-5" />
        New Task
      </button>
    </div>

    <!-- Inline status counts + filters -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <button
          v-for="opt in statusFilterOptions"
          :key="opt.value"
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors border"
          :class="filterStatus === opt.value
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card t-text-secondary border-border hover:border-primary/50'"
          @click="filterStatus = opt.value"
        >
          {{ opt.label }}
          <span v-if="opt.value === 'open'" class="ml-1 opacity-70">{{ taskCounts.open }}</span>
          <span v-else-if="opt.value === 'in_progress'" class="ml-1 opacity-70">{{ taskCounts.in_progress }}</span>
          <span v-else-if="opt.value === 'on_hold'" class="ml-1 opacity-70">{{ taskCounts.on_hold }}</span>
          <span v-else-if="opt.value === 'completed'" class="ml-1 opacity-70">{{ taskCounts.completed }}</span>
        </button>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 t-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tasks..."
            class="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm t-text placeholder:t-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 t-text-muted hover:t-text"
            @click="searchQuery = ''"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
        <select
          v-model="filterPriority"
          class="px-3 py-2.5 text-sm bg-card border border-border rounded-lg t-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>

    <!-- Overdue Warning -->
    <div
      v-if="overdueCount > 0"
      class="flex items-center gap-3 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
    >
      <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
      <p class="text-sm text-red-700 dark:text-red-300 font-medium">
        {{ overdueCount }} task{{ overdueCount > 1 ? 's are' : ' is' }} overdue
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-card rounded-lg p-6 animate-pulse">
        <div class="h-5 bg-muted rounded w-1/3 mb-3"></div>
        <div class="h-4 bg-muted rounded w-2/3 mb-2"></div>
        <div class="h-4 bg-muted rounded w-1/4"></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="displayTasks.length === 0" class="bg-card rounded-lg p-12 text-center">
      <UIcon name="i-heroicons-clipboard-document-check" class="w-16 h-16 mx-auto mb-4 t-text-muted" />
      <h2 class="text-xl font-semibold t-text mb-2">No tasks found</h2>
      <p class="t-text-secondary mb-6">Create a new task to get started</p>
      <button
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        @click="openCreateDialog"
      >
        <UIcon name="i-heroicons-plus" class="w-5 h-5" />
        Create Your First Task
      </button>
    </div>

    <!-- Task List -->
    <div v-else class="space-y-3">
      <div
        v-for="task in displayTasks"
        :key="`${task._source}-${task.id}`"
        class="bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow"
        :class="{ 'border-red-300 dark:border-red-700': isOverdue(task) }"
      >
        <div class="flex items-start gap-3">
          <!-- Status checkbox -->
          <button
            class="mt-0.5 shrink-0"
            @click="handleStatusChange(task, task.task_status === 'completed' ? 'open' : 'completed')"
          >
            <UIcon
              :name="task.task_status === 'completed' ? 'i-heroicons-check-circle-solid' : 'i-heroicons-circle'"
              class="w-5 h-5"
              :class="task.task_status === 'completed' ? 'text-green-500' : 't-text-muted hover:text-primary'"
            />
          </button>

          <!-- Task content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <NuxtLink
                :to="getTaskLink(task)"
                class="font-semibold text-sm t-text hover:text-primary transition-colors"
                :class="{ 'line-through t-text-muted': task.task_status === 'completed' }"
              >
                {{ task.title }}
              </NuxtLink>
              <span
                v-if="task._source === 'project_tasks'"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
              >
                Project
              </span>
              <span
                v-if="task.priority"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="priorityColor[task.priority]"
              >
                {{ priorityLabel[task.priority] }}
              </span>
              <span
                v-if="task.task_status && task.task_status !== 'open' && task.task_status !== 'completed'"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
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

            <p v-if="task.description" class="text-sm t-text-secondary mt-1 line-clamp-2">
              {{ task.description }}
            </p>

            <div class="flex items-center gap-4 mt-2 text-xs t-text-muted flex-wrap">
              <span v-if="task.category" class="flex items-center gap-1">
                <UIcon name="i-heroicons-tag" class="w-4 h-4" />
                {{ categoryLabel[task.category] || task.category }}
              </span>
              <span v-if="task.due_date" class="flex items-center gap-1" :class="{ 'text-red-600 dark:text-red-400': isOverdue(task) }">
                <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
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
                  : 'border-border hover:bg-muted'"
                @click="handleStatusChange(task, task.task_status === 'completed' ? 'open' : 'completed')"
              >
                {{ task.task_status === 'completed' ? 'Done' : 'Mark Done' }}
              </button>
            </template>
            <template v-else>
              <select
                :value="task.task_status"
                class="text-xs border border-border rounded px-1.5 py-1 bg-card t-text"
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
                <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 t-text-muted" />
              </button>
              <button
                class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                title="Delete"
                @click="handleDelete(task)"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4 text-red-500" />
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Teleport to="body">
      <div
        v-if="showCreateDialog"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showCreateDialog = false" />
        <div class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold t-text mb-4">{{ editingTask ? 'Edit Task' : 'New Task' }}</h3>
          <form class="space-y-4" @submit.prevent="handleCreateTask">
            <div>
              <label class="text-sm font-medium t-text">Title *</label>
              <input
                v-model="taskForm.title"
                type="text"
                required
                class="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background t-text placeholder:t-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Task title"
              />
            </div>

            <div>
              <label class="text-sm font-medium t-text">Description</label>
              <textarea
                v-model="taskForm.description"
                rows="3"
                class="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background t-text placeholder:t-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Task description..."
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium t-text">Priority</label>
                <select v-model="taskForm.priority" class="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background t-text">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium t-text">Category</label>
                <select v-model="taskForm.category" class="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background t-text">
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
              <label class="text-sm font-medium t-text">Due Date</label>
              <input
                v-model="taskForm.due_date"
                type="date"
                class="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background t-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                class="px-4 py-2 text-sm rounded-lg border border-border t-text hover:bg-muted transition-colors"
                @click="showCreateDialog = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {{ editingTask ? 'Update' : 'Create' }} Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
