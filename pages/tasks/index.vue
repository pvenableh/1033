<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import type { Task } from '~/types/directus'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
})

useHead({ title: 'Tasks' })

const { user } = useDirectusAuth()
const { isAdmin, isBoardMember } = useRoles()

const {
  myTasks,
  allTasks,
  loading,
  fetchMyTasks,
  fetchAllTasks,
  createTask,
  updateTask,
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

// View mode: 'my' for assigned tasks, 'all' for admin view
const viewMode = ref<'my' | 'all'>('my')

// Filters
const filterStatus = ref<string>('active')
const filterPriority = ref<string>('')
const filterAssignee = ref<string>('')
const searchQuery = ref('')

// Task counts
const taskCounts = ref({ open: 0, in_progress: 0, on_hold: 0, completed: 0 })

// AI generation state
const aiLoading = ref(false)
const aiTasks = ref<any[]>([])
const aiFinancialSummary = ref<string | null>(null)
const showAiPanel = ref(false)
const includeFinancial = ref(true)

// Create/Edit dialog
const showCreateDialog = ref(false)
const editingTask = ref<Task | null>(null)
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium' as string,
  category: 'other' as string,
  due_date: '',
  assigned_to: '',
  related_collection: '',
  related_id: '',
})

// Users list for assignment
const usersCollection = useDirectusItems('directus_users')
const users = ref<any[]>([])

// Status filter options
const statusFilterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: '', label: 'All' },
]

// Computed task list
const displayTasks = computed(() => {
  const source = viewMode.value === 'my' ? myTasks.value : allTasks.value
  let filtered = [...source]

  // Text search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (t: any) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        formatAssignee(t.assigned_to).toLowerCase().includes(q)
    )
  }

  return filtered
})

// Overdue tasks count
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
  if (filterAssignee.value && viewMode.value === 'all') {
    filters.assigned_to = filterAssignee.value
  }

  if (viewMode.value === 'my') {
    await fetchMyTasks(filters)
  } else {
    await fetchAllTasks(filters)
  }

  taskCounts.value = await getMyTaskCounts()
}

// Load users for assignment dropdown
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

// Create new task
async function handleCreateTask() {
  if (!taskForm.value.title.trim()) return

  const data: Record<string, any> = {
    title: taskForm.value.title,
    description: taskForm.value.description || null,
    priority: taskForm.value.priority || 'medium',
    category: taskForm.value.category || 'other',
    due_date: taskForm.value.due_date || null,
    assigned_to: taskForm.value.assigned_to || user.value?.id,
  }

  if (taskForm.value.related_collection) {
    data.related_collection = taskForm.value.related_collection
    data.related_id = taskForm.value.related_id
  }

  if (editingTask.value) {
    await updateTask(editingTask.value.id, data)
  } else {
    await createTask(data)
  }

  showCreateDialog.value = false
  resetForm()
  await loadTasks()
}

// Update task status
async function handleStatusChange(task: Task, newStatus: string) {
  await updateTask(task.id, { task_status: newStatus as any })
  await loadTasks()
}

// Delete task
async function handleDelete(task: Task) {
  if (!confirm(`Delete task "${task.title}"?`)) return
  await deleteTask(task.id)
  await loadTasks()
}

// Edit task
function openEdit(task: Task) {
  editingTask.value = task
  taskForm.value = {
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    category: task.category || 'other',
    due_date: task.due_date?.split('T')[0] || '',
    assigned_to: typeof task.assigned_to === 'string' ? task.assigned_to : (task.assigned_to as any)?.id || '',
    related_collection: task.related_collection || '',
    related_id: task.related_id || '',
  }
  showCreateDialog.value = true
}

function resetForm() {
  editingTask.value = null
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
    due_date: '',
    assigned_to: '',
    related_collection: '',
    related_id: '',
  }
}

