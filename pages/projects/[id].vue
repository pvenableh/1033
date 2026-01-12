<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gold" />
    </div>

    <!-- Access denied -->
    <div v-else-if="accessDenied" class="flex flex-col items-center justify-center min-h-screen px-4">
      <UIcon name="i-heroicons-lock-closed" class="w-16 h-16 text-gray-300 mb-4" />
      <h1 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Project Not Available</h1>
      <p class="text-gray-500 dark:text-gray-400 text-center mb-6">
        This project is not available to view at this time.
      </p>
      <UButton color="primary" to="/projects">
        Back to Projects
      </UButton>
    </div>

    <!-- Project not found -->
    <div v-else-if="notFound" class="flex flex-col items-center justify-center min-h-screen px-4">
      <UIcon name="i-heroicons-document-magnifying-glass" class="w-16 h-16 text-gray-300 mb-4" />
      <h1 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Project Not Found</h1>
      <p class="text-gray-500 dark:text-gray-400 text-center mb-6">
        The project you're looking for doesn't exist or has been removed.
      </p>
      <UButton color="primary" to="/projects">
        Back to Projects
      </UButton>
    </div>

    <!-- Project timeline -->
    <ProjectTimeline v-else-if="canView" :initial-focus="projectId" />
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/projects';

const route = useRoute();
const projectId = computed(() => route.params.id as string);

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

const { isBoardMember } = useRoles();
const { user } = useDirectusAuth();

// State
const loading = ref(true);
const accessDenied = ref(false);
const notFound = ref(false);
const projectData = ref<Project | null>(null);

// Check if user can view the project
const canView = computed(() => {
  if (!projectData.value) return false;

  // Board members can view all projects
  if (isBoardMember.value) return true;

  // Regular members can only view member_visible projects
  return projectData.value.member_visible === true;
});

// Fetch project to check visibility
async function checkProjectAccess() {
  loading.value = true;
  accessDenied.value = false;
  notFound.value = false;

  try {
    const response = await $fetch<Project>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'projects',
        operation: 'get',
        id: projectId.value,
        query: {
          fields: ['id', 'name', 'description', 'status', 'member_visible'],
        },
      },
    });

    if (!response) {
      notFound.value = true;
      return;
    }

    projectData.value = response;

    // Check if project is active/completed (not draft or archived)
    if (!['active', 'completed'].includes(response.status)) {
      notFound.value = true;
      return;
    }

    // Check visibility for non-board members
    if (!isBoardMember.value && !response.member_visible) {
      accessDenied.value = true;
      return;
    }
  } catch (error: any) {
    console.error('Failed to check project access:', error);
    // If 403 or not found, show appropriate message
    if (error?.statusCode === 403 || error?.statusCode === 404) {
      notFound.value = true;
    } else {
      notFound.value = true;
    }
  } finally {
    loading.value = false;
  }
}

// Dynamic SEO meta
const { projects } = useProjectTimeline();
const project = computed(() => projects.value.find((p) => p.id === projectId.value));

useSeoMeta({
  title: () => (project.value ? `${project.value.name} | 1033 Lenox` : 'Project | 1033 Lenox'),
  description: () => project.value?.description || 'Project timeline and management',
});

// Check access on mount
onMounted(async () => {
  // Wait for auth to be ready
  await nextTick();
  await checkProjectAccess();
});

// Re-check if route changes
watch(projectId, () => {
  checkProjectAccess();
});
</script>
