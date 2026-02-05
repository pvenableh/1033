<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'
import type { UnifiedTask } from '~/composables/useTasks'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
})

useSeoMeta({
  title: 'Tasks - Admin',
})

const { user } = useDirectusAuth()
const { isAdmin, isBoardMember } = useRoles()
const toast = useToast()

const {
  allTasks,
  loading,
  fetchAllTasks,
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
} = useTasks()

// Permission check
const hasAccess = computed(() => isAdmin.value || isBoardMember.value)

// Filters
const filterStatus = ref<string>('active')
const filterPriority = ref<string>('')
const filterAssignee = ref<string>('')
const filterSource = ref<string>('')
const searchQuery = ref('')

// Status filter options
const statusFilterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: '', label: 'All' },
]

// Create/Edit dialog
const showCreateDialog = ref(false)
const editingTask = ref<any | null>(null)
const showDeleteModal = ref(false)
const selectedTask = ref<UnifiedTask | null>(null)
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium' as string,
  category: 'other' as string,
  due_date: '',
  assigned_to: '',
})

// Users list for assignment
const usersCollection = useDirectusItems('directus_users')
const users = ref<any[]>([])

// AI generation state
const aiLoading = ref(false)
const aiTasks = ref<any[]>([])
const aiFinancialSummary = ref<string | null>(null)
const showAiPanel = ref(false)
const includeFinancial = ref(true)

// Stats
const taskStats = computed(() => ({
  total: allTasks.value.length,
  open: allTasks.value.filter((t: any) => t.task_status === 'open').length,
  in_progress: allTasks.value.filter((t: any) => t.task_status === 'in_progress').length,
  completed: allTasks.value.filter((t: any) => t.task_status === 'completed').length,
}))

// Overdue count
const overdueCount = computed(() => filteredTasks.value.filter((t: any) => isOverdue(t)).length)

// Filtered tasks
const filteredTasks = computed(() => {
  let result = [...allTasks.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (t: any) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        formatAssignee(t.assigned_to).toLowerCase().includes(q)
    )
  }

  return result
})

// Load tasks
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
  if (filterAssignee.value) {
    filters.assigned_to = filterAssignee.value
  }
  if (filterSource.value) {
    filters.source = filterSource.value
  }

  await fetchAllTasks(filters)
}

// Load users for assignment
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

// Create task
function openCreateDialog() {
  editingTask.value = null
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
    due_date: '',
    assigned_to: '',
  }
  showCreateDialog.value = true
}

// Edit task
function openEditDialog(task: any) {
  editingTask.value = task
  taskForm.value = {
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    category: task.category || 'other',
    due_date: task.due_date?.split('T')[0] || '',
    assigned_to: typeof task.assigned_to === 'string' ? task.assigned_to : (task.assigned_to as any)?.id || '',
  }
  showCreateDialog.value = true
}

// Save task (create or update)
async function handleSaveTask() {
  if (!taskForm.value.title.trim()) {
    toast.add({ title: 'Error', description: 'Task title is required', color: 'red' })
    return
  }

  try {
    const data: Record<string, any> = {
      title: taskForm.value.title,
      description: taskForm.value.description || null,
      priority: taskForm.value.priority || 'medium',
      category: taskForm.value.category || 'other',
      due_date: taskForm.value.due_date || null,
      assigned_to: taskForm.value.assigned_to || user.value?.id,
    }

    if (editingTask.value) {
      await updateTask(editingTask.value.id, data)
      toast.add({ title: 'Task Updated', description: `${data.title} has been updated`, color: 'green' })
    } else {
      await createTask(data)
      toast.add({ title: 'Task Created', description: `${data.title} has been created`, color: 'green' })
    }

    showCreateDialog.value = false
    await loadTasks()
  } catch (error: any) {
    toast.add({ title: 'Error', description: error?.message || 'Failed to save task', color: 'red' })
  }
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
function confirmDelete(task: UnifiedTask) {
  if (task._source === 'project_tasks') return
  selectedTask.value = task
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedTask.value) return
  try {
    await deleteTask(selectedTask.value.id)
    toast.add({ title: 'Task Deleted', description: `${selectedTask.value.title} has been deleted`, color: 'green' })
    showDeleteModal.value = false
    await loadTasks()
  } catch (error: any) {
    toast.add({ title: 'Error', description: error?.message || 'Failed to delete task', color: 'red' })
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
      body: { include_financial_summary: includeFinancial.value },
    })
    aiTasks.value = (result as any).tasks || []
    aiFinancialSummary.value = (result as any).financial_summary || null
  } catch (e: any) {
    console.error('AI generation failed:', e)
  } finally {
    aiLoading.value = false
  }
}

