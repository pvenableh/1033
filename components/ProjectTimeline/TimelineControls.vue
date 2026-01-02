<template>
  <div class="flex items-center gap-3">
    <!-- Zoom controls -->
    <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors disabled:opacity-50"
        :disabled="zoom <= 0.5"
        title="Zoom out"
        @click="zoomOut"
      >
        <UIcon
          name="i-heroicons-minus"
          class="w-4 h-4"
        />
      </button>
      <span class="text-xs text-gray-600 w-12 text-center">{{ Math.round(zoom * 100) }}%</span>
      <button
        class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors disabled:opacity-50"
        :disabled="zoom >= 2"
        title="Zoom in"
        @click="zoomIn"
      >
        <UIcon
          name="i-heroicons-plus"
          class="w-4 h-4"
        />
      </button>
    </div>

    <!-- Project focus dropdown -->
    <USelectMenu
      :model-value="selectedProject"
      :options="projectOptions"
      option-attribute="name"
      value-attribute="id"
      placeholder="All projects"
      class="w-48"
      @update:model-value="updateFocus"
    >
      <template #leading>
        <div
          v-if="selectedProject"
          class="w-2.5 h-2.5 rounded-full"
          :style="{ backgroundColor: selectedProject.color }"
        />
        <UIcon
          v-else
          name="i-heroicons-funnel"
          class="w-4 h-4 text-gray-400"
        />
      </template>
    </USelectMenu>

    <!-- Reset button -->
    <button
      v-if="focusedProject || zoom !== 1"
      class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title="Reset view"
      @click="$emit('reset')"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-4 h-4"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectWithRelations } from '~/types/projects';

interface Props {
  zoom: number;
  focusedProject: string | null;
  projects: ProjectWithRelations[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:zoom': [value: number];
  'update:focusedProject': [value: string | null];
  reset: [];
}>();

const projectOptions = computed(() => [
  { id: null, name: 'All projects', color: null },
  ...props.projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  })),
]);

const selectedProject = computed(() =>
  props.focusedProject
    ? projectOptions.value.find((p) => p.id === props.focusedProject)
    : null
);

const zoomIn = () => {
  const newZoom = Math.min(props.zoom + 0.25, 2);
  emit('update:zoom', newZoom);
};

const zoomOut = () => {
  const newZoom = Math.max(props.zoom - 0.25, 0.5);
  emit('update:zoom', newZoom);
};

const updateFocus = (option: { id: string | null } | null) => {
  emit('update:focusedProject', option?.id || null);
};
</script>
