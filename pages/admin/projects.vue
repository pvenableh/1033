<script setup lang="ts">
import type { Project, ProjectCategory } from '~/types/projects';
import { PERMISSION_CATEGORIES, CRUD_ACTIONS } from '~/composables/useUserPermissions';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

const toast = useToast();
const { isAdmin } = useRoles();
const { canCreate, canUpdate, canDelete } = useUserPermissions();

// State
const projects = ref<Project[]>([]);
const categories = ref<ProjectCategory[]>([]);
const loading = ref(true);
const selectedProject = ref<Project | null>(null);
const showProjectModal = ref(false);
const showDeleteModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);

// Filters
const statusFilter = ref('all');
const categoryFilter = ref('all');
const searchQuery = ref('');

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
];

// Project form state
const projectForm = ref<Partial<Project>>({
  name: '',
  description: '',
  color: '#C4A052',
  icon: '',
  status: 'active',
  category_id: null,
  start_date: new Date().toISOString().split('T')[0],
  target_end_date: null,
});

// Permission checks
const canCreateProjects = computed(() => isAdmin.value || canCreate(PERMISSION_CATEGORIES.PROJECTS));
const canUpdateProjects = computed(() => isAdmin.value || canUpdate(PERMISSION_CATEGORIES.PROJECTS));
const canDeleteProjects = computed(() => isAdmin.value || canDelete(PERMISSION_CATEGORIES.PROJECTS));

// Computed
const filteredProjects = computed(() => {
  let result = projects.value;

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter((p) => p.status === statusFilter.value);
  }

  // Filter by category
  if (categoryFilter.value !== 'all') {
    result = result.filter((p) => {
      const catId = typeof p.category_id === 'object' ? p.category_id?.id : p.category_id;
      return catId === categoryFilter.value;
    });
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }

  return result;
});

const categoryOptions = computed(() => {
  return [
    { label: 'All Categories', value: 'all' },
    ...categories.value.map((c) => ({
      label: c.name,
      value: c.id,
    })),
  ];
});

const categorySelectOptions = computed(() => {
  return [
    { label: 'No Category', value: null },
    ...categories.value.map((c) => ({
      label: c.name,
      value: c.id,
    })),
  ];
});

// Stats
const projectStats = computed(() => ({
  total: projects.value.length,
  active: projects.value.filter((p) => p.status === 'active').length,
  completed: projects.value.filter((p) => p.status === 'completed').length,
  draft: projects.value.filter((p) => p.status === 'draft').length,
}));

// Methods
async function fetchProjects() {
  loading.value = true;
  try {
    const response = await $fetch<Project[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'projects',
        operation: 'list',
        query: {
          fields: [
            'id',
            'status',
            'name',
            'description',
            'color',
            'icon',
            'start_date',
            'target_end_date',
            'actual_end_date',
            'date_created',
            'date_updated',
            'category_id.id',
            'category_id.name',
            'category_id.color',
            'user_created.id',
            'user_created.first_name',
            'user_created.last_name',
          ],
          sort: ['-date_created'],
          limit: -1,
        },
      },
    });
    projects.value = response || [];
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to load projects',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

async function fetchCategories() {
  try {
    const response = await $fetch<ProjectCategory[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'project_categories',
        operation: 'list',
        query: {
          fields: ['id', 'name', 'color', 'icon'],
          filter: { status: { _eq: 'published' } },
          sort: ['name'],
          limit: -1,
        },
      },
    });
    categories.value = response || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
}

function openCreateModal() {
  isEditing.value = false;
  selectedProject.value = null;
  projectForm.value = {
    name: '',
    description: '',
    color: '#C4A052',
    icon: '',
    status: 'active',
    category_id: null,
    start_date: new Date().toISOString().split('T')[0],
    target_end_date: null,
  };
  showProjectModal.value = true;
}

function openEditModal(project: Project) {
  isEditing.value = true;
  selectedProject.value = project;
  projectForm.value = {
    name: project.name,
    description: project.description || '',
    color: project.color || '#C4A052',
    icon: project.icon || '',
    status: project.status,
    category_id: typeof project.category_id === 'object' ? project.category_id?.id : project.category_id,
    start_date: project.start_date,
    target_end_date: project.target_end_date,
  };
  showProjectModal.value = true;
}

function openDeleteModal(project: Project) {
  selectedProject.value = project;
  showDeleteModal.value = true;
}