async function saveAiTask(aiTask: any) {
  await createTask({
    title: aiTask.title,
    description: aiTask.description,
    priority: aiTask.priority,
    category: aiTask.category,
    due_date: aiTask.suggested_due_date || null,
    assigned_to: user.value?.id,
    ai_generated: true,
  })
  aiTasks.value = aiTasks.value.filter((t: any) => t !== aiTask)
  await loadTasks()
}

async function saveAllAiTasks() {
  for (const aiTask of aiTasks.value) {
    await createTask({
      title: aiTask.title,
      description: aiTask.description,
      priority: aiTask.priority,
      category: aiTask.category,
      due_date: aiTask.suggested_due_date || null,
      assigned_to: user.value?.id,
      ai_generated: true,
    })
  }
  aiTasks.value = []
  await loadTasks()
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
  await Promise.all([loadTasks(), loadUsers()])
})

// Watch filters
watch([filterStatus, filterPriority, filterAssignee, filterSource], () => {
  loadTasks()
})
</script>

<template>
  <div class="admin-page t-bg min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">Tasks</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all tasks across the community
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center gap-3">
          <Button
            v-if="hasAccess"
            color="purple"
            variant="soft"
            icon="i-heroicons-sparkles"
            :loading="aiLoading"
            @click="generateAiTasks"
          >
            AI Generate
          </Button>
          <Button
            v-if="hasAccess"
            color="primary"
            icon="i-heroicons-plus"
            @click="openCreateDialog"
          >
            New Task
          </Button>
        </div>
      </div>

      <!-- Access Denied -->
      <div v-if="!hasAccess" class="text-center py-12">
        <Icon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You need board member or administrator privileges to manage tasks.
        </p>
      </div>

      <!-- Tasks Management -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="filterStatus = ''">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ taskStats.total }}</div>
              <div class="text-sm text-gray-500">Total Tasks</div>
            </div>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="filterStatus = 'open'">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-blue-600">{{ taskStats.open }}</div>
              <div class="text-sm text-gray-500">Open</div>
            </div>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="filterStatus = 'in_progress'">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-purple-600">{{ taskStats.in_progress }}</div>
              <div class="text-sm text-gray-500">In Progress</div>
            </div>
          </Card>
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="filterStatus = 'completed'">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-green-600">{{ taskStats.completed }}</div>
              <div class="text-sm text-gray-500">Completed</div>
            </div>
          </Card>
        </div>

        <!-- Overdue Warning -->
        <div
          v-if="overdueCount > 0"
          class="flex items-center gap-3 p-3 mb-6 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
        >
          <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
          <p class="text-sm text-red-700 dark:text-red-300 font-medium">
            {{ overdueCount }} task{{ overdueCount > 1 ? 's are' : ' is' }} overdue
          </p>
        </div>

        <!-- AI Generated Tasks Panel -->
        <Card v-if="showAiPanel" class="border-purple-200 dark:border-purple-800 mb-6">
          <CardContent class="p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <Icon name="i-heroicons-sparkles" class="w-5 h-5 text-purple-600" />
                <span class="font-semibold">AI-Generated Tasks</span>
              </div>
              <Button size="xs" color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showAiPanel = false" />
            </div>

            <div class="flex items-center gap-2 mb-3">
              <label class="flex items-center gap-2 text-sm text-gray-500">
                <input v-model="includeFinancial" type="checkbox" class="rounded border-gray-300" />
                Include financial summary
              </label>
            </div>

            <div v-if="aiLoading" class="flex items-center justify-center py-8">
              <Icon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-purple-600" />
              <span class="ml-2 text-sm text-gray-500">Analyzing your data and generating tasks...</span>
            </div>

            <div
              v-if="aiFinancialSummary"
              class="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
            >
              <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Icon name="i-heroicons-currency-dollar" class="w-4 h-4" />
                Financial Summary
              </h4>
              <p class="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-line">{{ aiFinancialSummary }}</p>
            </div>

            <div v-if="aiTasks.length > 0" class="space-y-3">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm text-gray-500">{{ aiTasks.length }} suggested task{{ aiTasks.length !== 1 ? 's' : '' }}</p>
                <button class="text-sm text-purple-600 hover:text-purple-800 font-medium" @click="saveAllAiTasks">
                  Save All Tasks
                </button>
              </div>

              <div
                v-for="(aiTask, idx) in aiTasks"
                :key="idx"
                class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                  </div>
                  <p v-if="aiTask.description" class="text-xs text-gray-500 mt-1 line-clamp-2">{{ aiTask.description }}</p>
                  <p v-if="aiTask.suggested_due_date" class="text-xs text-gray-500 mt-1">
                    Suggested due: {{ formatDate(aiTask.suggested_due_date) }}
                  </p>
                </div>
                <Button size="xs" color="purple" @click="saveAiTask(aiTask)">Save</Button>
              </div>
            </div>

            <div v-else-if="!aiLoading" class="text-center py-4 text-sm text-gray-500">
              No tasks generated. Click "AI Generate" to analyze your data.
            </div>
          </CardContent>
        </Card>

        <!-- Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search tasks..."
            class="md:w-64"
          />
          <SelectMenu
            v-model="filterStatus"
            :options="statusFilterOptions"
            value-attribute="value"
            option-attribute="label"
            class="md:w-48"
          />
          <select
            v-model="filterPriority"
            class="text-sm border rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600 md:w-48"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            v-model="filterSource"
            class="text-sm border rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600 md:w-48"
          >
            <option value="">All Sources</option>
            <option value="tasks">General Tasks</option>
            <option value="project_tasks">Project Tasks</option>
          </select>
          <select
            v-model="filterAssignee"
            class="text-sm border rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600 md:w-48"
          >
            <option value="">All Users</option>
            <option v-for="u in users" :key="u.id" :value="u.id">
              {{ u.first_name }} {{ u.last_name }}
            </option>
          </select>
        </div>

        <!-- Tasks Table -->
        <Card>
          <Table
            :rows="filteredTasks"
            :columns="[
              { key: 'title', label: 'Task' },
              { key: 'priority', label: 'Priority' },
              { key: 'status', label: 'Status' },
              { key: 'assignee', label: 'Assigned To' },
              { key: 'due', label: 'Due Date' },
              { key: 'actions', label: 'Actions' },
            ]"
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-clipboard-document-check', label: 'No tasks found' }"
          >
            <template #title-data="{ row }">
              <div>
                <div class="flex items-center gap-2">
                  <NuxtLink
                    :to="row._source === 'project_tasks' && row._project_event_id ? `/projects?event=${row._project_event_id}` : `/tasks/${row.id}`"
                    class="font-medium hover:text-primary transition-colors"
                    :class="{ 'line-through text-gray-400': row.task_status === 'completed' }"
                  >
                    {{ row.title }}
                  </NuxtLink>
                  <span
                    v-if="row._source === 'project_tasks'"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  >
                    Project
                  </span>
                  <span
                    v-if="row.ai_generated"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                  >
                    AI
                  </span>
                </div>
                <p v-if="row.description" class="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                  {{ row.description }}
                </p>
                <p v-if="row._source === 'project_tasks' && (row._project_name || row._event_title)" class="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {{ row._project_name }}<span v-if="row._event_title"> &mdash; {{ row._event_title }}</span>
                </p>
              </div>
            </template>

            <template #priority-data="{ row }">
              <Badge
                v-if="row.priority"
                :color="row.priority === 'urgent' ? 'red' : row.priority === 'high' ? 'orange' : row.priority === 'medium' ? 'amber' : 'green'"
                variant="soft"
                size="sm"
              >
                {{ priorityLabel[row.priority] || row.priority }}
              </Badge>
            </template>

            <template #status-data="{ row }">
              <div class="flex items-center gap-2">
                <Badge
                  :color="row.task_status === 'completed' ? 'green' : row.task_status === 'in_progress' ? 'purple' : row.task_status === 'on_hold' ? 'amber' : 'blue'"
                  variant="soft"
                  size="sm"
                >
                  {{ statusLabel[row.task_status] || row.task_status }}
                </Badge>
                <span v-if="isOverdue(row)" class="text-xs text-red-600 dark:text-red-400 font-medium">
                  Overdue
                </span>
              </div>
            </template>

            <template #assignee-data="{ row }">
              <span class="text-sm">{{ formatAssignee(row.assigned_to) }}</span>
            </template>

            <template #due-data="{ row }">
              <span class="text-sm" :class="{ 'text-red-600 dark:text-red-400': isOverdue(row) }">
                {{ formatDate(row.due_date) }}
              </span>
            </template>

            <template #actions-data="{ row }">
              <div class="flex items-center gap-2">
                <template v-if="row._source === 'project_tasks'">
                  <Button
                    size="xs"
                    :color="row.task_status === 'completed' ? 'green' : 'gray'"
                    :variant="row.task_status === 'completed' ? 'soft' : 'ghost'"
                    @click="handleStatusChange(row, row.task_status === 'completed' ? 'open' : 'completed')"
                  >
                    {{ row.task_status === 'completed' ? 'Done' : 'Mark Done' }}
                  </Button>
                </template>
                <template v-else>
                  <select
                    :value="row.task_status"
                    class="text-xs border rounded px-1.5 py-1 bg-white dark:bg-gray-800 dark:border-gray-600"
                    @change="handleStatusChange(row, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <Button
                    size="xs"
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-pencil"
                    @click="openEditDialog(row)"
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    @click="confirmDelete(row)"
                  />
                </template>
              </div>
            </template>
          </Table>
        </Card>
      </template>

      <!-- Create/Edit Task Modal -->
      <Modal v-model="showCreateDialog" :ui="{ width: 'sm:max-w-lg' }">
        <Card>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingTask ? 'Edit Task' : 'New Task' }}
              </h3>
              <Button
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showCreateDialog = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <FormGroup label="Title" required>
              <Input v-model="taskForm.title" placeholder="Task title" />
            </FormGroup>

            <FormGroup label="Description">
              <Textarea
                v-model="taskForm.description"
                placeholder="Task description..."
                rows="3"
              />
            </FormGroup>

            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Priority">
                <SelectMenu
                  v-model="taskForm.priority"
                  :options="[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
              <FormGroup label="Category">
                <SelectMenu
                  v-model="taskForm.category"
                  :options="[
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'follow_up', label: 'Follow Up' },
                    { value: 'inspection', label: 'Inspection' },
                    { value: 'communication', label: 'Communication' },
                    { value: 'financial', label: 'Financial' },
                    { value: 'administrative', label: 'Administrative' },
                    { value: 'other', label: 'Other' },
                  ]"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Due Date">
                <Input v-model="taskForm.due_date" type="date" />
              </FormGroup>
              <FormGroup label="Assign To">
                <SelectMenu
                  v-model="taskForm.assigned_to"
                  :options="[{ value: '', label: 'Myself' }, ...users.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))]"
                  value-attribute="value"
                  option-attribute="label"
                  searchable
                  searchable-placeholder="Search users..."
                />
              </FormGroup>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <Button color="gray" variant="ghost" @click="showCreateDialog = false">
                Cancel
              </Button>
              <Button color="primary" @click="handleSaveTask">
                {{ editingTask ? 'Save Changes' : 'Create Task' }}
              </Button>
            </div>
          </template>
        </Card>
      </Modal>

      <!-- Delete Confirmation Modal -->
      <Modal v-model="showDeleteModal">
        <Card>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
              </div>
              <h3 class="text-lg font-semibold">Delete Task</h3>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete
            <strong>{{ selectedTask?.title }}</strong>?
            This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <Button color="gray" variant="ghost" @click="showDeleteModal = false">
                Cancel
              </Button>
              <Button color="red" @click="handleDelete">
                Delete Task
              </Button>
            </div>
          </template>
        </Card>
      </Modal>
    </div>
  </div>
</template>