// AI Task Generation
async function generateAiTasks() {
  aiLoading.value = true
  aiTasks.value = []
  aiFinancialSummary.value = null
  showAiPanel.value = true

  try {
    const result = await $fetch('/api/ai/generate-tasks', {
      method: 'POST',
      body: {
        include_financial_summary: includeFinancial.value,
      },
    })

    aiTasks.value = (result as any).tasks || []
    aiFinancialSummary.value = (result as any).financial_summary || null
  } catch (e: any) {
    console.error('AI generation failed:', e)
    aiTasks.value = []
    aiFinancialSummary.value = null
  } finally {
    aiLoading.value = false
  }
}

// Save AI-generated task
async function saveAiTask(aiTask: any) {
  await createTask({
    title: aiTask.title,
    description: aiTask.description,
    priority: aiTask.priority,
    category: aiTask.category,
    due_date: aiTask.suggested_due_date || null,
    assigned_to: user.value?.id,
    related_collection: aiTask.related_collection || null,
    related_id: aiTask.related_id || null,
    ai_generated: true,
  })

  // Remove from AI list
  aiTasks.value = aiTasks.value.filter((t: any) => t !== aiTask)
  await loadTasks()
}

// Save all AI tasks
async function saveAllAiTasks() {
  for (const aiTask of aiTasks.value) {
    await createTask({
      title: aiTask.title,
      description: aiTask.description,
      priority: aiTask.priority,
      category: aiTask.category,
      due_date: aiTask.suggested_due_date || null,
      assigned_to: user.value?.id,
      related_collection: aiTask.related_collection || null,
      related_id: aiTask.related_id || null,
      ai_generated: true,
    })
  }
  aiTasks.value = []
  await loadTasks()
}

// Format date for display
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
  await Promise.all([loadTasks(), loadUsers()])
})

