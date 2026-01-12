<script setup lang="ts">
import type { ProjectWithRelations, ProjectEvent, ProjectTask, ProjectEventWithRelations } from '~/types/projects';
import { PERMISSION_CATEGORIES } from '~/composables/useUserPermissions';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { isAdmin } = useRoles();
const { canCreate, canUpdate, canDelete } = useUserPermissions();

const projectId = computed(() => route.params.id as string);

// Composables
const {
  projects,
  loading,
  error,
  refresh,
  fetchProject,
  updateProject,
  createEvent,
  updateEvent,
  deleteEvent,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
} = useProjectTimeline();

// Local state
const project = ref<ProjectWithRelations | null>(null);
const projectLoading = ref(true);

// Modal states
const showEventModal = ref(false);
const showDeleteEventModal = ref(false);
const showTaskModal = ref(false);
const showDeleteTaskModal = ref(false);
const showProjectEditModal = ref(false);
const isEditingEvent = ref(false);
const isEditingTask = ref(false);
const selectedEvent = ref<ProjectEventWithRelations | null>(null);
const selectedTask = ref<ProjectTask | null>(null);
const saving = ref(false);

// Form states
const eventForm = ref<Partial<ProjectEvent>>({
  title: '',
  description: '',
  event_date: new Date().toISOString().slice(0, 16),
  is_milestone: false,
  status: 'published',
});

const taskForm = ref<Partial<ProjectTask>>({
  title: '',
  description: '',
  priority: 'medium',
  due_date: null,
});

const projectForm = ref<Partial<ProjectWithRelations>>({
  name: '',
  description: '',
  color: '#C4A052',
  status: 'active',
  start_date: '',
  target_end_date: null,
  member_visible: false,
});

// Permission checks
const canUpdateProjects = computed(() => isAdmin.value || canUpdate(PERMISSION_CATEGORIES.PROJECTS));
const canDeleteProjects = computed(() => isAdmin.value || canDelete(PERMISSION_CATEGORIES.PROJECTS));

// Fetch project data
async function loadProject() {
  projectLoading.value = true;
  try {
    const result = await fetchProject(projectId.value);
    if (result) {
      project.value = result;
      // Populate project form
      projectForm.value = {
        name: result.name,
        description: result.description || '',
        color: result.color || '#C4A052',
        status: result.status,
        start_date: result.start_date,
        target_end_date: result.target_end_date,
        member_visible: result.member_visible || false,
      };
    } else {
      toast.add({
        title: 'Not Found',
        description: 'Project not found',
        color: 'red',
      });
      router.push('/admin/projects');
    }
  } catch (e) {
    console.error('Failed to load project:', e);
    toast.add({
      title: 'Error',
      description: 'Failed to load project',
      color: 'red',
    });
  } finally {
    projectLoading.value = false;
  }
}

// Event CRUD
function openCreateEventModal() {
  isEditingEvent.value = false;
  selectedEvent.value = null;
  eventForm.value = {
    title: '',
    description: '',
    event_date: new Date().toISOString().slice(0, 16),
    is_milestone: false,
    status: 'published',
  };
  showEventModal.value = true;
}

function openEditEventModal(event: ProjectEventWithRelations) {
  isEditingEvent.value = true;
  selectedEvent.value = event;
  eventForm.value = {
    title: event.title,
    description: event.description || '',
    event_date: event.event_date?.slice(0, 16) || new Date().toISOString().slice(0, 16),
    is_milestone: event.is_milestone || false,
    status: event.status,
  };
  showEventModal.value = true;
}

function openDeleteEventModal(event: ProjectEventWithRelations) {
  selectedEvent.value = event;
  showDeleteEventModal.value = true;
}