async function saveProject() {
  if (!projectForm.value.name?.trim()) {
    toast.add({
      title: 'Validation Error',
      description: 'Project name is required',
      color: 'red',
    });
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value && selectedProject.value) {
      // Update existing project
      await $fetch('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'projects',
          operation: 'update',
          id: selectedProject.value.id,
          data: projectForm.value,
        },
      });

      toast.add({
        title: 'Project Updated',
        description: `"${projectForm.value.name}" has been updated`,
        color: 'green',
      });
    } else {
      // Create new project
      await $fetch('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'projects',
          operation: 'create',
          data: projectForm.value,
        },
      });

      toast.add({
        title: 'Project Created',
        description: `"${projectForm.value.name}" has been created`,
        color: 'green',
      });
    }

    showProjectModal.value = false;
    await fetchProjects();
  } catch (error: any) {
    console.error('Failed to save project:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to save project',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

async function deleteProject() {
  if (!selectedProject.value) return;

  saving.value = true;
  try {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'projects',
        operation: 'delete',
        id: selectedProject.value.id,
      },
    });

    toast.add({
      title: 'Project Deleted',
      description: `"${selectedProject.value.name}" has been deleted`,
      color: 'green',
    });

    showDeleteModal.value = false;
    await fetchProjects();
  } catch (error: any) {
    console.error('Failed to delete project:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to delete project',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

async function updateProjectStatus(project: Project, newStatus: string) {
  try {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'projects',
        operation: 'update',
        id: project.id,
        data: { status: newStatus },
      },
    });

    toast.add({
      title: 'Status Updated',
      description: `Project status changed to ${newStatus}`,
      color: 'green',
    });

    await fetchProjects();
  } catch (error: any) {
    console.error('Failed to update status:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to update status',
      color: 'red',
    });
  }
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