// Watch filters
watch([filterStatus, filterPriority, filterAssignee, viewMode], () => {
  loadTasks()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Tasks</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Manage and track your assigned tasks
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- AI Generate Button -->
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm font-medium"
          :disabled="aiLoading"
          @click="generateAiTasks"
        >
          <Icon v-if="aiLoading" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
          <Icon v-else name="heroicons:sparkles" class="h-4 w-4" />
          {{ aiLoading ? 'Generating...' : 'AI Generate Tasks' }}
        </button>

        <!-- Create Task Button -->
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
          @click="resetForm(); showCreateDialog = true"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          New Task
        </button>
      </div>
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

    <!-- AI Generated Tasks Panel -->
    <Card v-if="showAiPanel" class="border-purple-200 dark:border-purple-800">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Icon name="heroicons:sparkles" class="h-5 w-5 text-purple-600" />
            <CardTitle class="text-base">AI-Generated Tasks</CardTitle>
          </div>
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="showAiPanel = false"
          >
            <Icon name="heroicons:x-mark" class="h-5 w-5" />
          </button>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <label class="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              v-model="includeFinancial"
              type="checkbox"
              class="rounded border-gray-300"
            />
            Include financial summary
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Loading -->
        <div v-if="aiLoading" class="flex items-center justify-center py-8">
          <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-purple-600" />
          <span class="ml-2 text-sm text-muted-foreground">Analyzing your data and generating tasks...</span>
        </div>

        <!-- Financial Summary -->
        <div
          v-if="aiFinancialSummary"
          class="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
        >
          <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Icon name="heroicons:currency-dollar" class="h-4 w-4" />
            Financial Summary
          </h4>
          <p class="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-line">{{ aiFinancialSummary }}</p>
        </div>

        <!-- AI Task List -->
        <div v-if="aiTasks.length > 0" class="space-y-3">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-muted-foreground">{{ aiTasks.length }} suggested task{{ aiTasks.length !== 1 ? 's' : '' }}</p>
            <button
              class="text-sm text-purple-600 hover:text-purple-800 font-medium"
              @click="saveAllAiTasks"
            >
              Save All Tasks
            </button>
          </div>

          <div
            v-for="(aiTask, idx) in aiTasks"
            :key="idx"
            class="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-medium text-sm">{{ aiTask.title }}</p>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="priorityColor[aiTask.priority] || 'bg-gray-100'"
                >
                  {{ priorityLabel[aiTask.priority] || aiTask.priority }}
                </span>
                <span class="text-xs text-muted-foreground">{{ categoryLabel[aiTask.category] || aiTask.category }}</span>
              </div>
              <p v-if="aiTask.description" class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ aiTask.description }}</p>
              <p v-if="aiTask.suggested_due_date" class="text-xs text-muted-foreground mt-1">
                Suggested due: {{ formatDate(aiTask.suggested_due_date) }}
              </p>
            </div>
            <button
              class="shrink-0 px-3 py-1 text-xs font-medium rounded bg-purple-600 text-white hover:bg-purple-700"
              @click="saveAiTask(aiTask)"
            >
              Save
            </button>
          </div>
        </div>

        <div v-else-if="!aiLoading" class="text-center py-4 text-sm text-muted-foreground">
          No tasks generated. Click "AI Generate Tasks" to analyze your data.
        </div>
      </CardContent>
    </Card>

    <!-- Filters Bar -->
    <Card>
      <CardContent class="p-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <!-- View Toggle (admin/board) -->
          <div v-if="isAdmin || isBoardMember" class="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="viewMode === 'my' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              @click="viewMode = 'my'"
            >
              My Tasks
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="viewMode === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              @click="viewMode = 'all'"
            >
              All Tasks
            </button>
          </div>

          <!-- Status Filter -->
          <select
            v-model="filterStatus"
            class="text-sm border rounded-lg px-3 py-1.5 bg-background"
          >
            <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <!-- Priority Filter -->
          <select
            v-model="filterPriority"
            class="text-sm border rounded-lg px-3 py-1.5 bg-background"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <!-- Assignee Filter (admin view) -->
          <select
            v-if="viewMode === 'all'"
            v-model="filterAssignee"
            class="text-sm border rounded-lg px-3 py-1.5 bg-background"
          >
            <option value="">All Users</option>
            <option v-for="u in users" :key="u.id" :value="u.id">
              {{ u.first_name }} {{ u.last_name }}
            </option>
          </select>

          <!-- Search -->
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

    <!-- Task List -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="displayTasks.length === 0" class="text-center py-16">
      <Icon name="heroicons:clipboard-document-check" class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p class="text-muted-foreground">No tasks found</p>
      <p class="text-sm text-muted-foreground mt-1">Create a new task or use AI to generate suggestions</p>
    </div>

    <div v-else class="space-y-2">
      <Card
        v-for="task in displayTasks"
        :key="task.id"
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
                  :to="`/tasks/${task.id}`"
                  class="font-medium text-sm hover:text-primary transition-colors"
                  :class="{ 'line-through text-muted-foreground': task.task_status === 'completed' }"
                >
                  {{ task.title }}
                </NuxtLink>
                <span
                  v-if="task.ai_generated"
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                >
                  <Icon name="heroicons:sparkles" class="h-3 w-3" />
                  AI
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
                <span v-if="viewMode === 'all'" class="flex items-center gap-1">
                  <Icon name="heroicons:user" class="h-3 w-3" />
                  {{ formatAssignee(task.assigned_to) }}
                </span>
                <span v-if="task.related_collection" class="flex items-center gap-1">
                  <Icon name="heroicons:link" class="h-3 w-3" />
                  {{ task.related_collection }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <!-- Status dropdown -->
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
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="showCreateDialog = false" />

        <!-- Dialog -->
        <Card class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
          <CardHeader>
            <CardTitle>{{ editingTask ? 'Edit Task' : 'New Task' }}</CardTitle>
            <CardDescription>
              {{ editingTask ? 'Update task details' : 'Create a new task' }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="handleCreateTask">
              <!-- Title -->
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

              <!-- Description -->
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
                <!-- Priority -->
                <div>
                  <label class="text-sm font-medium">Priority</label>
                  <select v-model="taskForm.priority" class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <!-- Category -->
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
                <!-- Due Date -->
                <div>
                  <label class="text-sm font-medium">Due Date</label>
                  <input
                    v-model="taskForm.due_date"
                    type="date"
                    class="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>

                <!-- Assigned To -->
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

              <!-- Actions -->
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