async function saveEvent() {
  if (!eventForm.value.title?.trim()) {
    toast.add({ title: 'Error', description: 'Event title is required', color: 'red' });
    return;
  }

  saving.value = true;
  try {
    if (isEditingEvent.value && selectedEvent.value) {
      await updateEvent(selectedEvent.value.id, eventForm.value);
      toast.add({ title: 'Success', description: 'Event updated', color: 'green' });
    } else {
      await createEvent({
        ...eventForm.value,
        project_id: projectId.value,
      } as any);
      toast.add({ title: 'Success', description: 'Event created', color: 'green' });
    }
    showEventModal.value = false;
    await loadProject();
  } catch (e: any) {
    console.error('Failed to save event:', e);
    toast.add({ title: 'Error', description: e?.message || 'Failed to save event', color: 'red' });
  } finally {
    saving.value = false;
  }
}

async function confirmDeleteEvent() {
  if (!selectedEvent.value) return;

  saving.value = true;
  try {
    await deleteEvent(selectedEvent.value.id);
    toast.add({ title: 'Success', description: 'Event deleted', color: 'green' });
    showDeleteEventModal.value = false;
    await loadProject();
  } catch (e: any) {
    console.error('Failed to delete event:', e);
    toast.add({ title: 'Error', description: e?.message || 'Failed to delete event', color: 'red' });
  } finally {
    saving.value = false;
  }
}

// Task CRUD
function openCreateTaskModal(event: ProjectEventWithRelations) {
  isEditingTask.value = false;
  selectedEvent.value = event;
  selectedTask.value = null;
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    due_date: null,
  };
  showTaskModal.value = true;
}

function openEditTaskModal(event: ProjectEventWithRelations, task: ProjectTask) {
  isEditingTask.value = true;
  selectedEvent.value = event;
  selectedTask.value = task;
  taskForm.value = {
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium',
    due_date: task.due_date,
  };
  showTaskModal.value = true;
}

function openDeleteTaskModal(task: ProjectTask) {
  selectedTask.value = task;
  showDeleteTaskModal.value = true;
}

async function saveTask() {
  if (!taskForm.value.title?.trim()) {
    toast.add({ title: 'Error', description: 'Task title is required', color: 'red' });
    return;
  }

  saving.value = true;
  try {
    if (isEditingTask.value && selectedTask.value) {
      await updateTask(selectedTask.value.id, taskForm.value);
      toast.add({ title: 'Success', description: 'Task updated', color: 'green' });
    } else if (selectedEvent.value) {
      await createTask({
        ...taskForm.value,
        event_id: selectedEvent.value.id,
      } as any);
      toast.add({ title: 'Success', description: 'Task created', color: 'green' });
    }
    showTaskModal.value = false;
    await loadProject();
  } catch (e: any) {
    console.error('Failed to save task:', e);
    toast.add({ title: 'Error', description: e?.message || 'Failed to save task', color: 'red' });
  } finally {
    saving.value = false;
  }
}

async function confirmDeleteTask() {
  if (!selectedTask.value) return;

  saving.value = true;
  try {
    await deleteTask(selectedTask.value.id);
    toast.add({ title: 'Success', description: 'Task deleted', color: 'green' });
    showDeleteTaskModal.value = false;
    await loadProject();
  } catch (e: any) {
    console.error('Failed to delete task:', e);
    toast.add({ title: 'Error', description: e?.message || 'Failed to delete task', color: 'red' });
  } finally {
    saving.value = false;
  }
}

async function handleTaskToggle(taskId: string, completed: boolean) {
  try {
    await toggleTask(taskId, completed);
    await loadProject();
  } catch (e) {
    console.error('Failed to toggle task:', e);
  }
}

// Project edit
async function saveProject() {
  if (!projectForm.value.name?.trim()) {
    toast.add({ title: 'Error', description: 'Project name is required', color: 'red' });
    return;
  }

  saving.value = true;
  try {
    await updateProject(projectId.value, projectForm.value);
    toast.add({ title: 'Success', description: 'Project updated', color: 'green' });
    showProjectEditModal.value = false;
    await loadProject();
  } catch (e: any) {
    console.error('Failed to save project:', e);
    toast.add({ title: 'Error', description: e?.message || 'Failed to save project', color: 'red' });
  } finally {
    saving.value = false;
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    draft: 'gray',
    active: 'green',
    completed: 'blue',
    archived: 'amber',
  };
  return colors[status] || 'gray';
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'gray',
    medium: 'blue',
    high: 'amber',
    urgent: 'red',
  };
  return colors[priority] || 'gray';
}