function getCategoryName(project: Project): string {
  if (typeof project.category_id === 'object' && project.category_id?.name) {
    return project.category_id.name;
  }
  return 'Uncategorized';
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Initialize
onMounted(async () => {
  await Promise.all([fetchProjects(), fetchCategories()]);
});
</script>

<template>
  <div class="admin-page bg-white dark:bg-gray-900 min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">Project Management</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Manage projects, timelines, and events
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center gap-3">
          <div class="flex gap-2">
            <UBadge color="green" variant="soft" size="sm">
              {{ projectStats.active }} active
            </UBadge>
            <UBadge color="blue" variant="soft" size="sm">
              {{ projectStats.completed }} completed
            </UBadge>
          </div>
          <UButton
            v-if="canCreateProjects"
            color="primary"
            icon="i-heroicons-plus"
            @click="openCreateModal"
          >
            New Project
          </UButton>
        </div>
      </div>

      <!-- Access Denied -->
      <div v-if="!isAdmin" class="text-center py-12">
        <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You need administrator privileges to manage projects.
        </p>
      </div>

      <!-- Project Management -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold">{{ projectStats.total }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">{{ projectStats.active }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Active</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">{{ projectStats.completed }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-600">{{ projectStats.draft }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Draft</p>
            </div>
          </UCard>
        </div>

        <!-- Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search projects..."
            class="md:w-64"
          />
          <USelectMenu
            v-model="statusFilter"
            :options="statusOptions"
            value-attribute="value"
            option-attribute="label"
            class="md:w-48"
          />
          <USelectMenu
            v-model="categoryFilter"
            :options="categoryOptions"
            value-attribute="value"
            option-attribute="label"
            class="md:w-48"
          />
        </div>

        <!-- Projects Table -->
        <UCard>
          <UTable
            :rows="filteredProjects"
            :columns="[
              { key: 'name', label: 'Project' },
              { key: 'category', label: 'Category' },
              { key: 'status', label: 'Status' },
              { key: 'dates', label: 'Timeline' },
              { key: 'actions', label: 'Actions' },
            ]"
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-folder', label: 'No projects found' }"
          >
            <template #name-data="{ row }">
              <div class="flex items-center gap-3">
                <div
                  class="w-4 h-4 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: row.color || '#C4A052' }"
                />
                <div>
                  <p class="font-medium">{{ row.name }}</p>
                  <p
                    v-if="row.description"
                    class="text-xs text-gray-500 truncate max-w-xs"
                    v-html="row.description.replace(/<[^>]*>/g, '').substring(0, 50)"
                  />
                </div>
              </div>
            </template>

            <template #category-data="{ row }">
              <UBadge
                v-if="row.category_id"
                :style="{
                  backgroundColor: typeof row.category_id === 'object' ? row.category_id.color + '20' : undefined,
                  color: typeof row.category_id === 'object' ? row.category_id.color : undefined,
                }"
                variant="soft"
                size="sm"
              >
                {{ getCategoryName(row) }}
              </UBadge>
              <span v-else class="text-sm text-gray-500">-</span>
            </template>

            <template #status-data="{ row }">
              <UDropdown
                v-if="canUpdateProjects"
                :items="[
                  [
                    { label: 'Draft', click: () => updateProjectStatus(row, 'draft') },
                    { label: 'Active', click: () => updateProjectStatus(row, 'active') },
                    { label: 'Completed', click: () => updateProjectStatus(row, 'completed') },
                    { label: 'Archived', click: () => updateProjectStatus(row, 'archived') },
                  ],
                ]"
              >
                <UBadge
                  :color="getStatusColor(row.status)"
                  variant="soft"
                  size="sm"
                  class="cursor-pointer"
                >
                  {{ row.status }}
                  <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 ml-1" />
                </UBadge>
              </UDropdown>
              <UBadge
                v-else
                :color="getStatusColor(row.status)"
                variant="soft"
                size="sm"
              >
                {{ row.status }}
              </UBadge>
            </template>

            <template #dates-data="{ row }">
              <div class="text-sm">
                <p>{{ formatDate(row.start_date) }}</p>
                <p v-if="row.target_end_date" class="text-gray-500">
                  → {{ formatDate(row.target_end_date) }}
                </p>
              </div>
            </template>

            <template #actions-data="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  size="xs"
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-eye"
                  :to="`/projects/${row.id}`"
                >
                  View
                </UButton>
                <UButton
                  v-if="canUpdateProjects"
                  size="xs"
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  @click="openEditModal(row)"
                >
                  Edit
                </UButton>
                <UButton
                  v-if="canDeleteProjects"
                  size="xs"
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  @click="openDeleteModal(row)"
                />
              </div>
            </template>
          </UTable>
        </UCard>
      </template>

      <!-- Create/Edit Project Modal -->
      <UModal v-model="showProjectModal" :ui="{ width: 'sm:max-w-xl' }">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ isEditing ? 'Edit Project' : 'Create Project' }}
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showProjectModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <!-- Name -->
            <UFormGroup label="Project Name" required>
              <UInput
                v-model="projectForm.name"
                placeholder="Enter project name"
              />
            </UFormGroup>

            <!-- Description -->
            <UFormGroup label="Description">
              <UTextarea
                v-model="projectForm.description"
                placeholder="Enter project description"
                :rows="3"
              />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <!-- Status -->
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

              <!-- Category -->
              <UFormGroup label="Category">
                <USelectMenu
                  v-model="projectForm.category_id"
                  :options="categorySelectOptions"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="Select category"
                />
              </UFormGroup>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Start Date -->
              <UFormGroup label="Start Date" required>
                <UInput
                  v-model="projectForm.start_date"
                  type="date"
                />
              </UFormGroup>

              <!-- Target End Date -->
              <UFormGroup label="Target End Date">
                <UInput
                  v-model="projectForm.target_end_date"
                  type="date"
                />
              </UFormGroup>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Color -->
              <UFormGroup label="Timeline Color">
                <div class="flex items-center gap-2">
                  <input
                    v-model="projectForm.color"
                    type="color"
                    class="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <UInput
                    v-model="projectForm.color"
                    placeholder="#C4A052"
                    class="flex-1"
                  />
                </div>
              </UFormGroup>

              <!-- Icon -->
              <UFormGroup label="Icon">
                <UInput
                  v-model="projectForm.icon"
                  placeholder="i-heroicons-folder"
                />
              </UFormGroup>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showProjectModal = false">
                Cancel
              </UButton>
              <UButton color="primary" :loading="saving" @click="saveProject">
                {{ isEditing ? 'Save Changes' : 'Create Project' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Delete Confirmation Modal -->
      <UModal v-model="showDeleteModal">
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600" />
              </div>
              <h3 class="text-lg font-semibold">Delete Project</h3>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>"{{ selectedProject?.name }}"</strong>?
            This will also delete all associated events, tasks, and files. This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="gray" variant="ghost" @click="showDeleteModal = false">
                Cancel
              </UButton>
              <UButton color="red" :loading="saving" @click="deleteProject">
                Delete Project
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>
