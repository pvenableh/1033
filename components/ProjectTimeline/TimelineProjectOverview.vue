<template>
  <div class="project-overview bg-cream-alt rounded-xl border border-divider p-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-4 h-4 rounded-full"
        :style="{ backgroundColor: project.color }"
      />
      <h2 class="font-serif text-xl">{{ project.name }}</h2>
      <span
        :class="statusClasses"
        class="ml-auto px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide"
      >
        {{ project.status }}
      </span>
    </div>

    <!-- Timeline Bar -->
    <div class="mb-6">
      <div class="flex justify-between text-xs text-gray-500 mb-2">
        <span>{{ formatDate(project.start_date) }}</span>
        <span
          v-if="project.actual_end_date"
        >
          Completed {{ formatDate(project.actual_end_date) }}
        </span>
        <span
          v-else
          class="flex items-center gap-1"
        >
          <span class="w-2 h-2 bg-gold rounded-full animate-pulse" />
          Ongoing
        </span>
      </div>
      <div class="h-2 bg-gray-900/10 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{
            width: stats.progressPercent + '%',
            backgroundColor: project.color,
          }"
        />
      </div>
      <p class="text-xs text-gray-400 mt-1">
        {{ stats.durationDays }} days {{ stats.isOngoing ? 'so far' : 'total' }}
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="text-center">
        <p class="text-2xl font-light text-gray-900">{{ stats.events }}</p>
        <p class="text-xs text-gray-500">Events</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-light text-gray-900">
          {{ stats.tasksCompleted }}/{{ stats.tasksTotal }}
        </p>
        <p class="text-xs text-gray-500">Tasks</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-light text-gray-900">{{ stats.subProjects }}</p>
        <p class="text-xs text-gray-500">Sub-projects</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-light text-gray-900">{{ stats.files }}</p>
        <p class="text-xs text-gray-500">Files</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-light text-gray-900">{{ stats.comments }}</p>
        <p class="text-xs text-gray-500">Comments</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-light text-gray-900">{{ stats.reactions }}</p>
        <p class="text-xs text-gray-500">Reactions</p>
      </div>
    </div>

    <!-- Activity Feed -->
    <div class="border-t border-divider pt-4">
      <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Recent Activity
      </h3>
      <TimelineActivityFeed :project-id="project.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectWithRelations } from '~/types/projects';

interface Props {
  project: ProjectWithRelations;
}

const props = defineProps<Props>();

const { stats } = useProjectStats(computed(() => props.project));

const statusClasses = computed(() => ({
  'bg-gold/20 text-gold': props.project.status === 'active',
  'bg-green-100 text-green-700': props.project.status === 'completed',
  'bg-gray-100 text-gray-500': props.project.status === 'draft',
  'bg-red-100 text-red-600': props.project.status === 'archived',
}));

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
</script>
