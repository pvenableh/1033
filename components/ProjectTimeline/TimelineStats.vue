<template>
  <div class="bg-gray-100 rounded-xl p-6">
    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
      Overview
    </h3>

    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      <div class="text-center p-3 bg-white rounded-lg">
        <p class="text-2xl font-light text-gray-900">
          {{ aggregateStats.projects }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Projects</p>
      </div>

      <div class="text-center p-3 bg-white rounded-lg">
        <p class="text-2xl font-light text-gray-900">
          {{ aggregateStats.activeProjects }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Active</p>
      </div>

      <div class="text-center p-3 bg-white rounded-lg">
        <p class="text-2xl font-light text-gray-900">
          {{ aggregateStats.events }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Events</p>
      </div>

      <div class="text-center p-3 bg-white rounded-lg">
        <p class="text-2xl font-light text-gray-900">
          {{ aggregateStats.tasksCompleted }}/{{ aggregateStats.tasksTotal }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Tasks Done</p>
      </div>

      <div class="text-center p-3 bg-white rounded-lg">
        <p class="text-2xl font-light text-gray-900">
          {{ aggregateStats.files }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Files</p>
      </div>

      <div class="text-center p-3 bg-white rounded-lg">
        <div class="flex items-center justify-center gap-2">
          <p class="text-2xl font-light text-gray-900">
            {{ aggregateStats.overallProgress }}%
          </p>
        </div>
        <p class="text-xs text-gray-500 mt-1">Progress</p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="mt-4">
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-gold rounded-full transition-all duration-500"
          :style="{ width: aggregateStats.overallProgress + '%' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectWithRelations } from '~/types/projects';

interface Props {
  projects: ProjectWithRelations[];
}

const props = defineProps<Props>();

const { aggregateStats } = useAggregateProjectStats(computed(() => props.projects));
</script>
