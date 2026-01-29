/**
 * useTasks - Task management composable
 *
 * Provides CRUD operations and filtered views for the universal tasks collection.
 * Tasks can be linked to any collection (requests, projects, etc.) via
 * related_collection and related_id polymorphic fields.
 *
 * Usage:
 * const { myTasks, allTasks, fetchMyTasks, createTask, updateTask, ... } = useTasks()
 */

import type { Task, DirectusUser } from '~/types/directus'

export type TaskStatus = 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskCategory = 'maintenance' | 'follow_up' | 'inspection' | 'communication' | 'financial' | 'administrative' | 'other'

export interface TaskFilters {
  task_status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority | TaskPriority[]
  category?: TaskCategory
  assigned_to?: string
  related_collection?: string
  related_id?: string
  search?: string
}

const TASK_FIELDS = [
  'id',
  'status',
  'date_created',
  'date_updated',
  'user_created.id',
  'user_created.first_name',
  'user_created.last_name',
  'title',
  'description',
  'task_status',
  'priority',
  'assigned_to.id',
  'assigned_to.first_name',
  'assigned_to.last_name',
  'assigned_to.email',
  'assigned_to.avatar',
  'due_date',
  'completed_at',
  'completed_by.id',
  'completed_by.first_name',
  'completed_by.last_name',
  'category',
  'related_collection',
  'related_id',
  'notes',
  'ai_generated',
]

export function useTasks() {
  const collection = useDirectusItems<Task>('tasks')
  const { user } = useDirectusAuth()

  const myTasks = ref<Task[]>([])
  const allTasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Build Directus filter from TaskFilters
   */
  function buildFilter(filters: TaskFilters = {}) {
    const filter: Record<string, any> = {
      status: { _eq: 'published' },
    }

    if (filters.task_status) {
      if (Array.isArray(filters.task_status)) {
        filter.task_status = { _in: filters.task_status }
      } else {
        filter.task_status = { _eq: filters.task_status }
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        filter.priority = { _in: filters.priority }
      } else {
        filter.priority = { _eq: filters.priority }
      }
    }

    if (filters.category) {
      filter.category = { _eq: filters.category }
    }

    if (filters.assigned_to) {
      filter.assigned_to = { _eq: filters.assigned_to }
    }

    if (filters.related_collection) {
      filter.related_collection = { _eq: filters.related_collection }
    }

    if (filters.related_id) {
      filter.related_id = { _eq: filters.related_id }
    }

    return filter
  }

  /**
   * Fetch tasks assigned to the current user
   */
  async function fetchMyTasks(filters: TaskFilters = {}) {
    if (!user.value?.id) return []

    loading.value = true
    error.value = null

    try {
      const result = await collection.list({
        fields: TASK_FIELDS,
        filter: {
          ...buildFilter(filters),
          assigned_to: { _eq: user.value.id },
        },
        sort: ['-priority', 'due_date', '-date_created'],
        limit: -1,
      })
      myTasks.value = result
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch tasks'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch all tasks (admin view) with optional filters
   */
  async function fetchAllTasks(filters: TaskFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const query: Record<string, any> = {
        fields: TASK_FIELDS,
        filter: buildFilter(filters),
        sort: ['-priority', 'due_date', '-date_created'],
        limit: -1,
      }

      if (filters.search) {
        query.search = filters.search
      }

      const result = await collection.list(query)
      allTasks.value = result
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch tasks'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch tasks related to a specific item (e.g., all tasks for a request)
   */
  async function fetchRelatedTasks(relatedCollection: string, relatedId: string) {
    try {
      return await collection.list({
        fields: TASK_FIELDS,
        filter: {
          status: { _eq: 'published' },
          related_collection: { _eq: relatedCollection },
          related_id: { _eq: relatedId },
        },
        sort: ['-priority', 'due_date', '-date_created'],
        limit: -1,
      })
    } catch (e: any) {
      console.error('Failed to fetch related tasks:', e)
      return []
    }
  }

  /**
   * Create a new task
   */
  async function createTask(data: Partial<Task>) {
    try {
      const result = await collection.create({
        status: 'published',
        task_status: 'open',
        ...data,
      })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to create task'
      throw e
    }
  }

  /**
   * Update a task
   */
  async function updateTask(id: string, data: Partial<Task>) {
    try {
      // Auto-set completed fields
      if (data.task_status === 'completed' && !data.completed_at) {
        data.completed_at = new Date().toISOString()
        data.completed_by = user.value?.id
      }

      const result = await collection.update(id, data)
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to update task'
      throw e
    }
  }

  /**
   * Delete a task
   */
  async function deleteTask(id: string) {
    try {
      await collection.remove(id)
      return true
    } catch (e: any) {
      error.value = e.message || 'Failed to delete task'
      throw e
    }
  }

  /**
   * Get task counts by status for the current user
   */
  async function getMyTaskCounts() {
    if (!user.value?.id) return { open: 0, in_progress: 0, on_hold: 0, completed: 0 }

    try {
      const tasks = await collection.list({
        fields: ['task_status'],
        filter: {
          status: { _eq: 'published' },
          assigned_to: { _eq: user.value.id },
          task_status: { _nin: ['cancelled'] },
        },
        limit: -1,
      })

      return {
        open: tasks.filter((t: any) => t.task_status === 'open').length,
        in_progress: tasks.filter((t: any) => t.task_status === 'in_progress').length,
        on_hold: tasks.filter((t: any) => t.task_status === 'on_hold').length,
        completed: tasks.filter((t: any) => t.task_status === 'completed').length,
      }
    } catch {
      return { open: 0, in_progress: 0, on_hold: 0, completed: 0 }
    }
  }

  /**
   * Priority sort order helpers
   */
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  const priorityLabel: Record<string, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }

  const priorityColor: Record<string, string> = {
    urgent: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
    high: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400',
    medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400',
    low: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
  }

  const statusLabel: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const statusColor: Record<string, string> = {
    open: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
    in_progress: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400',
    on_hold: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400',
    completed: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
    cancelled: 'text-gray-500 bg-gray-50 dark:bg-gray-950 dark:text-gray-400',
  }

  const categoryLabel: Record<string, string> = {
    maintenance: 'Maintenance',
    follow_up: 'Follow Up',
    inspection: 'Inspection',
    communication: 'Communication',
    financial: 'Financial',
    administrative: 'Administrative',
    other: 'Other',
  }

  /**
   * Format a user object for display
   */
  function formatAssignee(assignee: any): string {
    if (!assignee) return 'Unassigned'
    if (typeof assignee === 'string') return assignee
    const first = assignee.first_name || ''
    const last = assignee.last_name || ''
    return `${first} ${last}`.trim() || assignee.email || 'Unknown'
  }

  /**
   * Check if a task is overdue
   */
  function isOverdue(task: Task): boolean {
    if (!task.due_date || task.task_status === 'completed' || task.task_status === 'cancelled') return false
    return new Date(task.due_date) < new Date()
  }

  return {
    // State
    myTasks,
    allTasks,
    loading,
    error,

    // CRUD
    fetchMyTasks,
    fetchAllTasks,
    fetchRelatedTasks,
    createTask,
    updateTask,
    deleteTask,

    // Helpers
    getMyTaskCounts,
    buildFilter,
    formatAssignee,
    isOverdue,

    // Constants
    priorityOrder,
    priorityLabel,
    priorityColor,
    statusLabel,
    statusColor,
    categoryLabel,
    TASK_FIELDS,
  }
}