// Initialize
onMounted(async () => {
  await loadProject();
});
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Back button and header -->
      <div class="mb-6">
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          to="/admin/projects"
          class="mb-4"
        >
          Back to Projects
        </UButton>

        <!-- Loading state -->
        <div v-if="projectLoading" class="flex items-center justify-center py-20">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gold" />
        </div>

        <!-- Project header -->
        <div v-else-if="project" class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div class="flex items-start gap-4">
            <div
              class="w-4 h-4 rounded-full mt-2 flex-shrink-0"
              :style="{ backgroundColor: project.color || '#C4A052' }"
            />
            <div>
              <h1 class="text-2xl font-bold">{{ project.name }}</h1>
              <p v-if="project.description" class="text-gray-600 dark:text-gray-400 mt-1" v-html="project.description.replace(/<[^>]*>/g, '').substring(0, 200)" />
              <div class="flex items-center gap-3 mt-2">
                <UBadge :color="getStatusColor(project.status)" variant="soft">
                  {{ project.status }}
                </UBadge>
                <span class="text-sm text-gray-500">
                  {{ formatDate(project.start_date) }}
                  <span v-if="project.target_end_date"> → {{ formatDate(project.target_end_date) }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-eye"
              :to="`/projects/${project.id}`"
            >
              Public View
            </UButton>
            <UButton
              v-if="canUpdateProjects"
              color="gray"
              variant="soft"
              icon="i-heroicons-pencil"
              @click="showProjectEditModal = true"
            >
              Edit Project
            </UButton>
            <UButton
              v-if="canUpdateProjects"
              color="primary"
              icon="i-heroicons-plus"
              @click="openCreateEventModal"
            >
              Add Event
            </UButton>
          </div>
        </div>
      </div>

      <!-- Timeline visualization -->
      <div v-if="project && !projectLoading" class="space-y-6">
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold">{{ project.events?.length || 0 }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Events</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold">
                {{ project.events?.reduce((acc, e) => acc + (e.tasks?.length || 0), 0) || 0 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Tasks</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">
                {{ project.events?.reduce((acc, e) => acc + (e.tasks?.filter(t => t.completed)?.length || 0), 0) || 0 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold">
                {{ project.events?.filter(e => e.is_milestone)?.length || 0 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Milestones</p>
            </div>
          </UCard>
        </div>

        <!-- Timeline Events -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Timeline Events</h2>
              <UButton
                v-if="canUpdateProjects"
                size="sm"
                color="primary"
                icon="i-heroicons-plus"
                @click="openCreateEventModal"
              >
                Add Event
              </UButton>
            </div>
          </template>

          <!-- Empty state -->
          <div v-if="!project.events || project.events.length === 0" class="text-center py-12">
            <UIcon name="i-heroicons-calendar" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500">No events yet. Add your first event to start the timeline.</p>
          </div>

          <!-- Events list (horizontal timeline style) -->
          <div v-else class="relative">
            <!-- Timeline line -->
            <div class="absolute top-6 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div
              class="absolute top-6 left-0 h-1 rounded-full"
              :style="{ backgroundColor: project.color || '#C4A052', width: '100%' }"
            />

            <!-- Events -->
            <div class="relative flex overflow-x-auto pb-4 gap-6 pt-2">
              <div
                v-for="event in project.events"
                :key="event.id"
                class="flex-shrink-0 w-72"
              >
                <!-- Event node -->
                <div class="relative">
                  <!-- Node circle -->
                  <div
                    class="w-4 h-4 rounded-full border-4 mx-auto relative z-10"
                    :class="event.is_milestone ? 'w-6 h-6' : ''"
                    :style="{
                      borderColor: project.color || '#C4A052',
                      backgroundColor: event.is_milestone ? (project.color || '#C4A052') : 'white',
                    }"
                  />

                  <!-- Event card -->
                  <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <h3 class="font-medium text-sm">{{ event.title }}</h3>
                      <UDropdown
                        v-if="canUpdateProjects"
                        :items="[
                          [
                            { label: 'Edit', icon: 'i-heroicons-pencil', click: () => openEditEventModal(event as ProjectEventWithRelations) },
                            { label: 'Add Task', icon: 'i-heroicons-plus', click: () => openCreateTaskModal(event as ProjectEventWithRelations) },
                          ],
                          [
                            { label: 'Delete', icon: 'i-heroicons-trash', click: () => openDeleteEventModal(event as ProjectEventWithRelations) },
                          ],
                        ]"
                      >
                        <UButton
                          size="xs"
                          color="gray"
                          variant="ghost"
                          icon="i-heroicons-ellipsis-vertical"
                        />
                      </UDropdown>
                    </div>

                    <p class="text-xs text-gray-500 mb-2">
                      {{ formatDateTime(event.event_date) }}
                    </p>

                    <div class="flex items-center gap-2 mb-2">
                      <UBadge v-if="event.is_milestone" color="amber" variant="soft" size="xs">
                        Milestone
                      </UBadge>
                      <UBadge :color="event.status === 'published' ? 'green' : 'gray'" variant="soft" size="xs">
                        {{ event.status }}
                      </UBadge>
                    </div>

                    <!-- Tasks preview -->
                    <div v-if="event.tasks && event.tasks.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p class="text-xs text-gray-500 mb-2">
                        Tasks ({{ event.tasks.filter(t => t.completed).length }}/{{ event.tasks.length }})
                      </p>
                      <div class="space-y-1">
                        <div
                          v-for="task in event.tasks.slice(0, 3)"
                          :key="task.id"
                          class="flex items-center gap-2 text-xs"
                        >
                          <UCheckbox
                            :model-value="task.completed"
                            size="xs"
                            @change="handleTaskToggle(task.id, !task.completed)"
                          />
                          <span :class="task.completed ? 'line-through text-gray-400' : ''">
                            {{ task.title }}
                          </span>
                          <UDropdown
                            v-if="canUpdateProjects"
                            :items="[
                              [
                                { label: 'Edit', icon: 'i-heroicons-pencil', click: () => openEditTaskModal(event as ProjectEventWithRelations, task) },
                              ],
                              [
                                { label: 'Delete', icon: 'i-heroicons-trash', click: () => openDeleteTaskModal(task) },
                              ],
                            ]"
                            class="ml-auto"
                          >
                            <UButton
                              size="xs"
                              color="gray"
                              variant="ghost"
                              icon="i-heroicons-ellipsis-vertical"
                              class="opacity-0 group-hover:opacity-100"
                            />
                          </UDropdown>
                        </div>
                        <p v-if="event.tasks.length > 3" class="text-xs text-gray-400">
                          +{{ event.tasks.length - 3 }} more
                        </p>
                      </div>
                      <UButton
                        v-if="canUpdateProjects"
                        size="xs"
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-plus"
                        class="mt-2"
                        @click="openCreateTaskModal(event as ProjectEventWithRelations)"
                      >
                        Add Task
                      </UButton>
                    </div>

                    <!-- No tasks -->
                    <div v-else-if="canUpdateProjects" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <UButton
                        size="xs"
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-plus"
                        @click="openCreateTaskModal(event as ProjectEventWithRelations)"
                      >
                        Add Task
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Event Create/Edit Modal -->
      <UModal v-model="showEventModal" :ui="{ width: 'sm:max-w-xl' }">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ isEditingEvent ? 'Edit Event' : 'Create Event' }}
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showEventModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UFormGroup label="Event Title" required>
              <UInput v-model="eventForm.title" placeholder="Enter event title" />
            </UFormGroup>

            <UFormGroup label="Description">
              <UTextarea v-model="eventForm.description" placeholder="Enter event description" :rows="3" />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Event Date" required>
                <UInput v-model="eventForm.event_date" type="datetime-local" />
              </UFormGroup>

              <UFormGroup label="Status">
                <USelectMenu
                  v-model="eventForm.status"
                  :options="[
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                  ]"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormGroup>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p class="font-medium">Milestone</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Mark this event as a project milestone
                </p>
              </div>
              <UToggle v-model="eventForm.is_milestone" />
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showEventModal = false">
                Cancel
              </UButton>
              <UButton color="primary" :loading="saving" @click="saveEvent">
                {{ isEditingEvent ? 'Save Changes' : 'Create Event' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Delete Event Modal -->
      <UModal v-model="showDeleteEventModal">
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600" />
              </div>
              <h3 class="text-lg font-semibold">Delete Event</h3>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>"{{ selectedEvent?.title }}"</strong>?
            This will also delete all associated tasks. This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showDeleteEventModal = false">
                Cancel
              </UButton>
              <UButton color="red" :loading="saving" @click="confirmDeleteEvent">
                Delete Event
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Task Create/Edit Modal -->
      <UModal v-model="showTaskModal" :ui="{ width: 'sm:max-w-lg' }">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ isEditingTask ? 'Edit Task' : 'Create Task' }}
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showTaskModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UFormGroup label="Task Title" required>
              <UInput v-model="taskForm.title" placeholder="Enter task title" />
            </UFormGroup>

            <UFormGroup label="Description">
              <UTextarea v-model="taskForm.description" placeholder="Enter task description" :rows="2" />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Priority">
                <USelectMenu
                  v-model="taskForm.priority"
                  :options="[
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                    { label: 'Urgent', value: 'urgent' },
                  ]"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormGroup>

              <UFormGroup label="Due Date">
                <UInput v-model="taskForm.due_date" type="date" />
              </UFormGroup>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showTaskModal = false">
                Cancel
              </UButton>
              <UButton color="primary" :loading="saving" @click="saveTask">
                {{ isEditingTask ? 'Save Changes' : 'Create Task' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Delete Task Modal -->
      <UModal v-model="showDeleteTaskModal">
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600" />
              </div>
              <h3 class="text-lg font-semibold">Delete Task</h3>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>"{{ selectedTask?.title }}"</strong>?
            This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showDeleteTaskModal = false">
                Cancel
              </UButton>
              <UButton color="red" :loading="saving" @click="confirmDeleteTask">
                Delete Task
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Project Edit Modal -->
      <UModal v-model="showProjectEditModal" :ui="{ width: 'sm:max-w-xl' }">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Edit Project</h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showProjectEditModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UFormGroup label="Project Name" required>
              <UInput v-model="projectForm.name" placeholder="Enter project name" />
            </UFormGroup>

            <UFormGroup label="Description">
              <UTextarea v-model="projectForm.description" placeholder="Enter project description" :rows="3" />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Status">
                <USelectMenu
                  v-model="projectForm.status"
                  :options="[
                    { label: 'Draft', value: 'draft' },
                    { label: 'Active', value: 'active' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Archived', value: 'archived' },
                  ]"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormGroup>

              <UFormGroup label="Timeline Color">
                <div class="flex items-center gap-2">
                  <input
                    v-model="projectForm.color"
                    type="color"
                    class="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <UInput v-model="projectForm.color" placeholder="#C4A052" class="flex-1" />
                </div>
              </UFormGroup>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Start Date" required>
                <UInput v-model="projectForm.start_date" type="date" />
              </UFormGroup>

              <UFormGroup label="Target End Date">
                <UInput v-model="projectForm.target_end_date" type="date" />
              </UFormGroup>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p class="font-medium">Visible to Members</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  When enabled, all approved members can view this project
                </p>
              </div>
              <UToggle v-model="projectForm.member_visible" />
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showProjectEditModal = false">
                Cancel
              </UButton>
              <UButton color="primary" :loading="saving" @click="saveProject">
                Save Changes
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>
