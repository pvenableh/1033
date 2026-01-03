<template>
  <div class="projects-page min-h-screen">
    <div class="container mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">Building Projects</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            View ongoing and completed building projects
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center gap-3">
          <div class="flex gap-2">
            <UBadge color="green" variant="soft" size="sm">
              {{ activeCount }} active
            </UBadge>
            <UBadge color="blue" variant="soft" size="sm">
              {{ completedCount }} completed
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- Projects List -->
      <div v-else-if="projects.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card hover:shadow-lg transition-shadow duration-200"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-4 h-4 rounded-full flex-shrink-0"
                :style="{ backgroundColor: project.color || '#C4A052' }"
              />
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold truncate">{{ project.name }}</h3>
                <UBadge
                  :color="getStatusColor(project.status)"
                  variant="soft"
                  size="xs"
                  class="mt-1"
                >
                  {{ project.status }}
                </UBadge>
              </div>
            </div>
          </template>

          <div class="space-y-3">
            <!-- Description -->
            <p
              v-if="project.description"
              class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
              v-html="stripHtml(project.description)"
            />
            <p v-else class="text-sm text-gray-400 italic">No description</p>

            <!-- Category -->
            <div v-if="project.category_id" class="flex items-center gap-2">
              <UIcon name="i-heroicons-tag" class="w-4 h-4 text-gray-400" />
              <UBadge
                :style="{
                  backgroundColor: typeof project.category_id === 'object' ? project.category_id.color + '20' : undefined,
                  color: typeof project.category_id === 'object' ? project.category_id.color : undefined,
                }"
                variant="soft"
                size="xs"
              >
                {{ typeof project.category_id === 'object' ? project.category_id.name : 'Category' }}
              </UBadge>
            </div>

            <!-- Timeline -->
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
              <span>{{ formatDate(project.start_date) }}</span>
              <span v-if="project.target_end_date">
                → {{ formatDate(project.target_end_date) }}
              </span>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span v-if="project.user_created">
                Created by {{ project.user_created.first_name }} {{ project.user_created.last_name }}
              </span>
              <span v-else>-</span>
            </div>
          </template>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-chart-no-axes-gantt" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-600 dark:text-gray-400">No projects yet</h3>
        <p class="text-gray-500">Building projects will appear here when created.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/projects';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

useSeoMeta({
  title: 'Projects | 1033 Lenox',
  description: 'View building projects and timelines',
});

const { isBoardMember } = useRoles();
const projects = ref<Project[]>([]);
const loading = ref(true);

// Computed stats
const activeCount = computed(() => projects.value.filter((p) => p.status === 'active').length);
const completedCount = computed(() => projects.value.filter((p) => p.status === 'completed').length);

// Only show active and completed projects (not draft or archived) for regular members
const filteredProjects = computed(() => {
  return projects.value.filter((p) => ['active', 'completed'].includes(p.status));
});

// Fetch projects based on user role
async function fetchProjects() {
  loading.value = true;
  try {
    // Build filter based on role
    // Board members see all active/completed projects
    // Regular members only see projects marked as member_visible
    const filter: Record<string, any> = {
      status: {
        _in: ['active', 'completed'],
      },
    };

    // Non-board members only see member-visible projects
    if (!isBoardMember.value) {
      filter.member_visible = { _eq: true };
    }

    const response = await $fetch<Project[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'projects',
        operation: 'search',
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
            'member_visible',
            'category_id.id',
            'category_id.name',
            'category_id.color',
            'user_created.id',
            'user_created.first_name',
            'user_created.last_name',
          ],
          filter,
          sort: ['-date_created'],
          limit: -1,
        },
      },
    });
    projects.value = response || [];
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  } finally {
    loading.value = false;
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

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').substring(0, 100);
}

onMounted(() => {
  fetchProjects();
});
</script>

<style scoped>
.project-card {
  @apply cursor-default;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
