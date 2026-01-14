<template>
  <div class="project-timeline min-h-screen bg-gray-50">
    <!-- Header with Live Clock -->
    <div class="flex flex-col items-center gap-2 p-6 lg:p-8">
      <h1 class="font-serif text-2xl lg:text-3xl font-light text-gray-900 text-center">
        Project Timeline
      </h1>
      <div class="text-center">
        <p class="text-xs font-mono text-gray-600 tracking-wider uppercase">
          {{ currentDateTime }}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {{ rootProjects.length }} projects · {{ totalEvents }} events
        </p>
      </div>
    </div>

    <!-- Controls Row -->
    <div class="flex justify-between items-center px-6 lg:px-8 mb-4">
      <TimelineLegend
        :projects="rootProjects"
        :focused-id="focusedProjectId"
        @focus="focusedProjectId = $event"
      />
      <TimelineControls
        v-model:zoom="zoomLevel"
        v-model:focused-project="focusedProjectId"
        :projects="rootProjects"
        @reset="resetView"
      />
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-20"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin text-gold"
      />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="mx-6 lg:mx-8 p-6 bg-red-50 border border-red-200"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="w-5 h-5 text-red-500"
        />
        <p class="text-red-700">{{ error }}</p>
      </div>
      <button
        class="mt-3 text-sm text-red-600 hover:text-red-700 underline"
        @click="refresh"
      >
        Try again
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="projects.length === 0"
      class="mx-6 lg:mx-8 py-20 text-center"
    >
      <UIcon
        name="i-heroicons-calendar"
        class="w-12 h-12 text-gray-300 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-700">No projects yet</h3>
      <p class="text-gray-500 mt-1">Create your first project to get started</p>
    </div>

    <!-- Canvas (no rounded corners, white background) -->
    <div
      v-else
      ref="canvasContainer"
      class="bg-white border-y border-gray-200 overflow-auto"
    >
      <TimelineCanvas
        :projects="visibleProjects"
        :zoom="zoomLevel"
        :selected-event-id="selectedEventId"
        @select-event="handleEventSelect"
      />
    </div>

    <!-- Event Detail Panel (slide-out) -->
    <Teleport to="body">
      <TimelineEventDetail
        v-if="selectedEvent"
        :event="selectedEvent"
        :project="selectedEventProject"
        @close="selectedEventId = null"
        @task-toggle="handleTaskToggle"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TimelineControls from './TimelineControls.vue';
import TimelineEventDetail from './TimelineEventDetail.vue';
import TimelineCanvas from './TimelineCanvas.vue';
import TimelineLegend from './TimelineLegend.vue';
import type { ProjectWithRelations, ProjectEventWithRelations } from '~/types/projects';

gsap.registerPlugin(ScrollTrigger);

// Props
interface Props {
  initialFocus?: string;
}

const props = defineProps<Props>();

// Composables
const { user, fetch: fetchSession, loggedIn } = useDirectusAuth();
const { projects, loading, error, refresh, fetchProject, toggleTask } = useProjectTimeline();
const { celebrate } = useConfetti();

// View state
const canvasContainer = ref<HTMLElement | null>(null);
const zoomLevel = ref(1);
const focusedProjectId = ref<string | null>(props.initialFocus || null);
const selectedEventId = ref<string | null>(null);

// Live clock
const currentTime = ref(new Date());
let clockInterval: ReturnType<typeof setInterval> | null = null;

const currentDateTime = computed(() => {
  return currentTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
});

// Computed
const rootProjects = computed(() => projects.value.filter((p) => !p.parent_id));

const visibleProjects = computed(() => {
  if (!focusedProjectId.value) return projects.value;

  // Check if focused project exists in the list
  const focusedProject = projects.value.find((pr) => pr.id === focusedProjectId.value);

  // If focused project doesn't exist in the list, show all projects as fallback
  if (!focusedProject) return projects.value;

  return projects.value.filter((p) => {
    // Show focused project
    if (p.id === focusedProjectId.value) return true;

    // Show children of focused project
    const parentId = typeof p.parent_id === 'object' ? p.parent_id?.id : p.parent_id;
    if (parentId === focusedProjectId.value) return true;

    // Show parent of focused project
    const focusedParentId =
      typeof focusedProject?.parent_id === 'object'
        ? focusedProject?.parent_id?.id
        : focusedProject?.parent_id;
    if (p.id === focusedParentId) return true;

    return false;
  });
});

const totalEvents = computed(() =>
  projects.value.reduce((acc, p) => acc + (p.events?.length || 0), 0)
);

const selectedEvent = computed<ProjectEventWithRelations | null>(() => {
  if (!selectedEventId.value) return null;
  for (const project of projects.value) {
    const event = project.events?.find((e) => e.id === selectedEventId.value);
    if (event) return event as ProjectEventWithRelations;
  }
  return null;
});

const selectedEventProject = computed<ProjectWithRelations | null>(() => {
  if (!selectedEvent.value) return null;
  return (
    projects.value.find((p) => p.events?.some((e) => e.id === selectedEvent.value?.id)) || null
  );
});

// Methods
const resetView = () => {
  zoomLevel.value = 1;
  focusedProjectId.value = null;
  selectedEventId.value = null;
};

const handleEventSelect = (eventId: string) => {
  selectedEventId.value = eventId;
};

const handleTaskToggle = async (taskId: string, completed: boolean) => {
  await toggleTask(taskId, completed);

  // Celebrate if completing a task!
  if (completed) {
    celebrate();
  }
};

// GSAP animations
let ctx: gsap.Context;

// Fetch projects on mount (client-side)
onMounted(async () => {
  // Start the clock
  clockInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);

  ctx = gsap.context(() => {
    // Fade in header
    gsap.fromTo(
      '.project-timeline h1, .project-timeline > div:first-child p',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  });

  // Ensure session is loaded from cookies/storage
  await fetchSession();

  // Function to fetch projects and set focus
  const fetchData = async () => {
    await refresh();

    // Set initial focus if provided
    if (props.initialFocus) {
      focusedProjectId.value = props.initialFocus;

      // If focused project isn't in the list, try to fetch it individually
      const focusedInList = projects.value.find((p) => p.id === props.initialFocus);
      if (!focusedInList) {
        const focusedProject = await fetchProject(props.initialFocus);
        if (focusedProject) {
          // Add the fetched project to the list
          projects.value = [...projects.value, focusedProject];
        }
      }
    }
  };

  // If already logged in, fetch immediately
  if (loggedIn.value) {
    await fetchData();
  } else {
    // Wait for login state to become true
    const stopWatch = watch(
      loggedIn,
      async (isLoggedIn) => {
        if (isLoggedIn) {
          stopWatch();
          await fetchData();
        }
      },
      { immediate: true }
    );
  }
});

onUnmounted(() => {
  if (ctx) ctx.revert();
  if (clockInterval) clearInterval(clockInterval);
});
</script>

<style scoped>
.project-timeline {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
